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
  blocked_reason     TEXT     DEFAULT NULL,
  blocked_at         TEXT     DEFAULT NULL,
  blocked_by         TEXT     DEFAULT NULL,
  blocked_note       TEXT     DEFAULT NULL,
  is_supporter       INTEGER  NOT NULL DEFAULT 0,
  supporter_until    TEXT     DEFAULT NULL,
  deleted_at         TEXT     DEFAULT NULL,
  gender             TEXT     DEFAULT NULL CHECK (gender IN ('m', 'f')),
  player_token       TEXT     NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  terms_accepted_at  TEXT     DEFAULT NULL,
  yt_channel_id           TEXT     DEFAULT NULL,
  yt_sub_expires_at       TEXT     DEFAULT NULL,
  yt_last_live_video_id   TEXT     DEFAULT NULL,
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
  id                TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  login             TEXT    NOT NULL UNIQUE,
  email             TEXT    UNIQUE,
  email_verified_at TEXT    DEFAULT NULL,
  role              TEXT    NOT NULL DEFAULT 'moderator'
                    CHECK (role IN ('moderator', 'master')),
  password_hash             TEXT    NOT NULL,
  reset_token               TEXT    DEFAULT NULL,
  reset_token_expires_at    TEXT    DEFAULT NULL,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS moderator_tokens (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  email       TEXT     NOT NULL,
  token       TEXT     NOT NULL UNIQUE,
  type        TEXT     NOT NULL CHECK (type IN ('invite', 'otp')),
  expires_at  TEXT     NOT NULL,
  used_at     TEXT     DEFAULT NULL,
  created_at  TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
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
  trees_cut           INTEGER  DEFAULT NULL,
  books_read          INTEGER  DEFAULT NULL,
  structures_built    INTEGER  DEFAULT NULL,
  crops_planted       INTEGER  DEFAULT NULL,
  spiffo_visited      INTEGER  DEFAULT NULL,
  -- PZRX6
  eggs_collected      INTEGER  NOT NULL DEFAULT 0,
  milk_produced       INTEGER  NOT NULL DEFAULT 0,
  stone_structures    INTEGER  NOT NULL DEFAULT 0,
  ceramic_items       INTEGER  NOT NULL DEFAULT 0,
  forged_weapons      INTEGER  NOT NULL DEFAULT 0,
  km_driven           INTEGER  NOT NULL DEFAULT 0,
  cities_visited      INTEGER  NOT NULL DEFAULT 0,
  military_visited    INTEGER  NOT NULL DEFAULT 0,
  meals_cooked        INTEGER  NOT NULL DEFAULT 0,
  water_collected     INTEGER  NOT NULL DEFAULT 0,
  materials_crafted   INTEGER  NOT NULL DEFAULT 0,
  animal_tracks       INTEGER  NOT NULL DEFAULT 0,
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
INSERT OR IGNORE INTO moderators (id, login, email, email_verified_at, role, password_hash) VALUES (
  'aaaaaaaa-0000-4000-8000-000000000001',
  'admin',
  'lb.camargo94@gmail.com',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
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
              CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
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

-- ═══════════════════════════════════════════════════════
-- CONQUISTAS — 5 raridades, 75 conquistas
-- stats rastreados: kills, days, hours_without_sleep,
--   animals_killed, fish_caught, crops_harvested, items_crafted, houses_looted,
--   trees_cut, books_read, structures_built, crops_planted
-- stats futuros (mod): demais campos
-- ═══════════════════════════════════════════════════════
INSERT OR IGNORE INTO achievements (slug, name, description, icon, tier, stat, threshold) VALUES
  -- ── BRONZE (25) ──────────────────────────────────────
  -- Sobrevivência
  ('first-blood',    'Primeiro Sangue',    'Mate 100 zumbis',                  '🩸', 'bronze', 'kills',              100),
  ('marathon',       'Maratonista',        'Sobreviva 30 dias',                 '🏃', 'bronze', 'days',                30),
  ('insomniac',      'Insone',             '48h sem dormir',                    '😴', 'bronze', 'hours_without_sleep', 48),
  ('hunter',         'Caçador',            'Abata 50 animais',                  '🍖', 'bronze', 'animals_killed',       50),
  ('fisherman',      'Pescador',           'Pesque 30 peixes',                  '🐟', 'bronze', 'fish_caught',          30),
  -- Agricultura
  ('farmer',         'Fazendeiro',         'Colha 50 vegetais',                 '🌽', 'bronze', 'crops_harvested',      50),
  ('big-harvest',    'Colheita Farta',     'Colha 200 vegetais',                '🥔', 'bronze', 'crops_harvested',     200),
  ('egg-collector',  'Primeiros Ovos',     'Colete 30 ovos',                    '🥚', 'bronze', 'eggs_collected',       30),
  ('milkman',        'Ordenhador',         'Produza leite pela 1ª vez',         '🥛', 'bronze', 'milk_produced',         1),
  ('gardener',       'Mãos à Terra',       'Plante 100 culturas',               '🌱', 'bronze', 'crops_planted',       100),
  -- Crafting
  ('builder',        'Construtor',         'Fabrique 50 itens',                 '🔨', 'bronze', 'items_crafted',        50),
  ('carpenter',      'Carpinteiro',        'Construa 100 estruturas',           '🪓', 'bronze', 'structures_built',    100),
  ('mason',          'Pedreiro',           'Construa 50 estruturas de pedra',   '🧱', 'bronze', 'stone_structures',     50),
  ('potter',         'Oleiro',             'Produza 20 itens de cerâmica',      '🏺', 'bronze', 'ceramic_items',        20),
  ('smith-novice',   'Ferreiro Iniciante', 'Produza sua 1ª arma forjada',       '🔥', 'bronze', 'forged_weapons',        1),
  -- Exploração
  ('looter',         'Saqueador',          'Saqueie 20 casas',                  '🏚️', 'bronze', 'houses_looted',        20),
  ('driver',         'Motorista',          'Percorra 500 km',                   '🚗', 'bronze', 'km_driven',           500),
  ('explorer',       'Explorador',         'Visite 5 cidades',                  '🗺️', 'bronze', 'cities_visited',        5),
  ('spiffo-customer','Cliente do Spiffo',  'Visite um restaurante Spiffo',      '🦝', 'bronze', 'spiffo_visited',        1),
  ('recruit',        'Recruta',            'Entre na Base Militar',             '🪖', 'bronze', 'military_visited',      1),
  -- Diversos
  ('cook',           'Cozinheiro',         'Prepare 100 refeições',             '🍳', 'bronze', 'meals_cooked',        100),
  ('water-collector','Sobrevivente',       'Colete 500 litros de água',         '💧', 'bronze', 'water_collected',     500),
  ('lumberjack',     'Lenhador',           'Corte 500 árvores',                 '🪵', 'bronze', 'trees_cut',           500),
  ('craftsman',      'Artesão',            'Produza 500 materiais',             '⚒️', 'bronze', 'materials_crafted',   500),
  ('tracker',        'Rastreador',         'Siga 50 rastros de animais',        '🐾', 'bronze', 'animal_tracks',        50),
  -- ── PRATA (20) ───────────────────────────────────────
  ('zombie-slayer',    'Exterminador',         '1.000 zumbis mortos',           '⚔️', 'silver', 'kills',             1000),
  ('veteran',          'Veterano',             '60 dias sobrevividos',          '🎖️', 'silver', 'days',                60),
  ('big-game',         'Caça Grossa',          '200 animais abatidos',          '🦌', 'silver', 'animals_killed',      200),
  ('master-angler',    'Mestre da Pesca',      '100 peixes capturados',         '🎣', 'silver', 'fish_caught',         100),
  ('raider',           'Pilhador',             '100 casas saqueadas',           '🗝️', 'silver', 'houses_looted',       100),
  ('engineer',         'Engenheiro',           '500 itens fabricados',          '🏗️', 'silver', 'items_crafted',       500),
  ('colonizer',        'Colonizador',          'Construa 5 bases',              '🏠', 'silver', 'bases_built',           5),
  ('agronomist',       'Agrônomo',             '500 colheitas',                 '🚜', 'silver', 'crops_harvested',     500),
  ('trucker',          'Caminhoneiro',         'Percorra 2.000 km',             '🚛', 'silver', 'km_driven',          2000),
  ('master-lumberjack','Lenhador Mestre',      'Corte 5.000 árvores',           '🌲', 'silver', 'trees_cut',          5000),
  ('cheesemaker',      'Fazendeiro Rural',     'Produza queijo',                '🧀', 'silver', 'cheese_produced',       1),
  ('butcher',          'Açougueiro',           '200 animais abatidos p/ carne', '🥩', 'silver', 'meat_butchered',      200),
  ('breeder',          'Criador',              '4 espécies de animais',         '🐑', 'silver', 'animal_species',        4),
  ('nomad',            'Nômade',               'Durma em 30 locais diferentes', '🏕️', 'silver', 'sleep_locations',      30),
  ('kentucky-explorer','Explorador de Kentucky','Visite todas as cidades',      '🧭', 'silver', 'all_cities_visited',    1),
  ('scholar',          'Estudioso',            'Leia 100 livros',               '📚', 'silver', 'books_read',          100),
  ('master-craftsman', 'Mestre Artesão',       '5.000 itens fabricados',        '🛠️', 'silver', 'items_crafted',      5000),
  ('door-breaker',     'Arrombador',           'Abra 500 portas',               '🚪', 'silver', 'doors_opened',        500),
  ('industrialist',    'Industrial',           'Utilize todas as estações',     '🏭', 'silver', 'all_stations_used',     1),
  ('scout',            'Escoteiro',            'Explore 100 porões',            '🔦', 'silver', 'basements_explored',  100),
  -- ── OURO (19) — immortal promovido para Platina ─────
  ('zombie-god',       'Deus da Morte',        '10.000 zumbis mortos',          '💀', 'gold', 'kills',              10000),
  ('legend',           'Lenda',                '100 dias sobrevividos',         '👑', 'gold', 'days',                 100),
  ('immortal',         'Imortal',              'Sobreviva 365 dias',            '🌟', 'platinum', 'days',             365),
  ('no-sleep',         'Sem Sono',             '96h sem dormir',                '👁️', 'gold', 'hours_without_sleep',   96),
  ('fortress',         'Fortaleza',            'Construa uma mega base',        '🏰', 'gold', 'mega_base',              1),
  ('spiffo-base',      'Dono do Spiffo',       'Base em um restaurante Spiffo', '🍔', 'gold', 'spiffo_base_any',        1),
  ('spiffo-franchise', 'Franqueado',           'Bases em 5 restaurantes Spiffo','🦝', 'gold', 'spiffo_base_five',       5),
  ('conqueror',        'Conquistador',         'Limpe Louisville',              '🏙️', 'gold', 'louisville_cleared',     1),
  ('military-op',      'Operação Militar',     'Limpe a Base Militar',          '🪖', 'gold', 'military_cleared',       1),
  ('calorie-hoarder',  'Acumulador',           'Armazene 100.000 calorias',     '📦', 'gold', 'calories_stored',   100000),
  ('master-smith',     'Mestre Ferreiro',      '500 armas produzidas',          '⚙️', 'gold', 'weapons_crafted',      500),
  ('master-tailor',    'Alfaiate Mestre',      '500 roupas produzidas',         '🧵', 'gold', 'clothes_crafted',      500),
  ('master-woodworker','Marceneiro Mestre',    '500 móveis produzidos',         '🪑', 'gold', 'furniture_crafted',    500),
  ('livestock-king',   'Pecuarista',           '50 animais vivos',              '🐄', 'gold', 'animals_alive',         50),
  ('self-sufficient',  'Autossuficiente',      '180 dias sem enlatados',        '🌾', 'gold', 'days_no_canned',       180),
  ('traveler',         'Viajante',             'Visite todas as regiões do mapa','🚂', 'gold', 'all_regions_visited',   1),
  ('spiffo-collector', 'Colecionador',         'Colete todas as estátuas Spiffo','🏛️', 'gold', 'spiffo_statues',       1),
  ('scientist',        'Cientista',            'Use todas as bancadas',         '🔬', 'gold', 'all_benches_used',      1),
  ('arsenal',          'Arsenal',              '100 armas de cada categoria',   '🛡️', 'gold', 'arsenal_complete',      1),
  ('electrician',      'Eletricista',          'Energize 10 bases',             '⚡', 'gold', 'powered_bases',        10),
  -- ── PLATINA (9) — completionist/supreme-survivor promovidos para Lendária ──
  ('season-01',        'O Início do Fim',      'Complete a Temporada 01',                      '☣️', 'platinum', 'season_01_complete',    1),
  ('spiffo-guardian',  'Guardião do Spiffo',   'Domine todos os restaurantes Spiffo',          '🏅', 'platinum', 'all_spiffo_bases',       1),
  ('full-map',         'Kentucky Inteiro',     'Revele todo o mapa',                           '🗺️', 'platinum', 'full_map_revealed',      1),
  ('master-skills',    'Mestre das Habilidades','Nível máximo em todas as habilidades',        '🧬', 'platinum', 'all_skills_10',          1),
  ('supreme-hunter',   'Caçador Supremo',      'Abata todas as espécies de animais',           '🏹', 'platinum', 'all_animal_species',     1),
  ('magnate',          'Magnata',              'Tenha todas as bases totalmente equipadas',    '🏆', 'platinum', 'all_bases_equipped',     1),
  ('rebuilder',        'Reconstrutor',         'Reconstrua todas as cidades com bases',        '🧱', 'platinum', 'cities_rebuilt',         1),
  ('supreme-survivor', 'Sobrevivente Supremo', 'Complete todos os objetivos do campeonato',   '👑', 'legendary', 'all_objectives_complete',1),
  ('master-industry',  'Mestre da Indústria',  '50.000 itens produzidos',                     '⚒️', 'platinum', 'items_crafted',      50000),
  ('completionist',    'Completionista',       'Obtenha todas as conquistas Ouro',             '💯', 'legendary', 'all_gold_achievements', 1);

-- Corrige tiers de conquistas existentes (migrações de dados)
UPDATE achievements SET tier = 'bronze', icon = '🍖' WHERE slug = 'hunter'     AND tier != 'bronze';
UPDATE achievements SET tier = 'silver'               WHERE slug = 'big-game'   AND tier != 'silver';
UPDATE achievements SET tier = 'silver'               WHERE slug = 'engineer'   AND tier != 'silver';
UPDATE achievements SET tier = 'bronze'               WHERE slug = 'insomniac'  AND tier != 'bronze';
UPDATE achievements SET threshold = 500, description = '500 colheitas'
  WHERE slug = 'agronomist' AND threshold != 500;
-- Migration 011 (agosto/2026): ajustes de tier
UPDATE achievements SET tier = 'platinum', description = 'Sobreviva 365 dias'
  WHERE slug = 'immortal' AND tier != 'platinum';
UPDATE achievements SET tier = 'legendary'
  WHERE slug = 'completionist' AND tier != 'legendary';
UPDATE achievements SET tier = 'legendary'
  WHERE slug = 'supreme-survivor' AND tier != 'legendary';

-- Seed: jogador aprovado para testar sync
INSERT OR IGNORE INTO players (nick, status, twitch_url, player_token) VALUES (
  'TestPlayer',
  'approved',
  'https://twitch.tv/testplayer',
  'bbbbbbbb-0000-4000-8000-000000000001'
);