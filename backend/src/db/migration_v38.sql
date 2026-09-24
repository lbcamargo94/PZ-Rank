-- migration_v38: histórico de runs + temporada/causa da morte/início da run em entries
--
-- Problema: entries tem UNIQUE(player_id, character_name). Quando um jogador morre e
-- começa uma partida nova com o MESMO nome, o sync reaproveita a linha e a run
-- anterior era apagada (caso real: Kdevil, 563 dias, 2026-09-24). Pelo jornal, 138
-- personagens já tinham perdido runs assim desde 2026-09-06.
--
-- Solução: antes de sobrescrever, o servidor copia a run antiga para run_history
-- (lib/runHistory.ts). entries continua sendo "a run ATUAL de cada personagem".

CREATE TABLE IF NOT EXISTS run_history (
  id                   SERIAL       PRIMARY KEY,
  entry_id             INTEGER      REFERENCES entries(id) ON DELETE SET NULL,
  -- exclusão definitiva do jogador remove o histórico dele junto (privacidade)
  player_id            INTEGER      REFERENCES players(id) ON DELETE CASCADE,
  season_id            INTEGER      REFERENCES seasons(id) ON DELETE SET NULL,
  name                 TEXT         NOT NULL,
  character_name       TEXT,
  profession           TEXT,
  days                 INTEGER      NOT NULL DEFAULT 0,
  time_raw             INTEGER      NOT NULL DEFAULT 0,
  time_str             TEXT,
  kills                INTEGER      NOT NULL DEFAULT 0,
  score                INTEGER      NOT NULL DEFAULT 0,
  skills               TEXT,
  traits               TEXT,
  objectives           JSONB,
  is_alive             BOOLEAN      NOT NULL DEFAULT FALSE,  -- TRUE = run abandonada sem morte registrada
  sandbox_ok           BOOLEAN      NOT NULL DEFAULT TRUE,
  disqualification_reason TEXT,
  death_cause          TEXT,
  -- contadores de ações (mesmos nomes de entries) — só confiáveis com stats_synced_at
  animals_killed INTEGER, fish_caught INTEGER, crops_harvested INTEGER, items_crafted INTEGER,
  houses_looted INTEGER, hours_without_sleep INTEGER, trees_cut INTEGER, books_read INTEGER,
  structures_built INTEGER, crops_planted INTEGER, spiffo_visited INTEGER,
  eggs_collected INTEGER, milk_produced INTEGER, stone_structures INTEGER, ceramic_items INTEGER,
  forged_weapons INTEGER, km_driven INTEGER, cities_visited INTEGER, military_visited INTEGER,
  meals_cooked INTEGER, water_collected INTEGER, materials_crafted INTEGER, animal_tracks INTEGER,
  weapons_crafted INTEGER, furniture_crafted INTEGER, clothes_crafted INTEGER, cheese_produced INTEGER,
  doors_opened INTEGER, sleep_locations INTEGER, basements_explored INTEGER, stations_used INTEGER,
  animal_species INTEGER, days_no_canned INTEGER,
  stats_synced_at      TIMESTAMPTZ,
  run_started_at       TIMESTAMPTZ,
  run_ended_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  -- 'sync' = arquivada automaticamente; 'snapshot'/'dump'/'journal' = recuperada depois
  source               TEXT         NOT NULL DEFAULT 'sync'
                       CHECK (source IN ('sync', 'manual', 'snapshot', 'dump', 'journal')),
  -- TRUE = só temos dias/kills/pontuação/causa (recuperada do jornal): fica fora de
  -- profissões/traits/skills/ações nas estatísticas
  is_partial           BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_run_history_player ON run_history(player_id);

ALTER TABLE entries ADD COLUMN IF NOT EXISTS death_cause    TEXT        DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS run_started_at TIMESTAMPTZ DEFAULT NULL;
-- entries.season_id já existe (nunca era preenchida) — passa a ser gravada no sync
