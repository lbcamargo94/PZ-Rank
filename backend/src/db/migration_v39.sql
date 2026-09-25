-- migration_v39 (dados): temporada e causa da morte nas runs antigas
--
-- 1) Temporada: entries.season_id só passou a ser gravado na v4.23.0. Até aqui
--    existiu UMA temporada ("Um Novo Começo", id 2, desde 2026-07-31) e toda run do
--    banco é dela (entry mais antiga: 2026-07-31) — por isso o id fixo 2.
--    NÃO reaproveitar este arquivo depois que outra temporada começar.
-- 2) Causa da morte: entries.death_cause começou a ser gravado na v4.23.0; antes
--    ela só existia em journal_events (player_died). Recupera da morte registrada no
--    jornal com os mesmos dias/kills da run.
-- 3) Mods antigos mandavam o texto da tela de morte ("Você sobreviveu por...") no
--    campo de causa — fica NULL (= desconhecida). Lista igual a DEATH_CAUSES em
--    backend/src/lib/statistics.ts.
--
-- Idempotente: rodar de novo não altera nada.

BEGIN;

UPDATE entries     SET season_id = 2 WHERE season_id IS NULL;
UPDATE run_history SET season_id = 2 WHERE season_id IS NULL;

UPDATE entries e
SET death_cause = j.cause
FROM (
  SELECT DISTINCT ON (player_id, char_name, (data->>'days')::int, (data->>'kills')::int)
         player_id, char_name,
         (data->>'days')::int  AS days,
         (data->>'kills')::int AS kills,
         lower(trim(data->>'cause')) AS cause
  FROM journal_events
  WHERE type = 'player_died'
  ORDER BY player_id, char_name, (data->>'days')::int, (data->>'kills')::int, created_at DESC
) j
WHERE NOT e.is_alive
  AND e.death_cause IS NULL
  AND j.player_id = e.player_id
  AND j.char_name = e.character_name
  AND j.days = e.days
  AND j.kills = e.kills
  AND j.cause IN ('zombie','zombie_horde','zombie_virus','vehicle','pvp','burned','bled',
                  'infection','bleach','poison','fall','cold','sick','hunger','thirst');

UPDATE entries SET death_cause = NULL
WHERE death_cause IS NOT NULL
  AND death_cause NOT IN ('zombie','zombie_horde','zombie_virus','vehicle','pvp','burned','bled',
                          'infection','bleach','poison','fall','cold','sick','hunger','thirst');
UPDATE run_history SET death_cause = NULL
WHERE death_cause IS NOT NULL
  AND death_cause NOT IN ('zombie','zombie_horde','zombie_virus','vehicle','pvp','burned','bled',
                          'infection','bleach','poison','fall','cold','sick','hunger','thirst');

COMMIT;
