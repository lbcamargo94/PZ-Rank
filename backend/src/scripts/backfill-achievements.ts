/**
 * backfill-achievements.ts
 *
 * Retroativamente desbloqueia conquistas para todos os players com base nas
 * melhores stats acumuladas em suas entradas históricas no banco.
 *
 * Execução (Supabase produção):
 *   npx tsx src/scripts/backfill-achievements.ts
 *
 * Execução (SQLite local):
 *   USE_SQLITE=true npx tsx src/scripts/backfill-achievements.ts
 */

import { supabase } from '../supabase';
import { evaluateAchievements } from '../lib/achievements';
import { SKILL_NAMES } from '../lib/skills';

// Inverte SKILL_NAMES: "Machado" → "axe", "Culinária" → "cooking", etc.
const PT_TO_ID: Record<string, string> = {};
for (const [engId, ptName] of Object.entries(SKILL_NAMES)) {
  PT_TO_ID[ptName] = engId.toLowerCase();
}

/**
 * Parseia a coluna `skills` (ex: "Machado 6, Culinária 8, Corrida 3")
 * e retorna um mapa de English-ID-lowercase → nível máximo encontrado.
 * Aceita tanto PT-BR (banco atual) quanto IDs em inglês (entradas antigas).
 */
function parseSkillLevels(skillsStr: string | null): Record<string, number> {
  if (!skillsStr) return {};
  const result: Record<string, number> = {};
  for (const token of skillsStr.split(',')) {
    const t = token.trim();
    const lastSpace = t.lastIndexOf(' ');
    if (lastSpace <= 0) continue;
    const nameRaw = t.slice(0, lastSpace).trim();
    const level   = parseInt(t.slice(lastSpace + 1), 10);
    if (isNaN(level)) continue;
    // Tenta PT-BR primeiro; cai em lowercase do ID inglês como fallback
    const id = PT_TO_ID[nameRaw] ?? nameRaw.toLowerCase();
    if (id) result[id] = Math.max(result[id] ?? 0, level);
  }
  return result;
}

