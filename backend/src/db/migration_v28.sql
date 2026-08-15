-- migration_v28.sql — Morte não registrada: rastrear conflito de personagem bloqueado
-- Executar no Supabase SQL Editor (PostgreSQL)

ALTER TABLE entries ADD COLUMN IF NOT EXISTS pending_new_character       TEXT DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS pending_new_character_since TIMESTAMPTZ DEFAULT NULL;
