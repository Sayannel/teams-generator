<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';
require_once __DIR__ . '/../../lib/validate.php';

require_method('POST', 'DELETE');

$user = require_auth();
$pdo = db();

/**
 * Confirms the list belongs to the current user, or is a public list an
 * admin is managing, or halts with 404. Returns the list's owner user_id
 * (which is what player rows must be created/reused/attached under —
 * never the admin's own id when managing someone else's public list).
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

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $listId = filter_var($_GET['listId'] ?? null, FILTER_VALIDATE_INT);
    $playerId = filter_var($_GET['playerId'] ?? null, FILTER_VALIDATE_INT);
    if (!$listId || !$playerId) {
        json_response(['error' => 'invalid_input'], 422);
    }
    require_owned_list($pdo, $listId, $user);
    $pdo->prepare('DELETE FROM tg_list_players WHERE list_id = ? AND player_id = ?')->execute([$listId, $playerId]);
    json_response(['ok' => true]);
}

$body = read_json_body();
$listId = filter_var($body['listId'] ?? null, FILTER_VALIDATE_INT);
$name = validate_name($body['name'] ?? null);
$skill = validate_skill($body['skill'] ?? null);
$gender = validate_gender($body['gender'] ?? null);

if (!$listId || $name === null || $skill === null || $gender === null) {
    json_response(['error' => 'invalid_input'], 422);
}

$ownerId = require_owned_list($pdo, $listId, $user);

// Reuse an existing person from the directory (case-insensitive match via
// the table's collation); otherwise create them. On reuse, sync their
// gender/skill to the incoming values rather than keeping the stale ones —
// this is also the path a second sync of an already-created player takes,
// so it must reflect edits made since the first sync instead of dropping
// them silently.
//
// Always scoped to the list *owner's* directory ($ownerId), not the
// caller's — when an admin is managing someone else's public list, the
// player must be created/reused/attached under that list's owner, never
// mixed into the admin's own personal tg_players rows.
$stmt = $pdo->prepare('SELECT id, name, gender, skill FROM tg_players WHERE user_id = ? AND name = ?');
$stmt->execute([$ownerId, $name]);
$player = $stmt->fetch();

if ($player) {
    $pdo->prepare('UPDATE tg_players SET gender = ?, skill = ? WHERE id = ?')
        ->execute([$gender, $skill, $player['id']]);
    $player = ['id' => (int) $player['id'], 'name' => $player['name'], 'gender' => $gender, 'skill' => $skill];
} else {
    try {
        $pdo->prepare('INSERT INTO tg_players (user_id, name, gender, skill) VALUES (?, ?, ?, ?)')
            ->execute([$ownerId, $name, $gender, $skill]);
        $playerId = (int) $pdo->lastInsertId();
    } catch (PDOException $e) {
        if ($e->errorInfo[1] !== 1062) {
            throw $e;
        }
        // Lost a race against a concurrent request creating the same name.
        $stmt = $pdo->prepare('SELECT id FROM tg_players WHERE user_id = ? AND name = ?');
        $stmt->execute([$ownerId, $name]);
        $playerId = (int) $stmt->fetch()['id'];
    }
    $player = ['id' => $playerId, 'name' => $name, 'gender' => $gender, 'skill' => $skill];
}

$pdo->prepare('INSERT IGNORE INTO tg_list_players (list_id, player_id) VALUES (?, ?)')
    ->execute([$listId, $player['id']]);

json_response($player, 201);
