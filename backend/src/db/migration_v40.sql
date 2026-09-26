-- migration_v40: lista de identidades banidas (nick e canais) + marca no jogador
--
-- Pra banir quem ainda NÃO tem cadastro (ex: ofensas no chat de live de um
-- participante). Cadastro ou troca de links que bata com a lista fica pendente e
-- marcado em players.ban_match pra um moderador decidir (lib/bannedIdentities.ts).

CREATE TABLE IF NOT EXISTS banned_identities (
  id          SERIAL      PRIMARY KEY,
  kind        TEXT        NOT NULL CHECK (kind IN ('nick', 'twitch', 'youtube', 'kick', 'tiktok')),
  value       TEXT        NOT NULL,          -- normalizado (normalizeBanValue)
  reason      TEXT        NOT NULL,
  created_by  TEXT        DEFAULT NULL,      -- login do moderador
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, value)
);

ALTER TABLE players ADD COLUMN IF NOT EXISTS ban_match TEXT DEFAULT NULL;
