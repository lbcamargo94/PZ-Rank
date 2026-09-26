-- migration_v43: abates por arma (mod 2.29.0) — JSON {cats:{tipo:n}, top:[[item,n]]}
-- Ver lib/weapons.ts. Dado de jogo (arma usada), nenhuma posição ou dado pessoal.
ALTER TABLE entries     ADD COLUMN IF NOT EXISTS weapon_kills TEXT DEFAULT NULL;
ALTER TABLE run_history ADD COLUMN IF NOT EXISTS weapon_kills TEXT DEFAULT NULL;
