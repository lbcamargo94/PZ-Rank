-- migration_v49: histórico de syncs (v4.29.0, lib/syncHistory.ts)
-- Uma linha por sync decodificado, com o resultado (aceito, recusado, desclassificado,
-- mod desatualizado). Só guarda o que o Companion já envia. Retenção de 90 dias pelo cron
-- /cron/prune-sync-history. Peso estimado: ~60 MB/mês, ~180 MB estáveis.
CREATE TABLE IF NOT EXISTS sync_history (
  id             BIGSERIAL   PRIMARY KEY,
  at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  player_id      INTEGER     REFERENCES players(id) ON DELETE CASCADE,
  entry_id       INTEGER     DEFAULT NULL,
  character_name TEXT        NOT NULL DEFAULT '',
  result         TEXT        NOT NULL CHECK (result IN ('aceito', 'recusado', 'desclassificado', 'mod_desatualizado')),
  detail         TEXT        DEFAULT NULL,
  http_status    SMALLINT    DEFAULT NULL,
  time_raw       INTEGER     DEFAULT NULL,
  days           INTEGER     DEFAULT NULL,
  kills          INTEGER     DEFAULT NULL,
  score          INTEGER     DEFAULT NULL,
  is_alive       BOOLEAN     DEFAULT NULL,
  sandbox_ok     BOOLEAN     DEFAULT NULL,
  code_reason    TEXT        DEFAULT NULL,
  mod_version    TEXT        DEFAULT NULL,
  skills         TEXT        DEFAULT NULL,
  flagged        TEXT        DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_history_entry  ON sync_history(entry_id, at);
CREATE INDEX IF NOT EXISTS idx_sync_history_player ON sync_history(player_id, at);
CREATE INDEX IF NOT EXISTS idx_sync_history_at     ON sync_history(at);
