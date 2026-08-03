-- v23: sistema de banimento com motivo, data e moderador responsável
ALTER TABLE players ADD COLUMN IF NOT EXISTS blocked_reason TEXT DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS blocked_by TEXT DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS blocked_note TEXT DEFAULT NULL;
