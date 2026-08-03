-- migration_v22.sql — Reset de senha para moderadores
-- Executar no Supabase SQL Editor (PostgreSQL)

ALTER TABLE moderators ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE moderators ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;