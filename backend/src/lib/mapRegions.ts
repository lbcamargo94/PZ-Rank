// Região do mapa (cidade/arredores) a partir de uma posição — usado pra registrar
// ONDE cada personagem morreu (entries.death_region), só o NOME da região.
//
// Ordem de decisão (a 1ª que casar vence):
//   1. Base Militar Secreta — área das zonas SecretBase/SecretLab (mesma do mod,
//      RankMain.lua MILITARY_BASE_AREA)
//   2. Áreas oficiais do jogo (regions.lua): Valley Station antes do condado de
//      Jefferson que a envolve; aeroporto (LAA) conta como Louisville
//   3. Cidades novas do B42 sem área oficial (Brandenburg, Ekron, Irvington,
//      Echo Creek, Fallas Lake): até TOWN_RADIUS blocos do rótulo oficial da cidade
//   4. Senão: zona rural
//
// Dados em mapRegionsData.ts, GERADOS dos arquivos do jogo. Pra regenerar após um
// patch do PZ: ler regions.lua (type "Region") e os "MapLabel_*" com "text-town"
// de worldmap-annotations.lua em media/maps/Muldraugh, KY/.

import { OFFICIAL_REGION_RECTS, TOWN_LABELS } from './mapRegionsData';

export const REGION_NAMES: Record<string, string> = {
  Louisville:     'Louisville',
  LAA:            'Louisville',
  Jefferson:      'Condado de Jefferson',
  ValleyStation:  'Valley Station',
  Muldraugh:      'Muldraugh',
  WestPoint:      'West Point',
  Riverside:      'Riverside',
  Rosewood:       'Rosewood',
  MarchRidge:     'March Ridge',
  Brandenburg:    'Brandenburg',
  Ekron:          'Ekron',
  Irvington:      'Irvington',
  EchoCreek:      'Echo Creek',
  FallasLake:     'Fallas Lake',
  MilitaryBase:   'Base Militar Secreta',
  Rural:          'Zona rural',
};

const MILITARY_BASE = { x1: 5513, y1: 12411, x2: 5672, y2: 12529 };
/** Raio (blocos) em volta do rótulo das cidades do B42 que não têm área oficial */
export const TOWN_RADIUS = 1000;
// Mais específicas primeiro: Valley Station fica dentro do condado de Jefferson
const REGION_PRIORITY = ['ValleyStation', 'LAA'];

const rects = [...OFFICIAL_REGION_RECTS].sort((a, b) => {
  const pa = REGION_PRIORITY.includes(a[0]) ? 0 : a[0] === 'Jefferson' ? 2 : 1;
  const pb = REGION_PRIORITY.includes(b[0]) ? 0 : b[0] === 'Jefferson' ? 2 : 1;
  return pa - pb;
});
const withOfficialArea = new Set(OFFICIAL_REGION_RECTS.map(r => r[0]));
const b42Towns = TOWN_LABELS.filter(([id]) => !withOfficialArea.has(id));

/** Id da região (chave de REGION_NAMES) para uma posição em blocos do mapa. */
export function regionAt(x: number, y: number): string {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 'Rural';
  const m = MILITARY_BASE;
  if (x >= m.x1 && x <= m.x2 && y >= m.y1 && y <= m.y2) return 'MilitaryBase';
  for (const [id, rx, ry, w, h] of rects) {
    if (x >= rx && x < rx + w && y >= ry && y < ry + h) return id === 'LAA' ? 'Louisville' : id;
  }
  let best: string | null = null;
  let bestD = Infinity;
  for (const [id, lx, ly] of b42Towns) {
    const d = Math.hypot(lx - x, ly - y);
    if (d < bestD) { bestD = d; best = id; }
  }
  return best && bestD <= TOWN_RADIUS ? best : 'Rural';
}

/** Célula do mapa de calor (100×100 blocos, como o mod manda) → região (centro da célula). */
export function regionOfCell(gx: number, gy: number): string {
  return regionAt(gx * 100 + 50, gy * 100 + 50);
}

/** Ponto de morte dentro do heatmap_delta que o Companion manda no sync. */
export function deathCellFromDelta(delta: unknown): { gx: number; gy: number } | null {
  if (!Array.isArray(delta)) return null;
  for (const p of delta) {
    if (!p || typeof p !== 'object') continue;
    const { type, gx, gy } = p as Record<string, unknown>;
    const x = Math.floor(Number(gx));
    const y = Math.floor(Number(gy));
    if (type === 'death' && Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x <= 300 && y <= 300) {
      return { gx: x, gy: y };
    }
  }
  return null;
}
