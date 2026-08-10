-- Migration 010: remove conquistas silver de skill nível 10 duplicadas
--
-- A migration 009 adicionou sk-<skill>-10 (platinum, threshold 10) para todos os 35 skills,
-- mas não removeu as antigas sk-<skill> (silver, threshold 10) da migration anterior.
-- Resultado: todo jogador que atinge nível 10 em qualquer skill desbloqueia dois
-- achievements ao mesmo tempo — um silver e um platinum com o mesmo stat/threshold.
--
-- Este script remove os 35 duplicados antigos.
-- Os player_achievements associados também são removidos (ON DELETE CASCADE esperado,
-- ou excluídos manualmente abaixo se não houver CASCADE).
--
-- Run on Supabase SQL editor

-- 1. Remove os player_achievements referenciando os duplicados
DELETE FROM player_achievements
WHERE achievement_id IN (
  SELECT id FROM achievements
  WHERE tier = 'silver'
    AND threshold = 10
    AND stat LIKE 'skill_%'
);

-- 2. Remove as conquistas duplicadas
-- Identifica pelos 35 slugs antigos (sem sufixo numérico de nível)
DELETE FROM achievements
WHERE tier = 'silver'
  AND threshold = 10
  AND stat LIKE 'skill_%';

-- Verificação: deve retornar 0 linhas após a execução
-- SELECT slug, tier, stat, threshold FROM achievements
-- WHERE tier = 'silver' AND threshold = 10 AND stat LIKE 'skill_%';
