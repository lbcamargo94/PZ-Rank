/**
 * sqlite-adapter.ts — Adaptador SQLite que imita a interface do cliente Supabase.
 *
 * Cobre os padrões usados nas rotas:
 *   .from(table).select(cols?).eq().ilike().order().single()/.maybeSingle()
 *   .from(table).insert([row]).select().single()
 *   .from(table).update(data).eq().select(cols?).single()
 *   .from(table).delete().eq()
 *   await .from(table).select().order()   ← multi-row sem terminal
 *
 * Conversões automáticas:
 *   BOOLEAN → INTEGER 0/1 (players.blocked, entries.is_alive)
 *   JSONB   → TEXT serializado (entries.objectives)
 *   UUID    → gerado via crypto.randomUUID() (moderators.id, players.player_token)
 */

import BetterSqlite3, { type Database } from 'better-sqlite3';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

// ── Metadados por tabela ────────────────────────────────────────────────────

const BOOL_COLS: Record<string, string[]> = {
  players:      ['blocked', 'is_supporter'],
  entries:      ['is_alive', 'sandbox_ok'],
  mods:         ['is_required'],
  seasons:      ['is_active'],
};

const JSON_COLS: Record<string, string[]> = {
  entries:    ['objectives', 'sandbox_config'],
  daily_news: ['stats'],
};

// Colunas UUID geradas automaticamente na inserção quando ausentes
const UUID_DEFAULTS: Record<string, string[]> = {
  moderators: ['id'],
  players:    ['player_token'],
};

// Allowlist de tabelas e colunas válidas para evitar SQL injection
// via interpolação de nomes de tabela/coluna no adapter.
const ALLOWED_TABLES = new Set(['players', 'moderators', 'moderator_tokens', 'entries', 'mods', 'mod_dependencies', 'player_tokens', 'seasons', 'hall_of_fame', 'daily_news', 'season_finances', 'achievements', 'player_achievements', 'heatmap_events']);

const ALLOWED_COLS: Record<string, Set<string>> = {
  players:          new Set(['id','nick','email','password_hash','email_verified_at','twitch_url','youtube_url','kick_url','tiktok_url','status','blocked','is_supporter','supporter_until','player_token','created_at','deleted_at','gender','yt_channel_id','yt_sub_expires_at','yt_last_live_video_id']),
  moderators:       new Set(['id','login','email','email_verified_at','role','password_hash','created_at']),
  moderator_tokens: new Set(['id','email','token','type','expires_at','used_at','created_at']),
  entries:          new Set(['id','player_id','moderator_id','name','character_name','profession','days','time_raw','time_str','kills','skills','live_url','is_alive','sandbox_ok','traits','objectives','score','created_at','updated_at','sandbox_config','sandbox_config_updated_at','disqualified_at','disqualification_reason','flagged_reason','flagged_at','deleted_at','season_id','animals_killed','fish_caught','crops_harvested','items_crafted','houses_looted','hours_without_sleep','trees_cut','books_read','structures_built','crops_planted','spiffo_visited','eggs_collected','milk_produced','stone_structures','ceramic_items','forged_weapons','km_driven','cities_visited','military_visited','meals_cooked','water_collected','materials_crafted','animal_tracks','weapons_crafted','furniture_crafted','clothes_crafted','cheese_produced','doors_opened','sleep_locations','basements_explored','stations_used','animal_species','days_no_canned']),
  mods:             new Set(['id','name','mod_id','workshop_url','status','is_required','image_url','created_at','updated_at']),
  mod_dependencies: new Set(['mod_id','depends_on_id']),
  player_tokens:    new Set(['id','player_id','token','type','expires_at','used_at','created_at']),
  seasons:          new Set(['id','name','theme_slug','started_at','ended_at','is_active','created_at']),
  hall_of_fame:     new Set(['id','season_id','player_id','entry_name','character_name','position','days','kills','score','created_at']),
  daily_news:       new Set(['id','date','headline','stats','created_at']),
  season_finances:     new Set(['id','season_id','category','label','amount_brl','goal_brl','updated_at','created_at']),
  achievements:        new Set(['id','slug','name','description','icon','tier','stat','threshold']),
  player_achievements: new Set(['id','player_id','achievement_id','entry_id','unlocked_at']),
  heatmap_events:      new Set(['id','season_id','event_type','grid_x','grid_y','count']),
};

function assertTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) throw new Error(`Tabela não permitida: ${table}`);
}

function assertCol(table: string, col: string): void {
  const allowed = ALLOWED_COLS[table];
  if (!allowed || !allowed.has(col)) throw new Error(`Coluna não permitida: ${table}.${col}`);
}

// ── Conversores ─────────────────────────────────────────────────────────────

function fromDb(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const r = { ...row };
  for (const col of BOOL_COLS[table] ?? []) {
    if (col in r) r[col] = r[col] === 1 || r[col] === true;
  }
  for (const col of JSON_COLS[table] ?? []) {
    if (typeof r[col] === 'string') {
      try { r[col] = JSON.parse(r[col] as string); } catch { r[col] = null; }
    }
  }
  return r;
}

function toDb(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== undefined) r[k] = v;
  }
  for (const col of BOOL_COLS[table] ?? []) {
    if (col in r) r[col] = r[col] ? 1 : 0;
  }
  for (const col of JSON_COLS[table] ?? []) {
    if (col in r && r[col] !== null && typeof r[col] === 'object') {
      r[col] = JSON.stringify(r[col]);
    }
  }
  for (const col of UUID_DEFAULTS[table] ?? []) {
    if (!r[col]) r[col] = crypto.randomUUID();
  }
  return r;
}

// ── Query builder ────────────────────────────────────────────────────────────

type DbResult<T> = { data: T | null; count?: number | null; error: { message: string } | null };

class SqliteQueryBuilder {
  private readonly db:    Database;
  private readonly table: string;

  private selectCols = '*';
  private returnCols = '*';
  private hasReturn  = false;
  private countMode  = false;
  private conditions: { col: string; op: string; val: unknown }[] = [];
  private orderBy:    { col: string; asc: boolean }[] = [];
  private limitN:     number | null = null;
  private mode:       'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertRows: Record<string, unknown>[] = [];
  private updateData: Record<string, unknown>   = {};

  constructor(db: Database, table: string) {
    assertTable(table);
    this.db    = db;
    this.table = table;
  }

  select(cols?: string, opts?: { count?: string; head?: boolean }): this {
    if (this.mode === 'select') {
      this.selectCols = cols || '*';
      if (opts?.head) this.countMode = true;
    } else {
      this.returnCols = cols || '*';
      this.hasReturn  = true;
    }
    return this;
  }

  eq(col: string, val: unknown): this {
    const v = typeof val === 'boolean' ? (val ? 1 : 0) : val;
    this.conditions.push({ col, op: '=', val: v });
    return this;
  }

  ilike(col: string, val: unknown): this {
    this.conditions.push({ col, op: 'ILIKE', val });
    return this;
  }

  is(col: string, val: null | unknown): this {
    this.conditions.push({ col, op: val === null ? 'IS NULL' : 'IS NOT NULL', val: null });
    return this;
  }

  not(col: string, filter: string, val: unknown): this {
    if (filter === 'is' && val === null) {
      this.conditions.push({ col, op: 'IS NOT NULL', val: null });
    } else {
      this.conditions.push({ col, op: '!=', val });
    }
    return this;
  }

  neq(col: string, val: unknown): this {
    const v = typeof val === 'boolean' ? (val ? 1 : 0) : val;
    this.conditions.push({ col, op: '!=', val: v });
    return this;
  }

  gt(col: string, val: unknown): this {
    this.conditions.push({ col, op: '>', val });
    return this;
  }

  gte(col: string, val: unknown): this {
    this.conditions.push({ col, op: '>=', val });
    return this;
  }

  lt(col: string, val: unknown): this {
    this.conditions.push({ col, op: '<', val });
    return this;
  }

