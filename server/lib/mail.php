<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/**
 * Sends the OTP code by email via PHP's mail(). Isolated here so it can be
 * swapped for SMTP/PHPMailer later without touching any endpoint.
 */
function send_otp_email(string $to, string $code): bool
{
    // Defense in depth: re-validate even though callers already normalize
    // the address — never let unvalidated input near a mail header.
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Invalid recipient email');
    }

    $mailCfg = config('mail');
    $ttlMinutes = config('otp')['ttl_minutes'];

    $subject = mb_encode_mimeheader('Votre code de connexion', 'UTF-8', 'B', "\r\n");
    $fromName = mb_encode_mimeheader($mailCfg['from_name'], 'UTF-8', 'B', "\r\n");

    $body = "Voici votre code de connexion : {$code}\n\n"
        . "Ce code expire dans {$ttlMinutes} minutes.\n\n"
        . "Si vous n'avez pas demandé ce code, ignorez cet e-mail.\n";

    $headers = implode("\r\n", [
        sprintf('From: %s <%s>', $fromName, $mailCfg['from_email']),
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion(),
    ]);

    return mail($to, $subject, $body, $headers);
}
