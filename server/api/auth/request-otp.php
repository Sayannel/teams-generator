<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';
require_once __DIR__ . '/../../lib/mail.php';

require_method('POST');

$body = read_json_body();
$email = normalize_email($body['email'] ?? null);
if ($email === null) {
    json_response(['error' => 'invalid_email'], 422);
}

$otpCfg = config('otp');
$pdo = db();

$stmt = $pdo->prepare('SELECT id FROM tg_users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    $userId = (int) $user['id'];
} else {
    try {
        $pdo->prepare('INSERT INTO tg_users (email) VALUES (?)')->execute([$email]);
        $userId = (int) $pdo->lastInsertId();
    } catch (PDOException $e) {
        if ($e->errorInfo[1] !== 1062) {
            throw $e;
        }
        // Lost a race against a concurrent request for the same new email.
        $stmt = $pdo->prepare('SELECT id FROM tg_users WHERE email = ?');
        $stmt->execute([$email]);
        $userId = (int) $stmt->fetch()['id'];
    }
}

// Throttle: minimum interval between requests, and a per-hour cap. Compared
// in SQL rather than against PHP's time() so a PHP/MySQL timezone mismatch
// (common on shared hosts) can't desync the two clocks.
$stmt = $pdo->prepare(
    'SELECT COUNT(*) AS n FROM tg_otp_codes
     WHERE user_id = ? AND created_at > (NOW() - INTERVAL ? SECOND)'
);
$stmt->execute([$userId, $otpCfg['min_seconds_between_requests']]);
if ((int) $stmt->fetch()['n'] > 0) {
    json_response(['error' => 'too_many_requests'], 429);
}

$stmt = $pdo->prepare('SELECT COUNT(*) AS n FROM tg_otp_codes WHERE user_id = ? AND created_at > (NOW() - INTERVAL 1 HOUR)');
$stmt->execute([$userId]);
if ((int) $stmt->fetch()['n'] >= $otpCfg['max_requests_per_hour']) {
    json_response(['error' => 'too_many_requests'], 429);
}

$code = sprintf('%06d', random_int(0, 999999));
$expiresAt = new DateTimeImmutable('+' . $otpCfg['ttl_minutes'] . ' minutes');

$pdo->prepare('INSERT INTO tg_otp_codes (user_id, code_hash, expires_at) VALUES (?, ?, ?)')
    ->execute([$userId, hash('sha256', $code), $expiresAt->format('Y-m-d H:i:s')]);

$sent = send_otp_email($email, $code);
if (!$sent) {
    error_log("[teams-generator] send_otp_email() returned false for user {$userId}");
}

$payload = ['ok' => true];
// Belt-and-braces: never expose the code outside of dev, even if a dev
// config.php (or a stray dev_expose_code=true) ends up on the prod host.
if ($otpCfg['dev_expose_code'] && config('app_env') !== 'production') {
    $payload['dev_code'] = $code;
}

json_response($payload);
