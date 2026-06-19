-- ============================================================
--  Schema completo v8 — ambiente local (Supabase CLI)
--  Inclui todas as migrations até v8 (player_token).
-- ============================================================

-- ── players ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id           SERIAL      PRIMARY KEY,
  nick         TEXT        NOT NULL UNIQUE,
  twitch_url   TEXT,
  youtube_url  TEXT,
  kick_url     TEXT,
  tiktok_url   TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  blocked      BOOLEAN     NOT NULL DEFAULT false,
  player_token UUID        NOT NULL DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── moderators (auth própria, sem FK para auth.users) ────────
CREATE TABLE IF NOT EXISTS moderators (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  login         TEXT        NOT NULL UNIQUE,
  role          TEXT        NOT NULL DEFAULT 'moderator'
                CHECK (role IN ('moderator', 'master')),
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── entries ──────────────────────────────────────────────────
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
  is_alive       BOOLEAN     NOT NULL DEFAULT true,
  objectives     JSONB,
  score          INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries    ENABLE ROW LEVEL SECURITY;

-- Leitura pública (service role bypassa RLS — só afeta clientes anon)
CREATE POLICY "public_read_entries" ON entries FOR SELECT USING (true);
CREATE POLICY "public_read_players" ON players FOR SELECT USING (true);
