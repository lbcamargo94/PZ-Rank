-- migration_v52: versão do PZ Rank Companion de cada jogador (v4.32.0)
--   players.companion_version   versão informada pelo Companion no cabeçalho X-Companion-Version
--                               a cada sync aceito. NULL = Companion anterior à 2.7.0, que não
--                               informa a versão (inclui a 2.6.0, cujo atualizador quebrou
--                               quando o repositório do código ficou privado).
ALTER TABLE players ADD COLUMN IF NOT EXISTS companion_version TEXT DEFAULT NULL;
