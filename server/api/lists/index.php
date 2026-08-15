<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';
require_once __DIR__ . '/../../lib/validate.php';

require_method('GET', 'POST');

$user = require_auth();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT l.id, l.name,
                COUNT(lp.player_id) AS memberCount
         FROM tg_lists l
         LEFT JOIN tg_list_players lp ON lp.list_id = l.id
         WHERE l.user_id = ?
         GROUP BY l.id, l.name
         ORDER BY l.name'
    );
    $stmt->execute([$user['id']]);
    json_response(['lists' => $stmt->fetchAll()]);
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
