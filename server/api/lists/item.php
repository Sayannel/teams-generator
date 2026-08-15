<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';
require_once __DIR__ . '/../../lib/validate.php';

require_method('GET', 'PUT', 'DELETE');

$user = require_auth();
$pdo = db();

$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
if ($id === false || $id === null) {
    json_response(['error' => 'invalid_input'], 422);
}

$stmt = $pdo->prepare('SELECT id, name FROM tg_lists WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user['id']]);
$list = $stmt->fetch();
if (!$list) {
    json_response(['error' => 'not_found'], 404);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT p.id, p.name, p.gender, p.skill
         FROM tg_list_players lp
         JOIN tg_players p ON p.id = lp.player_id
         WHERE lp.list_id = ?
         ORDER BY p.name'
    );
    $stmt->execute([$id]);
    $list['players'] = $stmt->fetchAll();
    json_response($list);
}

if ($method === 'DELETE') {
    $pdo->prepare('DELETE FROM tg_lists WHERE id = ? AND user_id = ?')->execute([$id, $user['id']]);
    json_response(['ok' => true]);
}

// PUT: rename.
$body = read_json_body();
$name = array_key_exists('name', $body) ? validate_name($body['name']) : $list['name'];

if ($name === null) {
    json_response(['error' => 'invalid_input'], 422);
}

try {
    $pdo->prepare('UPDATE tg_lists SET name = ? WHERE id = ? AND user_id = ?')
        ->execute([$name, $id, $user['id']]);
} catch (PDOException $e) {
    if ($e->errorInfo[1] === 1062) {
        json_response(['error' => 'list_name_taken'], 409);
    }
    throw $e;
}

json_response(['id' => $id, 'name' => $name]);
