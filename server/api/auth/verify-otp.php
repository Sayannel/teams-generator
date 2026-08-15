<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';

require_method('POST');

$body = read_json_body();
$email = normalize_email($body['email'] ?? null);
$rawCode = $body['code'] ?? '';
$code = is_string($rawCode) ? preg_replace('/\D/', '', $rawCode) : '';

if ($email === null || strlen($code) !== 6) {
    json_response(['error' => 'invalid_code'], 422);
}

$otpCfg = config('otp');
$pdo = db();

$stmt = $pdo->prepare('SELECT id FROM tg_users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();
if (!$user) {
    json_response(['error' => 'invalid_code'], 401);
}
$userId = (int) $user['id'];

$stmt = $pdo->prepare(
    'SELECT id, code_hash, expires_at, attempts FROM tg_otp_codes
     WHERE user_id = ? AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1'
);
$stmt->execute([$userId]);
$otp = $stmt->fetch();

$isExpired = $otp && (new DateTimeImmutable($otp['expires_at'])) < new DateTimeImmutable();
$isLocked = $otp && (int) $otp['attempts'] >= $otpCfg['max_attempts'];

if (!$otp || $isExpired || $isLocked) {
    json_response(['error' => 'invalid_code'], 401);
}

if (!hash_equals($otp['code_hash'], hash('sha256', $code))) {
    $newAttempts = (int) $otp['attempts'] + 1;
    if ($newAttempts >= $otpCfg['max_attempts']) {
        $pdo->prepare('UPDATE tg_otp_codes SET attempts = ?, consumed_at = NOW() WHERE id = ?')
            ->execute([$newAttempts, $otp['id']]);
    } else {
        $pdo->prepare('UPDATE tg_otp_codes SET attempts = ? WHERE id = ?')
            ->execute([$newAttempts, $otp['id']]);
    }
    json_response(['error' => 'invalid_code'], 401);
}

$pdo->prepare('UPDATE tg_otp_codes SET consumed_at = NOW() WHERE id = ?')->execute([$otp['id']]);

$sessionCfg = config('session');
$token = bin2hex(random_bytes(32));
$expiresAt = new DateTimeImmutable('+' . $sessionCfg['lifetime_days'] . ' days');

$pdo->prepare('INSERT INTO tg_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
    ->execute([$userId, hash('sha256', $token), $expiresAt->format('Y-m-d H:i:s')]);

set_session_cookie($token, $expiresAt);

json_response(['ok' => true, 'user' => ['id' => $userId, 'email' => $email]]);
