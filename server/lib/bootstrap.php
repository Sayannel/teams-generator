<?php
declare(strict_types=1);

// Shared bootstrap for every endpoint under api/. Every endpoint starts
// with: require __DIR__ . '/../../lib/bootstrap.php';

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function (Throwable $e): void {
    error_log('[teams-generator] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['error' => 'internal_error']);
    exit;
});

/**
 * Loads config.php (gitignored, copied from config.example.php).
 * Pass a top-level key to get just that section, or omit for the whole array.
 */
function config(?string $key = null)
{
    static $cfg = null;
    if ($cfg === null) {
        $path = __DIR__ . '/../config.php';
        if (!file_exists($path)) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'error' => 'missing_config',
                'message' => 'Copy config.example.php to config.php and fill it in.',
            ]);
            exit;
        }
        $cfg = require $path;
    }
    return $key === null ? $cfg : ($cfg[$key] ?? null);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $cfg = config('db');
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $cfg['host'], $cfg['port'] ?? 3306, $cfg['name'], $cfg['charset']);
        $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_method(string ...$methods): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, $methods, true)) {
        json_response(['error' => 'method_not_allowed'], 405);
    }
}

/**
 * Trims/lowercases and validates an email; returns null if invalid.
 * Untyped param on purpose: a malformed JSON body (e.g. `{"email":["x"]}`)
 * can hand this a non-string under strict_types, and a declared `?string`
 * would TypeError before the is_string() guard below ever ran.
 */
function normalize_email($email): ?string
{
    if (!is_string($email)) {
        return null;
    }
    $email = trim($email);
    if ($email === '' || strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return null;
    }
    return mb_strtolower($email);
}

function session_cookie_name(): string
{
    return config('session')['cookie_name'];
}

function set_session_cookie(string $token, DateTimeImmutable $expiresAt): void
{
    setcookie(session_cookie_name(), $token, [
        'expires' => $expiresAt->getTimestamp(),
        'path' => '/',
        'secure' => config('app_env') === 'production',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clear_session_cookie(): void
{
    setcookie(session_cookie_name(), '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => config('app_env') === 'production',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/**
 * Opportunistically prunes expired sessions/OTP codes instead of running a
 * cron the shared host may not offer. ~1% chance per call keeps the cost off
 * the hot path while still bounding table growth over time.
 */
function maybe_cleanup_expired(): void
{
    if (random_int(1, 100) !== 1) {
        return;
    }
    $pdo = db();
    $pdo->exec('DELETE FROM tg_sessions WHERE expires_at < NOW()');
    $pdo->exec('DELETE FROM tg_otp_codes WHERE expires_at < NOW()');
}

/** Returns the current user (['id', 'email', 'role']) from the session cookie, or null. */
function current_user(): ?array
{
    maybe_cleanup_expired();
    $token = $_COOKIE[session_cookie_name()] ?? null;
    if (!$token) {
        return null;
    }
    $stmt = db()->prepare(
        'SELECT u.id, u.email, u.role FROM tg_sessions s
         JOIN tg_users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > NOW()'
    );
    $stmt->execute([hash('sha256', $token)]);
    $user = $stmt->fetch();
    return $user ?: null;
}

/** Returns the current user or halts the request with 401. */
function require_auth(): array
{
    $user = current_user();
    if (!$user) {
        json_response(['error' => 'unauthorized'], 401);
    }
    return $user;
}

/** Returns the current user or halts with 403 if not an admin. */
function require_admin(): array
{
    $user = require_auth();
    if ($user['role'] !== 'admin') {
        json_response(['error' => 'forbidden'], 403);
    }
    return $user;
}
