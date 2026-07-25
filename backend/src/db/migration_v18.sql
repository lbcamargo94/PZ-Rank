-- migration v18: adicionar tipo 'otp' em player_tokens para fluxo de confirmação por código
ALTER TABLE player_tokens DROP CONSTRAINT IF EXISTS player_tokens_type_check;
ALTER TABLE player_tokens ADD CONSTRAINT player_tokens_type_check
  CHECK (type IN ('verify', 'reset', 'activate', 'otp'));
