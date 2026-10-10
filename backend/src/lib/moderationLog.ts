import type { Response, NextFunction } from 'express';
import { supabase } from '../supabase';
import { config } from '../config';
import type { ModRequest } from '../middleware/moderator';

// Registro das ações da moderação (v4.29.5). Antes só a exclusão permanente de jogador
// deixava rastro no log do servidor; a reabilitação da run do Chris Pereira (30/09 e 05/10)
// apareceu só como "PATCH /entries/842/status" no Nginx, sem dizer qual moderador.
//
// Funciona no nível do roteador (auditModeration): toda ação de moderador que dá certo
// (2xx) em /entries e /players vira uma linha em moderation_log — quem, quando, o quê e
// em qual run/jogador. Gravado depois da resposta; nunca derruba nem atrasa a ação.

type Base = 'entries' | 'players';

// Ação legível a partir da rota. `body` decide o caso do PATCH /status de runs.
export function describeAction(base: Base, method: string, subpath: string, body: Record<string, unknown> | null): string {
  const m = method.toUpperCase();
  if (base === 'entries') {
    if (m === 'POST' && subpath === '') return 'criar_run';
    if (m === 'DELETE' && subpath === '') return 'remover_run';
    if (subpath === 'status') {
      if (body?.['sandbox_ok'] === false) return 'desclassificar_run';
      const alive = body?.['is_alive'];
      if (body?.['sandbox_ok'] === true) return alive === false ? 'reabilitar_run_morta' : 'reabilitar_run';
      if (alive === true)  return 'marcar_viva';
      if (alive === false) return 'marcar_morta';
      return 'alterar_status_run';
    }
    const map: Record<string, string> = {
      objectives: 'editar_objetivos', 'confirm-death': 'confirmar_morte',
      'clear-anomaly': 'limpar_anomalia', restore: 'restaurar_run',
    };
    return map[subpath] ?? `run:${m.toLowerCase()}:${subpath}`;
  }
  if (m === 'DELETE' && subpath === 'permanent') return 'excluir_jogador_permanente';
  const map: Record<string, string> = {
    status: 'status_cadastro', block: 'bloquear_jogador', unblock: 'desbloquear_jogador',
    delete: 'excluir_jogador', restore: 'restaurar_jogador', email: 'alterar_email',
    'verify-email': 'verificar_email', links: 'alterar_links', 'yt-retry': 'reprocessar_youtube',
    'test-mod': 'marcar_mod_teste', 'featured-streamer': 'streamer_destaque',
    moderator: 'alterar_moderador', supporter: 'alterar_apoiador',
  };
  return map[subpath] ?? `jogador:${m.toLowerCase()}:${subpath}`;
}

// Campos do corpo que vão para o registro. Dados pessoais (e-mail, links) e textos longos
// (objetivos) entram só como "alterado", sem o valor.
const KEEP_VALUE = new Set(['is_alive', 'sandbox_ok', 'note', 'status', 'reason', 'blocked_reason', 'blocked_note', 'is_test_mod', 'is_featured_streamer', 'is_moderator', 'is_supporter', 'character_name']);

export function sanitizeDetails(body: Record<string, unknown> | null): string | null {
  if (!body || typeof body !== 'object') return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (KEEP_VALUE.has(k)) out[k] = typeof v === 'string' ? v.slice(0, 500) : v;
    else out[k] = 'alterado';
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}

// /entries/842/status → { id: 842, subpath: 'status' } ; /entries → { id: null, subpath: '' }
export function parseTarget(path: string): { id: number | null; subpath: string } {
  const parts = path.split('?')[0]!.split('/').filter(Boolean);
  const id = parts[0] && /^\d+$/.test(parts[0]) ? parseInt(parts[0], 10) : null;
  return { id, subpath: (id != null ? parts.slice(1) : parts).join('/') };
}

async function targetName(base: Base, id: number | null): Promise<{ name: string | null; playerId: number | null }> {
  if (id == null) return { name: null, playerId: null };
  try {
    if (base === 'entries') {
      const { data } = await supabase.from(config.tableName).select('character_name, player_id').eq('id', id).maybeSingle();
      const r = data as { character_name?: string; player_id?: number } | null;
      return { name: r?.character_name ?? null, playerId: r?.player_id != null ? Number(r.player_id) : null };
    }
    const { data } = await supabase.from('players').select('nick').eq('id', id).maybeSingle();
    return { name: (data as { nick?: string } | null)?.nick ?? null, playerId: id };
  } catch {
    return { name: null, playerId: null };
  }
}

// Middleware do roteador. Lê o nome do alvo ANTES da ação (a exclusão permanente apaga a
// linha) e grava o registro quando a resposta termina com sucesso.
export function auditModeration(base: Base) {
  return async (req: ModRequest, res: Response, next: NextFunction): Promise<void> => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'OPTIONS' || !req.headers.authorization?.startsWith('Bearer ')) {
      next();
      return;
    }
    const { id, subpath } = parseTarget(req.path);
    const target = await targetName(base, id);
    const body = (req.body && typeof req.body === 'object') ? req.body as Record<string, unknown> : null;
    res.on('finish', () => {
      if (!req.userId || res.statusCode >= 400) return;   // só ação de moderador que deu certo
      void (async () => {
        try {
          const { data: mod } = await supabase.from('moderators').select('login').eq('id', req.userId!).maybeSingle();
          const { error } = await supabase.from('moderation_log').insert([{
            moderator_id:    String(req.userId),
            moderator_login: (mod as { login?: string } | null)?.login ?? null,
            action:          describeAction(base, method, subpath, body),
            entry_id:        base === 'entries' ? id : null,
            player_id:       target.playerId,
            target:          target.name,
            details:         sanitizeDetails(body),
            http_status:     res.statusCode,
          }]);
          if (error) console.error('[moderation-log] falha ao gravar:', error.message ?? error);
        } catch (err) {
          console.error('[moderation-log] erro inesperado:', err);
        }
      })();
    });
    next();
  };
}
