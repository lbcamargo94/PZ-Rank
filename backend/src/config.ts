import 'dotenv/config';

const useSQLite = process.env.USE_SQLITE === 'true';

function required(name: string, optionalInSQLite = false): string {
  const value = process.env[name];
  if (!value && !(useSQLite && optionalInSQLite)) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }
  return value ?? '';
}

export const config = {
  port:               parseInt(process.env.PORT ?? '3000', 10),
  supabaseUrl:        required('SUPABASE_URL',         true),
  supabaseServiceKey: required('SUPABASE_SERVICE_KEY', true),
  jwtSecret:          required('JWT_SECRET'),
  corsOrigin:         process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  tableName:          process.env.TABLE_NAME  ?? 'entries',
  resendApiKey:       process.env.RESEND_API_KEY ?? '',
  fromEmail:          process.env.FROM_EMAIL ?? 'PZ Community Rank <noreply@pzrank.com.br>',
  frontendUrl:        process.env.FRONTEND_URL ?? 'http://localhost:5173',
  syncHmacSecret:     process.env.SYNC_HMAC_SECRET ?? '',
};
