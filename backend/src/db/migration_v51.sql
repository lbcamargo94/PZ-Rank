-- migration_v51: ordem dos códigos (v4.30.3, lib/codeOrder.ts)
--   entries.last_code_ts   hora (relógio do PC do jogador, epoch s) do último código aceito na run
--   sync_history.code_ts   hora de geração de cada código recebido — ordena a geração e separa
--                          fila fora de ordem de save recarregado (caso Gets, 16/10/2026)
ALTER TABLE entries      ADD COLUMN IF NOT EXISTS last_code_ts BIGINT DEFAULT NULL;
ALTER TABLE sync_history ADD COLUMN IF NOT EXISTS code_ts      BIGINT DEFAULT NULL;
