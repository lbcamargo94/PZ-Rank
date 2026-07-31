-- migration_v21.sql — Moderadores com email/senha + fluxo de convite por OTP
-- Executar no Supabase SQL Editor (PostgreSQL)

-- 1. Adiciona colunas email e email_verified_at à tabela moderators
ALTER TABLE moderators ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE moderators ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Atualiza o moderador master com o email e marca como verificado
UPDATE moderators
SET email = 'lb.camargo94@gmail.com',
    email_verified_at = NOW()
WHERE role = 'master';

-- 3. Remove todos os moderadores não-master (serão recadastrados via convite)
DELETE FROM moderators WHERE role != 'master';

-- 4. Cria tabela de tokens de moderadores (convites + OTPs)
CREATE TABLE IF NOT EXISTS moderator_tokens (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT        NOT NULL,
  token       TEXT        NOT NULL UNIQUE,
  type        TEXT        NOT NULL CHECK (type IN ('invite', 'otp')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
