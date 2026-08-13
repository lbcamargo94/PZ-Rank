-- migration v26: PZRX7 — coluna weapons_crafted
ALTER TABLE entries ADD COLUMN IF NOT EXISTS weapons_crafted INTEGER NOT NULL DEFAULT 0;
