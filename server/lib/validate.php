<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/** Trims a name and enforces a sane length bound; returns null if invalid. */
function validate_name($name): ?string
{
    if (!is_string($name)) {
        return null;
    }
    $name = trim($name);
    if ($name === '' || mb_strlen($name) > 100) {
        return null;
    }
    return $name;
}

/** Validates a skill rating; returns the default when omitted, null when invalid. */
function validate_skill($skill, int $default = 1): ?int
{
    if ($skill === null) {
        return $default;
    }
    if (!is_int($skill) && !(is_string($skill) && ctype_digit($skill))) {
        return null;
    }
    $skill = (int) $skill;
    return ($skill >= 1 && $skill <= 20) ? $skill : null;
}

/** Validates a gender; returns the default when omitted, null when invalid. */
function validate_gender($gender, string $default = 'male'): ?string
{
    if ($gender === null) {
        return $default;
    }
    return in_array($gender, ['male', 'female'], true) ? $gender : null;
}
