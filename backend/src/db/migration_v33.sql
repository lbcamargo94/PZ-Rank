-- migration_v33.sql — motivo obrigatório em desclassificação manual
-- Executar no Supabase SQL Editor (PostgreSQL)

ALTER TABLE entries ADD COLUMN IF NOT EXISTS disqualification_note TEXT DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS disqualified_by       TEXT DEFAULT NULL;
