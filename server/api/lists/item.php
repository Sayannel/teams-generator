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

$method = $_SERVER['REQUEST_METHOD'];

// PUT/DELETE stay strictly owner-only: a public list is never
// rename/toggle/delete-able by anyone but its owner, admin included.
if ($method === 'PUT' || $method === 'DELETE') {
    $stmt = $pdo->prepare('SELECT id, name, is_public FROM tg_lists WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    $list = $stmt->fetch();
    if (!$list) {
        json_response(['error' => 'not_found'], 404);
    }

    if ($method === 'DELETE') {
        $pdo->prepare('DELETE FROM tg_lists WHERE id = ? AND user_id = ?')->execute([$id, $user['id']]);
        json_response(['ok' => true]);
    }

    // PUT: rename / toggle isPublic.
    $body = read_json_body();
    $name = array_key_exists('name', $body) ? validate_name($body['name']) : $list['name'];
    $isPublic = array_key_exists('isPublic', $body) ? (bool) $body['isPublic'] : (bool) $list['is_public'];

    if ($name === null) {
        json_response(['error' => 'invalid_input'], 422);
    }

    // Only an admin can manage visibility at all — a non-admin's lists stay
    // private, full stop. Force it false rather than merely rejecting an
    // explicit true, so a list that somehow ended up public (e.g. its
    // owner was demoted from admin) gets corrected on the next rename too.
    if ($user['role'] !== 'admin') {
        $isPublic = false;
    }

    try {
        $pdo->prepare('UPDATE tg_lists SET name = ?, is_public = ? WHERE id = ? AND user_id = ?')
            ->execute([$name, $isPublic ? 1 : 0, $id, $user['id']]);
    } catch (PDOException $e) {
        if ($e->errorInfo[1] === 1062) {
            json_response(['error' => 'list_name_taken'], 409);
        }
        throw $e;
    }

    json_response(['id' => $id, 'name' => $name, 'isPublic' => $isPublic]);
}

// GET: owner, or an admin viewing any is_public list.
$stmt = $pdo->prepare('SELECT id, name, user_id, is_public FROM tg_lists WHERE id = ? AND (user_id = ? OR is_public = 1)');
$stmt->execute([$id, $user['id']]);
$list = $stmt->fetch();
if (!$list) {
    json_response(['error' => 'not_found'], 404);
}

$isOwner = ((int) $list['user_id']) === (int) $user['id'];
if (!$isOwner && $user['role'] !== 'admin') {
    json_response(['error' => 'not_found'], 404);
}

$stmt = $pdo->prepare(
    'SELECT p.id, p.name, p.gender, p.skill
     FROM tg_list_players lp
     JOIN tg_players p ON p.id = lp.player_id
     WHERE lp.list_id = ?
     ORDER BY p.name'
);
$stmt->execute([$id]);

json_response([
    'id' => (int) $list['id'],
    'name' => $list['name'],
    'isOwner' => $isOwner,
    'isPublic' => (bool) $list['is_public'],
    'players' => $stmt->fetchAll(),
]);
