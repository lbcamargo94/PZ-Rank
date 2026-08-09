-- Migration v25: deduplicação de notificação de live
-- Armazena o ID do último vídeo notificado por jogador.
-- scan-lives só dispara Discord se yt_last_live_video_id mudar.

ALTER TABLE players ADD COLUMN IF NOT EXISTS yt_last_live_video_id TEXT DEFAULT NULL;
