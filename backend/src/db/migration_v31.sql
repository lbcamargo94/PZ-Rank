-- migration_v31.sql — notificação de live da Twitch no Discord
-- Executar no Supabase SQL Editor (PostgreSQL)

ALTER TABLE players ADD COLUMN IF NOT EXISTS twitch_last_live_id TEXT DEFAULT NULL;
