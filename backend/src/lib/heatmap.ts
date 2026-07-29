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

  for (const p of capped) {
    const { data: existing } = await supabase
      .from('heatmap_events')
      .select('id, count')
      .eq('season_id', seasonId)
      .eq('event_type', p.type)
      .eq('grid_x', p.gx)
      .eq('grid_y', p.gy)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('heatmap_events')
        .update({ count: (existing as { id: number; count: number }).count + p.count })
        .eq('id', (existing as { id: number }).id);
    } else {
      await supabase
        .from('heatmap_events')
        .insert([{ season_id: seasonId, event_type: p.type, grid_x: p.gx, grid_y: p.gy, count: p.count }]);
    }
  }
}
