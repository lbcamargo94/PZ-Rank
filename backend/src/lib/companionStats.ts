// Stats de ações enviadas pelo Companion junto do POST /sync/update.
//
// Contexto: desde o mod v2.16 (código PZRX9 slim) os contadores de ações saem do
// código de sync e vão para pz_rank_stats_<char>.log. O Companion v2.5.0+ lê esse
// arquivo no momento do sync e manda o objeto `stats` no body, assinado em
// X-Stats-Sig. Sem isso as colunas de ações em `entries` ficavam congeladas e as
// conquistas de ações nunca desbloqueavam no servidor (ver docs/estatisticas.md).
//
// Regra de ouro: stats inválidas NUNCA rejeitam o sync do rank — só são ignoradas.

import { createHmac, timingSafeEqual } from 'crypto';

/** Chaves exatamente como o mod grava em RankFile.saveStats → campo em DecodedCode. */
export const COMPANION_STAT_KEYS = {
  animals_killed:      'animalsKilled',
  fish_caught:         'fishCaught',
  crops_harvested:     'cropsHarvested',
  items_crafted:       'itemsCrafted',
  houses_looted:       'housesLooted',
  hours_without_sleep: 'hoursWithoutSleep',
  trees_cut:           'treesCut',
  books_read:          'booksRead',
  structures_built:    'structuresBuilt',
  crops_planted:       'cropsPlanted',
  spiffo_visited:      'spiffoVisited',
  eggs_collected:      'eggsCollected',
  milk_produced:       'milkProduced',
  stone_structures:    'stoneStructures',
  ceramic_items:       'ceramicItems',
  forged_weapons:      'forgedWeapons',
  km_driven:           'kmDriven',
  cities_visited:      'citiesVisited',
  military_visited:    'militaryVisited',
  meals_cooked:        'mealsCooked',
  water_collected:     'waterCollected',
  materials_crafted:   'materialsCrafted',
  animal_tracks:       'animalTracks',
  weapons_crafted:     'weaponsCrafted',
  furniture_crafted:   'furnitureCrafted',
  clothes_crafted:     'clothesCrafted',
  cheese_produced:     'cheeseProduced',
  doors_opened:        'doorsOpened',
  sleep_locations:     'sleepLocations',
  basements_explored:  'basementsExplored',
  stations_used:       'stationsUsed',
  animal_species:      'animalSpecies',
  days_no_canned:      'daysNoCanned',
} as const;

export type CompanionStatKey = keyof typeof COMPANION_STAT_KEYS;
export type CompanionStats = Record<CompanionStatKey, number>;

// Teto de sanidade por contador — muito acima de qualquer run real, só barra lixo/abuso
const MAX_STAT_VALUE = 10_000_000;

/** Mensagem assinada — o Companion monta exatamente a mesma string (main.js → signStats).
 *  Chaves ordenadas alfabeticamente, "k=v" unidos por "&". */
export function canonicalStats(stats: Record<string, unknown>): string {
  return Object.keys(stats).sort().map(k => `${k}=${String(stats[k])}`).join('&');
}

export function statsSignature(secret: string, playerToken: string, code: string, character: string, stats: Record<string, unknown>): string {
  return createHmac('sha256', secret)
    .update(`${playerToken}:${code}:${character}:${canonicalStats(stats)}`)
    .digest('hex');
}

/** O nome no código de sync é decodificado como latin1 (decoder.ts), mas o arquivo
 *  de stats é texto lido como UTF-8 pelo Companion — um acento pode chegar como
 *  "é", "�" ou "Ã©" conforme o caminho. Compara trocando todo não-ASCII por "?"
 *  e colapsando sequências, o que tolera a diferença de encoding sem aceitar
 *  nomes realmente diferentes. */
export function sameCharacter(a: string, b: string): boolean {
  if (a === b) return true;
  const fold = (s: string) => s.normalize('NFC').replace(/[^\x20-\x7E]+/g, '?').trim();
  return fold(a) === fold(b);
}

export type StatsRejection =
  | 'missing' | 'bad_shape' | 'character_mismatch' | 'bad_signature' | 'bad_value';

/**
 * Valida as stats do body. Retorna as 33 stats (chaves ausentes = 0) ou o motivo
 * da rejeição. `secret` vazio = assinatura não é exigida (mesma política do
 * X-Code-Sig: só vale quando SYNC_HMAC_SECRET está configurado).
 */
export function validateCompanionStats(opts: {
  stats:          unknown;
  statsCharacter: unknown;
  signature:      string | undefined;
  secret:         string;
  playerToken:    string;
  code:           string;
  characterName:  string;
}): { ok: true; stats: CompanionStats } | { ok: false; reason: StatsRejection } {
  const { stats, statsCharacter, signature, secret, playerToken, code, characterName } = opts;
  if (stats == null) return { ok: false, reason: 'missing' };
  if (typeof stats !== 'object' || Array.isArray(stats) || typeof statsCharacter !== 'string') {
    return { ok: false, reason: 'bad_shape' };
  }
  const raw = stats as Record<string, unknown>;
  if (Object.keys(raw).length > 64) return { ok: false, reason: 'bad_shape' };

  // O arquivo de stats é por personagem — um arquivo de outro save/personagem
  // (ex: jogador trocou de save entre gravações) não pode contaminar esta run.
  if (!sameCharacter(statsCharacter, characterName)) return { ok: false, reason: 'character_mismatch' };

  if (secret) {
    if (!signature) return { ok: false, reason: 'bad_signature' };
    const expected = statsSignature(secret, playerToken, code, statsCharacter, raw);
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'bad_signature' };
  }

  const out = {} as CompanionStats;
  for (const key of Object.keys(COMPANION_STAT_KEYS) as CompanionStatKey[]) {
    const v = raw[key] ?? 0;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > MAX_STAT_VALUE) {
      return { ok: false, reason: 'bad_value' };
    }
    out[key] = v;
  }
  return { ok: true, stats: out };
}
