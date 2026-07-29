-- SQLite schema — ambiente local (equivalente ao PostgreSQL v11)
-- Tipos adaptados: BOOLEAN→INTEGER(0/1), UUID→TEXT, JSONB→TEXT

CREATE TABLE IF NOT EXISTS players (
  id                 INTEGER  PRIMARY KEY AUTOINCREMENT,
  nick               TEXT     NOT NULL UNIQUE,
  email              TEXT     UNIQUE,
  password_hash      TEXT,
  email_verified_at  TEXT     DEFAULT NULL,
  twitch_url         TEXT,
  youtube_url        TEXT,
  kick_url           TEXT,
  tiktok_url         TEXT,
  status             TEXT     NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  blocked            INTEGER  NOT NULL DEFAULT 0,
  deleted_at         TEXT     DEFAULT NULL,
  player_token       TEXT     NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  created_at         TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS player_tokens (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  player_id   INTEGER  NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token       TEXT     NOT NULL UNIQUE,
  type        TEXT     NOT NULL CHECK (type IN ('verify', 'reset', 'activate', 'otp')),
  expires_at  TEXT     NOT NULL,
  used_at     TEXT     DEFAULT NULL,
  created_at  TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS moderators (
  id            TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  login         TEXT    NOT NULL UNIQUE,
  role          TEXT    NOT NULL DEFAULT 'moderator'
                CHECK (role IN ('moderator', 'master')),
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS entries (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  player_id      INTEGER  REFERENCES players(id)    ON DELETE SET NULL,
  moderator_id   TEXT     REFERENCES moderators(id) ON DELETE SET NULL,
  name           TEXT     NOT NULL,
  character_name TEXT,
  profession     TEXT,
  days           INTEGER  NOT NULL DEFAULT 0,
  time_raw       INTEGER  NOT NULL DEFAULT 0,
  time_str       TEXT,
  kills          INTEGER  NOT NULL DEFAULT 0,
  skills         TEXT,
  live_url       TEXT,
  is_alive       INTEGER  NOT NULL DEFAULT 1,
  sandbox_ok     INTEGER  NOT NULL DEFAULT 1,
  traits         TEXT,
  objectives     TEXT,
  score                      INTEGER  NOT NULL DEFAULT 0,
  sandbox_config             TEXT,
  sandbox_config_updated_at  TEXT,
  disqualification_reason    TEXT     DEFAULT NULL,
  disqualified_at            TEXT     DEFAULT NULL,
  flagged_reason             TEXT     DEFAULT NULL,
  flagged_at                 TEXT     DEFAULT NULL,
  created_at                 TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at                 TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deleted_at                 TEXT     DEFAULT NULL,
  UNIQUE (player_id, character_name)
);

CREATE TABLE IF NOT EXISTS mods (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  name         TEXT     NOT NULL,
  mod_id       TEXT     UNIQUE DEFAULT NULL,
  workshop_url TEXT     NOT NULL UNIQUE,
  status       TEXT     NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'blocked')),
  is_required  INTEGER  NOT NULL DEFAULT 0,
  image_url    TEXT     DEFAULT NULL,
  created_at   TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS mod_dependencies (
  mod_id        INTEGER NOT NULL REFERENCES mods(id) ON DELETE CASCADE,
  depends_on_id INTEGER NOT NULL REFERENCES mods(id) ON DELETE CASCADE,
  PRIMARY KEY (mod_id, depends_on_id)
);

-- Seed: moderador master (login=admin, senha=admin123)
INSERT OR IGNORE INTO moderators (id, login, role, password_hash) VALUES (
  'aaaaaaaa-0000-4000-8000-000000000001',
  'admin',
  'master',
  '$2b$10$USBsx2GHapo/wz7X2mBUremnmMCdZ.p9Sc11EoFgVaAQMB4Efdjz2'
);

CREATE TABLE IF NOT EXISTS seasons (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  name        TEXT     NOT NULL,
  theme_slug  TEXT     DEFAULT NULL,
  started_at  TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ended_at    TEXT     DEFAULT NULL,
  is_active   INTEGER  NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS hall_of_fame (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  season_id      INTEGER  NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_id      INTEGER  REFERENCES players(id) ON DELETE SET NULL,
  entry_name     TEXT     NOT NULL,
  character_name TEXT     DEFAULT NULL,
  position       INTEGER  NOT NULL,
  days           INTEGER  DEFAULT 0,
  kills          INTEGER  DEFAULT 0,
  score          INTEGER  DEFAULT 0
);

-- Seed: jogador aprovado para testar sync
INSERT OR IGNORE INTO players (nick, status, twitch_url, player_token) VALUES (
  'TestPlayer',
  'approved',
  'https://twitch.tv/testplayer',
  'bbbbbbbb-0000-4000-8000-000000000001'
);