<?php
declare(strict_types=1);

// Real cron entry point, for hosts (like this one, alongside its WordPress
// install) whose control panel offers a task scheduler that runs a PHP
// script directly — no SSH needed for that, just a "Cron Jobs" section in
// the hosting panel. If that's available, point it at this file instead of
// relying on the opportunistic 1%-per-request job in bootstrap.php.
//
// CLI-only on purpose: this file lives under the same web-servable
// directory as everything else in server/, so it must refuse to run if
// ever hit over HTTP.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

require __DIR__ . '/../lib/bootstrap.php';
require __DIR__ . '/../lib/retention.php';

$pdo = db();
// Higher per-run limit than the opportunistic path: this runs once a day
// (or whatever the panel's schedule is) rather than on a slice of every
// request, so it needs to clear a full day's backlog in one pass.
degrade_expired_sessions($pdo, 1000);
anonymize_expired_sessions($pdo, 1000);

echo 'Retention job completed at ' . date('c') . "\n";
