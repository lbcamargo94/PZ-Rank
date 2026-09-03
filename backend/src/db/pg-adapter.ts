/**
 * pg-adapter.ts — Adaptador PostgreSQL que imita a interface do cliente Supabase.
 *
 * Cobre os mesmos padrões do sqlite-adapter:
 *   .from(table).select(cols?).eq().ilike().order().single()/.maybeSingle()
 *   .from(table).insert([row]).select().single()
 *   .from(table).update(data).eq().select(cols?).single()
 *   .from(table).delete().eq()
 *
 * PostgreSQL lida nativamente com BOOLEAN e JSONB — sem conversões manuais.
 * Parâmetros usam $1, $2... (estilo pg) em vez de ? (estilo SQLite).
 */

import { Pool } from 'pg';

// Reutiliza as mesmas allowlists do sqlite-adapter para evitar SQL injection
const ALLOWED_TABLES = new Set([
  'players', 'moderators', 'moderator_tokens', 'entries', 'mods',
  'mod_dependencies', 'player_tokens', 'seasons', 'hall_of_fame',
  'daily_news', 'season_finances', 'achievements', 'player_achievements',
  'heatmap_events', 'player_likes',
]);

const ALLOWED_COLS: Record<string, Set<string>> = {
  players:          new Set(['id','nick','email','password_hash','email_verified_at','twitch_url','youtube_url','kick_url','tiktok_url','status','blocked','is_supporter','supporter_until','is_test_mod','is_featured_streamer','is_moderator','player_token','created_at','deleted_at','gender','yt_channel_id','yt_sub_expires_at','yt_last_live_video_id','yt_live_confirmed_at','twitch_last_live_id']),
  moderators:       new Set(['id','login','email','email_verified_at','role','password_hash','created_at']),
  moderator_tokens: new Set(['id','email','token','type','expires_at','used_at','created_at']),
  entries:          new Set(['id','player_id','moderator_id','name','character_name','profession','days','time_raw','time_str','kills','skills','live_url','is_alive','sandbox_ok','traits','objectives','score','record_score','created_at','updated_at','sandbox_config','sandbox_config_updated_at','disqualified_at','disqualification_reason','disqualification_note','disqualified_by','flagged_reason','flagged_at','deleted_at','season_id','animals_killed','fish_caught','crops_harvested','items_crafted','houses_looted','hours_without_sleep','trees_cut','books_read','structures_built','crops_planted','spiffo_visited','eggs_collected','milk_produced','stone_structures','ceramic_items','forged_weapons','km_driven','cities_visited','military_visited','meals_cooked','water_collected','materials_crafted','animal_tracks','weapons_crafted','furniture_crafted','clothes_crafted','cheese_produced','doors_opened','sleep_locations','basements_explored','stations_used','animal_species','days_no_canned','pending_new_character','pending_new_character_since','no_live_streak']),
  mods:             new Set(['id','name','mod_id','workshop_url','status','is_required','image_url','created_at','updated_at']),
  mod_dependencies: new Set(['mod_id','depends_on_id']),
  player_tokens:    new Set(['id','player_id','token','type','expires_at','used_at','created_at']),
  seasons:          new Set(['id','name','theme_slug','started_at','ended_at','is_active','created_at']),
  hall_of_fame:     new Set(['id','season_id','player_id','entry_name','character_name','position','days','kills','score','created_at']),
  daily_news:       new Set(['id','date','headline','stats','created_at']),
  season_finances:     new Set(['id','season_id','category','label','amount_brl','goal_brl','updated_at','created_at']),
  achievements:        new Set(['id','slug','name','description','icon','tier','stat','threshold']),
  player_achievements: new Set(['id','player_id','achievement_id','entry_id','unlocked_at']),
  player_likes:        new Set(['id','liker_player_id','liked_player_id','created_at']),
  heatmap_events:      new Set(['id','season_id','event_type','grid_x','grid_y','count']),
};

function assertTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) throw new Error(`Tabela não permitida: ${table}`);
}

function assertCol(table: string, col: string): void {
  const allowed = ALLOWED_COLS[table];
  if (!allowed || !allowed.has(col)) throw new Error(`Coluna não permitida: ${table}.${col}`);
}

type DbResult<T> = { data: T | null; count?: number | null; error: { message: string } | null };

class PgQueryBuilder {
  private readonly pool:  Pool;
  private readonly table: string;

