-- ============================================================
--  PZ Community Rank — Database Setup v3
--  Execute no SQL Editor do Supabase (painel → SQL Editor)
--  ATENÇÃO: Auth própria com bcrypt+JWT — sem dependência de auth.users
-- ============================================================

-- ── Tabela: players ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id          SERIAL      PRIMARY KEY,
  nick        TEXT        NOT NULL UNIQUE,
  twitch_url  TEXT,
  youtube_url TEXT,
  kick_url    TEXT,
  tiktok_url  TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela: moderators (auth própria — sem FK para auth.users) ──
CREATE TABLE IF NOT EXISTS moderators (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  role          TEXT        NOT NULL DEFAULT 'moderator'
                CHECK (role IN ('moderator', 'master')),
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela: entries ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entries (
  id             SERIAL      PRIMARY KEY,
  player_id      INTEGER     REFERENCES players(id)    ON DELETE SET NULL,
  moderator_id   UUID        REFERENCES moderators(id) ON DELETE SET NULL,
  name           TEXT        NOT NULL,
  character_name TEXT,
  profession     TEXT,
  days           INTEGER     NOT NULL DEFAULT 0,
  time_raw       INTEGER     NOT NULL DEFAULT 0,
  time_str       TEXT,
  kills          INTEGER     NOT NULL DEFAULT 0,
  skills         TEXT,
  live_url       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries    ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "public_read_entries" ON entries    FOR SELECT USING (true);
CREATE POLICY "public_read_players" ON players    FOR SELECT USING (true);
