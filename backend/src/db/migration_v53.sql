-- migration_v53: dados da Oficina Steam por item, para a página de mods (v4.34.0)
--   Uma linha por item da Oficina (um item pode empacotar vários mod_id em `mods`).
--   tags, subscriptions e steam_updated_at vêm do cron diário /cron/refresh-workshop.
--   categories é a correção do moderador (JSON, ex: ["mapas"]); NULL = usar as tags.
CREATE TABLE IF NOT EXISTS workshop_items (
  workshop_id      TEXT PRIMARY KEY,
  title            TEXT DEFAULT NULL,
  tags             TEXT DEFAULT NULL,
  subscriptions    INTEGER DEFAULT NULL,
  steam_updated_at TIMESTAMPTZ DEFAULT NULL,
  fetched_at       TIMESTAMPTZ DEFAULT NULL,
  categories       TEXT DEFAULT NULL
);
