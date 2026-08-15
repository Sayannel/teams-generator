<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';

require_method('POST');

$token = $_COOKIE[session_cookie_name()] ?? null;
if ($token) {
    db()->prepare('DELETE FROM tg_sessions WHERE token_hash = ?')->execute([hash('sha256', $token)]);
}
clear_session_cookie();

json_response(['ok' => true]);
