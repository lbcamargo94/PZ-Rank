/**
 * seed.ts — 60+ participantes para desenvolvimento local
 *
 * Uso:  npx tsx --env-file=.env.local src/db/seed.ts
 *   ou: npm run seed
 *
 * Idempotente: limpa dados anteriores do seed antes de reinserir.
 * Dados preservados: moderador 'admin' e TestPlayer (player_id=1).
 */

import { openLocalDb } from './sqlite-adapter';

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

function timeStr(days: number): string {
  return `${Math.floor(days / 30)}a ${days % 30}d 0h 0m`;
}

// Gera string de habilidades: os primeiros n10 no nível 10, o resto em níveis variados
const SKILL_NAMES = [
  'Corrida', 'Pés Leves', 'Agilidade', 'Furtividade',
  'Aptidão Física', 'Força',
  'Machado', 'Contundente Longo', 'Contundente Curto', 'Lâmina Longa', 'Lâmina Curta', 'Lança',
  'Manutenção', 'Mira', 'Recarga',
  'Marcenaria', 'Eletricidade', 'Soldagem', 'Mecânica', 'Costura',
  'Culinária', 'Agricultura', 'Primeiros Socorros', 'Pescaria',
  'Armadilhas', 'Coleta', 'Lascamento', 'Entalhamento',
  'Alvenaria', 'Cerâmica', 'Forja', 'Vidraria',
  'Pecuária', 'Abate', 'Rastreamento',
];
const LOW_LEVELS = [8, 7, 6, 5, 4, 3];
function skills(n10: number): string {
  return SKILL_NAMES.map((s, i) =>
    i < n10 ? `${s} 10` : `${s} ${LOW_LEVELS[i % LOW_LEVELS.length]}`
  ).join(', ');
}

type ObjOpts = { bases?: string[]; military_base?: boolean; spiffo_hq?: boolean; spiffo_relic?: boolean };

function obj(opts: ObjOpts = {}): string {
  const basesOut: Record<string, unknown> = {};
  for (const id of opts.bases ?? []) {
    basesOut[id] = { has_base: true, bed: true, windows: true, sink: true, power: true, food: true, vehicle: true };
  }
  return JSON.stringify({
    bases:         basesOut,
    military_base: opts.military_base ?? false,
    spiffo_hq:     opts.spiffo_hq     ?? false,
    spiffo_relic:  opts.spiffo_relic  ?? false,
  });
}

// Fórmula real de score (igual a backend/src/lib/scoring.ts)
function sc(kills: number, n10: number, opts: ObjOpts = {}): number {
  return Math.round(Math.min(kills, 800_000) * 0.1)
    + n10 * 1_000
    + (opts.military_base ? 5_000 : 0)
    + (opts.spiffo_hq     ? 5_000 : 0)
    + (opts.spiffo_relic  ? 3_000 : 0)
    + (opts.bases ?? []).length * 1_000;
}

const TR_FIGHTER = 'base:Brave,base:Athletic,base:Strong,base:Lucky';
const TR_SNEAKY  = 'base:Sneaky,base:Fit,base:Night Owl,base:Brave';
const TR_CRAFTER = 'base:Handy,base:Outdoorsman,base:Fit,base:Brave';
const TR_BASE    = 'base:Brave,base:Fit';
// token a partir do ID: cccccccc-0000-4000-8000-{pad(id)}
function tok(id: number): string {
  return `cccccccc-0000-4000-8000-${String(id).padStart(12, '0')}`;
}

// ── IDs do seed ───────────────────────────────────────────────────────────────

// Players 2-15: existentes | 16-70: novos vivos | 71-75: mortos adicionais
const SEED_PLAYER_IDS = Array.from({ length: 74 }, (_, i) => i + 2); // 2..75
const IDS_SQL = SEED_PLAYER_IDS.join(',');

// ── MOD_ID do admin ───────────────────────────────────────────────────────────

const MOD_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

// ── Transação ─────────────────────────────────────────────────────────────────

