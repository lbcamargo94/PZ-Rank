import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const useSQLite = process.env.USE_SQLITE === 'true';
const usePg     = process.env.USE_PG === 'true';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = useSQLite
  ? (() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createSQLiteClient } = require('./db/sqlite-adapter');
      return createSQLiteClient();
    })()
  : usePg
  ? (() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createPgClient } = require('./db/pg-adapter');
      const url = process.env.DATABASE_URL;
      if (!url) throw new Error('DATABASE_URL não definida (USE_PG=true requer DATABASE_URL)');
      return createPgClient(url);
    })()
  : createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
