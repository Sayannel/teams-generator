<?php
// Copy this file to config.php (gitignored) and fill in real values.
// config.php is never committed and never uploaded anywhere but the host.

return [
    // 'production' on the real host: hides PHP errors, requires HTTPS for
    // the session cookie. 'development': for local `php -S` testing only.
    'app_env' => 'production',

    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'change_me',
        'user' => 'change_me',
        'pass' => 'change_me',
        'charset' => 'utf8mb4',
    ],

    'session' => [
        'cookie_name' => 'tg_session',
        'lifetime_days' => 30,
    ],

    'otp' => [
        'ttl_minutes' => 10,
        'max_attempts' => 5,
        'min_seconds_between_requests' => 60,
        'max_requests_per_hour' => 5,
        // Echo the OTP code back in the request-otp response instead of
        // relying on mail() — only for local dev without a working mail
        // setup. MUST stay false on the deployed host.
        'dev_expose_code' => false,
    ],

    'mail' => [
        'from_email' => 'noreply@example.org',
        'from_name' => 'Teams Generator',
    ],
];
