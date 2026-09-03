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

$stmt = $pdo->prepare(
    "SELECT p.id, p.name, p.gender, p.skill
     FROM tg_players p
     WHERE p.id = ?
       AND (
         p.user_id = ?
         OR (? = 'admin' AND EXISTS (
           SELECT 1 FROM tg_list_players lp
           JOIN tg_lists l ON l.id = lp.list_id
           WHERE lp.player_id = p.id AND l.is_public = 1
         ))
       )"
);
$stmt->execute([$id, $user['id'], $user['role']]);
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
    // Ownership (or admin-on-public-list) was already confirmed above, so
    // the WHERE here doesn't repeat the user_id check — doing so would
    // silently no-op the update for the admin-managing-a-public-list path.
    $pdo->prepare('UPDATE tg_players SET name = ?, gender = ?, skill = ? WHERE id = ?')
        ->execute([$name, $gender, $skill, $id]);
} catch (PDOException $e) {
    if ($e->errorInfo[1] === 1062) {
        json_response(['error' => 'player_name_taken'], 409);
    }
    throw $e;
}

json_response(['id' => $id, 'name' => $name, 'gender' => $gender, 'skill' => $skill]);
