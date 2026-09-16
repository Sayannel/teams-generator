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
        'min_seconds_between_requests' => 30,
        'max_requests_per_hour' => 10,
        // Echo the OTP code back in the request-otp response instead of
        // relying on mail() — only for local dev without a working mail
        // setup. MUST stay false on the deployed host.
        'dev_expose_code' => false,
    ],

    'mail' => [
        'from_email' => 'noreply@example.org',
        'from_name' => 'Teams Generator',
        // Notified by email every time a new account signs up — production
        // only, see notify_super_admin_new_account() in lib/mail.php.
        'super_admin_email' => 'axel.gaillard91@gmail.com',
    ],

    'retention' => [
        // Age (from tg_list_sessions.occurred_at) at which nominative
        // attendance is sealed with the public key below and the
        // tg_session_attendees rows are deleted, leaving only aggregate
        // counts — see lib/retention.php.
        'degrade_after_days' => 30,
        // Age at which the sealed blob itself is destroyed for good —
        // after this, nobody, including the private key holder, can
        // recover who attended; only the aggregate counts remain.
        'anonymize_after_days' => 365,
        // Below this many people of a given sex present, the male/female
        // breakdown is withheld (small-group re-identification risk) —
        // presentCount still shows.
        'gender_breakdown_min_count' => 3,
        // sodium_crypto_box public key, base64-encoded — generate a pair
        // with `php -r 'analogous one-liner in README', give this half to
        // config.php, keep the private half offline with the club's
        // designated "responsable", never in this repo or on the host.
        'encryption_public_key' => 'change_me',
    ],
];
