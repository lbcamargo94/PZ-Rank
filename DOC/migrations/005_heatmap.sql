-- Migration 005: heatmap_events
-- Run on Supabase SQL editor

CREATE TABLE IF NOT EXISTS heatmap_events (
  id         SERIAL       PRIMARY KEY,
  season_id  INTEGER      REFERENCES seasons(id) ON DELETE CASCADE,
  event_type TEXT         NOT NULL CHECK (event_type IN ('kill', 'death', 'base')),
  grid_x     INTEGER      NOT NULL,
  grid_y     INTEGER      NOT NULL,
  count      INTEGER      NOT NULL DEFAULT 0,
  UNIQUE(season_id, event_type, grid_x, grid_y)
);

CREATE INDEX IF NOT EXISTS idx_heatmap_season ON heatmap_events(season_id);
