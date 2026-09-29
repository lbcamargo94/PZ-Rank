-- migration_v48: anistia de debug dada sem hora conhecida (v4.28.2)
-- Quando o mod do jogador ainda não informava a hora do debug (< v2.31.0), o limite da
-- anistia vinha do último estado gravado e a marca antiga era derrubada ao atualizar o mod
-- (caso n4ndo, 29/09). Com esta coluna, a anistia sem hora aceita a marca estimada.
ALTER TABLE entries ADD COLUMN IF NOT EXISTS debug_amnesty_legacy BOOLEAN DEFAULT NULL;

-- Anistias já concedidas: sem hora conhecida = debug_seen_min ainda nulo (Peppers).
UPDATE entries
   SET debug_amnesty_legacy = (debug_seen_min IS NULL)
 WHERE debug_amnesty_until_min IS NOT NULL
   AND debug_amnesty_legacy IS NULL;