async function main() {
  console.log('Buscando todas as entradas do banco...');

  const { data: entries, error } = await supabase
    .from('entries')
    .select([
      'id', 'player_id',
      'kills', 'days',
      'animals_killed', 'fish_caught', 'crops_harvested', 'items_crafted',
      'houses_looted', 'hours_without_sleep', 'trees_cut', 'books_read',
      'structures_built', 'crops_planted', 'spiffo_visited',
      'skills',
    ].join(', '))
    .not('player_id', 'is', null)
    .order('id', { ascending: true });

  if (error || !entries) {
    console.error('Erro ao buscar entradas:', error);
    process.exit(1);
  }

  console.log(`${entries.length} entrada(s) encontrada(s). Agrupando por player...`);

  // Mapa player_id → melhor stats acumulada de todas as entradas
  interface PlayerBest {
    latestEntryId: number;
    kills:             number;
    days:              number;
    animalsKilled:     number;
    fishCaught:        number;
    cropsHarvested:    number;
    itemsCrafted:      number;
    housesLooted:      number;
    hoursWithoutSleep: number;
    treesCut:          number;
    booksRead:         number;
    structuresBuilt:   number;
    cropsPlanted:      number;
    spiffoVisited:     number;
    eggsCollected:     number;
    milkProduced:      number;
    stoneStructures:   number;
    ceramicItems:      number;
    forgedWeapons:     number;
    kmDriven:          number;
    citiesVisited:     number;
    militaryVisited:   number;
    mealsCooked:       number;
    waterCollected:    number;
    materialsCrafted:  number;
    animalTracks:      number;
    skillLevels:       Record<string, number>;
  }

  const playerMap = new Map<number, PlayerBest>();

  for (const e of entries as Array<Record<string, unknown>>) {
    const pid = e['player_id'] as number;
    const n = (f: string) => Math.max(0, (e[f] as number | null) ?? 0);
    const skillLevels = parseSkillLevels(e['skills'] as string | null);

    const cur = playerMap.get(pid);
    if (!cur) {
      playerMap.set(pid, {
        latestEntryId:    e['id'] as number,
        kills:             n('kills'),
        days:              n('days'),
        animalsKilled:     n('animals_killed'),
        fishCaught:        n('fish_caught'),
        cropsHarvested:    n('crops_harvested'),
        itemsCrafted:      n('items_crafted'),
        housesLooted:      n('houses_looted'),
        hoursWithoutSleep: n('hours_without_sleep'),
        treesCut:          n('trees_cut'),
        booksRead:         n('books_read'),
        structuresBuilt:   n('structures_built'),
        cropsPlanted:      n('crops_planted'),
        spiffoVisited:     n('spiffo_visited'),
        eggsCollected:     n('eggs_collected'),
        milkProduced:      n('milk_produced'),
        stoneStructures:   n('stone_structures'),
        ceramicItems:      n('ceramic_items'),
        forgedWeapons:     n('forged_weapons'),
        kmDriven:          n('km_driven'),
        citiesVisited:     n('cities_visited'),
        militaryVisited:   n('military_visited'),
        mealsCooked:       n('meals_cooked'),
        waterCollected:    n('water_collected'),
        materialsCrafted:  n('materials_crafted'),
        animalTracks:      n('animal_tracks'),
        skillLevels,
      });
    } else {
      cur.latestEntryId     = Math.max(cur.latestEntryId, e['id'] as number);
      cur.kills              = Math.max(cur.kills,              n('kills'));
      cur.days               = Math.max(cur.days,               n('days'));
      cur.animalsKilled      = Math.max(cur.animalsKilled,      n('animals_killed'));
      cur.fishCaught         = Math.max(cur.fishCaught,         n('fish_caught'));
      cur.cropsHarvested     = Math.max(cur.cropsHarvested,     n('crops_harvested'));
      cur.itemsCrafted       = Math.max(cur.itemsCrafted,       n('items_crafted'));
      cur.housesLooted       = Math.max(cur.housesLooted,       n('houses_looted'));
      cur.hoursWithoutSleep  = Math.max(cur.hoursWithoutSleep,  n('hours_without_sleep'));
      cur.treesCut           = Math.max(cur.treesCut,           n('trees_cut'));
      cur.booksRead          = Math.max(cur.booksRead,          n('books_read'));
      cur.structuresBuilt    = Math.max(cur.structuresBuilt,    n('structures_built'));
      cur.cropsPlanted       = Math.max(cur.cropsPlanted,       n('crops_planted'));
      cur.spiffoVisited      = Math.max(cur.spiffoVisited,      n('spiffo_visited'));
      cur.eggsCollected      = Math.max(cur.eggsCollected,      n('eggs_collected'));
      cur.milkProduced       = Math.max(cur.milkProduced,       n('milk_produced'));
      cur.stoneStructures    = Math.max(cur.stoneStructures,    n('stone_structures'));
      cur.ceramicItems       = Math.max(cur.ceramicItems,       n('ceramic_items'));
      cur.forgedWeapons      = Math.max(cur.forgedWeapons,      n('forged_weapons'));
      cur.kmDriven           = Math.max(cur.kmDriven,           n('km_driven'));
      cur.citiesVisited      = Math.max(cur.citiesVisited,      n('cities_visited'));
      cur.militaryVisited    = Math.max(cur.militaryVisited,    n('military_visited'));
      cur.mealsCooked        = Math.max(cur.mealsCooked,        n('meals_cooked'));
      cur.waterCollected     = Math.max(cur.waterCollected,     n('water_collected'));
      cur.materialsCrafted   = Math.max(cur.materialsCrafted,   n('materials_crafted'));
      cur.animalTracks       = Math.max(cur.animalTracks,       n('animal_tracks'));
      for (const [id, level] of Object.entries(skillLevels)) {
        cur.skillLevels[id] = Math.max(cur.skillLevels[id] ?? 0, level);
      }
    }
  }

  const players = [...playerMap.entries()];
  console.log(`${players.length} player(s) únicos. Avaliando conquistas...\n`);

  let total = 0;
  for (const [playerId, best] of players) {
    try {
      await evaluateAchievements(playerId, best.latestEntryId, {
        kills:             best.kills,
        days:              best.days,
        animalsKilled:     best.animalsKilled,
        fishCaught:        best.fishCaught,
        cropsHarvested:    best.cropsHarvested,
        itemsCrafted:      best.itemsCrafted,
        housesLooted:      best.housesLooted,
        hoursWithoutSleep: best.hoursWithoutSleep,
        treesCut:          best.treesCut,
        booksRead:         best.booksRead,
        structuresBuilt:   best.structuresBuilt,
        cropsPlanted:      best.cropsPlanted,
        spiffoVisited:     best.spiffoVisited,
        eggsCollected:     best.eggsCollected,
        milkProduced:      best.milkProduced,
        stoneStructures:   best.stoneStructures,
        ceramicItems:      best.ceramicItems,
        forgedWeapons:     best.forgedWeapons,
        kmDriven:          best.kmDriven,
        citiesVisited:     best.citiesVisited,
        militaryVisited:   best.militaryVisited,
        mealsCooked:       best.mealsCooked,
        waterCollected:    best.waterCollected,
        materialsCrafted:  best.materialsCrafted,
        animalTracks:      best.animalTracks,
        skillLevels:       best.skillLevels,
      });
      console.log(`  player ${playerId}: ok (kills=${best.kills}, days=${best.days}, skills=${Object.keys(best.skillLevels).length})`);
      total++;
    } catch (err) {
      console.error(`  player ${playerId}: ERRO`, err);
    }
  }

  console.log(`\nBackfill concluído: ${total}/${players.length} player(s) processados.`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
