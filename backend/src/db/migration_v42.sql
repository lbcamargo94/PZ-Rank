-- migration_v42: mapa de calor em lotes (mod 2.28.0)
-- Guarda só o id do último lote do mapa de calor processado por entry, para ignorar
-- reenvios do mesmo arquivo pelo Companion. Nenhuma posição é guardada por jogador.
ALTER TABLE entries ADD COLUMN IF NOT EXISTS heatmap_batch TEXT DEFAULT NULL;
