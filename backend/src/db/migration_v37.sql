-- migration_v37: stats_synced_at em entries
-- Preenchida quando o sync traz os contadores de ações enviados pelo Companion
-- v2.5.0+ (lib/companionStats.ts). /estatisticas só usa contadores de ações de
-- runs com esta coluna preenchida — os valores antigos (PZRX≤8) estão congelados
-- desde o mod v2.16 e não são confiáveis (ver docs/estatisticas.md).

ALTER TABLE entries ADD COLUMN IF NOT EXISTS stats_synced_at TIMESTAMPTZ DEFAULT NULL;
