-- Migration 012: Add weapons_crafted column (PZRX7)
ALTER TABLE entries ADD COLUMN weapons_crafted INTEGER NOT NULL DEFAULT 0;
