-- migration_v50: registro das ações da moderação (v4.29.5, lib/moderationLog.ts)
-- Uma linha por ação de moderador que deu certo em /entries e /players: quem, quando, o quê
-- e em qual run/jogador. Dados pessoais (e-mail, links) entram só como "alterado".
CREATE TABLE IF NOT EXISTS moderation_log (
  id              BIGSERIAL   PRIMARY KEY,
  at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderator_id    TEXT        DEFAULT NULL,
  moderator_login TEXT        DEFAULT NULL,
  action          TEXT        NOT NULL,
  entry_id        INTEGER     DEFAULT NULL,
  player_id       INTEGER     DEFAULT NULL,
  target          TEXT        DEFAULT NULL,
  details         TEXT        DEFAULT NULL,
  http_status     SMALLINT    DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_moderation_log_entry  ON moderation_log(entry_id, at);
CREATE INDEX IF NOT EXISTS idx_moderation_log_player ON moderation_log(player_id, at);
CREATE INDEX IF NOT EXISTS idx_moderation_log_at     ON moderation_log(at);
