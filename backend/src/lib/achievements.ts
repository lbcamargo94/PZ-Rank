import { supabase } from '../supabase';
import type { Objectives } from '../types';
import { OFFICIAL_BASE_IDS } from './scoring';
import { SKILL_NAMES } from './skills';

// Metas fixas para as conquistas "visite/abata todos" — definidas com o usuário
// (Brasileirão PZ): 12 cidades oficiais (mesmo conjunto de OFFICIAL_BASE_IDS) e
// 7 espécies de animais (caça ativa + rastreamento/armadilhas, sem repetir coelho).
const TOTAL_CITIES         = 12;
const TOTAL_ANIMAL_SPECIES = 7;

// IDs de skill em minúsculo (mesma normalização usada pelas chaves skill_<id>
// abaixo) — fonte única de verdade: SKILL_NAMES (backend/src/lib/skills.ts).
const ALL_SKILL_IDS = Object.keys(SKILL_NAMES).map(id => id.toLowerCase());

export interface ExtendedStats {
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
  // PZRX6
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
  // PZRX7
  weaponsCrafted:    number;
  // PZRX8
  furnitureCrafted:  number;
  clothesCrafted:    number;
  cheeseProduced:    number;
  doorsOpened:       number;
  sleepLocations:    number;
  basementsExplored: number;
  stationsUsed:      number;
  animalSpecies:     number;
  daysNoCanned:      number;
  skillLevels:       Record<string, number>;
}

