// ============================================================
//  db.ts — Integração com Supabase
//  Responsável por todas as operações de dados:
//  inserir, buscar e deletar entradas + upload de imagens
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_BUCKET, TABLE_NAME } from './config';

export interface Entry {
  id?: number;
  name: string;
  live_url: string | null;
  days: number;
  time_str: string | null;
  time_raw: number;
  kills: number;
  image_url: string | null;
  skills: string | null;
}

export type SortKey = 'days' | 'kills' | 'time';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Busca todas as entradas ordenadas por dias (desc) ──────
export async function dbFetchAll(orderBy: SortKey = 'days'): Promise<Entry[]> {
  const colMap: Record<SortKey, string> = { days: 'days', kills: 'kills', time: 'time_raw' };
  const col = colMap[orderBy] || 'days';

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order(col, { ascending: false });

  if (error) throw error;
  return data as Entry[];
}

// ── Upload da imagem no Supabase Storage ───────────────────
export async function dbUploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// ── Insere nova entrada no banco ───────────────────────────
export async function dbInsert(entry: Entry): Promise<Entry> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data as Entry;
}

// ── Deleta entrada por id ──────────────────────────────────
export async function dbDelete(id: number): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Converte "12h 34m" ou "38h" em minutos (para ordenação) ──
export function parseTimeToMinutes(str: string | null): number {
  if (!str) return 0;
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  if (!h && !m) { const n = parseInt(str); return isNaN(n) ? 0 : n; }
  return h * 60 + m;
}
