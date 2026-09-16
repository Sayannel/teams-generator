-- teams-generator backend schema
-- Import manually via phpMyAdmin (no SSH/Composer/migration tool on the host).
-- Table prefix `tg_` keeps this isolated from WordPress's `wp_` tables if it
-- ends up sharing a database with the club's WordPress install.

CREATE TABLE tg_users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE tg_otp_codes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_created (user_id, created_at),
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES tg_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE tg_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_token_hash (token_hash),
  KEY idx_session_user (user_id),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES tg_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Personal directory of known people for a given user (skill/gender belong
-- to the person, not to any one list). `uniq_user_name` relies on the
-- table's case-insensitive collation to dedupe "Jane" vs "jane".
CREATE TABLE tg_players (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  gender ENUM('male', 'female') NOT NULL DEFAULT 'male',
  skill TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_user_name (user_id, name),
  CONSTRAINT fk_player_user FOREIGN KEY (user_id) REFERENCES tg_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- A named saved roster (e.g. "Mardi", "Jeudi") — just the people. Team size
-- is a per-session choice made when the list is imported into a session,
-- not a property of the list itself.
CREATE TABLE tg_lists (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_user_list_name (user_id, name),
  CONSTRAINT fk_list_user FOREIGN KEY (user_id) REFERENCES tg_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Usual roster membership (many-to-many). Ad hoc one-off additions for a
-- given session are NOT written here — only actual "usuals" of the list.
CREATE TABLE tg_list_players (
  list_id INT UNSIGNED NOT NULL,
  player_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (list_id, player_id),
  KEY idx_list_players_player (player_id),
  CONSTRAINT fk_lp_list FOREIGN KEY (list_id) REFERENCES tg_lists (id) ON DELETE CASCADE,
  CONSTRAINT fk_lp_player FOREIGN KEY (player_id) REFERENCES tg_players (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migration: public lists + per-list attendance history.
-- Import manually via phpMyAdmin, same as the rest of this file (no
-- migration tool on the host) — run against an already-deployed database
-- that already has the tables above.

-- Simple two-tier role for cross-account visibility (public lists feature).
-- Promoted manually in the DB, e.g.:
--   UPDATE tg_users SET role = 'admin' WHERE email = 'someone@example.org';
ALTER TABLE tg_users
  ADD COLUMN role ENUM('member', 'admin') NOT NULL DEFAULT 'member' AFTER email;

-- A list an admin (not just its owner) can see and manage the roster of,
-- from the "Mes listes" screen. Renaming/deleting/toggling this flag stays
-- owner-only — this only affects who else can *see and edit membership*.
ALTER TABLE tg_lists
  ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER name;

-- One row per completed team-generation session run from a saved list —
-- recorded when the organizer validates the generated teams (not when
-- attendance is merely checked). Only who was present is stored, consistent
-- with the rest of this schema never persisting absences.
CREATE TABLE tg_list_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  list_id INT UNSIGNED NOT NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_session_list (list_id, occurred_at),
  CONSTRAINT fk_ls_list FOREIGN KEY (list_id) REFERENCES tg_lists (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Who attended a given recorded session. Not scoped to current list
-- membership on purpose: a player later removed from the list still shows
-- up correctly in past history.
CREATE TABLE tg_session_attendees (
  session_id INT UNSIGNED NOT NULL,
  player_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (session_id, player_id),
  KEY idx_attendee_player (player_id),
  CONSTRAINT fk_sa_session FOREIGN KEY (session_id) REFERENCES tg_list_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_player FOREIGN KEY (player_id) REFERENCES tg_players (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migration: role-scoped attendance history + time-based retention.
-- Import manually via phpMyAdmin against an already-deployed database.

-- Three tiers: 'member' (own lists only) < 'coach' (public lists, but only
-- sees the attendance history of sessions they personally recorded) <
-- 'admin' (sees every public list's history, still subject to the same
-- retention degradation below — admin is not exempt from it).
ALTER TABLE tg_users
  MODIFY COLUMN role ENUM('member', 'coach', 'admin') NOT NULL DEFAULT 'member';

-- Who recorded a given session — lets a coach's history view be scoped to
-- "sessions I ran" rather than every session on a public list they can
-- otherwise manage. NULL for sessions recorded before this column existed,
-- or after the recording account was deleted; such sessions are admin-only.
ALTER TABLE tg_list_sessions
  ADD COLUMN recorded_by INT UNSIGNED NULL AFTER list_id,
  ADD CONSTRAINT fk_ls_recorded_by FOREIGN KEY (recorded_by) REFERENCES tg_users (id) ON DELETE SET NULL;

-- Retention state for a session, degraded by age regardless of who's
-- looking (owner, coach or admin) — see lib/retention.php. present_count /
-- male_count / female_count are computed once, at degrade time, from the
-- (about to be deleted) tg_session_attendees rows, and survive past
-- anonymization; encrypted_attendees is the only thing anonymization wipes.
ALTER TABLE tg_list_sessions
  ADD COLUMN present_count SMALLINT UNSIGNED NULL AFTER occurred_at,
  ADD COLUMN male_count SMALLINT UNSIGNED NULL AFTER present_count,
  ADD COLUMN female_count SMALLINT UNSIGNED NULL AFTER male_count,
  ADD COLUMN encrypted_attendees MEDIUMBLOB NULL AFTER female_count,
  ADD COLUMN degraded_at DATETIME NULL AFTER encrypted_attendees,
  ADD COLUMN anonymized_at DATETIME NULL AFTER degraded_at,
  ADD KEY idx_session_retention (occurred_at, degraded_at, anonymized_at);

-- Single-row table: the last calendar day the retention job ran. Lets
-- bootstrap.php trigger it once per day off real traffic (first request of
-- the day) instead of needing a cron feature the host may not offer — see
-- maybe_run_daily_retention() in lib/retention.php.
CREATE TABLE tg_retention_state (
  id TINYINT UNSIGNED NOT NULL,
  last_run_date DATE NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO tg_retention_state (id, last_run_date) VALUES (1, NULL);
