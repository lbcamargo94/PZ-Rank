import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const useSQLite = process.env.USE_SQLITE === 'true';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = useSQLite
  ? (() => {
      // Import dinâmico evita carregar better-sqlite3 em produção
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createSQLiteClient } = require('./db/sqlite-adapter');
      return createSQLiteClient();
    })()
  : createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
