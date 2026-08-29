-- 016: adiciona coluna yt_live_confirmed_at na tabela players
-- Registra quando yt_last_live_video_id foi confirmado por último (webhook do
-- YouTube ou checagem real via YouTube Data API — nunca por confirmações em
-- "modo degradado", quando a API key está ausente ou a cota estourou).
-- Serve de teto de segurança: se uma live nunca é reconfirmada de forma
-- confiável dentro de YT_LIVE_MAX_AGE_MS (backend/src/lib/youtube.ts), o
-- badge "ao vivo" some sozinho, mesmo que a checagem real continue falhando.
ALTER TABLE players ADD COLUMN yt_live_confirmed_at TIMESTAMPTZ DEFAULT NULL;
