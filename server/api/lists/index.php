<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';
require_once __DIR__ . '/../../lib/validate.php';

require_method('GET', 'POST');

$user = require_auth();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($user['role'] === 'admin') {
        $stmt = $pdo->prepare(
            'SELECT l.id, l.name, l.is_public AS isPublic,
                    (l.user_id = ?) AS isOwner,
                    u.email AS ownerEmail,
                    COUNT(lp.player_id) AS memberCount
             FROM tg_lists l
             JOIN tg_users u ON u.id = l.user_id
             LEFT JOIN tg_list_players lp ON lp.list_id = l.id
             WHERE l.user_id = ? OR l.is_public = 1
             GROUP BY l.id, l.name, l.is_public, isOwner, u.email
             ORDER BY l.name'
        );
        $stmt->execute([$user['id'], $user['id']]);
        $lists = $stmt->fetchAll();
        foreach ($lists as &$row) {
            $row['isPublic'] = (bool) $row['isPublic'];
            $row['isOwner'] = (bool) $row['isOwner'];
            if ($row['isOwner']) {
                unset($row['ownerEmail']);
            }
        }
        unset($row);
        json_response(['lists' => $lists]);
    }

    $stmt = $pdo->prepare(
        'SELECT l.id, l.name, l.is_public AS isPublic,
                COUNT(lp.player_id) AS memberCount
         FROM tg_lists l
         LEFT JOIN tg_list_players lp ON lp.list_id = l.id
         WHERE l.user_id = ?
         GROUP BY l.id, l.name, l.is_public
         ORDER BY l.name'
    );
    $stmt->execute([$user['id']]);
    $lists = $stmt->fetchAll();
    foreach ($lists as &$row) {
        $row['isPublic'] = (bool) $row['isPublic'];
        $row['isOwner'] = true;
    }
    unset($row);
    json_response(['lists' => $lists]);
}

$body = read_json_body();
$name = validate_name($body['name'] ?? null);

if ($name === null) {
    json_response(['error' => 'invalid_input'], 422);
}

try {
    $pdo->prepare('INSERT INTO tg_lists (user_id, name) VALUES (?, ?)')
        ->execute([$user['id'], $name]);
} catch (PDOException $e) {
    if ($e->errorInfo[1] === 1062) { // duplicate key
        json_response(['error' => 'list_name_taken'], 409);
    }
    throw $e;
}

json_response([
    'id' => (int) $pdo->lastInsertId(),
    'name' => $name,
    'memberCount' => 0,
], 201);
