import { lazy, type ComponentType } from 'react';

// Cada deploy gera arquivos novos com hash no nome (StatisticsPage-XXXX.js). Quem
// estava com o site aberto de ANTES do deploy ainda tem o index antigo na memória
// e, ao abrir uma página pela 1ª vez, pede um arquivo que talvez não exista mais
// → o import() falha e a página ficava em branco (bug reportado 2026-09-26 nos
// cards de Acesso Rápido, depois de vários deploys no mesmo dia).
//
// O servidor agora guarda os arquivos antigos por um tempo (vite.config.ts:
// emptyOutDir false + limpeza na VPS). Isto é a 2ª camada: se mesmo assim faltar,
// recarrega a página UMA vez (o index.html não tem cache → vem a versão nova).

const RELOAD_KEY = 'pzr-chunk-reload-at';
const RELOAD_WINDOW_MS = 30_000;   // 2ª falha dentro de 30s = problema real, não recarrega de novo

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Unable to preload CSS/i.test(msg);
}

/** Recarrega uma vez. Devolve false se já recarregou há pouco (evita loop). */
export function reloadOnceForNewVersion(): boolean {
  let last = 0;
  try { last = Number(sessionStorage.getItem(RELOAD_KEY) || 0); } catch { /* sem storage */ }
  if (Date.now() - last < RELOAD_WINDOW_MS) return false;
  try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { /* sem storage */ }
  window.location.reload();
  return true;
}

/** React.lazy que se recupera de arquivo de versão antiga (ver comentário acima). */
export function lazyPage<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() => factory().catch((err: unknown) => {
    if (isChunkLoadError(err) && reloadOnceForNewVersion()) {
      return new Promise<{ default: T }>(() => { /* a página vai recarregar */ });
    }
    throw err;   // vai pro PageErrorBoundary (mensagem + botão de recarregar)
  }));
}
