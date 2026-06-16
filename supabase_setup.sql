-- ============================================================
--  EXECUTE ESTE SQL NO SUPABASE
--  Painel → SQL Editor → New query → cole e clique em Run
-- ============================================================

-- 1. Criar tabela de entradas do ranking
CREATE TABLE entries (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  live_url   TEXT,
  days       INTEGER     NOT NULL DEFAULT 0,
  time_str   TEXT,
  time_raw   INTEGER     NOT NULL DEFAULT 0,   -- tempo em minutos (para ordenação)
  kills      INTEGER     NOT NULL DEFAULT 0,
  image_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitar leitura pública (qualquer pessoa pode ver o ranking)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública"
  ON entries FOR SELECT
  USING (true);

CREATE POLICY "Inserção pública"
  ON entries FOR INSERT
  WITH CHECK (true);

-- ============================================================
--  STORAGE — Execute separadamente se necessário
-- ============================================================
-- No painel do Supabase vá em:
--   Storage → New bucket → nome: screenshots → Public: SIM
-- Isso já cria o bucket com acesso público de leitura.
