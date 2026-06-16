// ============================================================
//  CONFIGURAÇÃO DO SUPABASE
//  Valores lidos das variáveis de ambiente (.env).
//  Veja .env.example para a lista de variáveis necessárias.
// ============================================================

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Nome do bucket de imagens criado no Supabase Storage
export const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'screenshots';

// Nome da tabela criada no banco de dados
export const TABLE_NAME = import.meta.env.VITE_TABLE_NAME || 'entries';
