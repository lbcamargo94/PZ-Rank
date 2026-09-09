-- migration_v35.sql — Sistema de transparência financeira v2
-- Executar no Supabase SQL Editor (PostgreSQL)

-- Ledger principal de movimentações financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
  id               SERIAL        PRIMARY KEY,
  season_id        INTEGER       NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  type             TEXT          NOT NULL CHECK(type IN ('income','expense','adjustment')),
  category         TEXT          NOT NULL,
  description      TEXT          NOT NULL,
  amount_brl       NUMERIC(12,2) NOT NULL DEFAULT 0,
  funding_source   TEXT          NOT NULL DEFAULT 'organization'
                   CHECK(funding_source IN ('organization','operational_fund','sponsor','prize_fund','other')),
  is_prize_fund    BOOLEAN       NOT NULL DEFAULT false,
  is_public        BOOLEAN       NOT NULL DEFAULT true,
  transaction_date DATE          NOT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ   DEFAULT NULL
);

-- Configuração do fundo de premiação por temporada (uma linha por season)
CREATE TABLE IF NOT EXISTS prize_fund (
  id                  SERIAL        PRIMARY KEY,
  season_id           INTEGER       NOT NULL UNIQUE REFERENCES seasons(id) ON DELETE CASCADE,
  target_amount_brl   NUMERIC(12,2) NOT NULL DEFAULT 1000,
  locked              BOOLEAN       NOT NULL DEFAULT true,
  distribution_status TEXT          NOT NULL DEFAULT 'draft'
                       CHECK(distribution_status IN ('draft','defined','published','paid')),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Distribuição da premiação por posição (percentual ou valor fixo)
CREATE TABLE IF NOT EXISTS prize_distribution (
  id           SERIAL        PRIMARY KEY,
  season_id    INTEGER       NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  position     INTEGER       NOT NULL,
  percentage   NUMERIC(5,2)  DEFAULT NULL,
  fixed_amount NUMERIC(12,2) DEFAULT NULL,
  description  TEXT          DEFAULT NULL,
  UNIQUE(season_id, position)
);