  private selectCols = '*';
  private returnCols = '*';
  private hasReturn  = false;
  private countMode  = false;
  private conditions: { col: string; op: string; val: unknown }[] = [];
  private orderBy:    { col: string; asc: boolean }[] = [];
  private limitN:     number | null = null;
  private mode:       'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private insertRows: Record<string, unknown>[] = [];
  private updateData: Record<string, unknown>   = {};
  private orFilter:       string | null = null;
  private upsertConflict: string | null = null;

  constructor(pool: Pool, table: string) {
    assertTable(table);
    this.pool  = pool;
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

  eq(col: string, val: unknown):    this { this.conditions.push({ col, op: '=',  val }); return this; }
  neq(col: string, val: unknown):   this { this.conditions.push({ col, op: '!=', val }); return this; }
  gt(col: string, val: unknown):    this { this.conditions.push({ col, op: '>',  val }); return this; }
  gte(col: string, val: unknown):   this { this.conditions.push({ col, op: '>=', val }); return this; }
  lt(col: string, val: unknown):    this { this.conditions.push({ col, op: '<',  val }); return this; }
  lte(col: string, val: unknown):   this { this.conditions.push({ col, op: '<=', val }); return this; }
  ilike(col: string, val: unknown): this { this.conditions.push({ col, op: 'ILIKE', val }); return this; }

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
    this.orderBy.push({ col: safe, asc: opts?.ascending !== false });
    return this;
  }

  limit(n: number): this { this.limitN = n; return this; }

  insert(rows: Record<string, unknown>[]):         this { this.mode = 'insert'; this.insertRows = rows; return this; }
  update(data: Record<string, unknown>):           this { this.mode = 'update'; this.updateData = data; return this; }
  delete():                                        this { this.mode = 'delete'; return this; }
  upsert(rows: Record<string, unknown>[], opts?: { onConflict?: string }): this {
    this.mode = 'upsert'; this.insertRows = rows; this.upsertConflict = opts?.onConflict ?? null; return this;
  }

  or(filter: string): this { this.orFilter = filter; return this; }

  private parseOrFilter(filter: string, offset: number): { sql: string; params: unknown[] } | null {
    const opMap: Record<string, string> = { eq: '=', gt: '>', lt: '<', gte: '>=', lte: '<=' };
    const groups: string[] = [];
    let depth = 0, start = 0;
    for (let i = 0; i < filter.length; i++) {
      if (filter[i] === '(') depth++;
      else if (filter[i] === ')') depth--;
      else if (filter[i] === ',' && depth === 0) { groups.push(filter.slice(start, i).trim()); start = i + 1; }
    }
    groups.push(filter.slice(start).trim());

    const groupSqls: string[] = [];
    const allParams: unknown[] = [];
    let idx = offset;

    for (const group of groups) {
      const andMatch = group.match(/^and\((.+)\)$/s);
      const items = andMatch ? andMatch[1].split(',') : [group];
      const conds: string[] = [];
      for (const item of items) {
        const fd = item.indexOf('.'), sd = item.indexOf('.', fd + 1);
        if (fd < 0 || sd < 0) return null;
        const col = item.slice(0, fd).trim(), op = item.slice(fd + 1, sd).trim(), val = item.slice(sd + 1).trim();
        try { assertCol(this.table, col); } catch { return null; }
        if (op === 'is') {
          conds.push(val === 'null' ? `${col} IS NULL` : `${col} IS NOT NULL`);
        } else {
          const sqlOp = opMap[op]; if (!sqlOp) return null;
          allParams.push(isNaN(Number(val)) ? val : Number(val));
          conds.push(`${col} ${sqlOp} $${++idx}`);
        }
      }
      groupSqls.push(conds.length === 1 ? conds[0] : `(${conds.join(' AND ')})`);
    }
    return { sql: groupSqls.join(' OR '), params: allParams };
  }

  private where(startIdx: number): { sql: string; params: unknown[] } {
    const parts: string[] = [], params: unknown[] = [];
    let idx = startIdx;
    for (const c of this.conditions) {
      assertCol(this.table, c.col);
      if (c.op === 'IS NULL' || c.op === 'IS NOT NULL') {
        parts.push(`${c.col} ${c.op}`);
      } else {
        parts.push(`${c.col} ${c.op} $${++idx}`);
        params.push(c.val);
      }
    }
    if (this.orFilter) {
      const parsed = this.parseOrFilter(this.orFilter, idx);
      if (parsed) { parts.push(`(${parsed.sql})`); params.push(...parsed.params); }
    }
    if (parts.length === 0) return { sql: '', params: [] };
    return { sql: ' WHERE ' + parts.join(' AND '), params };
  }

