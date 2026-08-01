-- Migration 007: PZRX4 — 4 novas colunas de stats estendidos (mod v2.10+)
-- Run on Supabase SQL editor

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS trees_cut        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS books_read       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS structures_built INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crops_planted    INTEGER NOT NULL DEFAULT 0;
