import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Service role — bypassa RLS; nunca exposto ao cliente
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