  lte(col: string, val: unknown): this {
    this.conditions.push({ col, op: '<=', val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    const safe = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col) ? col : 'created_at';
    this.orderBy.push({ col: safe, asc: opts?.ascending !== false });
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  insert(rows: Record<string, unknown>[]): this {
    this.mode       = 'insert';
    this.insertRows = rows;
    return this;
  }

  update(data: Record<string, unknown>): this {
    this.mode       = 'update';
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.mode = 'delete';
    return this;
  }

  // ── Execução ───────────────────────────────────────────────────────────────

  private where(): { sql: string; params: unknown[] } {
    if (this.conditions.length === 0) return { sql: '', params: [] };
    const parts:  string[]  = [];
    const params: unknown[] = [];
    for (const c of this.conditions) {
      assertCol(this.table, c.col);
      if (c.op === 'IS NULL' || c.op === 'IS NOT NULL') {
        parts.push(`${c.col} ${c.op}`);
      } else if (c.op === 'ILIKE') {
        parts.push(`LOWER(${c.col}) LIKE LOWER(?)`);
        params.push(c.val);
      } else {
        parts.push(`${c.col} ${c.op} ?`);
        params.push(c.val);
      }
    }
    return { sql: ' WHERE ' + parts.join(' AND '), params };
  }

  private execute(): DbResult<unknown[]> {
    try {
      const { sql: wSql, params: wP } = this.where();

      if (this.mode === 'select') {
        if (this.countMode) {
          const sql = `SELECT COUNT(*) AS c FROM ${this.table}${wSql}`;
          const row = this.db.prepare(sql).get(...wP) as { c: number };
          return { data: null, count: row?.c ?? 0, error: null };
        }
        let sql = `SELECT ${this.selectCols} FROM ${this.table}${wSql}`;
        if (this.orderBy.length > 0) {
          sql += ' ORDER BY ' + this.orderBy.map(o => `${o.col} ${o.asc ? 'ASC' : 'DESC'}`).join(', ');
        }
        if (this.limitN !== null) sql += ` LIMIT ${this.limitN}`;
        const rows = this.db.prepare(sql).all(...wP) as Record<string, unknown>[];
        return { data: rows.map(r => fromDb(this.table, r)), error: null };
      }

      if (this.mode === 'insert') {
        const out: unknown[] = [];
        for (const raw of this.insertRows) {
          const row  = toDb(this.table, raw);
          const cols = Object.keys(row);
          cols.forEach(c => assertCol(this.table, c));
          const ph   = cols.map(() => '?').join(', ');
          const vals = cols.map(c => row[c]);
          const sql  = `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${ph}) RETURNING *`;
          const result = this.db.prepare(sql).get(...vals) as Record<string, unknown>;
          out.push(result ? fromDb(this.table, result) : null);
        }
        return { data: out, error: null };
      }

      if (this.mode === 'update') {
        const row  = toDb(this.table, this.updateData);
        const cols = Object.keys(row);
        cols.forEach(c => assertCol(this.table, c));
        const set  = cols.map(c => `${c} = ?`).join(', ');
        const vals = [...cols.map(c => row[c]), ...wP];
        const ret  = this.hasReturn ? this.returnCols : '*';
        const sql  = `UPDATE ${this.table} SET ${set}${wSql} RETURNING ${ret}`;
        const result = this.db.prepare(sql).get(...vals) as Record<string, unknown>;
        return { data: result ? [fromDb(this.table, result)] : [], error: null };
      }

      if (this.mode === 'delete') {
        this.db.prepare(`DELETE FROM ${this.table}${wSql}`).run(...wP);
        return { data: [], error: null };
      }

      return { data: [], error: null };

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SQLite] ${this.mode.toUpperCase()} ${this.table}: ${message}`);
      return { data: null, error: { message } };
    }
  }

  // ── Terminais ──────────────────────────────────────────────────────────────

  async single(): Promise<DbResult<unknown>> {
    const { data, error } = this.execute();
    if (error) return { data: null, error };
    const rows = (data ?? []) as unknown[];
    if (rows.length === 0) return { data: null, error: { message: 'Nenhum registro encontrado.' } };
    return { data: rows[0], error: null };
  }

  async maybeSingle(): Promise<DbResult<unknown>> {
    const { data, error } = this.execute();
    if (error) return { data: null, error };
    const rows = (data ?? []) as unknown[];
    return { data: rows[0] ?? null, error: null };
  }

  // Torna o builder diretamente "awaitable" para resultados multi-linha
  then<R1 = DbResult<unknown[]>, R2 = never>(
    resolve: (v: DbResult<unknown[]>) => R1 | PromiseLike<R1>,
    reject?: (r: unknown) => R2 | PromiseLike<R2>,
  ): Promise<R1 | R2> {
    return Promise.resolve(this.execute()).then(resolve, reject);
  }
}

// ── Fábrica ──────────────────────────────────────────────────────────────────

function runMigrations(db: Database): void {
  const entryCols  = (db.prepare('PRAGMA table_info(entries)').all()    as { name: string }[]).map(c => c.name);
  const playerCols = (db.prepare('PRAGMA table_info(players)').all()    as { name: string }[]).map(c => c.name);
  const modsCols   = (db.prepare('PRAGMA table_info(mods)').all()       as { name: string }[]).map(c => c.name);
  const moderCols  = (db.prepare('PRAGMA table_info(moderators)').all() as { name: string }[]).map(c => c.name);

  if (!moderCols.includes('email')) {
    db.exec('ALTER TABLE moderators ADD COLUMN email TEXT UNIQUE');
    console.log('[SQLite] migração: coluna email adicionada em moderators');
  }
  if (!moderCols.includes('email_verified_at')) {
    db.exec('ALTER TABLE moderators ADD COLUMN email_verified_at TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna email_verified_at adicionada em moderators');
  }

  if (!modsCols.includes('image_url')) {
    db.exec('ALTER TABLE mods ADD COLUMN image_url TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna image_url adicionada em mods');
  }
  if (!modsCols.includes('created_at')) {
    db.exec("ALTER TABLE mods ADD COLUMN created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))");
    console.log('[SQLite] migração: coluna created_at adicionada em mods');
  }
  if (!modsCols.includes('updated_at')) {
    db.exec("ALTER TABLE mods ADD COLUMN updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))");
    console.log('[SQLite] migração: coluna updated_at adicionada em mods');
  }

  const hasUrlIndex = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_mods_workshop_url'").get();
  if (!hasUrlIndex) {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_mods_workshop_url ON mods(workshop_url)');
    console.log('[SQLite] migração: índice único idx_mods_workshop_url criado em mods');
  }

  const hasDepsTable = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mod_dependencies'").get());
  if (!hasDepsTable) {
    db.exec(`CREATE TABLE IF NOT EXISTS mod_dependencies (
      mod_id        INTEGER NOT NULL REFERENCES mods(id) ON DELETE CASCADE,
      depends_on_id INTEGER NOT NULL REFERENCES mods(id) ON DELETE CASCADE,
      PRIMARY KEY (mod_id, depends_on_id)
    )`);
    console.log('[SQLite] migração: tabela mod_dependencies criada');
  }

  if (!entryCols.includes('sandbox_ok')) {
    db.exec('ALTER TABLE entries ADD COLUMN sandbox_ok INTEGER NOT NULL DEFAULT 1');
    console.log('[SQLite] migração: coluna sandbox_ok adicionada');
  }
  if (!entryCols.includes('traits')) {
    db.exec('ALTER TABLE entries ADD COLUMN traits TEXT');
    console.log('[SQLite] migração: coluna traits adicionada');
  }
  if (!playerCols.includes('deleted_at')) {
    db.exec('ALTER TABLE players ADD COLUMN deleted_at TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna deleted_at adicionada');
  }
  if (!entryCols.includes('updated_at')) {
    // SQLite não aceita default dinâmico em ALTER TABLE — usa string constante
    db.exec("ALTER TABLE entries ADD COLUMN updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z'");
    console.log('[SQLite] migração: coluna updated_at adicionada');
  }
  if (!entryCols.includes('sandbox_config')) {
    db.exec('ALTER TABLE entries ADD COLUMN sandbox_config TEXT');
    console.log('[SQLite] migração: coluna sandbox_config adicionada');
  }
  if (!entryCols.includes('sandbox_config_updated_at')) {
    db.exec('ALTER TABLE entries ADD COLUMN sandbox_config_updated_at TEXT');
    console.log('[SQLite] migração: coluna sandbox_config_updated_at adicionada');
  }
  if (!entryCols.includes('disqualified_at')) {
    db.exec('ALTER TABLE entries ADD COLUMN disqualified_at TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna disqualified_at adicionada');
  }
  if (!entryCols.includes('disqualification_reason')) {
    db.exec('ALTER TABLE entries ADD COLUMN disqualification_reason TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna disqualification_reason adicionada');
  }
  if (!entryCols.includes('deleted_at')) {
    db.exec('ALTER TABLE entries ADD COLUMN deleted_at TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna deleted_at adicionada em entries');
  }

  if (!entryCols.includes('season_id')) {
    db.exec('ALTER TABLE entries ADD COLUMN season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL');
    console.log('[SQLite] migração: coluna season_id adicionada em entries');
  }

  if (!entryCols.includes('flagged_reason')) {
    db.exec('ALTER TABLE entries ADD COLUMN flagged_reason TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna flagged_reason adicionada em entries');
  }
  if (!entryCols.includes('flagged_at')) {
    db.exec('ALTER TABLE entries ADD COLUMN flagged_at TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna flagged_at adicionada em entries');
  }

  if (!playerCols.includes('gender')) {
    db.exec("ALTER TABLE players ADD COLUMN gender TEXT DEFAULT NULL CHECK (gender IN ('m', 'f'))");
    console.log('[SQLite] migração: coluna gender adicionada em players');
  }

  // PZRX3/PZRX4 extended stats
  const pzrx3Cols = ['animals_killed', 'fish_caught', 'crops_harvested', 'items_crafted', 'houses_looted', 'hours_without_sleep', 'trees_cut', 'books_read', 'structures_built', 'crops_planted'] as const;
  for (const col of pzrx3Cols) {
    if (!entryCols.includes(col)) {
      db.exec(`ALTER TABLE entries ADD COLUMN ${col} INTEGER DEFAULT NULL`);
      console.log(`[SQLite] migração: coluna ${col} adicionada em entries`);
    }
  }

  // PZRX7
  if (!entryCols.includes('weapons_crafted')) {
    db.exec('ALTER TABLE entries ADD COLUMN weapons_crafted INTEGER NOT NULL DEFAULT 0');
    console.log('[SQLite] migração: coluna weapons_crafted adicionada em entries');
  }

  // PZRX8
  const pzrx8Cols = ['furniture_crafted', 'clothes_crafted', 'cheese_produced', 'doors_opened', 'sleep_locations', 'basements_explored', 'stations_used', 'animal_species', 'days_no_canned'] as const;
  for (const col of pzrx8Cols) {
    if (!entryCols.includes(col)) {
      db.exec(`ALTER TABLE entries ADD COLUMN ${col} INTEGER NOT NULL DEFAULT 0`);
      console.log(`[SQLite] migração: coluna ${col} adicionada em entries`);
    }
  }

  const hasSeasons = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='seasons'").get();
  if (!hasSeasons) {
    db.exec(`CREATE TABLE seasons (
      id         INTEGER  PRIMARY KEY AUTOINCREMENT,
      name       TEXT     NOT NULL,
      theme_slug TEXT     DEFAULT NULL,
      started_at TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      ended_at   TEXT     DEFAULT NULL,
      is_active  INTEGER  NOT NULL DEFAULT 1,
      created_at TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    )`);
    console.log('[SQLite] migração: tabela seasons criada');
  } else {
    const seasonCols = (db.prepare('PRAGMA table_info(seasons)').all() as { name: string }[]).map(c => c.name);
    if (!seasonCols.includes('created_at')) {
      db.exec("ALTER TABLE seasons ADD COLUMN created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))");
      console.log('[SQLite] migração: coluna created_at adicionada em seasons');
    }
  }

  const hasHoF = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='hall_of_fame'").get();
  if (!hasHoF) {
    db.exec(`CREATE TABLE hall_of_fame (
      id             INTEGER  PRIMARY KEY AUTOINCREMENT,
      season_id      INTEGER  NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
      player_id      INTEGER  REFERENCES players(id) ON DELETE SET NULL,
      entry_name     TEXT     NOT NULL,
      character_name TEXT     DEFAULT NULL,
      position       INTEGER  NOT NULL,
      days           INTEGER  DEFAULT 0,
      kills          INTEGER  DEFAULT 0,
      score          INTEGER  DEFAULT 0,
      created_at     TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    )`);
    console.log('[SQLite] migração: tabela hall_of_fame criada');
  } else {
    const hofCols = (db.prepare('PRAGMA table_info(hall_of_fame)').all() as { name: string }[]).map(c => c.name);
    if (!hofCols.includes('created_at')) {
      db.exec("ALTER TABLE hall_of_fame ADD COLUMN created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))");
      console.log('[SQLite] migração: coluna created_at adicionada em hall_of_fame');
    }
  }

  const hasNews = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='daily_news'").get();
  if (!hasNews) {
    db.exec(`CREATE TABLE daily_news (
      id        INTEGER  PRIMARY KEY AUTOINCREMENT,
      date      TEXT     NOT NULL UNIQUE,
      headline  TEXT     DEFAULT NULL,
      stats     TEXT     DEFAULT NULL
    )`);
    console.log('[SQLite] migração: tabela daily_news criada');
  }

  if (!playerCols.includes('is_supporter')) {
    db.exec('ALTER TABLE players ADD COLUMN is_supporter INTEGER NOT NULL DEFAULT 0');
    console.log('[SQLite] migração: coluna is_supporter adicionada em players');
  }
  if (!playerCols.includes('supporter_until')) {
    db.exec('ALTER TABLE players ADD COLUMN supporter_until TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna supporter_until adicionada em players');
  }

  const hasFinances = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='season_finances'").get();
  if (!hasFinances) {
    db.exec(`CREATE TABLE season_finances (
      id          INTEGER  PRIMARY KEY AUTOINCREMENT,
      season_id   INTEGER  NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
      category    TEXT     NOT NULL CHECK(category IN ('hosting','prize','domain','adsense','supporters','sponsor','other')),
      label       TEXT     NOT NULL,
      amount_brl  REAL     NOT NULL DEFAULT 0,
      goal_brl    REAL     DEFAULT NULL,
      updated_at  TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    )`);
    console.log('[SQLite] migração: tabela season_finances criada');
  }

  if (!playerCols.includes('email')) {
    db.exec('ALTER TABLE players ADD COLUMN email TEXT');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email ON players(email) WHERE email IS NOT NULL');
    console.log('[SQLite] migração: coluna email adicionada em players');
  }
  if (!playerCols.includes('password_hash')) {
    db.exec('ALTER TABLE players ADD COLUMN password_hash TEXT');
    console.log('[SQLite] migração: coluna password_hash adicionada em players');
  }
  if (!playerCols.includes('email_verified_at')) {
    db.exec('ALTER TABLE players ADD COLUMN email_verified_at TEXT DEFAULT NULL');
    console.log('[SQLite] migração: coluna email_verified_at adicionada em players');
  }

  if (!modsCols.includes('mod_id')) {
    db.exec('ALTER TABLE mods ADD COLUMN mod_id TEXT DEFAULT NULL');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_mods_mod_id ON mods(mod_id) WHERE mod_id IS NOT NULL');
    console.log('[SQLite] migração: coluna mod_id adicionada em mods');
  }

  // player_tokens — cria a tabela se não existir; recria se 'activate' ou 'otp' faltarem no CHECK
  const ptSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='player_tokens'").get() as { sql?: string } | undefined)?.sql ?? '';
  if (!ptSql) {
    db.exec(`CREATE TABLE player_tokens (
      id          INTEGER  PRIMARY KEY AUTOINCREMENT,
      player_id   INTEGER  NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      token       TEXT     NOT NULL UNIQUE,
      type        TEXT     NOT NULL CHECK (type IN ('verify', 'reset', 'activate', 'otp')),
      expires_at  TEXT     NOT NULL,
      used_at     TEXT     DEFAULT NULL,
      created_at  TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    )`);
    console.log('[SQLite] migração: tabela player_tokens criada');
  } else if (!ptSql.includes("'activate'") || !ptSql.includes("'otp'")) {
    // Recria a tabela com todos os tipos (tokens são efêmeros, perda de dados aceitável)
    db.exec(`
      DROP TABLE player_tokens;
      CREATE TABLE player_tokens (
        id          INTEGER  PRIMARY KEY AUTOINCREMENT,
        player_id   INTEGER  NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        token       TEXT     NOT NULL UNIQUE,
        type        TEXT     NOT NULL CHECK (type IN ('verify', 'reset', 'activate', 'otp')),
        expires_at  TEXT     NOT NULL,
        used_at     TEXT     DEFAULT NULL,
        created_at  TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      );
    `);
    console.log('[SQLite] migração: player_tokens recriado com suporte aos tipos activate e otp');
  }

  // achievements — adiciona platinum/legendary ao tier CHECK se ausente
  const achSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='achievements'").get() as { sql?: string } | undefined)?.sql ?? '';
  if (achSql && !achSql.includes("'platinum'")) {
    // Preserva dados: renomeia, recria com novo constraint, copia, descarta backup
    db.exec(`
      PRAGMA foreign_keys = OFF;
      ALTER TABLE achievements RENAME TO achievements_bak;
      CREATE TABLE achievements (
        id          INTEGER  PRIMARY KEY AUTOINCREMENT,
        slug        TEXT     NOT NULL UNIQUE,
        name        TEXT     NOT NULL,
        description TEXT     NOT NULL DEFAULT '',
        icon        TEXT     NOT NULL DEFAULT '',
        tier        TEXT     NOT NULL DEFAULT 'bronze'
                    CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
        stat        TEXT     NOT NULL DEFAULT 'kills',
        threshold   INTEGER  NOT NULL DEFAULT 0
      );
      INSERT INTO achievements SELECT * FROM achievements_bak;
      DROP TABLE achievements_bak;
      PRAGMA foreign_keys = ON;
    `);
    // Corrige tiers existentes e insere novas conquistas (IDs preservados)
    db.exec(`
      UPDATE achievements SET tier = 'bronze', icon = '🍖' WHERE slug = 'hunter'    AND tier != 'bronze';
      UPDATE achievements SET tier = 'silver'               WHERE slug = 'big-game'  AND tier != 'silver';
      UPDATE achievements SET tier = 'silver'               WHERE slug = 'engineer'  AND tier != 'silver';
      UPDATE achievements SET tier = 'bronze'               WHERE slug = 'insomniac' AND tier != 'bronze';
      UPDATE achievements SET threshold = 500, description = '500 colheitas' WHERE slug = 'agronomist' AND threshold != 500;
    `);
    console.log('[SQLite] migração: achievements expandido para 5 raridades (platinum/legendary)');
  }
}

/**
 * Abre o local.db, aplica o schema e todas as migrations, e retorna a instância
 * raw do BetterSqlite3. Usado pelo seed script para inicializar o banco sem
 * precisar subir o servidor Express.
 */
export function openLocalDb(): Database {
  const dbPath     = path.join(process.cwd(), 'local.db');
  const schemaPath = path.join(__dirname, 'sqlite-schema.sql');
  const db = new BetterSqlite3(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(schemaPath, 'utf-8'));
  runMigrations(db);
  return db;
}

export function createSQLiteClient() {
  const dbPath     = path.join(process.cwd(), 'local.db');
  const schemaPath = path.join(__dirname, 'sqlite-schema.sql');

  const db = new BetterSqlite3(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(schemaPath, 'utf-8'));
  runMigrations(db);

  console.log(`[SQLite] Banco em: ${dbPath}`);

  return {
    from: (table: string) => new SqliteQueryBuilder(db, table),
  };
}
