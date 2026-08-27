-- 015: adiciona coluna is_moderator na tabela players
-- Marca jogadores que também são moderadores oficiais do site. Diferente de
-- is_test_mod (moderador de teste): quem tem is_moderator participa
-- normalmente da numeração do rank público — o flag só concede acessos
-- extras (ex: overlay de OBS), sem afetar a competição.
ALTER TABLE players ADD COLUMN is_moderator BOOLEAN NOT NULL DEFAULT FALSE;
