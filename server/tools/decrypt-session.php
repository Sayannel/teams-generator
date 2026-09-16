<?php
declare(strict_types=1);

// Offline recovery tool for the club's designated "responsable" — NEVER
// upload this to the host (see README "Deploy" step: only api/, lib/,
// config.php go up). Decrypts one session's sealed attendee list using the
// private half of the retention keypair, which this tool is the only place
// that ever needs it.
//
// Usage:
//   php decrypt-session.php <base64-private-key> <path-to-encrypted-blob>
//
// The blob is the raw bytes of tg_list_sessions.encrypted_attendees for one
// session — export it from phpMyAdmin (or `SELECT ... INTO OUTFILE`) first;
// this script never touches the database itself.

if ($argc !== 3) {
    fwrite(STDERR, "Usage: php decrypt-session.php <base64-private-key> <path-to-encrypted-blob>\n");
    exit(1);
}

$privateKey = base64_decode($argv[1], true);
if ($privateKey === false || strlen($privateKey) !== SODIUM_CRYPTO_BOX_SECRETKEYBYTES) {
    fwrite(STDERR, "Invalid private key.\n");
    exit(1);
}

$blob = file_get_contents($argv[2]);
if ($blob === false) {
    fwrite(STDERR, "Could not read blob file: {$argv[2]}\n");
    exit(1);
}

$publicKey = sodium_crypto_box_publickey_from_secretkey($privateKey);
$keypair = sodium_crypto_box_keypair_from_secretkey_and_publickey($privateKey, $publicKey);

$plaintext = sodium_crypto_box_seal_open($blob, $keypair);
if ($plaintext === false) {
    fwrite(STDERR, "Decryption failed — wrong key, or the blob is corrupt/truncated.\n");
    exit(1);
}

echo $plaintext . "\n";
