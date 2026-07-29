-- Migration 003: achievement system
-- Run on Supabase SQL editor

CREATE TABLE IF NOT EXISTS achievements (
  id          SERIAL       PRIMARY KEY,
  slug        TEXT         NOT NULL UNIQUE,
  name        TEXT         NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  icon        TEXT         NOT NULL DEFAULT '',
  tier        TEXT         NOT NULL DEFAULT 'bronze'
              CHECK (tier IN ('bronze', 'silver', 'gold')),
  stat        TEXT         NOT NULL DEFAULT 'kills',
  threshold   INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_achievements (
  id             SERIAL       PRIMARY KEY,
  player_id      INTEGER      NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id INTEGER      NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  entry_id       INTEGER      REFERENCES entries(id) ON DELETE SET NULL,
  unlocked_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, achievement_id)
);

INSERT INTO achievements (slug, name, description, icon, tier, stat, threshold) VALUES
  ('first-blood',   'Primeiro Sangue',  '100 zumbis mortos',      '🩸', 'bronze', 'kills', 100),
  ('zombie-slayer', 'Exterminador',     '1.000 zumbis mortos',    '⚔️', 'silver', 'kills', 1000),
  ('zombie-god',    'Deus da Morte',    '10.000 zumbis mortos',   '💀', 'gold',   'kills', 10000),
  ('marathon',      'Maratonista',      '30 dias sobrevividos',   '🏃', 'bronze', 'days',  30),
  ('veteran',       'Veterano',         '60 dias sobrevividos',   '🎖️', 'silver', 'days',  60),
  ('legend',        'Lenda',            '100 dias sobrevividos',  '👑', 'gold',   'days',  100),
  ('immortal',      'Imortal',          '365 dias sobrevividos',  '🌟', 'gold',   'days',  365)
ON CONFLICT (slug) DO NOTHING;
