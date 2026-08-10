-- Migration 011: ajustes de tier em 3 conquistas (agosto/2026)
--
-- Mudanças:
--   immortal         gold      → platinum  (365 dias é raro demais para ser apenas Ouro)
--   completionist    platinum  → legendary (requer TODAS as conquistas Ouro)
--   supreme-survivor platinum  → legendary (requer completar TODOS os objetivos)
--
-- Run on Supabase SQL editor APÓS migration 010 (remove_duplicate_skill10_silver)

UPDATE achievements
SET tier = 'platinum', description = 'Sobreviva 365 dias'
WHERE slug = 'immortal';

UPDATE achievements
SET tier = 'legendary'
WHERE slug = 'completionist';

UPDATE achievements
SET tier = 'legendary'
WHERE slug = 'supreme-survivor';

-- Verificação esperada após execução:
-- SELECT slug, tier FROM achievements WHERE slug IN ('immortal', 'completionist', 'supreme-survivor');
-- immortal         | platinum
-- completionist    | legendary
-- supreme-survivor | legendary
