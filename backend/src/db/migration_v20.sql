-- migration v20: adiciona terms_accepted_at em players
ALTER TABLE players ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;
