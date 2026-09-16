<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';
require_once __DIR__ . '/../../lib/validate.php';

require_method('GET', 'POST');

$user = require_auth();
$pdo = db();

/**
 * Confirms the list belongs to the current user, or is a public list a
 * coach/admin is managing (read or write — write endpoints elsewhere are
 * stricter about owner-only actions, this file only ever reads/attaches
 * attendance, never mutates the list itself). Returns the list's owner
 * user_id, since attendance must only be recorded against players that
 * belong to that owner's tg_players directory.
 */
function require_owned_list(PDO $pdo, int $listId, array $user): int
{
    $stmt = $pdo->prepare(
        'SELECT user_id FROM tg_lists WHERE id = ? AND (user_id = ? OR (is_public = 1 AND ? = 1))'
    );
    $stmt->execute([$listId, $user['id'], can_manage_public_lists($user) ? 1 : 0]);
    $list = $stmt->fetch();
    if (!$list) {
        json_response(['error' => 'not_found'], 404);
    }
    return (int) $list['user_id'];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    $listId = filter_var($body['listId'] ?? null, FILTER_VALIDATE_INT);
    $playerIds = $body['playerIds'] ?? null;

    if (!$listId || !is_array($playerIds)) {
        json_response(['error' => 'invalid_input'], 422);
    }

    $filteredIds = [];
    foreach ($playerIds as $pid) {
        $intId = filter_var($pid, FILTER_VALIDATE_INT);
        if ($intId === false || $intId === null) {
            json_response(['error' => 'invalid_input'], 422);
        }
        $filteredIds[] = (int) $intId;
    }

    $ownerId = require_owned_list($pdo, $listId, $user);

    // Only players that actually belong to the list owner's directory may
    // be marked present — this matters most on the admin-on-public-list
    // path, where the caller must not be able to attach arbitrary ids.
    $validIds = [];
    if ($filteredIds !== []) {
        $placeholders = implode(',', array_fill(0, count($filteredIds), '?'));
        $stmt = $pdo->prepare("SELECT id FROM tg_players WHERE user_id = ? AND id IN ($placeholders)");
        $stmt->execute(array_merge([$ownerId], $filteredIds));
        foreach ($stmt->fetchAll() as $row) {
            $validIds[] = (int) $row['id'];
        }
    }

    $pdo->prepare('INSERT INTO tg_list_sessions (list_id, recorded_by) VALUES (?, ?)')->execute([$listId, $user['id']]);
    $sessionId = (int) $pdo->lastInsertId();

    $insertAttendee = $pdo->prepare('INSERT INTO tg_session_attendees (session_id, player_id) VALUES (?, ?)');
    foreach ($validIds as $playerId) {
        $insertAttendee->execute([$sessionId, $playerId]);
    }

    $stmt = $pdo->prepare('SELECT occurred_at FROM tg_list_sessions WHERE id = ?');
    $stmt->execute([$sessionId]);
    $occurredAt = $stmt->fetchColumn();

    json_response([
        'id' => $sessionId,
        'occurredAt' => $occurredAt,
        'playerIds' => $validIds,
    ], 201);
}

// GET
$listId = filter_var($_GET['listId'] ?? null, FILTER_VALIDATE_INT);
if (!$listId) {
    json_response(['error' => 'invalid_input'], 422);
}

$ownerId = require_owned_list($pdo, $listId, $user);
$isOwner = $ownerId === (int) $user['id'];

// A coach managing someone else's public list only sees the history of
// sessions they personally recorded — not every session anyone ever ran on
// that list. Owner and admin see the whole list's history (subject to the
// same retention degradation below, admin included).
$scopedToRecorder = !$isOwner && $user['role'] === 'coach';
$genderThreshold = (int) config('retention')['gender_breakdown_min_count'];

$sessionParams = [$listId];
$recorderFilter = '';
if ($scopedToRecorder) {
    $recorderFilter = ' AND s.recorded_by = ?';
    $sessionParams[] = $user['id'];
}

$stmt = $pdo->prepare(
    "SELECT s.id AS session_id, s.occurred_at, s.present_count, s.male_count, s.female_count,
            s.degraded_at, p.id AS player_id, p.name AS player_name, p.gender AS player_gender
     FROM tg_list_sessions s
     LEFT JOIN tg_session_attendees sa ON sa.session_id = s.id
     LEFT JOIN tg_players p ON p.id = sa.player_id
     WHERE s.list_id = ?$recorderFilter
     ORDER BY s.occurred_at DESC, s.id DESC"
);
$stmt->execute($sessionParams);

$sessionsById = [];
foreach ($stmt->fetchAll() as $row) {
    $sid = (int) $row['session_id'];
    if (!isset($sessionsById[$sid])) {
        $degraded = $row['degraded_at'] !== null;
        $session = [
            'id' => $sid,
            'occurredAt' => $row['occurred_at'],
            'degraded' => $degraded,
            'attendees' => [],
        ];
        if ($degraded) {
            $session['presentCount'] = (int) $row['present_count'];
            if ((int) $row['male_count'] >= $genderThreshold && (int) $row['female_count'] >= $genderThreshold) {
                $session['maleCount'] = (int) $row['male_count'];
                $session['femaleCount'] = (int) $row['female_count'];
            }
        }
        $sessionsById[$sid] = $session;
    }
    if ($row['player_id'] !== null) {
        $sessionsById[$sid]['attendees'][] = [
            'id' => (int) $row['player_id'],
            'name' => $row['player_name'],
        ];
        // Fresh (non-degraded) sessions already show every name, so a
        // gender breakdown adds no re-identification risk — no threshold
        // needed here, unlike the degraded/aggregate-only case above.
        if (!$sessionsById[$sid]['degraded']) {
            $genderKey = $row['player_gender'] === 'female' ? 'femaleCount' : 'maleCount';
            $sessionsById[$sid][$genderKey] = ($sessionsById[$sid][$genderKey] ?? 0) + 1;
        }
    }
}
$sessions = array_values($sessionsById);

// Per-player breakdown only draws on non-degraded (< 1 month) sessions —
// degraded ones no longer have tg_session_attendees rows to join against,
// and mixing "recent nominative presence" with "old aggregate-only" counts
// would misrepresent both.
$statParams = [$listId];
$statRecorderFilter = '';
if ($scopedToRecorder) {
    $statRecorderFilter = ' AND s.recorded_by = ?';
    $statParams[] = $user['id'];
}

$stmt = $pdo->prepare(
    "SELECT p.id AS player_id, p.name AS player_name, COUNT(sa.session_id) AS present
     FROM tg_session_attendees sa
     JOIN tg_players p ON p.id = sa.player_id
     JOIN tg_list_sessions s ON s.id = sa.session_id
     WHERE s.list_id = ? AND s.degraded_at IS NULL$statRecorderFilter
     GROUP BY p.id, p.name"
);
$stmt->execute($statParams);
$statRows = $stmt->fetchAll();

$stmt = $pdo->prepare(
    "SELECT COUNT(*) FROM tg_list_sessions s WHERE s.list_id = ? AND s.degraded_at IS NULL$statRecorderFilter"
);
$stmt->execute($statParams);
$totalSessions = (int) $stmt->fetchColumn();

$stats = [];
foreach ($statRows as $row) {
    $stats[] = [
        'playerId' => (int) $row['player_id'],
        'name' => $row['player_name'],
        'present' => (int) $row['present'],
        'totalSessions' => $totalSessions,
    ];
}

json_response(['sessions' => $sessions, 'stats' => $stats]);