const run = db.transaction(() => {

  // ── 0. LIMPEZA ────────────────────────────────────────────────────────────────
  db.prepare(`DELETE FROM player_achievements WHERE player_id IN (${IDS_SQL})`).run();
  db.prepare(`DELETE FROM entries WHERE player_id IN (${IDS_SQL})`).run();
  db.prepare(`DELETE FROM players WHERE id IN (${IDS_SQL})`).run();
  db.prepare('DELETE FROM heatmap_events WHERE season_id IN (1,2)').run();
  db.prepare('DELETE FROM hall_of_fame WHERE season_id IN (1,2)').run();
  db.prepare('DELETE FROM season_finances WHERE season_id IN (1,2)').run();
  db.prepare('DELETE FROM daily_news').run();

  // ── 1. SEASONS ───────────────────────────────────────────────────────────────
  db.prepare(`
    INSERT OR IGNORE INTO seasons (id, name, theme_slug, started_at, ended_at, is_active)
    VALUES (1,'Brasileirão - 1ª Temporada','temporada-1','2024-01-15T00:00:00Z','2024-06-30T23:59:59Z',0)
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO seasons (id, name, theme_slug, started_at, ended_at, is_active)
    VALUES (2,'Brasileirão - 2ª Temporada','temporada-2','2024-07-01T00:00:00Z',NULL,1)
  `).run();
  console.log('  ✓ seasons');

  // ── 2. PLAYERS ───────────────────────────────────────────────────────────────
  const stmtP = db.prepare(`
    INSERT OR IGNORE INTO players
      (id, nick, email, status, is_supporter, supporter_until,
       twitch_url, youtube_url, player_token, email_verified_at, created_at)
    VALUES
      (@id,@nick,@email,@status,@is_supporter,@supporter_until,
       @twitch_url,@youtube_url,@player_token,@email_verified_at,@created_at)
  `);

  type P = {
    id: number; nick: string; email?: string; status?: string;
    is_supporter?: number; supporter_until?: string | null;
    twitch_url?: string | null; youtube_url?: string | null;
  };

  const players: P[] = [
    // ── Existentes ──────────────────────────────────────────────────────────
    { id:2,  nick:'RodrigoBR',        email:'rodrigo@test.local',  status:'approved', is_supporter:1, supporter_until:daysFromNow(30), twitch_url:'https://twitch.tv/rodrigobr' },
    { id:3,  nick:'FernandaSurvives', email:'fernanda@test.local', status:'approved', twitch_url:'https://twitch.tv/fernandasurvives', youtube_url:'https://youtube.com/@fernandasurvives' },
    { id:4,  nick:'KaiqueMata500k',   email:'kaique@test.local',   status:'approved' },
    { id:5,  nick:'AnaSombra',        email:'ana@test.local',      status:'approved' },
    { id:6,  nick:'GabrielFloresta',  email:'gabriel@test.local',  status:'approved' },
    { id:7,  nick:'MatheusZumbi',     email:'matheus@test.local',  status:'approved' },
    { id:8,  nick:'LucasMorto',       email:'lucas@test.local',    status:'approved' },
    { id:9,  nick:'MarianaDead',      email:'mariana@test.local',  status:'approved' },
    { id:10, nick:'CarlosKilled',     email:'carlos@test.local',   status:'approved' },
    { id:11, nick:'HackMaster2000',   email:'hack@test.local',     status:'approved' },
    { id:12, nick:'CheatCode99',      email:'cheat@test.local',    status:'approved' },
    { id:13, nick:'JogadorPendente',  email:'pendente@test.local', status:'pending'  },
    { id:14, nick:'CavaloDeTroia',    email:'cavalo@test.local',   status:'rejected' },
    { id:15, nick:'VitorBloqueado',   email:'vitor@test.local',    status:'approved' },
    // ── Novos vivos (16–70) ──────────────────────────────────────────────────
    { id:16, nick:'XandraoApocalipse',   email:'xandrao@test.local',   status:'approved', twitch_url:'https://twitch.tv/xandrao' },
    { id:17, nick:'CamilaBravura',       email:'camila@test.local',    status:'approved', is_supporter:1, supporter_until:daysFromNow(60) },
    { id:18, nick:'PauloExterminador',   email:'paulo@test.local',     status:'approved' },
    { id:19, nick:'DiegoKentucky',       email:'diego@test.local',     status:'approved', twitch_url:'https://twitch.tv/diegokentucky' },
    { id:20, nick:'IsabellaElite',       email:'isabella@test.local',  status:'approved' },
    { id:21, nick:'RafaelRampante',      email:'rafael@test.local',    status:'approved' },
    { id:22, nick:'ThiagoFortress',      email:'thiago@test.local',    status:'approved' },
    { id:23, nick:'JulianaZumbi',        email:'juliana@test.local',   status:'approved' },
    { id:24, nick:'MarcosRaider',        email:'marcos@test.local',    status:'approved' },
    { id:25, nick:'FelipeMilitar',       email:'felipe@test.local',    status:'approved' },
    { id:26, nick:'CarolinaSombra',      email:'carolina@test.local',  status:'approved' },
    { id:27, nick:'OtavioSurvivor',      email:'otavio@test.local',    status:'approved' },
    { id:28, nick:'NathaliaBrave',       email:'nathalia@test.local',  status:'approved' },
    { id:29, nick:'BrendaFloresta',      email:'brenda@test.local',    status:'approved' },
    { id:30, nick:'AlexMuldraugh',       email:'alex@test.local',      status:'approved' },
    { id:31, nick:'SandraZumbeadora',    email:'sandra@test.local',    status:'approved' },
    { id:32, nick:'LeandroEsconderijo', email:'leandro@test.local',   status:'approved' },
    { id:33, nick:'VitoriaKentucky',     email:'vitoria@test.local',   status:'approved' },
    { id:34, nick:'CaioExplorer',        email:'caio@test.local',      status:'approved' },
    { id:35, nick:'LarissaSurvivor',     email:'larissa@test.local',   status:'approved' },
    { id:36, nick:'EdsonFighter',        email:'edson@test.local',     status:'approved' },
    { id:37, nick:'MonicaFortress',      email:'monica@test.local',    status:'approved' },
    { id:38, nick:'WagnerApocalipse',    email:'wagner@test.local',    status:'approved' },
    { id:39, nick:'PriscilaSombra',      email:'priscila@test.local',  status:'approved' },
    { id:40, nick:'HenriqueMilitar',     email:'henrique@test.local',  status:'approved' },
    { id:41, nick:'TainaraBrava',        email:'tainara@test.local',   status:'approved' },
    { id:42, nick:'MuriloKills',         email:'murilo@test.local',    status:'approved' },
    { id:43, nick:'JessicaElite',        email:'jessica@test.local',   status:'approved' },
    { id:44, nick:'DaniloBeta',          email:'danilo@test.local',    status:'approved' },
    { id:45, nick:'AndresaZumbi',        email:'andresa@test.local',   status:'approved' },
    { id:46, nick:'TalilaFronteira',     email:'talila@test.local',    status:'approved' },
    { id:47, nick:'RicardoNovato',       email:'ricardon@test.local',  status:'approved' },
    { id:48, nick:'FernandaNovata',      email:'fernandn@test.local',  status:'approved' },
    { id:49, nick:'GabrielNovato',       email:'gabrieln@test.local',  status:'approved' },
    { id:50, nick:'LucasBeta',           email:'lucasb@test.local',    status:'approved' },
    { id:51, nick:'MariaNovata',         email:'maria@test.local',     status:'approved' },
    { id:52, nick:'CarlosNoob',          email:'carlosn@test.local',   status:'approved' },
    { id:53, nick:'EduardoExplorer',     email:'eduardo@test.local',   status:'approved' },
    { id:54, nick:'VanessaFloresta',     email:'vanessa@test.local',   status:'approved' },
    { id:55, nick:'PedroFloresta',       email:'pedron@test.local',    status:'approved' },
    { id:56, nick:'CristianeZumbi',      email:'cristiane@test.local', status:'approved' },
    { id:57, nick:'EversonRaider',       email:'everson@test.local',   status:'approved' },
    { id:58, nick:'FabioApocalipse',     email:'fabio@test.local',     status:'approved' },
    { id:59, nick:'KamilaSurvivor',      email:'kamila@test.local',    status:'approved' },
    { id:60, nick:'JoaoFloresta',        email:'joao@test.local',      status:'approved' },
    { id:61, nick:'AnaLuz',             email:'analuz@test.local',    status:'approved' },
    { id:62, nick:'BrunoNoob',           email:'brunon@test.local',    status:'approved' },
    { id:63, nick:'TatianeNovata',       email:'tatiane@test.local',   status:'approved' },
    { id:64, nick:'SergioSurvivor',      email:'sergio@test.local',    status:'approved' },
    { id:65, nick:'ClarissaFronteira',   email:'clarissa@test.local',  status:'approved' },
    { id:66, nick:'MiltonZumbi',         email:'milton@test.local',    status:'approved' },
    { id:67, nick:'PamelaExplorer',      email:'pamela@test.local',    status:'approved' },
    { id:68, nick:'RobertoKentucky',     email:'roberto@test.local',   status:'approved' },
    { id:69, nick:'NovataApocalipse',    email:'novata@test.local',    status:'approved' },
    { id:70, nick:'InicanteZumbi',       email:'iniçante@test.local',  status:'approved' },
    // ── Mortos adicionais (71–75) ────────────────────────────────────────────
    { id:71, nick:'GledsonMorto',        email:'gledson@test.local',   status:'approved' },
    { id:72, nick:'IngridDead',          email:'ingrid@test.local',    status:'approved' },
    { id:73, nick:'FrancisMorto',        email:'francis@test.local',   status:'approved' },
    { id:74, nick:'MayraMorta',          email:'mayra@test.local',     status:'approved' },
    { id:75, nick:'RonaldoDead',         email:'ronaldo@test.local',   status:'approved' },
  ];

  const now = new Date().toISOString();
  for (const p of players) {
    stmtP.run({
      id:               p.id,
      nick:             p.nick,
      email:            p.email ?? null,
      status:           p.status ?? 'approved',
      is_supporter:     p.is_supporter ?? 0,
      supporter_until:  p.supporter_until ?? null,
      twitch_url:       p.twitch_url  ?? null,
      youtube_url:      p.youtube_url ?? null,
      player_token:     tok(p.id),
      email_verified_at: (p.status ?? 'approved') === 'approved' ? now : null,
      created_at:       daysAgo(Math.floor(Math.random() * 90) + 10),
    });
  }

  db.prepare(`UPDATE players SET blocked = 1 WHERE nick = 'VitorBloqueado'`).run();
  console.log(`  ✓ players (${players.length})`);

  // ── 3. ENTRIES ───────────────────────────────────────────────────────────────
  const stmtE = db.prepare(`
    INSERT INTO entries (
      player_id, moderator_id, name, character_name, profession,
      days, time_raw, time_str, kills, skills, is_alive, sandbox_ok,
      traits, objectives, score, disqualification_reason, disqualified_at, season_id,
      animals_killed, fish_caught, crops_harvested, items_crafted, houses_looted, hours_without_sleep,
      created_at, updated_at
    ) VALUES (
      @pid, @mod, @name, @char, @prof,
      @days, @time_raw, @tstr, @kills, @sk, @alive, @sbok,
      @tr, @ob, @score, @dqr, @dqat, 2,
      @ak, @fc, @ch, @ic, @hl, @hws,
      @cat, @uat
    )
  `);

  type E = {
    pid: number; name: string; char: string; prof: string;
    days: number; kills: number; n10: number;
    alive?: number; sbok?: number;
    tr?: string; ob?: ObjOpts;
    dqr?: string;
    ak?: number | null; fc?: number | null; ch?: number | null;
    ic?: number | null; hl?: number | null; hws?: number | null;
    cat: string; uat: string;
  };

  // score helper inline para entries
  function esc(e: E): number {
    return sc(e.kills, e.n10, e.ob);
  }

  const entries: E[] = [
    // ── VIVOS existentes ──────────────────────────────────────────────────────
    { pid:2,  name:'RodrigoBR',        char:'Rodrigo "Tempestade"',  prof:'Bombeiro',    days:89,  kills:450_000, n10:5,  tr:TR_FIGHTER, ob:{military_base:true},   ak:87,  fc:34,  ch:120, ic:450, hl:95,  hws:72, cat:daysAgo(89), uat:daysAgo(1) },
    { pid:3,  name:'FernandaSurvives', char:'Fernanda das Sombras',  prof:'Policial',    days:67,  kills:380_000, n10:5,  tr:TR_SNEAKY,  ob:{spiffo_relic:true},    ak:45,  fc:62,  ch:88,  ic:310, hl:72,  hws:48, cat:daysAgo(67), uat:daysAgo(2) },
    { pid:4,  name:'KaiqueMata500k',   char:'Kaique o Exterminador', prof:'Açougueiro',  days:54,  kills:310_000, n10:35, tr:TR_FIGHTER, ob:{},                      ak:210, fc:12,  ch:55,  ic:620, hl:48,  hws:96, cat:daysAgo(54), uat:daysAgo(3) },
    { pid:5,  name:'AnaSombra',        char:'Ana Lua',               prof:'Paramédica',  days:41,  kills:250_000, n10:0,  tr:TR_CRAFTER, ob:{military_base:true},   ak:18,  fc:95,  ch:340, ic:180, hl:30,  hws:24, cat:daysAgo(41), uat:daysAgo(4) },
    { pid:6,  name:'GabrielFloresta',  char:'Gabriel da Mata',       prof:'Lenhador',    days:35,  kills:180_000, n10:0,  tr:TR_BASE,    ob:{},                      ak:52,  fc:28,  ch:210, ic:95,  hl:18,  hws:0,  cat:daysAgo(35), uat:daysAgo(5) },
    { pid:7,  name:'MatheusZumbi',     char:'Matheus Bala',          prof:'Soldado',     days:22,  kills:95_000,  n10:0,  tr:TR_BASE,    ob:{},                      ak:8,   fc:3,   ch:12,  ic:30,  hl:8,   hws:0,  cat:daysAgo(22), uat:daysAgo(7) },

    // ── MORTOS existentes ─────────────────────────────────────────────────────
    { pid:8,  name:'LucasMorto',       char:'Lucas dos Mil Zumbis',  prof:'Bombeiro',    days:112, kills:500_000, n10:5,  tr:TR_FIGHTER, ob:{military_base:true},   ak:150, fc:80,  ch:200, ic:900, hl:200, hws:110, alive:0, cat:daysAgo(112), uat:daysAgo(20) },
    { pid:9,  name:'MarianaDead',      char:'Mariana Sombria',       prof:'Médico',      days:28,  kills:120_000, n10:0,  tr:TR_SNEAKY,  ob:{},                      ak:10,  fc:45,  ch:60,  ic:80,  hl:15,  hws:0,  alive:0, cat:daysAgo(28),  uat:daysAgo(25) },
    { pid:10, name:'CarlosKilled',     char:'Carlos Primeiro',       prof:'Estudante',   days:15,  kills:45_000,  n10:0,  tr:TR_BASE,    ob:{},                      ak:2,   fc:1,   ch:5,   ic:10,  hl:3,   hws:0,  alive:0, cat:daysAgo(15),  uat:daysAgo(14) },

    // ── DESCLASSIFICADOS ──────────────────────────────────────────────────────
    { pid:11, name:'HackMaster2000',   char:'Hacker Supremo',        prof:'Estudante',   days:45,  kills:200_000, n10:0,  tr:TR_BASE,    ob:{},                      sbok:0, dqr:'mods:NAO_PERMITIDO:CheatMod', cat:daysAgo(45), uat:daysAgo(5) },
    { pid:12, name:'CheatCode99',      char:'Mr. Cheat',             prof:'Policial',    days:30,  kills:150_000, n10:0,  tr:TR_BASE,    ob:{},                      sbok:0, dqr:'manual',                      cat:daysAgo(30), uat:daysAgo(10) },

    // ── NOVOS VIVOS — Tier Lenda (16–18) ─────────────────────────────────────
    { pid:16, name:'XandraoApocalipse', char:'Xandrao o Imortal',  prof:'Bombeiro',        days:195, kills:780_000, n10:35, tr:TR_FIGHTER, ob:{military_base:true, spiffo_hq:true, bases:['louisville_hq','muldraugh']}, cat:daysAgo(195), uat:daysAgo(0) },
    { pid:17, name:'CamilaBravura',     char:'Camila Bravura',     prof:'Paramédica',      days:163, kills:620_000, n10:30, tr:TR_SNEAKY,  ob:{military_base:true, spiffo_relic:true, bases:['rosewood','riverside']},    cat:daysAgo(163), uat:daysAgo(1) },
    { pid:18, name:'PauloExterminador', char:'Paulo o Maldito',    prof:'Açougueiro',      days:141, kills:490_000, n10:25, tr:TR_FIGHTER, ob:{military_base:true, bases:['west_point','ekron']},                         cat:daysAgo(141), uat:daysAgo(1) },

    // ── NOVOS VIVOS — Tier S (19–28) ─────────────────────────────────────────
    { pid:19, name:'DiegoKentucky',   char:'Diego da Fronteira',   prof:'Soldado',         days:122, kills:430_000, n10:20, tr:TR_FIGHTER, ob:{spiffo_hq:true, bases:['irvington']},   cat:daysAgo(122), uat:daysAgo(2) },
    { pid:20, name:'IsabellaElite',   char:'Isabella das Armas',   prof:'Policial',         days:108, kills:360_000, n10:20, tr:TR_SNEAKY,  ob:{},                                      cat:daysAgo(108), uat:daysAgo(2) },
    { pid:21, name:'RafaelRampante',  char:'Rafael Sem Medo',      prof:'Bombeiro',         days:98,  kills:400_000, n10:15, tr:TR_FIGHTER, ob:{},                                      cat:daysAgo(98),  uat:daysAgo(3) },
    { pid:22, name:'ThiagoFortress',  char:'Thiago Fortaleza',     prof:'Carpinteiro',      days:115, kills:310_000, n10:18, tr:TR_CRAFTER, ob:{military_base:true},                    cat:daysAgo(115), uat:daysAgo(3) },
    { pid:23, name:'JulianaZumbi',    char:'Juliana Carniceira',   prof:'Açougueiro',       days:87,  kills:290_000, n10:15, tr:TR_FIGHTER, ob:{},                                      cat:daysAgo(87),  uat:daysAgo(4) },
    { pid:24, name:'MarcosRaider',    char:'Marcos Pilhador',      prof:'Segurança',        days:93,  kills:330_000, n10:12, tr:TR_SNEAKY,  ob:{spiffo_relic:true},                     cat:daysAgo(93),  uat:daysAgo(4) },
    { pid:25, name:'FelipeMilitar',   char:'Felipe Coronel',       prof:'Soldado',          days:79,  kills:260_000, n10:15, tr:TR_FIGHTER, ob:{military_base:true},                    cat:daysAgo(79),  uat:daysAgo(4) },
    { pid:26, name:'CarolinaSombra',  char:'Carolina das Trevas',  prof:'Estudante',        days:71,  kills:210_000, n10:20, tr:TR_SNEAKY,  ob:{},                                      cat:daysAgo(71),  uat:daysAgo(5) },
    { pid:27, name:'OtavioSurvivor',  char:'Otávio Resiliente',    prof:'Mecânico',         days:84,  kills:280_000, n10:10, tr:TR_CRAFTER, ob:{},                                      cat:daysAgo(84),  uat:daysAgo(5) },
    { pid:28, name:'NathaliaBrave',   char:'Nathalia Valente',     prof:'Enfermeiro',       days:76,  kills:240_000, n10:12, tr:TR_BASE,    ob:{},                                      cat:daysAgo(76),  uat:daysAgo(6) },

    // ── NOVOS VIVOS — Tier A (29–43) ─────────────────────────────────────────
    { pid:29, name:'BrendaFloresta',  char:'Brenda da Mata',       prof:'Guarda Florestal', days:55,  kills:165_000, n10:10, tr:TR_CRAFTER, ob:{},                  cat:daysAgo(55),  uat:daysAgo(7) },
    { pid:30, name:'AlexMuldraugh',   char:'Alex de Muldraugh',    prof:'Bombeiro',         days:63,  kills:185_000, n10:8,  tr:TR_FIGHTER, ob:{military_base:true}, cat:daysAgo(63),  uat:daysAgo(7) },
    { pid:31, name:'SandraZumbeadora',char:'Sandra Exterminadora', prof:'Policial',         days:48,  kills:145_000, n10:8,  tr:TR_SNEAKY,  ob:{},                  cat:daysAgo(48),  uat:daysAgo(8) },
    { pid:32, name:'LeandroEsconderijo',char:'Leandro Sombrio',    prof:'Mecânico',         days:51,  kills:125_000, n10:10, tr:TR_CRAFTER, ob:{},                  cat:daysAgo(51),  uat:daysAgo(8) },
    { pid:33, name:'VitoriaKentucky', char:'Vitória da Fronteira', prof:'Veterinário',      days:44,  kills:155_000, n10:5,  tr:TR_BASE,    ob:{},                  cat:daysAgo(44),  uat:daysAgo(9) },
    { pid:34, name:'CaioExplorer',    char:'Caio o Explorador',    prof:'Biólogo',          days:47,  kills:135_000, n10:7,  tr:TR_CRAFTER, ob:{},                  cat:daysAgo(47),  uat:daysAgo(9) },
    { pid:35, name:'LarissaSurvivor', char:'Larissa Resistente',   prof:'Salva-vidas',      days:38,  kills:105_000, n10:10, tr:TR_BASE,    ob:{},                  cat:daysAgo(38),  uat:daysAgo(10) },
    { pid:36, name:'EdsonFighter',    char:'Edson Lutador',        prof:'Bombeiro',         days:52,  kills:165_000, n10:3,  tr:TR_FIGHTER, ob:{},                  cat:daysAgo(52),  uat:daysAgo(10) },
    { pid:37, name:'MonicaFortress',  char:'Mônica Fortress',      prof:'Carpinteiro',      days:42,  kills:115_000, n10:7,  tr:TR_CRAFTER, ob:{},                  cat:daysAgo(42),  uat:daysAgo(11) },
    { pid:38, name:'WagnerApocalipse',char:'Wagner do Fim',        prof:'Eletricista',      days:45,  kills:125_000, n10:5,  tr:TR_BASE,    ob:{},                  cat:daysAgo(45),  uat:daysAgo(11) },
    { pid:39, name:'PriscilaSombra',  char:'Priscila da Noite',    prof:'Professor',        days:33,  kills:82_000,  n10:10, tr:TR_SNEAKY,  ob:{},                  cat:daysAgo(33),  uat:daysAgo(12) },
    { pid:40, name:'HenriqueMilitar', char:'Henrique Coronel',     prof:'Soldado',          days:37,  kills:92_000,  n10:8,  tr:TR_FIGHTER, ob:{military_base:true}, cat:daysAgo(37),  uat:daysAgo(12) },
    { pid:41, name:'TainaraBrava',    char:'Tainara Valente',      prof:'Paramédica',       days:40,  kills:105_000, n10:5,  tr:TR_BASE,    ob:{},                  cat:daysAgo(40),  uat:daysAgo(13) },
    { pid:42, name:'MuriloKills',     char:'Murilo Matador',       prof:'Açougueiro',       days:49,  kills:145_000, n10:1,  tr:TR_FIGHTER, ob:{},                  cat:daysAgo(49),  uat:daysAgo(13) },
    { pid:43, name:'JessicaElite',    char:'Jéssica das Armas',    prof:'Policial',         days:29,  kills:72_000,  n10:10, tr:TR_SNEAKY,  ob:{},                  cat:daysAgo(29),  uat:daysAgo(14) },

    // ── NOVOS VIVOS — Tier B (44–58) ─────────────────────────────────────────
    { pid:44, name:'DaniloBeta',       char:'Danilo Beta',          prof:'Fazendeiro',      days:24,  kills:52_000,  n10:5,  tr:TR_CRAFTER, ob:{}, cat:daysAgo(24),  uat:daysAgo(15) },
    { pid:45, name:'AndresaZumbi',     char:'Andresa Zumbi',        prof:'Enfermeiro',      days:27,  kills:62_000,  n10:3,  tr:TR_BASE,    ob:{}, cat:daysAgo(27),  uat:daysAgo(15) },
    { pid:46, name:'TalilaFronteira',  char:'Tálila da Fronteira',  prof:'Segurança',       days:21,  kills:47_000,  n10:5,  tr:TR_SNEAKY,  ob:{}, cat:daysAgo(21),  uat:daysAgo(16) },
    { pid:47, name:'RicardoNovato',    char:'Ricardo Novato',       prof:'Bombeiro',        days:29,  kills:73_000,  n10:1,  tr:TR_FIGHTER, ob:{}, cat:daysAgo(29),  uat:daysAgo(16) },
    { pid:48, name:'FernandaNovata',   char:'Fernanda Nova',        prof:'Mecânico',        days:18,  kills:42_000,  n10:5,  tr:TR_BASE,    ob:{}, cat:daysAgo(18),  uat:daysAgo(17) },
    { pid:49, name:'GabrielNovato',    char:'Gabriel Novato',       prof:'Carpinteiro',     days:22,  kills:57_000,  n10:2,  tr:TR_CRAFTER, ob:{}, cat:daysAgo(22),  uat:daysAgo(17) },
    { pid:50, name:'LucasBeta',        char:'Lucas Beta',           prof:'Estudante',       days:15,  kills:37_000,  n10:5,  tr:TR_BASE,    ob:{}, cat:daysAgo(15),  uat:daysAgo(18) },
    { pid:51, name:'MariaNovata',      char:'Maria Nova',           prof:'Biólogo',         days:19,  kills:48_000,  n10:3,  tr:TR_CRAFTER, ob:{}, cat:daysAgo(19),  uat:daysAgo(18) },
    { pid:52, name:'CarlosNoob',       char:'Carlos Noob',          prof:'Estudante',       days:16,  kills:32_000,  n10:3,  tr:TR_BASE,    ob:{}, cat:daysAgo(16),  uat:daysAgo(19) },
    { pid:53, name:'EduardoExplorer',  char:'Eduardo Explorador',   prof:'Guarda Florestal',days:24,  kills:52_000,  n10:1,  tr:TR_CRAFTER, ob:{}, cat:daysAgo(24),  uat:daysAgo(19) },
    { pid:54, name:'VanessaFloresta',  char:'Vanessa da Floresta',  prof:'Veterinário',     days:12,  kills:27_000,  n10:5,  tr:TR_BASE,    ob:{}, cat:daysAgo(12),  uat:daysAgo(20) },
    { pid:55, name:'PedroFloresta',    char:'Pedro Floresta',       prof:'Lenhador',        days:10,  kills:22_000,  n10:5,  tr:TR_CRAFTER, ob:{}, cat:daysAgo(10),  uat:daysAgo(20) },
    { pid:56, name:'CristianeZumbi',   char:'Cristiane Zumbi',      prof:'Paramédica',      days:8,   kills:17_000,  n10:5,  tr:TR_BASE,    ob:{}, cat:daysAgo(8),   uat:daysAgo(21) },
    { pid:57, name:'EversonRaider',    char:'Everson Raider',       prof:'Segurança',       days:20,  kills:43_000,  n10:1,  tr:TR_FIGHTER, ob:{}, cat:daysAgo(20),  uat:daysAgo(21) },
    { pid:58, name:'FabioApocalipse',  char:'Fábio do Apocalipse',  prof:'Professor',       days:17,  kills:32_000,  n10:0,  tr:TR_BASE,    ob:{}, cat:daysAgo(17),  uat:daysAgo(22) },

    // ── NOVOS VIVOS — Tier C (59–68) ─────────────────────────────────────────
    { pid:59, name:'KamilaSurvivor',   char:'Kamila Resiliente',    prof:'Enfermeiro',      days:7,   kills:11_000,  n10:3,  tr:TR_BASE,    ob:{}, cat:daysAgo(7),   uat:daysAgo(22) },
    { pid:60, name:'JoaoFloresta',     char:'João da Floresta',     prof:'Fazendeiro',      days:6,   kills:8_500,   n10:3,  tr:TR_CRAFTER, ob:{}, cat:daysAgo(6),   uat:daysAgo(23) },
    { pid:61, name:'AnaLuz',           char:'Ana Luz',              prof:'Biólogo',         days:5,   kills:5_500,   n10:3,  tr:TR_BASE,    ob:{}, cat:daysAgo(5),   uat:daysAgo(23) },
    { pid:62, name:'BrunoNoob',        char:'Bruno Noob',           prof:'Estudante',       days:8,   kills:13_000,  n10:1,  tr:TR_BASE,    ob:{}, cat:daysAgo(8),   uat:daysAgo(24) },
    { pid:63, name:'TatianeNovata',    char:'Tatiane Novata',       prof:'Mecânico',        days:5,   kills:8_000,   n10:1,  tr:TR_BASE,    ob:{}, cat:daysAgo(5),   uat:daysAgo(24) },
    { pid:64, name:'SergioSurvivor',   char:'Sérgio Sobrevivente',  prof:'Carpinteiro',     days:4,   kills:6_000,   n10:1,  tr:TR_CRAFTER, ob:{}, cat:daysAgo(4),   uat:daysAgo(25) },
    { pid:65, name:'ClarissaFronteira',char:'Clarissa Fronteira',   prof:'Salva-vidas',     days:9,   kills:15_000,  n10:0,  tr:TR_BASE,    ob:{}, cat:daysAgo(9),   uat:daysAgo(25) },
    { pid:66, name:'MiltonZumbi',      char:'Milton Zumbi',         prof:'Segurança',       days:7,   kills:11_000,  n10:0,  tr:TR_BASE,    ob:{}, cat:daysAgo(7),   uat:daysAgo(26) },
    { pid:67, name:'PamelaExplorer',   char:'Pâmela Exploradora',   prof:'Biólogo',         days:3,   kills:4_200,   n10:1,  tr:TR_CRAFTER, ob:{}, cat:daysAgo(3),   uat:daysAgo(26) },
    { pid:68, name:'RobertoKentucky',  char:'Roberto de Kentucky',  prof:'Mecânico',        days:3,   kills:3_100,   n10:1,  tr:TR_BASE,    ob:{}, cat:daysAgo(3),   uat:daysAgo(27) },

    // ── NOVOS VIVOS — Tier D (69–70) ─────────────────────────────────────────
    { pid:69, name:'NovataApocalipse', char:'Novata',               prof:'Estudante',       days:1,   kills:820,     n10:0,  tr:TR_BASE,    ob:{}, cat:daysAgo(1),   uat:daysAgo(1) },
    { pid:70, name:'InicanteZumbi',    char:'Iniçante',             prof:'Estudante',       days:1,   kills:510,     n10:0,  tr:TR_BASE,    ob:{}, cat:daysAgo(1),   uat:daysAgo(1) },

    // ── MORTOS adicionais (71–75) ─────────────────────────────────────────────
    { pid:71, name:'GledsonMorto',  char:'Gledson o Morto',    prof:'Bombeiro',   days:63,  kills:205_000, n10:5,  tr:TR_FIGHTER, ob:{}, alive:0, cat:daysAgo(63),  uat:daysAgo(15) },
    { pid:72, name:'IngridDead',    char:'Ingrid Dead',         prof:'Paramédica', days:34,  kills:103_000, n10:3,  tr:TR_SNEAKY,  ob:{}, alive:0, cat:daysAgo(34),  uat:daysAgo(18) },
    { pid:73, name:'FrancisMorto',  char:'Francis Morto',       prof:'Policial',   days:88,  kills:305_000, n10:10, tr:TR_FIGHTER, ob:{}, alive:0, cat:daysAgo(88),  uat:daysAgo(10) },
    { pid:74, name:'MayraMorta',    char:'Mayra Morta',         prof:'Veterinário',days:18,  kills:52_000,  n10:0,  tr:TR_BASE,    ob:{}, alive:0, cat:daysAgo(18),  uat:daysAgo(20) },
    { pid:75, name:'RonaldoDead',   char:'Ronaldo Dead',        prof:'Salva-vidas',days:28,  kills:84_000,  n10:5,  tr:TR_FIGHTER, ob:{}, alive:0, cat:daysAgo(28),  uat:daysAgo(22) },
  ];

  for (const e of entries) {
    const alive  = e.alive  ?? 1;
    const sbok   = e.sbok   ?? 1;
    const objStr = obj(e.ob ?? {});
    const score  = esc(e);
    const dqat   = e.dqr ? daysAgo(5) : null;

    stmtE.run({
      pid: e.pid, mod: MOD_ID, name: e.name, char: e.char, prof: e.prof,
      days: e.days, time_raw: e.days * 1440, tstr: timeStr(e.days),
      kills: e.kills, sk: skills(e.n10), alive, sbok,
      tr: e.tr ?? TR_BASE, ob: objStr, score,
      dqr: e.dqr ?? null, dqat,
      ak: e.ak ?? null, fc: e.fc ?? null, ch: e.ch ?? null,
      ic: e.ic ?? null, hl: e.hl ?? null, hws: e.hws ?? null,
      cat: e.cat, uat: e.uat,
    });
  }
  console.log(`  ✓ entries (${entries.length} total: ${entries.filter(e => (e.alive ?? 1) === 1 && (e.sbok ?? 1) === 1).length} vivos no rank)`);

  // ── 4. MODS ──────────────────────────────────────────────────────────────────
  const mods = [
    { name:'PZ Rank Companion',           mod_id:'PZRankCompanion',  workshop_url:'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000001', status:'active',  is_required:1 },
    { name:'Anti-Cheat Sandbox Validator', mod_id:'PZRankValidator',  workshop_url:'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000002', status:'active',  is_required:1 },
    { name:'Simple Overhaul Retexture',    mod_id:'SimpleRetexture',  workshop_url:'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000003', status:'active',  is_required:0 },
    { name:'Soundtrack Extended',          mod_id:'SoundtrackExt',    workshop_url:'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000004', status:'active',  is_required:0 },
    { name:'Speed Hack Pro [BLOQUEADO]',   mod_id:'SpeedHackPro',     workshop_url:'https://steamcommunity.com/sharedfiles/filedetails/?id=3000000099', status:'blocked', is_required:0 },
  ];
  const stmtM = db.prepare(`INSERT OR IGNORE INTO mods (name, mod_id, workshop_url, status, is_required) VALUES (@name,@mod_id,@workshop_url,@status,@is_required)`);
  for (const m of mods) stmtM.run(m);
  console.log('  ✓ mods');

  // ── 5. DAILY NEWS ─────────────────────────────────────────────────────────────
  const headlines = [
    'Xandrão supera 780 mil kills e dispara na liderança do Brasileirão!',
    'Camila Bravura conquista Base Militar e sobe ao 2º lugar com grande score!',
    'Paulo Exterminador encosta no top 3 com 490 mil kills acumulados',
    'Diego Kentucky obtém base no Spiffo HQ — bônus de 5.000 pontos garantido',
    'Kaique domina todas as 35 habilidades no nível 10 — façanha histórica!',
    'Rodrigo amplia liderança após registrar 7ª sync consecutiva',
    'Comunidade bate recorde: 18 syncs em 24 horas durante o final de semana',
  ];
  const stmtN = db.prepare(`INSERT OR IGNORE INTO daily_news (date, headline, stats) VALUES (?,?,?)`);
  for (let i = 0; i < 7; i++) {
    stmtN.run(dateOnly(-i), headlines[i] ?? null, JSON.stringify({
      alive_count:  61, dead_count: 8, total_kills: 12_800_000,
      deaths_today: i === 2 ? 2 : i === 4 ? 1 : 0,
      syncs_today:  18 - i * 2,
      kills_today:  28_000 - i * 3_000,
    }));
  }
  console.log('  ✓ daily_news');

  // ── 6. SEASON FINANCES ───────────────────────────────────────────────────────
  const fin = [
    { season_id:2, category:'hosting',    label:'Vercel Pro (mensal)',         amount_brl:120.00, goal_brl:150.00 },
    { season_id:2, category:'domain',     label:'Registro pzrank.com.br',      amount_brl: 49.90, goal_brl: 49.90 },
    { season_id:2, category:'prize',      label:'Prêmio 1º Lugar',             amount_brl:  0.00, goal_brl:500.00 },
    { season_id:2, category:'prize',      label:'Prêmio 2º Lugar',             amount_brl:  0.00, goal_brl:250.00 },
    { season_id:2, category:'prize',      label:'Prêmio 3º Lugar',             amount_brl:  0.00, goal_brl:100.00 },
    { season_id:2, category:'supporters', label:'Apoiadores Temporada 2',      amount_brl:320.00, goal_brl:500.00 },
    { season_id:2, category:'adsense',    label:'Google AdSense',              amount_brl: 42.15, goal_brl:null   },
    { season_id:2, category:'sponsor',    label:'Patrocínio Comunidade PZ BR', amount_brl:200.00, goal_brl:null   },
    { season_id:1, category:'hosting',    label:'Vercel Pro (T1)',              amount_brl:360.00, goal_brl:360.00 },
    { season_id:1, category:'prize',      label:'Premiação T1 (distribuída)',   amount_brl:850.00, goal_brl:850.00 },
    { season_id:1, category:'supporters', label:'Apoiadores T1',               amount_brl:540.00, goal_brl:500.00 },
  ];
  const stmtF = db.prepare(`INSERT INTO season_finances (season_id,category,label,amount_brl,goal_brl) VALUES (@season_id,@category,@label,@amount_brl,@goal_brl)`);
  for (const f of fin) stmtF.run(f);
  console.log('  ✓ season_finances');

  // ── 7. HALL OF FAME (T1) ─────────────────────────────────────────────────────
  const hof = [
    { season_id:1, player_id:16, entry_name:'XandraoApocalipse', character_name:'Xandrao Campeão T1',  position:1, days:180, kills:720_000, score: sc(720_000, 32, { military_base:true }) },
    { season_id:1, player_id:8,  entry_name:'LucasMorto',        character_name:'Lucas Vice T1',       position:2, days:112, kills:500_000, score: sc(500_000, 5,  { military_base:true }) },
    { season_id:1, player_id:3,  entry_name:'FernandaSurvives',  character_name:'Fernanda Bronze T1',  position:3, days: 98, kills:320_000, score: sc(320_000, 5,  {}) },
  ];
  const stmtH = db.prepare(`INSERT INTO hall_of_fame (season_id,player_id,entry_name,character_name,position,days,kills,score) VALUES (@season_id,@player_id,@entry_name,@character_name,@position,@days,@kills,@score)`);
  for (const h of hof) stmtH.run(h);
  console.log('  ✓ hall_of_fame');

  // ── 8. HEATMAP EVENTS ────────────────────────────────────────────────────────
  const stmtHeat = db.prepare(`INSERT INTO heatmap_events (season_id,event_type,grid_x,grid_y,count) VALUES (?,?,?,?,?)`);
  const clusters = [
    { cx:30, cy:20, r:5, base:900 }, { cx:10, cy:40, r:4, base:450 },
    { cx:50, cy:60, r:3, base:280 }, { cx:70, cy:30, r:3, base:200 },
    { cx:45, cy:15, r:2, base:120 },
  ];
  for (const cl of clusters) {
    for (let dx = -cl.r; dx <= cl.r; dx++) {
      for (let dy = -cl.r; dy <= cl.r; dy++) {
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > cl.r) continue;
        stmtHeat.run(2, 'kill', cl.cx+dx, cl.cy+dy, Math.max(1, Math.round(cl.base*(1-dist/cl.r))));
      }
    }
  }
  for (const [x,y,c] of [[31,21,5],[11,41,3],[51,61,2],[26,16,2],[46,56,1]] as [number,number,number][]) stmtHeat.run(2,'death',x,y,c);
  for (const [x,y,c] of [[28,18,3],[12,42,2],[55,62,1],[72,28,1]] as [number,number,number][]) stmtHeat.run(2,'base',x,y,c);
  console.log('  ✓ heatmap_events');

  // ── 9. PLAYER ACHIEVEMENTS ───────────────────────────────────────────────────
  const achMap = Object.fromEntries(
    (db.prepare('SELECT id, slug FROM achievements').all() as { id:number; slug:string }[]).map(a => [a.slug, a.id])
  );
  const stmtA = db.prepare(`INSERT INTO player_achievements (player_id,achievement_id,entry_id) VALUES (?,?,?)`);
  const achs: [number, string][] = [
    [2,'first-blood'],[2,'zombie-slayer'],[2,'marathon'],[2,'veteran'],[2,'insomniac'],
    [3,'first-blood'],[3,'zombie-slayer'],[3,'marathon'],[3,'veteran'],[3,'master-angler'],
    [4,'first-blood'],[4,'zombie-slayer'],[4,'zombie-god'],[4,'no-sleep'],[4,'big-game'],
    [5,'first-blood'],[5,'zombie-slayer'],[5,'marathon'],[5,'agronomist'],
    [6,'first-blood'],[6,'zombie-slayer'],[6,'marathon'],
    [7,'first-blood'],
    [8,'first-blood'],[8,'zombie-slayer'],[8,'zombie-god'],[8,'marathon'],[8,'veteran'],[8,'legend'],
    [9,'first-blood'],[9,'zombie-slayer'],[9,'marathon'],
    [10,'first-blood'],
    [16,'first-blood'],[16,'zombie-slayer'],[16,'zombie-god'],[16,'marathon'],[16,'veteran'],[16,'legend'],[16,'no-sleep'],
    [17,'first-blood'],[17,'zombie-slayer'],[17,'zombie-god'],[17,'marathon'],[17,'veteran'],
    [18,'first-blood'],[18,'zombie-slayer'],[18,'zombie-god'],[18,'marathon'],
    [19,'first-blood'],[19,'zombie-slayer'],[19,'zombie-god'],[19,'marathon'],
    [20,'first-blood'],[20,'zombie-slayer'],[20,'marathon'],[20,'veteran'],
    [21,'first-blood'],[21,'zombie-slayer'],[21,'zombie-god'],
    [22,'first-blood'],[22,'zombie-slayer'],[22,'marathon'],
    [23,'first-blood'],[23,'zombie-slayer'],
    [24,'first-blood'],[24,'zombie-slayer'],
    [25,'first-blood'],[25,'zombie-slayer'],[25,'marathon'],
  ];
  for (const [pid, slug] of achs) {
    const id = achMap[slug];
    if (!id) continue;
    stmtA.run(pid, id, null);
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
  Jogadores ............ 74 (+TestPlayer existente = 75 total)
  Entries no rank ...... 61 vivos aprovados
  Entries mortos ....... 8
  Desclassificados ..... 2
  Mods ................. 5
  Daily news ........... 7 dias
  Finanças ............. 11 entradas (T1 + T2)
  Hall of Fame ......... 3 posições (T1)
  Heatmap events ....... kills/deaths/bases

  ── Acesso local ───────────────────────────────────────────────
  Moderador master:    login=admin     senha=admin123
  TestPlayer token:    bbbbbbbb-0000-4000-8000-000000000001
  RodrigoBR token:     cccccccc-0000-4000-8000-000000000002
  XandraoApocalipse:   cccccccc-0000-4000-8000-000000000016
  ───────────────────────────────────────────────────────────────
`);
} catch (err) {
  console.error('\n❌ Erro no seed:', err);
  process.exit(1);
} finally {
  db.close();
}
