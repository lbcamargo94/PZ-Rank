import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Os dois adaptadores têm cada um a sua lista de colunas permitidas (ALLOWED_COLS). Os testes
// rodam com o SQLite, mas produção usa o PostgreSQL: uma coluna nova só no SQLite passa em
// todos os testes e derruba o sync em produção ("Coluna não permitida", v4.28.0 → v4.28.1).
function allowedCols(file: string): Record<string, string[]> {
  const src = readFileSync(join(__dirname, '..', 'db', file), 'utf8');
  const block = /const ALLOWED_COLS[^=]*=\s*\{([\s\S]*?)\n\};/.exec(src);
  if (!block) throw new Error(`ALLOWED_COLS não encontrado em ${file}`);
  const out: Record<string, string[]> = {};
  for (const m of block[1]!.matchAll(/^\s*(\w+):\s*new Set\(\[([^\]]*)\]\)/gm)) {
    out[m[1]!] = [...m[2]!.matchAll(/'([^']+)'/g)].map(x => x[1]!).sort();
  }
  return out;
}

describe('colunas permitidas nos adaptadores', () => {
  it('PostgreSQL (produção) e SQLite (testes) permitem exatamente as mesmas colunas', () => {
    const pg = allowedCols('pg-adapter.ts');
    const sqlite = allowedCols('sqlite-adapter.ts');
    expect(Object.keys(pg).length).toBeGreaterThan(5);
    expect(pg).toEqual(sqlite);
  });
});
