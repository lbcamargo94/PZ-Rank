import { supabase } from '../supabase';

export interface HeatmapDeltaPoint {
  type:  'kill' | 'death' | 'base';
  gx:    number;
  gy:    number;
  count: number;
}

const VALID_TYPES  = new Set(['kill', 'death', 'base']);
const MAX_GRID_VAL = 300; // sanity cap (~30.000 squares)

function validatePoint(p: unknown): HeatmapDeltaPoint | null {
  if (!p || typeof p !== 'object') return null;
  const { type, gx, gy, count } = p as Record<string, unknown>;
  if (typeof type !== 'string' || !VALID_TYPES.has(type)) return null;
  const x = Math.floor(Number(gx));
  const y = Math.floor(Number(gy));
  const c = Math.max(1, Math.floor(Number(count) || 1));
  if (!isFinite(x) || !isFinite(y) || x < 0 || y < 0 || x > MAX_GRID_VAL || y > MAX_GRID_VAL) return null;
  return { type: type as HeatmapDeltaPoint['type'], gx: x, gy: y, count: c };
}

export async function processHeatmapDelta(
  seasonId: number,
  raw:      unknown[],
): Promise<void> {
  if (!raw || raw.length === 0) return;

  const points = raw.map(validatePoint).filter(Boolean) as HeatmapDeltaPoint[];
  if (points.length === 0) return;

  // Limita a 50 pontos por sync para evitar abuso
  const capped = points.slice(0, 50);

  // Agrega duplicatas dentro do mesmo batch (ex: dois kills na mesma célula)
  const deltaMap = new Map<string, HeatmapDeltaPoint>();
  for (const p of capped) {
    const key = `${p.type}:${p.gx}:${p.gy}`;
    const cur = deltaMap.get(key);
    if (cur) cur.count += p.count;
    else deltaMap.set(key, { ...p });
  }
  const merged = Array.from(deltaMap.values());

  // Busca rows existentes com uma única query usando filtro OR composto
  const orFilter = merged
    .map(p => `and(event_type.eq.${p.type},grid_x.eq.${p.gx},grid_y.eq.${p.gy})`)
    .join(',');

  type HeatRow = { id: number; event_type: string; grid_x: number; grid_y: number; count: number };
  const { data: existing } = await supabase
    .from('heatmap_events')
    .select('id, event_type, grid_x, grid_y, count')
    .eq('season_id', seasonId)
    .or(orFilter);

  const existingMap = new Map<string, HeatRow>();
  for (const row of (existing ?? []) as HeatRow[]) {
    existingMap.set(`${row.event_type}:${row.grid_x}:${row.grid_y}`, row);
  }

  // Calcula contagens finais (acumula sobre o que já existe) e faz upsert em batch
  const upsertRows = merged.map(p => {
    const key = `${p.type}:${p.gx}:${p.gy}`;
    const ex  = existingMap.get(key);
    return {
      ...(ex ? { id: ex.id } : {}),
      season_id:  seasonId,
      event_type: p.type,
      grid_x:     p.gx,
      grid_y:     p.gy,
      count:      (ex?.count ?? 0) + p.count,
    };
  });

  await supabase
    .from('heatmap_events')
    .upsert(upsertRows, { onConflict: 'season_id,event_type,grid_x,grid_y' });
}