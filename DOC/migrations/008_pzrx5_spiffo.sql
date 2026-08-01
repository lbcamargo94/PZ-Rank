-- Migration 008: PZRX5 — coluna spiffo_visited (mod v2.11+)
-- Rastreia quantos restaurantes Spiffo únicos o jogador visitou (por room type).
-- Run on Supabase SQL editor

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS spiffo_visited INTEGER NOT NULL DEFAULT 0;
