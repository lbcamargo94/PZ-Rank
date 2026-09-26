-- migration_v45: região onde o personagem nasceu (mod 2.30.0) — só o nome, sem posição
ALTER TABLE entries     ADD COLUMN IF NOT EXISTS start_region TEXT DEFAULT NULL;
ALTER TABLE run_history ADD COLUMN IF NOT EXISTS start_region TEXT DEFAULT NULL;
