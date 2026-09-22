/**
 * backfill-achievements.ts
 *
 * Retroativamente reavalia conquistas para todos os personagens (entries)
 * com base nas stats de cada entry individual — por personagem, não por player.
 * Útil após adicionar/corrigir critérios de conquista: pega jogadores que já
 * cumpriam o requisito antes da mudança entrar no ar.
 *
 * --dry-run: não grava nada. Lista o que SERIA concedido (por conquista e por
 * personagem) para revisão antes de aplicar de verdade.
 *
 * Execução (Supabase/Postgres produção):
 *   npx tsx src/scripts/backfill-achievements.ts --dry-run
 *   npx tsx src/scripts/backfill-achievements.ts
 *
 * Execução (SQLite local):
 *   USE_SQLITE=true npx tsx src/scripts/backfill-achievements.ts --dry-run
 */

import { supabase } from '../supabase';
import { evaluateAchievements } from '../lib/achievements';
import { SKILL_NAMES } from '../lib/skills';
import type { Objectives } from '../types';

const DRY_RUN = process.argv.includes('--dry-run');

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
  console.log(DRY_RUN ? '=== MODO DRY-RUN — nada será gravado ===\n' : '=== MODO REAL — vai gravar no banco ===\n');
  console.log('Buscando todas as entradas do banco...');

  const { data: entries, error } = await supabase
    .from('entries')
    .select([
      'id', 'player_id', 'character_name',
      'kills', 'days',
      'animals_killed', 'fish_caught', 'crops_harvested', 'items_crafted',
      'houses_looted', 'hours_without_sleep', 'trees_cut', 'books_read',
      'structures_built', 'crops_planted', 'spiffo_visited',
      'eggs_collected', 'milk_produced', 'stone_structures', 'ceramic_items',
      'forged_weapons', 'km_driven', 'cities_visited', 'military_visited',
      'meals_cooked', 'water_collected', 'materials_crafted', 'animal_tracks',
      'weapons_crafted', 'furniture_crafted', 'clothes_crafted', 'cheese_produced',
      'doors_opened', 'sleep_locations', 'basements_explored', 'stations_used',
      'animal_species', 'days_no_canned',
      'skills', 'objectives',
    ].join(', '))
    .not('player_id', 'is', null)
    .order('id', { ascending: true });

  if (error || !entries) {
    console.error('Erro ao buscar entradas:', error);
    process.exit(1);
  }

  const { data: players } = await supabase.from('players').select('id, nick');
  const nickById = new Map<number, string>(
    ((players ?? []) as Array<{ id: number; nick: string }>).map(p => [p.id, p.nick]),
  );

  console.log(`${entries.length} entrada(s) encontrada(s). Avaliando conquistas por personagem...\n`);

  let processed = 0;
  const perAchievement = new Map<string, number>(); // slug -> quantas vezes seria/foi concedida
  const details: string[] = []; // linhas "nick | personagem | slug" pra revisão detalhada

  for (const e of entries as Array<Record<string, unknown>>) {
    const playerId      = e['player_id']      as number;
    const characterName = String(e['character_name'] ?? '');
    const entryId        = e['id']            as number;
    const n = (f: string) => Math.max(0, (e[f] as number | null) ?? 0);
    const skillLevels  = parseSkillLevels(e['skills'] as string | null);

    try {
      const unlocked = await evaluateAchievements(playerId, characterName, entryId, {
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
        weaponsCrafted:    n('weapons_crafted'),
        furnitureCrafted:  n('furniture_crafted'),
        clothesCrafted:    n('clothes_crafted'),
        cheeseProduced:    n('cheese_produced'),
        doorsOpened:       n('doors_opened'),
        sleepLocations:    n('sleep_locations'),
        basementsExplored: n('basements_explored'),
        stationsUsed:      n('stations_used'),
        animalSpecies:     n('animal_species'),
        daysNoCanned:      n('days_no_canned'),
        skillLevels,
      }, (e['objectives'] as Objectives | null) ?? null, { dryRun: DRY_RUN });

      processed++;
      if (unlocked.length > 0) {
        const nick = nickById.get(playerId) ?? `player#${playerId}`;
        for (const u of unlocked) {
          perAchievement.set(u.slug, (perAchievement.get(u.slug) ?? 0) + 1);
          details.push(`${nick} | ${characterName} | ${u.slug}`);
        }
      }
    } catch (err) {
      console.error(`  entry ${entryId} (player ${playerId} / "${characterName}"): ERRO`, err);
    }
  }

  console.log(`\nEntradas processadas: ${processed}/${entries.length}`);
  console.log(`${DRY_RUN ? 'Conquistas que SERIAM concedidas' : 'Conquistas concedidas'}: ${details.length}\n`);

  if (perAchievement.size > 0) {
    console.log('Por conquista:');
    for (const [slug, count] of [...perAchievement.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${slug}: ${count}`);
    }
    console.log('\nDetalhado (jogador | personagem | conquista):');
    for (const line of details) console.log(`  ${line}`);
  } else {
    console.log('Nenhuma conquista nova a conceder — nada mudaria.');
  }

  if (DRY_RUN) {
    console.log('\nDry-run concluído. Nada foi gravado. Rode sem --dry-run pra aplicar de verdade.');
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
