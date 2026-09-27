-- migration_v47: anistia de debug e aviso de possível sessão sem o mod (mod 2.31.0)
--   debug_seen_min          última hora de jogo (min) em que o mod viu o debug (chega mesmo com a run desclassificada)
--   debug_amnesty_*         anistia concedida pelo moderador: perdoa debug visto até debug_amnesty_until_min
--   mod_gap_at_min          tempo de jogo do último aviso de gap já registrado (não repete o mesmo aviso)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS debug_seen_min          INTEGER     DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS debug_amnesty_until_min INTEGER     DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS debug_amnesty_note      TEXT        DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS debug_amnesty_by        TEXT        DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS debug_amnesty_at        TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS mod_gap_at_min          INTEGER     DEFAULT NULL;
