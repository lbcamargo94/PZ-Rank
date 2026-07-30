/**
 * seed.ts — Dados de mock para desenvolvimento local
 *
 * Uso:  npx tsx --env-file=.env.local src/db/seed.ts
 *   ou: npm run seed
 *
 * Pré-requisito: banco criado pelo dev:local (local.db deve existir).
 * Idempotente: usa INSERT OR IGNORE em todos os registros.
 */

import { openLocalDb } from './sqlite-adapter';

// ── DB ────────────────────────────────────────────────────────────────────────

// openLocalDb() aplica o schema completo + todas as migrations antes de retornar
const db = openLocalDb();

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19) + 'Z';
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 19) + 'Z';
}

function dateOnly(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function obj(bases: Record<string, Partial<{
  bed: boolean; windows: boolean; sink: boolean;
  power: boolean; food: boolean; vehicle: boolean;
}>>, flags: { kills_500k?: boolean; all_skills_10?: boolean; spiffo_statue?: boolean; military_base?: boolean } = {}): string {
  const basesOut: Record<string, unknown> = {};
  for (const [name, b] of Object.entries(bases)) {
    basesOut[name] = {
      has_base: true,
      bed:     b.bed     ?? false,
      windows: b.windows ?? false,
      sink:    b.sink    ?? false,
      power:   b.power   ?? false,
      food:    b.food    ?? false,
      vehicle: b.vehicle ?? false,
    };
  }
  return JSON.stringify({
    bases:         basesOut,
    kills_500k:    flags.kills_500k    ?? false,
    all_skills_10: flags.all_skills_10 ?? false,
    spiffo_statue: flags.spiffo_statue ?? false,
    military_base: flags.military_base ?? false,
  });
}


// ── Strings de habilidades ────────────────────────────────────────────────────

const SK_ELITE = [
  'Corrida 10', 'Pés Leves 9', 'Agilidade 8', 'Furtividade 7',
  'Aptidão Física 10', 'Força 10', 'Machado 10', 'Contundente Longo 8',
  'Lâmina Longa 9', 'Manutenção 10', 'Mira 9', 'Recarga 8',
  'Marcenaria 7', 'Culinária 6', 'Primeiros Socorros 7',
].join(', ');

const SK_ALL10 = [
  'Corrida 10', 'Pés Leves 10', 'Agilidade 10', 'Furtividade 10',
  'Aptidão Física 10', 'Força 10', 'Machado 10', 'Contundente Longo 10',
  'Contundente Curto 10', 'Lâmina Longa 10', 'Lâmina Curta 10', 'Lança 10',
  'Manutenção 10', 'Mira 10', 'Recarga 10', 'Marcenaria 10',
  'Eletricidade 10', 'Soldagem 10', 'Mecânica 10', 'Costura 10',
  'Culinária 10', 'Agricultura 10', 'Primeiros Socorros 10', 'Pescaria 10',
  'Armadilhas 10', 'Coleta 10', 'Lascamento 10', 'Entalhamento 10',
  'Alvenaria 10', 'Cerâmica 10', 'Forja 10', 'Vidraria 10',
  'Pecuária 10', 'Abate 10', 'Rastreamento 10',
].join(', ');

const SK_MID = [
  'Corrida 7', 'Agilidade 6', 'Aptidão Física 8', 'Força 7',
  'Machado 8', 'Mira 7', 'Recarga 6', 'Marcenaria 5',
  'Culinária 4', 'Primeiros Socorros 5',
].join(', ');

const SK_LOW = [
  'Corrida 4', 'Força 5', 'Machado 5', 'Mira 4', 'Marcenaria 3',
].join(', ');

// Traits (formato base:xxx)
const TR_FIGHTER = 'base:Brave,base:Athletic,base:Strong,base:Lucky';
const TR_SNEAKY  = 'base:Sneaky,base:Fit,base:Night Owl,base:Brave';
const TR_CRAFTER = 'base:Handy,base:Outdoorsman,base:Fit,base:Brave';
const TR_BASE    = 'base:Brave,base:Fit';

// ── Seed ─────────────────────────────────────────────────────────────────────

const MOD_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

const run = db.transaction(() => {

  // ── 1. SEASONS ─────────────────────────────────────────────────────────────

  db.prepare(`
    INSERT OR IGNORE INTO seasons (id, name, theme_slug, started_at, ended_at, is_active)
    VALUES (1, 'Brasileirão - 1ª Temporada', 'temporada-1', '2024-01-15T00:00:00Z', '2024-06-30T23:59:59Z', 0)
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO seasons (id, name, theme_slug, started_at, ended_at, is_active)
    VALUES (2, 'Brasileirão - 2ª Temporada', 'temporada-2', '2024-07-01T00:00:00Z', NULL, 1)
  `).run();

  console.log('  ✓ seasons');

  // ── 2. PLAYERS ─────────────────────────────────────────────────────────────

  type PlayerRow = {
    id: number; nick: string; email: string; status: string;
    is_supporter?: number; supporter_until?: string | null;
    twitch_url?: string | null; youtube_url?: string | null;
    kick_url?: string | null; tiktok_url?: string | null;
    player_token: string; created_at: string;
  };

  const players: PlayerRow[] = [
    {
      id: 2,  nick: 'RodrigoBR',        email: 'rodrigo@test.local',
      status: 'approved', is_supporter: 1, supporter_until: daysFromNow(30),
      twitch_url: 'https://twitch.tv/rodrigobr',
      player_token: 'cccccccc-0000-4000-8000-000000000002', created_at: daysAgo(90),
    },
    {
      id: 3,  nick: 'FernandaSurvives', email: 'fernanda@test.local',
      status: 'approved',
      twitch_url: 'https://twitch.tv/fernandasurvives',
      youtube_url: 'https://youtube.com/@fernandasurvives',
      player_token: 'cccccccc-0000-4000-8000-000000000003', created_at: daysAgo(80),
    },
    {
      id: 4,  nick: 'KaiqueMata500k',  email: 'kaique@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000004', created_at: daysAgo(70),
    },
    {
      id: 5,  nick: 'AnaSombra',        email: 'ana@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000005', created_at: daysAgo(60),
    },
    {
      id: 6,  nick: 'GabrielFloresta',  email: 'gabriel@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000006', created_at: daysAgo(50),
    },
    {
      id: 7,  nick: 'MatheusZumbi',     email: 'matheus@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000007', created_at: daysAgo(40),
    },
    {
      id: 8,  nick: 'LucasMorto',       email: 'lucas@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000008', created_at: daysAgo(120),
    },
    {
      id: 9,  nick: 'MarianaDead',      email: 'mariana@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000009', created_at: daysAgo(90),
    },
    {
      id: 10, nick: 'CarlosKilled',     email: 'carlos@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000010', created_at: daysAgo(60),
    },
    {
      id: 11, nick: 'HackMaster2000',   email: 'hack@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000011', created_at: daysAgo(30),
    },
    {
      id: 12, nick: 'CheatCode99',      email: 'cheat@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000012', created_at: daysAgo(20),
    },
    {
      id: 13, nick: 'JogadorPendente',  email: 'pendente@test.local',
      status: 'pending',
      player_token: 'cccccccc-0000-4000-8000-000000000013', created_at: daysAgo(2),
    },
    {
      id: 14, nick: 'CavaloDeTroia',    email: 'cavalo@test.local',
      status: 'rejected',
      player_token: 'cccccccc-0000-4000-8000-000000000014', created_at: daysAgo(5),
    },
    {
      id: 15, nick: 'VitorBloqueado',   email: 'vitor@test.local',
      status: 'approved',
      player_token: 'cccccccc-0000-4000-8000-000000000015', created_at: daysAgo(8),
    },
  ];

  const stmtPlayer = db.prepare(`
    INSERT OR IGNORE INTO players
      (id, nick, email, status, is_supporter, supporter_until,
       twitch_url, youtube_url, kick_url, tiktok_url,
       player_token, email_verified_at, created_at)
    VALUES
      (@id, @nick, @email, @status, @is_supporter, @supporter_until,
       @twitch_url, @youtube_url, @kick_url, @tiktok_url,
       @player_token, @email_verified_at, @created_at)
  `);

  for (const p of players) {
    stmtPlayer.run({
      id:               p.id,
      nick:             p.nick,
      email:            p.email,
      status:           p.status,
      is_supporter:     p.is_supporter ?? 0,
      supporter_until:  p.supporter_until ?? null,
      twitch_url:       p.twitch_url  ?? null,
      youtube_url:      p.youtube_url ?? null,
      kick_url:         p.kick_url    ?? null,
      tiktok_url:       p.tiktok_url  ?? null,
      player_token:     p.player_token,
      email_verified_at: p.status === 'approved' ? p.created_at : null,
      created_at:       p.created_at,
    });
  }

  // blocked player
  db.prepare(`UPDATE players SET blocked = 1 WHERE nick = 'VitorBloqueado'`).run();

  console.log('  ✓ players');

  // ── 3. ENTRIES ─────────────────────────────────────────────────────────────

  type EntryRow = {
    player_id: number; name: string; character_name: string; profession: string;
    days: number; time_raw: number; time_str: string;
    kills: number; skills: string; is_alive: number; sandbox_ok: number;
    traits: string; objectives: string; score: number;
    disqualification_reason?: string; disqualified_at?: string;
    animals_killed?: number | null; fish_caught?: number | null;
    crops_harvested?: number | null; items_crafted?: number | null;
    houses_looted?: number | null; hours_without_sleep?: number | null;
    created_at: string; updated_at: string;
  };

  // Scoring: score = min(kills, 500000) + base bonuses + global flags
  // Base bonus: 50 (has_base) + 10 per true sub-item (max 60) = max 110 per base
  // kills_500k=+500, all_skills_10=+500, spiffo_statue=+300, military_base=+300
  const entries: EntryRow[] = [

    // ── VIVOS (tab Rank) ───────────────────────────────────────────────────
    {
      player_id: 2, name: 'RodrigoBR', character_name: 'Rodrigo "Tempestade"',
      profession: 'Bombeiro', days: 89, time_raw: 128160, time_str: '2a 29d 0h 0m',
      kills: 450_000, skills: SK_ELITE, is_alive: 1, sandbox_ok: 1,
      traits: TR_FIGHTER,
      objectives: obj(
        { 'Base Principal': { bed:true, windows:true, sink:true, power:true, food:true, vehicle:true },
          'Posto Avançado':  { bed:true, windows:true } },
        { military_base: true }
      ),
      score: 450_000 + 110 + 70 + 300,  // 450_480
      animals_killed: 87,  fish_caught: 34,  crops_harvested: 120, items_crafted: 450, houses_looted: 95,  hours_without_sleep: 72,
      created_at: daysAgo(89), updated_at: daysAgo(1),
    },
    {
      player_id: 3, name: 'FernandaSurvives', character_name: 'Fernanda das Sombras',
      profession: 'Policial', days: 67, time_raw: 96480, time_str: '1a 22d 0h 0m',
      kills: 380_000, skills: SK_ELITE, is_alive: 1, sandbox_ok: 1,
      traits: TR_SNEAKY,
      objectives: obj(
        { 'Fortaleza Verde': { bed:true, windows:true, sink:true, power:true, food:true, vehicle:true } },
        { spiffo_statue: true }
      ),
      score: 380_000 + 110 + 300,       // 380_410
      animals_killed: 45,  fish_caught: 62,  crops_harvested: 88,  items_crafted: 310, houses_looted: 72,  hours_without_sleep: 48,
      created_at: daysAgo(67), updated_at: daysAgo(2),
    },
    {
      player_id: 4, name: 'KaiqueMata500k', character_name: 'Kaique o Exterminador',
      profession: 'Açougueiro', days: 54, time_raw: 77760, time_str: '1a 9d 0h 0m',
      kills: 310_000, skills: SK_ALL10, is_alive: 1, sandbox_ok: 1,
      traits: TR_FIGHTER,
      objectives: obj(
        { 'Esconderijo Secreto': { bed:true, windows:true, sink:true } },
        { all_skills_10: true }
      ),
      score: 310_000 + 80 + 500,        // 310_580
      animals_killed: 210, fish_caught: 12,  crops_harvested: 55,  items_crafted: 620, houses_looted: 48,  hours_without_sleep: 96,
      created_at: daysAgo(54), updated_at: daysAgo(3),
    },
    {
      player_id: 5, name: 'AnaSombra', character_name: 'Ana Lua',
      profession: 'Paramédica', days: 41, time_raw: 59040, time_str: '1a 0d 0h 0m',
      kills: 250_000, skills: SK_MID, is_alive: 1, sandbox_ok: 1,
      traits: TR_CRAFTER,
      objectives: obj(
        { 'Clínica da Mata': { bed:true, food:true } },
        { military_base: true }
      ),
      score: 250_000 + 70 + 300,        // 250_370
      animals_killed: 18,  fish_caught: 95,  crops_harvested: 340, items_crafted: 180, houses_looted: 30,  hours_without_sleep: 24,
      created_at: daysAgo(41), updated_at: daysAgo(4),
    },
    {
      player_id: 6, name: 'GabrielFloresta', character_name: 'Gabriel da Mata',
      profession: 'Lenhador', days: 35, time_raw: 50400, time_str: '0a 35d 0h 0m',
      kills: 180_000, skills: SK_MID, is_alive: 1, sandbox_ok: 1,
      traits: TR_BASE,
      objectives: obj({ 'Cabana na Floresta': { bed:true } }),
      score: 180_000 + 60,              // 180_060
      animals_killed: 52,  fish_caught: 28,  crops_harvested: 210, items_crafted: 95,  houses_looted: 18,  hours_without_sleep: 0,
      created_at: daysAgo(35), updated_at: daysAgo(5),
    },
    {
      player_id: 7, name: 'MatheusZumbi', character_name: 'Matheus Bala',
      profession: 'Soldado', days: 22, time_raw: 31680, time_str: '0a 22d 0h 0m',
      kills: 95_000, skills: SK_LOW, is_alive: 1, sandbox_ok: 1,
      traits: TR_BASE,
      objectives: obj({}),
      score: 95_000,
      animals_killed: 8,   fish_caught: 3,   crops_harvested: 12,  items_crafted: 30,  houses_looted: 8,   hours_without_sleep: 0,
      created_at: daysAgo(22), updated_at: daysAgo(7),
    },

    // ── MORTOS (tab Mortes) ────────────────────────────────────────────────
    {
      player_id: 8, name: 'LucasMorto', character_name: 'Lucas dos Mil Zumbis',
      profession: 'Bombeiro', days: 112, time_raw: 161280, time_str: '2a 52d 0h 0m',
      kills: 500_000, skills: SK_ELITE, is_alive: 0, sandbox_ok: 1,
      traits: TR_FIGHTER,
      objectives: obj(
        { 'Forte São Lucas': { bed:true, windows:true, sink:true, power:true, food:true, vehicle:true } },
        { kills_500k: true }
      ),
      score: 500_000 + 110 + 500,       // 500_610
      animals_killed: 150, fish_caught: 80,  crops_harvested: 200, items_crafted: 900, houses_looted: 200, hours_without_sleep: 110,
      created_at: daysAgo(112), updated_at: daysAgo(20),
    },
    {
      player_id: 9, name: 'MarianaDead', character_name: 'Mariana Sombria',
      profession: 'Médica', days: 28, time_raw: 40320, time_str: '0a 28d 0h 0m',
      kills: 120_000, skills: SK_MID, is_alive: 0, sandbox_ok: 1,
      traits: TR_SNEAKY,
      objectives: obj(
        { 'Posto Médico': { bed:true, windows:true, sink:true, power:true, food:true, vehicle:true } }
      ),
      score: 120_000 + 110,             // 120_110
      animals_killed: 10,  fish_caught: 45,  crops_harvested: 60,  items_crafted: 80,  houses_looted: 15,  hours_without_sleep: 0,
      created_at: daysAgo(28), updated_at: daysAgo(25),
    },
    {
      player_id: 10, name: 'CarlosKilled', character_name: 'Carlos Primeiro',
      profession: 'Estudante', days: 15, time_raw: 21600, time_str: '0a 15d 0h 0m',
      kills: 45_000, skills: SK_LOW, is_alive: 0, sandbox_ok: 1,
      traits: 'base:Brave',
      objectives: obj({}),
      score: 45_000,
      animals_killed: 2,   fish_caught: 1,   crops_harvested: 5,   items_crafted: 10,  houses_looted: 3,   hours_without_sleep: 0,
      created_at: daysAgo(15), updated_at: daysAgo(14),
    },

    // ── DESCLASSIFICADOS (tab Desclassificados) ────────────────────────────
    {
      player_id: 11, name: 'HackMaster2000', character_name: 'Hacker Supremo',
      profession: 'Programador', days: 45, time_raw: 64800, time_str: '1a 0d 0h 0m',
      kills: 200_000, skills: SK_MID, is_alive: 1, sandbox_ok: 0,
      traits: 'base:Brave',
      objectives: obj({}),
      score: 200_000,
      disqualification_reason: 'mods:NAO_PERMITIDO:CheatMod', disqualified_at: daysAgo(5),
      animals_killed: null, fish_caught: null, crops_harvested: null, items_crafted: null, houses_looted: null, hours_without_sleep: null,
      created_at: daysAgo(45), updated_at: daysAgo(5),
    },
    {
      player_id: 12, name: 'CheatCode99', character_name: 'Mr. Cheat',
      profession: 'Policial', days: 30, time_raw: 43200, time_str: '0a 30d 0h 0m',
      kills: 150_000, skills: SK_LOW, is_alive: 1, sandbox_ok: 0,
      traits: 'base:Brave',
      objectives: obj({}),
      score: 150_000,
      disqualification_reason: 'manual', disqualified_at: daysAgo(10),
      animals_killed: null, fish_caught: null, crops_harvested: null, items_crafted: null, houses_looted: null, hours_without_sleep: null,
      created_at: daysAgo(30), updated_at: daysAgo(10),
    },
  ];

  const entryCols = `player_id, moderator_id, name, character_name, profession,
       days, time_raw, time_str, kills, skills, is_alive, sandbox_ok,
       traits, objectives, score, disqualification_reason, disqualified_at, season_id,
       animals_killed, fish_caught, crops_harvested, items_crafted, houses_looted, hours_without_sleep,
       created_at, updated_at`;

  const entryParams = `@player_id, @moderator_id, @name, @character_name, @profession,
       @days, @time_raw, @time_str, @kills, @skills, @is_alive, @sandbox_ok,
       @traits, @objectives, @score, @disq_reason, @disq_at, @season_id,
       @animals_killed, @fish_caught, @crops_harvested, @items_crafted, @houses_looted, @hours_without_sleep,
       @created_at, @updated_at`;

  const stmtEntry = db.prepare(`
    INSERT OR IGNORE INTO entries (${entryCols}) VALUES (${entryParams})
  `);

  for (const e of entries) {
    stmtEntry.run({
      player_id:        e.player_id,
      moderator_id:     MOD_ID,
      name:             e.name,
      character_name:   e.character_name,
      profession:       e.profession,
      days:             e.days,
      time_raw:         e.time_raw,
      time_str:         e.time_str,
      kills:            e.kills,
      skills:           e.skills,
      is_alive:         e.is_alive,
      sandbox_ok:       e.sandbox_ok,
      traits:           e.traits,
      objectives:       e.objectives,
      score:            e.score,
      disq_reason:      e.disqualification_reason ?? null,
      disq_at:          e.disqualified_at ?? null,
      season_id:        2,
      animals_killed:   e.animals_killed   ?? null,
      fish_caught:      e.fish_caught      ?? null,
      crops_harvested:  e.crops_harvested  ?? null,
      items_crafted:    e.items_crafted    ?? null,
      houses_looted:    e.houses_looted    ?? null,
      hours_without_sleep: e.hours_without_sleep ?? null,
      created_at:       e.created_at,
      updated_at:       e.updated_at,
    });
  }

  console.log('  ✓ entries');

  // ── 4. MODS ────────────────────────────────────────────────────────────────

  const mods = [
    { name: 'PZ Rank Companion',           mod_id: 'PZRankCompanion',   workshop_url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000001', status: 'active',  is_required: 1 },
    { name: 'Anti-Cheat Sandbox Validator', mod_id: 'PZRankValidator',   workshop_url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000002', status: 'active',  is_required: 1 },
    { name: 'Simple Overhaul Retexture',    mod_id: 'SimpleRetexture',   workshop_url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000003', status: 'active',  is_required: 0 },
    { name: 'Soundtrack Extended',          mod_id: 'SoundtrackExt',     workshop_url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000004', status: 'active',  is_required: 0 },
    { name: 'Speed Hack Pro [BLOQUEADO]',   mod_id: 'SpeedHackPro',      workshop_url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000099', status: 'blocked', is_required: 0 },
  ];

  const stmtMod = db.prepare(`
    INSERT OR IGNORE INTO mods (name, mod_id, workshop_url, status, is_required)
    VALUES (@name, @mod_id, @workshop_url, @status, @is_required)
  `);

  for (const m of mods) stmtMod.run(m);
  console.log('  ✓ mods');

  // ── 5. DAILY NEWS ──────────────────────────────────────────────────────────

  const headlines = [
    'Rodrigo ultrapassa 450 mil kills e amplia liderança no Brasileirão!',
    'Fernanda conquista a estátua do Spiffo e garante 300 pts bônus',
    'Kaique domina as 35 habilidades no nível 10 — façanha inédita',
    'Ana Sombra neutraliza base militar e sobe para o top 4',
    'Matheus entra no rank pela primeira vez com 95 mil kills',
    'Comunidade registra recorde de sincronizações: 42 syncs em 24h',
    'Lucas é homenageado após alcançar 500 mil kills antes de cair no dia 112',
  ];

  const stmtNews = db.prepare(`
    INSERT OR IGNORE INTO daily_news (date, headline, stats) VALUES (?, ?, ?)
  `);

  for (let i = 0; i < 7; i++) {
    stmtNews.run(
      dateOnly(-i),
      headlines[i] ?? null,
      JSON.stringify({
        alive_count:   6,
        dead_count:    3,
        total_kills:   1_795_000,
        deaths_today:  i === 2 ? 1 : 0,
        syncs_today:   10 + (i % 7) * 3,
        kills_today:   2500 + (i % 5) * 800,
      })
    );
  }

  console.log('  ✓ daily_news');

  // ── 6. SEASON FINANCES ─────────────────────────────────────────────────────

  const finances = [
    { season_id: 2, category: 'hosting',    label: 'Vercel Pro (mensal)',        amount_brl: 120.00, goal_brl: 150.00 },
    { season_id: 2, category: 'domain',     label: 'Registro pzrank.com.br',     amount_brl:  49.90, goal_brl:  49.90 },
    { season_id: 2, category: 'prize',      label: 'Prêmio 1º Lugar',            amount_brl:   0.00, goal_brl: 500.00 },
    { season_id: 2, category: 'prize',      label: 'Prêmio 2º Lugar',            amount_brl:   0.00, goal_brl: 250.00 },
    { season_id: 2, category: 'prize',      label: 'Prêmio 3º Lugar',            amount_brl:   0.00, goal_brl: 100.00 },
    { season_id: 2, category: 'supporters', label: 'Apoiadores Temporada 2',     amount_brl: 320.00, goal_brl: 500.00 },
    { season_id: 2, category: 'adsense',    label: 'Google AdSense',             amount_brl:  42.15, goal_brl: null   },
    { season_id: 2, category: 'sponsor',    label: 'Patrocínio Comunidade PZ BR',amount_brl: 200.00, goal_brl: null   },
    // Season 1 retrospective
    { season_id: 1, category: 'hosting',    label: 'Vercel Pro (T1)',             amount_brl: 360.00, goal_brl: 360.00 },
    { season_id: 1, category: 'prize',      label: 'Premiação T1 (distribuída)',  amount_brl: 850.00, goal_brl: 850.00 },
    { season_id: 1, category: 'supporters', label: 'Apoiadores T1',              amount_brl: 540.00, goal_brl: 500.00 },
  ];

  const stmtFin = db.prepare(`
    INSERT OR IGNORE INTO season_finances (season_id, category, label, amount_brl, goal_brl)
    VALUES (@season_id, @category, @label, @amount_brl, @goal_brl)
  `);

  for (const f of finances) stmtFin.run(f);
  console.log('  ✓ season_finances');

  // ── 7. HALL OF FAME (Temporada 1) ──────────────────────────────────────────

  const hof = [
    { season_id: 1, player_id: 8, entry_name: 'LucasMorto',       character_name: 'Lucas Campeão T1',  position: 1, days: 130, kills: 480_000, score: 481_610 },
    { season_id: 1, player_id: 3, entry_name: 'FernandaSurvives', character_name: 'Fernanda Prata T1', position: 2, days:  98, kills: 320_000, score: 321_110 },
    { season_id: 1, player_id: 2, entry_name: 'RodrigoBR',        character_name: 'Rodrigo Bronze T1', position: 3, days:  85, kills: 280_000, score: 280_520 },
  ];

  const stmtHof = db.prepare(`
    INSERT OR IGNORE INTO hall_of_fame
      (season_id, player_id, entry_name, character_name, position, days, kills, score)
    VALUES
      (@season_id, @player_id, @entry_name, @character_name, @position, @days, @kills, @score)
  `);

  for (const h of hof) stmtHof.run(h);
  console.log('  ✓ hall_of_fame');

  // ── 8. HEATMAP EVENTS ──────────────────────────────────────────────────────

  const stmtHeat = db.prepare(`
    INSERT OR IGNORE INTO heatmap_events (season_id, event_type, grid_x, grid_y, count)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Clusters de kills ao redor das áreas principais do mapa
  const killClusters = [
    { cx: 30, cy: 20, r: 5, base: 900 },  // Louisville
    { cx: 10, cy: 40, r: 4, base: 450 },  // Muldraugh
    { cx: 50, cy: 60, r: 3, base: 280 },  // West Point
    { cx: 70, cy: 30, r: 3, base: 200 },  // March Ridge
    { cx: 45, cy: 15, r: 2, base: 120 },  // Rota secundária
  ];

  for (const cl of killClusters) {
    for (let dx = -cl.r; dx <= cl.r; dx++) {
      for (let dy = -cl.r; dy <= cl.r; dy++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > cl.r) continue;
        const count = Math.max(1, Math.round(cl.base * (1 - dist / cl.r)));
        stmtHeat.run(2, 'kill', cl.cx + dx, cl.cy + dy, count);
      }
    }
  }

  // Mortes espalhadas
  const deaths = [
    [31,21,5],[11,41,3],[51,61,2],[26,16,2],[46,56,1],[62,26,1],[35,45,1],[72,31,1],
  ] as [number, number, number][];
  for (const [x, y, c] of deaths) stmtHeat.run(2, 'death', x, y, c);

  // Localizações de bases
  const bases = [
    [28,18,3],[12,42,2],[55,62,1],[72,28,1],[36,50,1],[48,14,1],
  ] as [number, number, number][];
  for (const [x, y, c] of bases) stmtHeat.run(2, 'base', x, y, c);

  console.log('  ✓ heatmap_events');

  // ── 9. PLAYER ACHIEVEMENTS ─────────────────────────────────────────────────

  const achRows = db.prepare('SELECT id, slug FROM achievements').all() as { id: number; slug: string }[];
  const achId   = Object.fromEntries(achRows.map(a => [a.slug, a.id]));

  const stmtAch = db.prepare(`
    INSERT OR IGNORE INTO player_achievements (player_id, achievement_id, entry_id)
    VALUES (?, ?, ?)
  `);

  const playerAchs: [number, string][] = [
    // RodrigoBR — kills, dias, extended
    [2, 'first-blood'], [2, 'zombie-slayer'], [2, 'zombie-god'],
    [2, 'marathon'],    [2, 'veteran'],
    [2, 'insomniac'],  [2, 'hunter'],  [2, 'fisherman'], [2, 'farmer'],
    // FernandaSurvives
    [3, 'first-blood'], [3, 'zombie-slayer'], [3, 'zombie-god'],
    [3, 'marathon'],    [3, 'veteran'],
    [3, 'master-angler'], [3, 'insomniac'],
    // KaiqueMata500k
    [4, 'first-blood'], [4, 'zombie-slayer'], [4, 'zombie-god'],
    [4, 'no-sleep'],    [4, 'big-game'],      [4, 'engineer'],
    // AnaSombra
    [5, 'first-blood'], [5, 'zombie-slayer'],
    [5, 'marathon'],    [5, 'master-angler'], [5, 'agronomist'],
    // GabrielFloresta
    [6, 'first-blood'], [6, 'zombie-slayer'],
    [6, 'marathon'],    [6, 'hunter'],        [6, 'farmer'],
    // MatheusZumbi
    [7, 'first-blood'],
    // LucasMorto — record holder
    [8, 'first-blood'], [8, 'zombie-slayer'], [8, 'zombie-god'],
    [8, 'marathon'],    [8, 'veteran'],       [8, 'legend'],
    [8, 'no-sleep'],    [8, 'engineer'],      [8, 'raider'],
    // MarianaDead
    [9, 'first-blood'], [9, 'zombie-slayer'],
    [9, 'marathon'],    [9, 'master-angler'],
    // CarlosKilled
    [10, 'first-blood'],
  ];

  for (const [playerId, slug] of playerAchs) {
    const id = achId[slug];
    if (!id) { console.warn(`    ⚠ achievement slug não encontrado: ${slug}`); continue; }
    stmtAch.run(playerId, id, null);
  }

  console.log('  ✓ player_achievements');
});

// ── Execução ──────────────────────────────────────────────────────────────────

try {
  console.log('\n🌱 Executando seed...\n');
  run();
  console.log(`
✅ Seed concluído!

  Temporadas ........... 2  (T1 encerrada + T2 ativa)
  Jogadores ............ 15 (+ TestPlayer existente)
  Entries .............. 11 (6 vivos · 3 mortos · 2 desclassificados)
  Mods ................. 5  (2 obrigatórios · 2 opcionais · 1 bloqueado)
  Daily news ........... 7  dias
  Finanças ............. 11 entradas (T1 + T2)
  Hall of Fame ......... 3  posições (T1)
  Heatmap events ....... kills/deaths/bases espalhados
  Conquistas ........... desbloqueadas para jogadores principais

  ── Acesso local ────────────────────────────────────────────
  Moderador master:  login=admin       senha=admin123
  TestPlayer token:  bbbbbbbb-0000-4000-8000-000000000001
  RodrigoBR token:   cccccccc-0000-4000-8000-000000000002
  ────────────────────────────────────────────────────────────
`);
} catch (err) {
  console.error('\n❌ Erro no seed:', err);
  process.exit(1);
} finally {
  db.close();
}
