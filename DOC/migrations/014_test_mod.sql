-- 014: adiciona coluna is_test_mod na tabela players
-- Marca jogadores que atuam como moderadores de teste no rank público.
-- A linha do jogador exibe fundo verde militar e posição igual à do jogador acima.
ALTER TABLE players ADD COLUMN is_test_mod BOOLEAN NOT NULL DEFAULT FALSE;