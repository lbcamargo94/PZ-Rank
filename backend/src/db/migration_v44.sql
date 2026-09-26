-- migration_v44: link do YouTube que não resolve para um canal
-- O cron /cron/backfill-yt-subs conta só falhas definitivas (canal não existe) e
-- desiste depois de YT_RESOLVE_MAX_ATTEMPTS; o painel lista esses jogadores.
ALTER TABLE players ADD COLUMN IF NOT EXISTS yt_resolve_attempts  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS yt_resolve_failed_at TIMESTAMPTZ DEFAULT NULL;
