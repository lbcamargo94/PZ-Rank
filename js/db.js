// ============================================================
//  db.js — Integração com Supabase
//  Responsável por todas as operações de dados:
//  inserir, buscar e deletar entradas + upload de imagens
// ============================================================

// Carrega o cliente Supabase via CDN
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
document.head.appendChild(supabaseScript);

let supabase = null;

supabaseScript.onload = () => {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.dispatchEvent(new Event('db-ready'));
};

supabaseScript.onerror = () => {
  window.dispatchEvent(new Event('db-error'));
};

// ── Busca todas as entradas ordenadas por dias (desc) ──────
async function dbFetchAll(orderBy = 'days') {
  const colMap = { days: 'days', kills: 'kills', time: 'time_raw' };
  const col = colMap[orderBy] || 'days';

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order(col, { ascending: false });

  if (error) throw error;
  return data;
}

// ── Upload da imagem no Supabase Storage ───────────────────
async function dbUploadImage(file) {
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
async function dbInsert(entry) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Deleta entrada por id ──────────────────────────────────
async function dbDelete(id) {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Converte "12h 34m" ou "38h" em minutos (para ordenação) ──
function parseTimeToMinutes(str) {
  if (!str) return 0;
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  if (!h && !m) { const n = parseInt(str); return isNaN(n) ? 0 : n; }
  return h * 60 + m;
}
