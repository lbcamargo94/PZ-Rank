import type { TFunction } from 'i18next';
import { ApiError } from './api';

// Mapa error_code (estável, vindo do backend) → chave de tradução. Só cobre
// os códigos emitidos pelas rotas usadas nas páginas migradas pro i18n (fase 1)
// — o restante do backend ainda responde só com texto em português.
const ERROR_CODE_KEY: Record<string, string> = {
  PLAYER_NOT_FOUND:  'errors.player_not_found',
  INVALID_ID:        'errors.invalid_id',
  CANNOT_LIKE_SELF:  'errors.cannot_like_self',
  DB_ERROR:          'errors.db_error',
};

export function translateApiError(err: unknown, t: TFunction): string {
  if (err instanceof ApiError && err.code && ERROR_CODE_KEY[err.code]) {
    return t(ERROR_CODE_KEY[err.code]);
  }
  return err instanceof Error ? err.message : String(err);
}
