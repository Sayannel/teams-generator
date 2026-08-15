<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/bootstrap.php';

require_method('GET');

$user = require_auth();

json_response(['user' => $user]);
