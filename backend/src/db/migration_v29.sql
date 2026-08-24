-- migration_v29.sql — Aviso de sync sem transmissão ativa
-- Executar no Supabase SQL Editor (PostgreSQL)

ALTER TABLE entries ADD COLUMN IF NOT EXISTS no_live_streak INTEGER NOT NULL DEFAULT 0;
