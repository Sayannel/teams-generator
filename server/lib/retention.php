<?php
declare(strict_types=1);

// Time-based degradation of attendance history, run opportunistically from
// maybe_cleanup_expired() — this host has no cron (FTP/SFTP-only, no SSH),
// same constraint that already shaped that function.
//
// Lifecycle of a tg_list_sessions row:
//   fresh    (age < degrade_after_days):  tg_session_attendees rows exist,
//            names are readable as usual.
//   degraded (age >= degrade_after_days): tg_session_attendees rows are
//            gone; the nominative list survives only sealed in
//            encrypted_attendees, decryptable offline with the private key
//            the club's designated "responsable" holds — never by this
//            app. present_count/male_count/female_count are visible.
//   anonymized (age >= anonymize_after_days): encrypted_attendees is wiped
//            too. Nobody, private key included, can recover who attended.

/** Processes at most $limit not-yet-degraded sessions per call. */
function degrade_expired_sessions(PDO $pdo, int $limit = 20): void
{
    $days = (int) config('retention')['degrade_after_days'];
    $publicKey = base64_decode((string) config('retention')['encryption_public_key'], true);
    if ($publicKey === false || strlen($publicKey) !== SODIUM_CRYPTO_BOX_PUBLICKEYBYTES) {
        // Not configured (e.g. still 'change_me') — skip rather than fatal.
        return;
    }

    $stmt = $pdo->prepare(
        'SELECT id FROM tg_list_sessions
         WHERE occurred_at <= (NOW() - INTERVAL ? DAY) AND degraded_at IS NULL
         LIMIT ?'
    );
    $stmt->bindValue(1, $days, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $sessionIds = array_column($stmt->fetchAll(), 'id');

    foreach ($sessionIds as $sessionId) {
        degrade_one_session($pdo, (int) $sessionId, $publicKey);
    }
}

function degrade_one_session(PDO $pdo, int $sessionId, string $publicKey): void
{
    $stmt = $pdo->prepare(
        'SELECT p.id, p.name, p.gender
         FROM tg_session_attendees sa
         JOIN tg_players p ON p.id = sa.player_id
         WHERE sa.session_id = ?'
    );
    $stmt->execute([$sessionId]);
    $attendees = $stmt->fetchAll();

    $presentCount = count($attendees);
    $maleCount = 0;
    $femaleCount = 0;
    foreach ($attendees as $a) {
        if ($a['gender'] === 'female') {
            $femaleCount++;
        } else {
            $maleCount++;
        }
    }

    $sealed = sodium_crypto_box_seal(
        json_encode(array_map(fn($a) => ['id' => (int) $a['id'], 'name' => $a['name']], $attendees)),
        $publicKey
    );

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'UPDATE tg_list_sessions
             SET present_count = ?, male_count = ?, female_count = ?, encrypted_attendees = ?, degraded_at = NOW()
             WHERE id = ?'
        )->execute([$presentCount, $maleCount, $femaleCount, $sealed, $sessionId]);
        $pdo->prepare('DELETE FROM tg_session_attendees WHERE session_id = ?')->execute([$sessionId]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/** Wipes the sealed blob for sessions past the final retention window. */
function anonymize_expired_sessions(PDO $pdo, int $limit = 20): void
{
    $days = (int) config('retention')['anonymize_after_days'];
    $stmt = $pdo->prepare(
        'UPDATE tg_list_sessions
         SET encrypted_attendees = NULL, anonymized_at = NOW()
         WHERE occurred_at <= (NOW() - INTERVAL ? DAY)
           AND degraded_at IS NOT NULL
           AND anonymized_at IS NULL
         LIMIT ?'
    );
    $stmt->bindValue(1, $days, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->execute();
}

function run_retention_job(PDO $pdo): void
{
    degrade_expired_sessions($pdo);
    anonymize_expired_sessions($pdo);
}
