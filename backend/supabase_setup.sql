-- ============================================================
--  PZ Community Rank — Database Setup v5
--  Execute no SQL Editor do Supabase (painel → SQL Editor)
--  ATENÇÃO: Auth própria com bcrypt+JWT — sem dependência de auth.users
-- ============================================================

-- ── Tabela: players ─────────────────────────────────────────
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

-- ── Tabela: moderators (auth própria — sem FK para auth.users) ──
CREATE TABLE IF NOT EXISTS moderators (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  login         TEXT        NOT NULL UNIQUE,
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
  is_alive       BOOLEAN     NOT NULL DEFAULT true,
  sandbox_ok     BOOLEAN     NOT NULL DEFAULT true,
  traits         TEXT,
  objectives     JSONB,
  score          INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries    ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "public_read_entries" ON entries    FOR SELECT USING (true);
CREATE POLICY "public_read_players" ON players    FOR SELECT USING (true);

-- Migration v17 (2026-07-24): tipo 'activate' em player_tokens para ativação de contas legadas
-- ALTER TABLE player_tokens DROP CONSTRAINT IF EXISTS player_tokens_type_check;
-- ALTER TABLE player_tokens ADD CONSTRAINT player_tokens_type_check CHECK (type IN ('verify', 'reset', 'activate'));

-- Migration v16 (2026-07-24): soft-delete em entries para preservar Records histórico
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Migration v15 (2026-07-24): auth de jogadores (email + senha + verificação por email)
-- Executar no SQL Editor do Supabase após remover duplicatas:
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash TEXT;
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ DEFAULT NULL;
-- CREATE TABLE IF NOT EXISTS player_tokens (
--   id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   player_id   INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
--   token       TEXT NOT NULL UNIQUE,
--   type        TEXT NOT NULL CHECK (type IN ('verify', 'reset')),
--   expires_at  TIMESTAMPTZ NOT NULL,
--   used_at     TIMESTAMPTZ DEFAULT NULL,
--   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- ALTER TABLE player_tokens ENABLE ROW LEVEL SECURITY;

-- Migration v14 (2026-07-24): unicidade de (player_id, character_name) — impede múltiplos registros
-- do mesmo personagem causados por race condition entre /entries e /sync/update.
-- ANTES de rodar: apague entradas duplicadas (keep the lowest id):
--   DELETE FROM entries WHERE id NOT IN (
--     SELECT MIN(id) FROM entries GROUP BY player_id, character_name
--   );
-- ALTER TABLE entries ADD CONSTRAINT entries_player_character_unique UNIQUE (player_id, character_name);

-- Migration v13 (2026-06-28): coluna de data de desclassificação — base do contador da Dead-Zone (15 dias)
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ DEFAULT NULL;
-- Migration v12 (2026-06-25): coluna de data de atualização — OBRIGATÓRIA para a coluna "Atualizado" do rank
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- Migration v11 (2026-06-24): colunas de auditoria de sandbox
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS sandbox_config JSONB;
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS sandbox_config_updated_at TIMESTAMPTZ;
-- ── Migration v10 (rodar se o banco já existe) ───────────────
-- Adiciona campo de traços do personagem (comma-separated IDs em inglês).
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS traits TEXT;
-- ── Migration v9 (rodar se o banco já existe) ────────────────
-- Adiciona campo de validade do sandbox — DEFAULT true não afeta entradas anteriores.
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS sandbox_ok BOOLEAN NOT NULL DEFAULT true;
-- ── Migration v8 (rodar se o banco já existe) ────────────────
-- Adiciona token único por jogador para sincronização automática do mod.
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS player_token UUID DEFAULT gen_random_uuid();
-- UPDATE players SET player_token = gen_random_uuid() WHERE player_token IS NULL;
-- ── Migration v7 (rodar se o banco já existe) ────────────────
-- (sem ALTER necessário — múltiplos personagens já são suportados pelo schema atual)
-- ── Migration v6 (rodar se o banco já existe) ────────────────
-- ALTER TABLE moderators RENAME COLUMN email TO login;
-- ── Migration v5 (rodar se o banco já existe) ────────────────
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS objectives JSONB;
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS score      INTEGER NOT NULL DEFAULT 0;
-- ── Migration v4 (rodar se ainda não rodou) ──────────────────
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS blocked    BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_alive   BOOLEAN NOT NULL DEFAULT true;
