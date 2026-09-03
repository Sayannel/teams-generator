<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';
require_once __DIR__ . '/../../lib/validate.php';

require_method('GET', 'POST');

$user = require_auth();
$pdo = db();

/**
 * Confirms the list belongs to the current user, or is a public list an
 * admin is managing (read or write — write endpoints elsewhere are
 * stricter about owner-only actions, this file only ever reads/attaches
 * attendance, never mutates the list itself). Returns the list's owner
 * user_id, since attendance must only be recorded against players that
 * belong to that owner's tg_players directory.
 */
function require_owned_list(PDO $pdo, int $listId, array $user): int
{
    $stmt = $pdo->prepare(
        "SELECT user_id FROM tg_lists WHERE id = ? AND (user_id = ? OR (is_public = 1 AND ? = 'admin'))"
    );
    $stmt->execute([$listId, $user['id'], $user['role']]);
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

    $pdo->prepare('INSERT INTO tg_list_sessions (list_id) VALUES (?)')->execute([$listId]);
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

require_owned_list($pdo, $listId, $user);

$stmt = $pdo->prepare(
    'SELECT s.id AS session_id, s.occurred_at, p.id AS player_id, p.name AS player_name
     FROM tg_list_sessions s
     LEFT JOIN tg_session_attendees sa ON sa.session_id = s.id
     LEFT JOIN tg_players p ON p.id = sa.player_id
     WHERE s.list_id = ?
     ORDER BY s.occurred_at DESC, s.id DESC'
);
$stmt->execute([$listId]);

$sessionsById = [];
foreach ($stmt->fetchAll() as $row) {
    $sid = (int) $row['session_id'];
    if (!isset($sessionsById[$sid])) {
        $sessionsById[$sid] = [
            'id' => $sid,
            'occurredAt' => $row['occurred_at'],
            'attendees' => [],
        ];
    }
    if ($row['player_id'] !== null) {
        $sessionsById[$sid]['attendees'][] = [
            'id' => (int) $row['player_id'],
            'name' => $row['player_name'],
        ];
    }
}
$sessions = array_values($sessionsById);

$stmt = $pdo->prepare(
    'SELECT p.id AS player_id, p.name AS player_name, COUNT(sa.session_id) AS present
     FROM tg_session_attendees sa
     JOIN tg_players p ON p.id = sa.player_id
     JOIN tg_list_sessions s ON s.id = sa.session_id
     WHERE s.list_id = ?
     GROUP BY p.id, p.name'
);
$stmt->execute([$listId]);
$statRows = $stmt->fetchAll();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM tg_list_sessions WHERE list_id = ?');
$stmt->execute([$listId]);
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
