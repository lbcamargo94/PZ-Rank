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
  is_supporter       INTEGER  NOT NULL DEFAULT 0,
  supporter_until    TEXT     DEFAULT NULL,
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
  -- PZRX3 extended stats (NULL = not yet reported by mod)
  animals_killed      INTEGER  DEFAULT NULL,
  fish_caught         INTEGER  DEFAULT NULL,
  crops_harvested     INTEGER  DEFAULT NULL,
  items_crafted       INTEGER  DEFAULT NULL,
  houses_looted       INTEGER  DEFAULT NULL,
  hours_without_sleep INTEGER  DEFAULT NULL,
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

CREATE TABLE IF NOT EXISTS daily_news (
  id        INTEGER  PRIMARY KEY AUTOINCREMENT,
  date      TEXT     NOT NULL UNIQUE,
  headline  TEXT     DEFAULT NULL,
  stats     TEXT     DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS season_finances (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  season_id   INTEGER  NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  category    TEXT     NOT NULL CHECK(category IN ('hosting','prize','domain','adsense','supporters','sponsor','other')),
  label       TEXT     NOT NULL,
  amount_brl  REAL     NOT NULL DEFAULT 0,
  goal_brl    REAL     DEFAULT NULL,
  updated_at  TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS heatmap_events (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  season_id  INTEGER  REFERENCES seasons(id) ON DELETE CASCADE,
  event_type TEXT     NOT NULL CHECK (event_type IN ('kill', 'death', 'base')),
  grid_x     INTEGER  NOT NULL,
  grid_y     INTEGER  NOT NULL,
  count      INTEGER  NOT NULL DEFAULT 0,
  UNIQUE(season_id, event_type, grid_x, grid_y)
);

CREATE TABLE IF NOT EXISTS achievements (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  slug        TEXT     NOT NULL UNIQUE,
  name        TEXT     NOT NULL,
  description TEXT     NOT NULL DEFAULT '',
  icon        TEXT     NOT NULL DEFAULT '',
  tier        TEXT     NOT NULL DEFAULT 'bronze'
              CHECK (tier IN ('bronze', 'silver', 'gold')),
  stat        TEXT     NOT NULL DEFAULT 'kills',
  threshold   INTEGER  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_achievements (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  player_id      INTEGER  NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id INTEGER  NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  entry_id       INTEGER  REFERENCES entries(id) ON DELETE SET NULL,
  unlocked_at    TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(player_id, achievement_id)
);

INSERT OR IGNORE INTO achievements (slug, name, description, icon, tier, stat, threshold) VALUES
  -- kills
  ('first-blood',   'Primeiro Sangue',  '100 zumbis mortos',       '🩸', 'bronze', 'kills',              100),
  ('zombie-slayer', 'Exterminador',     '1.000 zumbis mortos',     '⚔️', 'silver', 'kills',             1000),
  ('zombie-god',    'Deus da Morte',    '10.000 zumbis mortos',    '💀', 'gold',   'kills',            10000),
  -- days
  ('marathon',      'Maratonista',      '30 dias sobrevividos',    '🏃', 'bronze', 'days',               30),
  ('veteran',       'Veterano',         '60 dias sobrevividos',    '🎖️', 'silver', 'days',               60),
  ('legend',        'Lenda',            '100 dias sobrevividos',   '👑', 'gold',   'days',              100),
  ('immortal',      'Imortal',          '365 dias sobrevividos',   '🌟', 'gold',   'days',              365),
  -- PZRX3 extended stats
  ('hunter',        'Caçador',          '50 animais abatidos',     '🏹', 'bronze', 'animals_killed',      50),
  ('big-game',      'Caça Grossa',      '200 animais abatidos',    '🦌', 'gold',   'animals_killed',     200),
  ('fisherman',     'Pescador',         '30 peixes capturados',    '🐟', 'bronze', 'fish_caught',         30),
  ('master-angler', 'Mestre da Pesca',  '100 peixes capturados',   '🎣', 'silver', 'fish_caught',        100),
  ('farmer',        'Fazendeiro',       '50 vegetais colhidos',    '🌽', 'bronze', 'crops_harvested',     50),
  ('agronomist',    'Agrônomo',         '200 vegetais colhidos',   '🚜', 'silver', 'crops_harvested',    200),
  ('builder',       'Construtor',       '50 itens fabricados',     '🔨', 'bronze', 'items_crafted',       50),
  ('engineer',      'Engenheiro',       '500 itens fabricados',    '🏗️', 'gold',   'items_crafted',      500),
  ('looter',        'Saqueador',        '20 casas saqueadas',      '🏚️', 'bronze', 'houses_looted',       20),
  ('raider',        'Pilhador',         '100 casas saqueadas',     '🗝️', 'silver', 'houses_looted',      100),
  ('insomniac',     'Insone',           '48h sem dormir',          '😴', 'silver', 'hours_without_sleep', 48),
  ('no-sleep',      'Sem Sono',         '96h sem dormir',          '👁️', 'gold',   'hours_without_sleep', 96);

-- Seed: jogador aprovado para testar sync
INSERT OR IGNORE INTO players (nick, status, twitch_url, player_token) VALUES (
  'TestPlayer',
  'approved',
  'https://twitch.tv/testplayer',
  'bbbbbbbb-0000-4000-8000-000000000001'
);