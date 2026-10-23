import 'dotenv/config';

const useSQLite = process.env.USE_SQLITE === 'true';
const usePg     = process.env.USE_PG     === 'true';

function required(name: string, optionalInSQLite = false): string {
  const value = process.env[name];
  if (!value && !(useSQLite && optionalInSQLite) && !(usePg && optionalInSQLite)) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }
  return value ?? '';
}

export const config = {
  port:               parseInt(process.env.PORT ?? '3000', 10),
  supabaseUrl:        required('SUPABASE_URL',         true),
  supabaseServiceKey: required('SUPABASE_SERVICE_KEY', true),
  jwtSecret:          required('JWT_SECRET'),
  // Sessão de JOGADOR assina com chave própria (v4.30.9): um JWT de jogador nunca verifica com a
  // chave de moderador, nem por engano de rota. Sem a variável (dev/testes) deriva uma chave
  // distinta da JWT_SECRET; em produção PLAYER_JWT_SECRET é definida no .env.
  playerJwtSecret:    process.env.PLAYER_JWT_SECRET || `${process.env.JWT_SECRET ?? ''}:player-session`,
  corsOrigin:         process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  tableName:          process.env.TABLE_NAME  ?? 'entries',
  resendApiKey:       process.env.RESEND_API_KEY ?? '',
  fromEmail:          process.env.FROM_EMAIL ?? 'PZ Community Rank <noreply@pzrank.com.br>',
  frontendUrl:        process.env.FRONTEND_URL ?? 'http://localhost:5173',
  syncHmacSecret:     process.env.SYNC_HMAC_SECRET ?? '',
  minModVersion:      process.env.MIN_MOD_VERSION  ?? '',
};
