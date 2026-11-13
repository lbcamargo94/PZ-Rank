// Dados públicos dos itens da Oficina Steam usados na página de mods (v4.34.0):
// tags (viram categorias), inscritos atuais e data da última atualização.
//
// GetPublishedFileDetails não exige chave da Web API. Uma chamada aceita vários itens;
// o lote de 100 mantém o corpo pequeno. Roda num cron diário (GET /cron/refresh-workshop),
// nunca a cada visita da página.
import { supabase } from '../supabase';

const ENDPOINT = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/';
const BATCH = 100;

export interface WorkshopDetails {
  workshop_id:      string;
  title:            string | null;
  tags:             string[];
  subscriptions:    number | null;
  steam_updated_at: string | null;
}

interface RawDetail {
  publishedfileid?: string;
  result?:          number;
  title?:           string;
  tags?:            Array<{ tag?: string }>;
  subscriptions?:   number;
  time_updated?:    number;
}

// "Build 42", "Multiplayer" e "WIP" não dizem do que o mod trata: ficam de fora.
const IGNORED_TAGS = new Set(['build 41', 'build 42', 'multiplayer', 'wip', 'misc']);

export function parseDetails(raw: RawDetail[]): WorkshopDetails[] {
  const out: WorkshopDetails[] = [];
  for (const d of raw) {
    if (!d.publishedfileid || d.result !== 1) continue;
    const tags = (d.tags ?? [])
      .map(t => (t.tag ?? '').trim())
      .filter(t => t && !IGNORED_TAGS.has(t.toLowerCase()));
    out.push({
      workshop_id:      d.publishedfileid,
      title:            d.title ?? null,
      tags:             [...new Set(tags)],
      subscriptions:    Number.isFinite(d.subscriptions) ? Number(d.subscriptions) : null,
      steam_updated_at: d.time_updated ? new Date(d.time_updated * 1000).toISOString() : null,
    });
  }
  return out;
}

export async function fetchWorkshopDetails(ids: string[], fetchFn: typeof fetch = fetch): Promise<WorkshopDetails[]> {
  const out: WorkshopDetails[] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const body  = new URLSearchParams({ itemcount: String(chunk.length) });
    chunk.forEach((id, n) => body.set(`publishedfileids[${n}]`, id));
    const res = await fetchFn(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
      signal:  AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Steam respondeu ${res.status}`);
    const json = await res.json() as { response?: { publishedfiledetails?: RawDetail[] } };
    out.push(...parseDetails(json.response?.publishedfiledetails ?? []));
  }
  return out;
}

/** Atualiza workshop_items para todos os itens cadastrados em `mods`. Não mexe na categoria do moderador. */
export async function refreshWorkshopItems(): Promise<{ items: number; updated: number; missing: string[] }> {
  const { data: mods, error } = await supabase.from('mods').select('workshop_id');
  if (error) throw new Error(error.message);
  const ids = [...new Set(((mods ?? []) as Array<{ workshop_id: string | null }>)
    .map(m => m.workshop_id).filter((w): w is string => !!w && /^\d+$/.test(w)))];
  const details = await fetchWorkshopDetails(ids);
  const now = new Date().toISOString();
  let updated = 0;
  for (const d of details) {
    const { error: upErr } = await supabase.from('workshop_items').upsert([{
      workshop_id:      d.workshop_id,
      title:            d.title,
      tags:             JSON.stringify(d.tags),
      subscriptions:    d.subscriptions,
      steam_updated_at: d.steam_updated_at,
      fetched_at:       now,
    }], { onConflict: 'workshop_id' });
    if (upErr) console.warn(`[workshop] falha ao gravar ${d.workshop_id}: ${upErr.message}`);
    else updated++;
  }
  const got = new Set(details.map(d => d.workshop_id));
  return { items: ids.length, updated, missing: ids.filter(id => !got.has(id)) };
}
