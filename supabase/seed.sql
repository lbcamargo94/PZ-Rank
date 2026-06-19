-- ============================================================
--  Seed de desenvolvimento local
--  Moderador:  admin / admin123
--  Jogador:    TestPlayer (aprovado, com player_token)
-- ============================================================

-- Moderador master de teste
INSERT INTO moderators (login, role, password_hash) VALUES (
  'admin',
  'master',
  '$2b$10$USBsx2GHapo/wz7X2mBUremnmMCdZ.p9Sc11EoFgVaAQMB4Efdjz2'  -- senha: admin123
) ON CONFLICT (login) DO NOTHING;

-- Jogador de teste já aprovado
INSERT INTO players (nick, status, twitch_url) VALUES (
  'TestPlayer',
  'approved',
  'https://twitch.tv/testplayer'
) ON CONFLICT (nick) DO NOTHING;
