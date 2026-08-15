<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';

require_method('GET');

$user = require_auth();
$pdo = db();

$rawSearch = $_GET['search'] ?? '';
$search = is_string($rawSearch) ? trim($rawSearch) : '';
$limit = $search !== '' ? 50 : 200;

if ($search !== '') {
    $stmt = $pdo->prepare(
        'SELECT id, name, gender, skill FROM tg_players
         WHERE user_id = ? AND name LIKE ?
         ORDER BY name LIMIT ' . ($limit + 1)
    );
    $stmt->execute([$user['id'], '%' . $search . '%']);
} else {
    $stmt = $pdo->prepare('SELECT id, name, gender, skill FROM tg_players WHERE user_id = ? ORDER BY name LIMIT ' . ($limit + 1));
    $stmt->execute([$user['id']]);
}

$players = $stmt->fetchAll();
$truncated = count($players) > $limit;
if ($truncated) {
    $players = array_slice($players, 0, $limit);
}

json_response(['players' => $players, 'truncated' => $truncated]);
