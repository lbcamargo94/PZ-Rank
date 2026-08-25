-- migration_v32.sql — destaque de streamers oficiais na home page
-- Executar no Supabase SQL Editor (PostgreSQL)

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_featured_streamer BOOLEAN NOT NULL DEFAULT false;
