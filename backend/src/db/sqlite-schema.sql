-- SQLite schema — ambiente local (equivalente ao PostgreSQL v11)
-- Tipos adaptados: BOOLEAN→INTEGER(0/1), UUID→TEXT, JSONB→TEXT

CREATE TABLE IF NOT EXISTS players (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  nick         TEXT     NOT NULL UNIQUE,
  twitch_url   TEXT,
  youtube_url  TEXT,
  kick_url     TEXT,
  tiktok_url   TEXT,
  status       TEXT     NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  blocked      INTEGER  NOT NULL DEFAULT 0,
  deleted_at   TEXT     DEFAULT NULL,
  player_token TEXT     NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  created_at   TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
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
  score          INTEGER  NOT NULL DEFAULT 0,
  created_at     TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Seed: moderador master (login=admin, senha=admin123)
INSERT OR IGNORE INTO moderators (id, login, role, password_hash) VALUES (
  'aaaaaaaa-0000-4000-8000-000000000001',
  'admin',
  'master',
  '$2b$10$USBsx2GHapo/wz7X2mBUremnmMCdZ.p9Sc11EoFgVaAQMB4Efdjz2'
);

-- Seed: jogador aprovado para testar sync
INSERT OR IGNORE INTO players (nick, status, twitch_url, player_token) VALUES (
  'TestPlayer',
  'approved',
  'https://twitch.tv/testplayer',
  'bbbbbbbb-0000-4000-8000-000000000001'
);
