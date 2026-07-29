-- Migration 004: PZRX3 extended stats
-- Run on Supabase SQL editor

-- New columns on entries (nullable = not yet reported by mod)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS animals_killed      INTEGER DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS fish_caught         INTEGER DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS crops_harvested     INTEGER DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS items_crafted       INTEGER DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS houses_looted       INTEGER DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS hours_without_sleep INTEGER DEFAULT NULL;

-- New achievements (PZRX3 extended stats)
INSERT INTO achievements (slug, name, description, icon, tier, stat, threshold) VALUES
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
  ('no-sleep',      'Sem Sono',         '96h sem dormir',          '👁️', 'gold',   'hours_without_sleep', 96)
ON CONFLICT (slug) DO NOTHING;
