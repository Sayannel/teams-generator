<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';
require_once __DIR__ . '/../../lib/validate.php';

require_method('PUT');

$user = require_auth();
$pdo = db();

$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
if (!$id) {
    json_response(['error' => 'invalid_input'], 422);
}

$stmt = $pdo->prepare('SELECT id, name, gender, skill FROM tg_players WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $user['id']]);
$player = $stmt->fetch();
if (!$player) {
    json_response(['error' => 'not_found'], 404);
}

$body = read_json_body();
$name = array_key_exists('name', $body) ? validate_name($body['name']) : $player['name'];
$skill = array_key_exists('skill', $body)
    ? validate_skill($body['skill'], (int) $player['skill'])
    : (int) $player['skill'];
$gender = array_key_exists('gender', $body)
    ? validate_gender($body['gender'], $player['gender'])
    : $player['gender'];

if ($name === null || $skill === null || $gender === null) {
    json_response(['error' => 'invalid_input'], 422);
}

try {
    $pdo->prepare('UPDATE tg_players SET name = ?, gender = ?, skill = ? WHERE id = ? AND user_id = ?')
        ->execute([$name, $gender, $skill, $id, $user['id']]);
} catch (PDOException $e) {
    if ($e->errorInfo[1] === 1062) {
        json_response(['error' => 'player_name_taken'], 409);
    }
    throw $e;
}

json_response(['id' => $id, 'name' => $name, 'gender' => $gender, 'skill' => $skill]);
