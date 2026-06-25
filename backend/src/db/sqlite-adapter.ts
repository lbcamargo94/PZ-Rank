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
  players: ['blocked'],
  entries: ['is_alive', 'sandbox_ok'],
};

const JSON_COLS: Record<string, string[]> = {
  entries: ['objectives', 'sandbox_config'],
};

// Colunas UUID geradas automaticamente na inserção quando ausentes
const UUID_DEFAULTS: Record<string, string[]> = {
  moderators: ['id'],
  players:    ['player_token'],
};

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

type DbResult<T> = { data: T | null; error: { message: string } | null };

class SqliteQueryBuilder {
  private readonly db:    Database;
  private readonly table: string;

  private selectCols = '*';
  private returnCols = '*';
  private hasReturn  = false;
  private conditions: { col: string; op: string; val: unknown }[] = [];
  private orderBy:    { col: string; asc: boolean } | null = null;
  private mode:       'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertRows: Record<string, unknown>[] = [];
  private updateData: Record<string, unknown>   = {};

  constructor(db: Database, table: string) {
    this.db    = db;
    this.table = table;
  }

  select(cols?: string): this {
    if (this.mode === 'select') {
      this.selectCols = cols || '*';
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

  order(col: string, opts?: { ascending?: boolean }): this {
    const safe = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col) ? col : 'created_at';
    this.orderBy = { col: safe, asc: opts?.ascending !== false };
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
        let sql = `SELECT ${this.selectCols} FROM ${this.table}${wSql}`;
        if (this.orderBy) sql += ` ORDER BY ${this.orderBy.col} ${this.orderBy.asc ? 'ASC' : 'DESC'}`;
        const rows = this.db.prepare(sql).all(...wP) as Record<string, unknown>[];
        return { data: rows.map(r => fromDb(this.table, r)), error: null };
      }

      if (this.mode === 'insert') {
        const out: unknown[] = [];
        for (const raw of this.insertRows) {
          const row  = toDb(this.table, raw);
          const cols = Object.keys(row);
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
  const entryCols  = (db.prepare('PRAGMA table_info(entries)').all()  as { name: string }[]).map(c => c.name);
  const playerCols = (db.prepare('PRAGMA table_info(players)').all() as { name: string }[]).map(c => c.name);

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