  private async execute(): Promise<DbResult<unknown[]>> {
    const client = await this.pool.connect();
    try {
      if (this.mode === 'select') {
        if (this.countMode) {
          const { sql: wSql, params: wP } = this.where(0);
          const res = await client.query(`SELECT COUNT(*) AS c FROM ${this.table}${wSql}`, wP);
          return { data: null, count: parseInt(res.rows[0].c, 10), error: null };
        }
        const { sql: wSql, params: wP } = this.where(0);
        let sql = `SELECT ${this.selectCols} FROM ${this.table}${wSql}`;
        if (this.orderBy.length > 0) sql += ' ORDER BY ' + this.orderBy.map(o => `${o.col} ${o.asc ? 'ASC' : 'DESC'}`).join(', ');
        if (this.limitN !== null) sql += ` LIMIT ${this.limitN}`;
        const res = await client.query(sql, wP);
        return { data: res.rows, error: null };
      }

      if (this.mode === 'insert') {
        const out: unknown[] = [];
        for (const raw of this.insertRows) {
          const row = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
          const cols = Object.keys(row);
          cols.forEach(c => assertCol(this.table, c));
          const ph   = cols.map((_, i) => `$${i + 1}`).join(', ');
          const vals = cols.map(c => row[c]);
          const res  = await client.query(`INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${ph}) RETURNING *`, vals);
          out.push(res.rows[0] ?? null);
        }
        return { data: out, error: null };
      }

      if (this.mode === 'upsert') {
        const conflictCols = (this.upsertConflict ?? '').split(',').map(c => c.trim()).filter(Boolean);
        for (const raw of this.insertRows) {
          const row  = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
          const hasPk = 'id' in row && row['id'] !== undefined && row['id'] !== null;
          const cols  = Object.keys(row).filter(c => c !== 'id' || hasPk);
          cols.forEach(c => assertCol(this.table, c));
          const ph       = cols.map((_, i) => `$${i + 1}`).join(', ');
          const vals     = cols.map(c => row[c]);
          const setCols  = cols.filter(c => !conflictCols.includes(c) && c !== 'id');
          const setClause = setCols.map(c => `${c} = EXCLUDED.${c}`).join(', ');
          const conflict  = conflictCols.length > 0 ? conflictCols.join(', ') : 'id';
          const sql = `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${ph})` +
            (setClause ? ` ON CONFLICT(${conflict}) DO UPDATE SET ${setClause}` : ` ON CONFLICT(${conflict}) DO NOTHING`);
          await client.query(sql, vals);
        }
        return { data: [], error: null };
      }

      if (this.mode === 'update') {
        const row  = Object.fromEntries(Object.entries(this.updateData).filter(([, v]) => v !== undefined));
        const cols = Object.keys(row);
        cols.forEach(c => assertCol(this.table, c));
        const set  = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
        const vals = cols.map(c => row[c]);
        const { sql: wSql, params: wP } = this.where(cols.length);
        const ret  = this.hasReturn ? this.returnCols : '*';
        const res  = await client.query(`UPDATE ${this.table} SET ${set}${wSql} RETURNING ${ret}`, [...vals, ...wP]);
        return { data: res.rows, error: null };
      }

      if (this.mode === 'delete') {
        const { sql: wSql, params: wP } = this.where(0);
        await client.query(`DELETE FROM ${this.table}${wSql}`, wP);
        return { data: [], error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[PG] ${this.mode.toUpperCase()} ${this.table}: ${message}`);
      return { data: null, error: { message } };
    } finally {
      client.release();
    }
  }

  async single(): Promise<DbResult<unknown>> {
    const { data, error } = await this.execute();
    if (error) return { data: null, error };
    const rows = (data ?? []) as unknown[];
    if (rows.length === 0) return { data: null, error: { message: 'Nenhum registro encontrado.' } };
    return { data: rows[0], error: null };
  }

  async maybeSingle(): Promise<DbResult<unknown>> {
    const { data, error } = await this.execute();
    if (error) return { data: null, error };
    const rows = (data ?? []) as unknown[];
    return { data: rows[0] ?? null, error: null };
  }

  then<R1 = DbResult<unknown[]>, R2 = never>(
    resolve: (v: DbResult<unknown[]>) => R1 | PromiseLike<R1>,
    reject?: (r: unknown) => R2 | PromiseLike<R2>,
  ): Promise<R1 | R2> {
    return this.execute().then(resolve, reject);
  }
}

export function createPgClient(connectionString: string) {
  const pool = new Pool({ connectionString, max: 10 });
  pool.on('error', (err) => console.error('[PG] pool error:', err.message));
  console.log('[PG] Pool conectado ao PostgreSQL local');
  return {
    from: (table: string) => new PgQueryBuilder(pool, table),
  };
}
