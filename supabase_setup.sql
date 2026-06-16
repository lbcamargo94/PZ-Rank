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
  skills     TEXT,                                -- habilidades coletadas pelo mod (ex: "Forca 8, Machado 6")
  character_name TEXT,                            -- nome do personagem no jogo (mod)
  profession     TEXT,                            -- profissão do personagem (mod)
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
-- Isso cria o bucket com acesso público de LEITURA, mas marcar
-- "Public" não libera UPLOAD. Rode as políticas abaixo para
-- permitir que qualquer pessoa envie screenshots:

CREATE POLICY "Leitura pública de imagens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'screenshots');

CREATE POLICY "Upload público de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'screenshots');

-- ============================================================
--  MIGRAÇÃO — Integração com o mod (rode se a tabela já existia
--  antes destas colunas serem adicionadas)
-- ============================================================

ALTER TABLE entries ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS character_name TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS profession TEXT;
