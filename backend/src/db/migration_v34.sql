-- migration_v34.sql — curtir perfil de jogador
-- Executar no Supabase SQL Editor (PostgreSQL)

CREATE TABLE IF NOT EXISTS player_likes (
  id              SERIAL      PRIMARY KEY,
  liker_player_id INTEGER     NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  liked_player_id INTEGER     NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(liker_player_id, liked_player_id)
);