export async function evaluateAchievements(
  playerId:      number,
  characterName: string,
  entryId:       number,
  s:             ExtendedStats,
  objectives:    Objectives | null = null,
): Promise<void> {
  const { data: allAch } = await supabase
    .from('achievements')
    .select('id, stat, threshold, tier');

  if (!allAch || allAch.length === 0) return;

  const { data: existing } = await supabase
    .from('player_achievements')
    .select('achievement_id')
    .eq('player_id', playerId)
    .eq('character_name', characterName);

  const unlocked = new Set(
    (existing ?? []).map((r: { achievement_id: number }) => r.achievement_id),
  );

  const stats: Record<string, number> = {
    kills:               s.kills,
    days:                s.days,
    animals_killed:      s.animalsKilled,
    fish_caught:         s.fishCaught,
    crops_harvested:     s.cropsHarvested,
    items_crafted:       s.itemsCrafted,
    houses_looted:       s.housesLooted,
    hours_without_sleep: s.hoursWithoutSleep,
    trees_cut:           s.treesCut,
    books_read:          s.booksRead,
    structures_built:    s.structuresBuilt,
    crops_planted:       s.cropsPlanted,
    // spiffo_visited: contagem de restaurantes visitados — essa está correta.
    // spiffo_base_any/spiffo_base_five/all_spiffo_bases NÃO entram aqui: são sobre
    // ter BASE estabelecida (ver descrição de cada uma), não sobre visitar — usam
    // objectives.bases (basesBuilt), calculado mais abaixo junto com bases_built.
    spiffo_visited: s.spiffoVisited,          // threshold 1
    // PZRX6
    eggs_collected:    s.eggsCollected,
    milk_produced:     s.milkProduced,
    stone_structures:  s.stoneStructures,
    ceramic_items:     s.ceramicItems,
    forged_weapons:    s.forgedWeapons,
    km_driven:         s.kmDriven,
    cities_visited:    s.citiesVisited,
    military_visited:  s.militaryVisited,
    meals_cooked:      s.mealsCooked,
    water_collected:   s.waterCollected,
    materials_crafted: s.materialsCrafted,
    animal_tracks:     s.animalTracks,
    // PZRX7
    weapons_crafted:   s.weaponsCrafted,
    // PZRX8
    furniture_crafted:  s.furnitureCrafted,
    clothes_crafted:    s.clothesCrafted,
    cheese_produced:    s.cheeseProduced,
    doors_opened:       s.doorsOpened,
    sleep_locations:    s.sleepLocations,
    basements_explored: s.basementsExplored,
    all_stations_used:  s.stationsUsed,
    animal_species:     s.animalSpecies,
    days_no_canned:     s.daysNoCanned,
  };

  // Conquistas individuais de skill: stat key = "skill_<id>" (lowercase English ID)
  for (const [id, level] of Object.entries(s.skillLevels)) {
    stats[`skill_${id}`] = level;
  }

  // Nível máximo em TODAS as skills (não só as que o jogador já treinou alguma vez —
  // uma skill nunca tocada não aparece em s.skillLevels, então conta como nível 0).
  stats.all_skills_10 = ALL_SKILL_IDS.every(id => (s.skillLevels[id] ?? 0) >= 10) ? 1 : 0;

  // "Visite todas as cidades" / "abata todas as espécies" — cities_visited e
  // animal_species já são contagens reais enviadas pelo mod; só faltava a meta fixa.
  stats.all_cities_visited = s.citiesVisited >= TOTAL_CITIES ? 1 : 0;
  stats.all_animal_species = s.animalSpecies >= TOTAL_ANIMAL_SPECIES ? 1 : 0;

  // objectives é preenchido manualmente pelo moderador no painel (EditObjectivesModal),
  // não vem do mod — mas já é a fonte oficial usada pro cálculo de score (ver
  // backend/src/lib/scoring.ts), então é a fonte correta pras conquistas abaixo também.
  const bases = objectives?.bases ?? {};
  const officialBaseIds = [...OFFICIAL_BASE_IDS];
  const basesBuilt = officialBaseIds.filter(id => bases[id]?.has_base).length;
  const allBasesEquipped = officialBaseIds.length > 0 && officialBaseIds.every(id => {
    const b = bases[id];
    return !!b && b.has_base && b.bed && b.windows && b.sink && b.power && b.food && b.vehicle && b.arsenal;
  });
  const militaryCleared = objectives?.military_base === true;

  stats.bases_built         = basesBuilt;
  stats.all_bases_equipped  = allBasesEquipped ? 1 : 0;
  stats.military_cleared    = militaryCleared  ? 1 : 0;

  // Corrige bug encontrado na auditoria: essas 3 usavam s.spiffoVisited (visitas),
  // mas a descrição de todas promete BASE estabelecida ("Base em...", "Bases em
  // 5...", "Domine..."). O antigo threshold de all_spiffo_bases (13) também nunca
  // batia com o total real de bases oficiais (12) — nunca era desbloqueável nem
  // pelo critério errado.
  stats.spiffo_base_any  = basesBuilt;                                    // threshold 1
  stats.spiffo_base_five = basesBuilt;                                    // threshold 5
  stats.all_spiffo_bases = basesBuilt >= officialBaseIds.length ? 1 : 0;  // threshold 1 = todas as 12
  stats.all_objectives_complete =
    allBasesEquipped && militaryCleared && objectives?.spiffo_hq === true && objectives?.spiffo_relic === true
      ? 1 : 0;

  // Meta-conquista: todas as conquistas de tier Ouro já desbloqueadas por este
  // personagem. Compara só contra `unlocked` (estado antes desta chamada) — se a
  // ÚLTIMA conquista Ouro for atingida neste mesmíssimo sync, o Completionista só
  // aparece no próximo sync (autocura, mesmo padrão de todo o resto do sistema).
  const achWithTier = allAch as Array<{ id: number; stat: string; threshold: number; tier: string }>;
  const goldIds = achWithTier.filter(a => a.tier === 'gold').map(a => a.id);
  stats.all_gold_achievements =
    goldIds.length > 0 && goldIds.every(id => unlocked.has(id)) ? 1 : 0;

  const now = new Date().toISOString();

  const toInsert = achWithTier
    .filter(a => !unlocked.has(a.id) && (stats[a.stat] ?? 0) >= a.threshold)
    .map(a => ({ player_id: playerId, character_name: characterName, achievement_id: a.id, entry_id: entryId, unlocked_at: now }));

  if (toInsert.length > 0) {
    // upsert (não insert simples): um insert em lote comum aborta o lote inteiro
    // se QUALQUER linha colidir com o UNIQUE(player_id, character_name, achievement_id)
    // — cenário real em race de syncs concorrentes do mesmo personagem, onde uma
    // conquista já registrada por outra requisição faz o restante do lote (outras
    // conquistas novas e legítimas) nunca ser sequer tentado. onConflict torna cada
    // linha independente: a que já existe só atualiza entry_id/unlocked_at (inofensivo),
    // as demais são inseridas normalmente.
    const { error } = await supabase
      .from('player_achievements')
      .upsert(toInsert, { onConflict: 'player_id,character_name,achievement_id' });

    if (error) {
      console.error('[achievements] falha ao gravar player_achievements:', error, 'player:', playerId, 'character:', characterName);
    }
  }
}
