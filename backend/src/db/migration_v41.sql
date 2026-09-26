-- migration_v41: região onde o personagem morreu (só o NOME, nunca coordenada)
-- Gravada pelo servidor no sync em que o personagem passa de vivo → morto, a partir
-- do ponto de morte do heatmap_delta (lib/mapRegions.ts). Antes disso não há dado
-- confiável: o mapa de calor somava o mesmo ponto de morte a cada sync.

ALTER TABLE entries     ADD COLUMN IF NOT EXISTS death_region TEXT DEFAULT NULL;
ALTER TABLE run_history ADD COLUMN IF NOT EXISTS death_region TEXT DEFAULT NULL;
