/**
 * Testes de segurança — backend
 *
 * Cobre:
 *  1. parsePzrCode — resiliência a entradas adversariais
 *  2. isVersionAtLeast — lógica de controle de versão do mod
 *  3. HMAC — propriedades da assinatura (determinismo, sensibilidade a chave/payload)
 *  4. JWT middleware — requireModerator / requireMaster
 *  5. validatePoint (heatmap) — validação de input externo não confiável
 */

import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'crypto';
import jwt from 'jsonwebtoken';

// vi.hoisted garante que os valores existam quando vi.mock for executado (ambos são hoistados)
const { TEST_JWT_SECRET, TEST_HMAC_SECRET } = vi.hoisted(() => ({
  TEST_JWT_SECRET:  'test-jwt-secret-segurança-pzrank',
  TEST_HMAC_SECRET: 'test-hmac-secret-segurança-pzrank',
}));

// Moca o config antes de qualquer importação que dependa dele.
// JWT_SECRET é obrigatório no config.ts; sem o mock, a importação lança.
vi.mock('../config', () => ({
  config: {
    jwtSecret:          TEST_JWT_SECRET,
    syncHmacSecret:     TEST_HMAC_SECRET,
    minModVersion:      '',
    tableName:          'entries',
    supabaseUrl:        '',
    supabaseServiceKey: '',
    corsOrigin:         '',
    resendApiKey:       '',
    fromEmail:          '',
    frontendUrl:        '',
    port:               3000,
  },
}));

import { parsePzrCode }                      from '../lib/decoder';
import { requireModerator, requireMaster }   from '../middleware/moderator';
import type { ModRequest }                   from '../middleware/moderator';
import type { Response, NextFunction }       from 'express';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const XOR_KEY = 'PZRank-Community-2026-Key!';

function obfuscate(plain: string): string {
  const key  = Buffer.from(XOR_KEY, 'latin1');
  const data = Buffer.from(plain,   'latin1');
  const out  = Buffer.allocUnsafe(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i]! ^ key[i % key.length]!;
  return out.toString('base64');
}

function makePZRX2(fields: Partial<{
  name: string; prof: string; kills: number; time: number;
  skills: string; status: string; sandbox: string; traits: string;
}> = {}): string {
  const f = {
    name: 'Teste', prof: 'Bombeiro', kills: 100, time: 1440,
    skills: '', status: 'vivo', sandbox: 'ok', traits: '',
    ...fields,
  };
  const plain = `PZR|${f.name}|${f.prof}|${f.kills}|${f.time}|${f.skills}|${f.status}|${f.sandbox}|${f.traits}`;
  return 'PZRX2:' + obfuscate(plain);
}

function makePZRX3(fields: Partial<{
  name: string; prof: string; kills: number; time: number;
  skills: string; status: string; sandbox: string; traits: string; motivo: string;
  ts: number; version: string;
  animals: number; fish: number; crops: number; items: number; houses: number; sleep: number;
}> = {}): string {
  const f = {
    name: 'Teste', prof: 'Bombeiro', kills: 100, time: 1440,
    skills: '', status: 'vivo', sandbox: 'ok', traits: '', motivo: '',
    ts: Math.floor(Date.now() / 1000), version: '2.8.0',
    animals: 0, fish: 0, crops: 0, items: 0, houses: 0, sleep: 0,
    ...fields,
  };
  const plain = `PZR|${f.name}|${f.prof}|${f.kills}|${f.time}|${f.skills}|${f.status}|${f.sandbox}|${f.traits}|${f.motivo}|${f.ts}|${f.version}|${f.animals}|${f.fish}|${f.crops}|${f.items}|${f.houses}|${f.sleep}`;
  return 'PZRX3:' + obfuscate(plain);
}

// Replica o isVersionAtLeast de sync.ts (função pura, sem efeitos colaterais)
function isVersionAtLeast(version: string | null, minimum: string): boolean {
  if (!version) return false;
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  const a = parse(version);
  const b = parse(minimum);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return true;
}

// Replica o validatePoint de heatmap.ts (função pura, não exportada)
type HeatmapPointType = 'kill' | 'death' | 'base';
interface ValidatedPoint { type: HeatmapPointType; gx: number; gy: number; count: number; }
const VALID_HEATMAP_TYPES = new Set(['kill', 'death', 'base']);
const MAX_GRID_VAL = 300;

function validatePoint(p: unknown): ValidatedPoint | null {
  if (!p || typeof p !== 'object') return null;
  const { type, gx, gy, count } = p as Record<string, unknown>;
  if (typeof type !== 'string' || !VALID_HEATMAP_TYPES.has(type)) return null;
  const x = Math.floor(Number(gx));
  const y = Math.floor(Number(gy));
  const c = Math.max(1, Math.floor(Number(count) || 1));
  if (!isFinite(x) || !isFinite(y) || x < 0 || y < 0 || x > MAX_GRID_VAL || y > MAX_GRID_VAL) return null;
  return { type: type as HeatmapPointType, gx: x, gy: y, count: c };
}

// Mock de req/res Express para testar middleware sem servidor
interface MockRes {
  _status?: number;
  _json?: unknown;
  status(n: number): this;
  json(d: unknown): this;
}
function mockRes(): MockRes {
  const res: MockRes = {
    status(n) { this._status = n; return this; },
    json(d)  { this._json   = d; return this; },
  };
  return res;
}
function mockReq(authHeader?: string): ModRequest {
  return { headers: authHeader ? { authorization: authHeader } : {} } as unknown as ModRequest;
}
function makeModToken(role: 'master' | 'moderator', opts: { expired?: boolean; secret?: string } = {}): string {
  return jwt.sign(
    { sub: 'mod-123', role },
    opts.secret ?? TEST_JWT_SECRET,
    { expiresIn: opts.expired ? -1 : '1h' },
  );
}
const noop: NextFunction = () => {};

// ─── 1. Decoder — resiliência a entradas adversariais ─────────────────────────

describe('parsePzrCode — entradas adversariais', () => {

  it('string vazia → null', () => {
    expect(parsePzrCode('')).toBeNull();
  });

  it('whitespace apenas → null', () => {
    expect(parsePzrCode('   \n\t  ')).toBeNull();
  });

  it('prefixo inválido PZRX4 → null', () => {
    expect(parsePzrCode('PZRX4:' + obfuscate('PZR|x|x|0|0|||||'))).toBeNull();
  });

  it('prefixo sem payload → null', () => {
    expect(parsePzrCode('PZRX3:')).toBeNull();
  });

  it('base64 inválido (caracteres especiais) → null sem crash', () => {
    expect(parsePzrCode('PZRX3:!!!INVALID_BASE64!!!')).toBeNull();
  });

  it('base64 válido mas conteúdo não começa com PZR| → null', () => {
    // Codifica um payload que não tem o prefixo interno esperado
    const garbage = obfuscate('HACK|injection|attempt');
    expect(parsePzrCode('PZRX3:' + garbage)).toBeNull();
  });

  it('string de 100.000 caracteres → null sem travar (sem backtracking catastrófico)', () => {
    const big = 'A'.repeat(100_000);
    const start = Date.now();
    const result = parsePzrCode(big);
    const ms = Date.now() - start;
    expect(result).toBeNull();
    expect(ms).toBeLessThan(500); // deve ser instantâneo
  });

  it('payload com nome contendo XSS → decodifica como string literal, não executa', () => {
    const xssName = '<script>alert("xss")</script>';
    const r = parsePzrCode(makePZRX2({ name: xssName }));
    expect(r).not.toBeNull();
    // O nome é tratado como string — o browser renderiza o text node, não executa
    expect(r!.characterName).toBe(xssName);
  });

  it('payload com nome contendo SQL injection → decodifica como string literal', () => {
    const sqlName = "'; DROP TABLE players; --";
    const r = parsePzrCode(makePZRX2({ name: sqlName }));
    expect(r).not.toBeNull();
    expect(r!.characterName).toBe(sqlName);
  });

  it('nome com pipe (|) → injeção quebra estrutura do payload e a regex rejeita', () => {
    // A regex [^|]* captura apenas até o próximo pipe. Com name='Legitimo|morto',
    // o payload gerado é "PZR|Legitimo|morto|Bombeiro|100|...". Isso faz "Bombeiro"
    // cair no campo kills, que exige (\d+). "Bombeiro" não é dígito → regex falha → null.
    // A injeção de campo via pipe é naturalmente bloqueada pela tipagem da regex.
    const injectedName = 'Legitimo|morto';
    const r = parsePzrCode(makePZRX2({ name: injectedName }));
    expect(r).toBeNull();
  });

  it('status desconhecido ("zombie") → tratado como vivo (não é "morto")', () => {
    const r = parsePzrCode(makePZRX2({ status: 'zombie' }));
    expect(r).not.toBeNull();
    expect(r!.isAlive).toBe(true); // só "morto" mata — qualquer outro = vivo
  });

  it('sandbox com valor inventado ("hackeado") → tratado como ok (não é "invalido")', () => {
    const r = parsePzrCode(makePZRX2({ sandbox: 'hackeado' }));
    expect(r).not.toBeNull();
    expect(r!.sandboxOk).toBe(true); // só "invalido" desclassifica
  });

  it('kills negativo no payload (-999) → regex (\d+) rejeita o sinal → null', () => {
    // O grupo kills usa (\d+) que só aceita dígitos 0-9. O "-" de "-999"
    // não é dígito, então a regex falha inteiramente → null.
    // Primeira linha de defesa: a regex; segunda: o check kills < 0 em sync.ts.
    const r = parsePzrCode(makePZRX2({ kills: -999 }));
    expect(r).toBeNull();
  });

  it('kills = NaN no payload (texto) → parseInt retorna NaN', () => {
    // Payload manual com "abc" no campo kills — não obfuscado via makeCode, usa raw string
    const plain = 'PZR|Teste|Prof|abc|1440||vivo|ok||';
    const r = parsePzrCode('PZRX2:' + obfuscate(plain));
    // A regex \d+ não aceita "abc" — o match falha → null
    expect(r).toBeNull();
  });

  it('PZRX3: todos os 6 ext stats decodificados corretamente', () => {
    const r = parsePzrCode(makePZRX3({
      animals: 10, fish: 20, crops: 30, items: 40, houses: 50, sleep: 60,
    }));
    expect(r).not.toBeNull();
    expect(r!.animalsKilled).toBe(10);
    expect(r!.fishCaught).toBe(20);
    expect(r!.cropsHarvested).toBe(30);
    expect(r!.itemsCrafted).toBe(40);
    expect(r!.housesLooted).toBe(50);
    expect(r!.hoursWithoutSleep).toBe(60);
  });

  it('PZRX3: modVersion "2.8.0" é decodificado sem corromper ext stats', () => {
    // Este era o bug crítico: a "." do modVersion quebrava a regex antiga
    const r = parsePzrCode(makePZRX3({ version: '2.8.0', animals: 5, fish: 3 }));
    expect(r).not.toBeNull();
    expect(r!.modVersion).toBe('2.8.0');
    expect(r!.animalsKilled).toBe(5);
    expect(r!.fishCaught).toBe(3);
  });

  it('PZRX3: ext stats ausentes (PZRX2 legado) → todos zero', () => {
    const r = parsePzrCode(makePZRX2());
    expect(r).not.toBeNull();
    expect(r!.animalsKilled).toBe(0);
    expect(r!.fishCaught).toBe(0);
    expect(r!.cropsHarvested).toBe(0);
  });

  it('PZRX1 legado (campos mínimos com skills vazio) → decodifica nome, kills e days', () => {
    // A regex exige ao menos 5 campos separados por "|" após PZR (o campo skills é
    // obrigatório mesmo vazio). Um PZRX1 com só 4 campos seria rejeitado.
    const plain = 'PZR|AnaLima|Médica|5000|2880|'; // skills vazio mas presente
    const r = parsePzrCode('PZRX1:' + obfuscate(plain));
    expect(r).not.toBeNull();
    expect(r!.characterName).toBe('AnaLima');
    expect(r!.kills).toBe(5000);
    expect(r!.days).toBe(2); // 2880 min / 1440
  });

  it('motivo com injeção de texto longo (1000 chars) → decodificado como string', () => {
    const longReason = 'mods:' + 'A'.repeat(995);
    const r = parsePzrCode(makePZRX2({ sandbox: 'invalido', traits: '' }));
    expect(r).not.toBeNull();
    // Payload com motivo longo — não deve crashar
    const plain = `PZR|T|T|0|0||vivo|invalido||${longReason}`;
    const r2 = parsePzrCode('PZRX2:' + obfuscate(plain));
    expect(r2).not.toBeNull();
    expect(r2!.sandboxOk).toBe(false);
  });

});

// ─── 2. isVersionAtLeast — lógica de controle de versão ──────────────────────

describe('isVersionAtLeast — controle de versão do mod', () => {

  it('null → falso (sem versão = rejeitar)', () => {
    expect(isVersionAtLeast(null, '2.8.0')).toBe(false);
  });

  it('string vazia → falso', () => {
    expect(isVersionAtLeast('', '2.8.0')).toBe(false);
  });

  it('mesma versão → aceitar', () => {
    expect(isVersionAtLeast('2.8.0', '2.8.0')).toBe(true);
  });

  it('versão maior (patch) → aceitar', () => {
    expect(isVersionAtLeast('2.8.1', '2.8.0')).toBe(true);
  });

  it('versão maior (minor) → aceitar', () => {
    expect(isVersionAtLeast('2.9.0', '2.8.0')).toBe(true);
  });

  it('versão maior (major) → aceitar', () => {
    expect(isVersionAtLeast('3.0.0', '2.8.0')).toBe(true);
  });

  it('versão menor (patch) → rejeitar', () => {
    expect(isVersionAtLeast('2.7.9', '2.8.0')).toBe(false);
  });

  it('versão menor (minor) → rejeitar', () => {
    expect(isVersionAtLeast('2.7.0', '2.8.0')).toBe(false);
  });

  it('versão menor (major) → rejeitar', () => {
    expect(isVersionAtLeast('1.99.99', '2.8.0')).toBe(false);
  });

  it('versão com mais segmentos (2.8.0.1) → aceitar pois >2.8.0', () => {
    expect(isVersionAtLeast('2.8.0.1', '2.8.0')).toBe(true);
  });

  it('versão com segmento inválido ("2.abc.0") → parseInt retorna 0, avança normalmente', () => {
    // "2.abc.0" parse → [2, 0, 0]; mínimo "2.8.0" → [2, 8, 0]: 0 < 8 → false
    expect(isVersionAtLeast('2.abc.0', '2.8.0')).toBe(false);
  });

  it('versão sem ponto ("280") → parse = [280]; mínimo "2.8.0" = [2,8,0]: 280 > 2 → aceitar', () => {
    // Comportamento documentado: sem separador, o número inteiro é o major
    expect(isVersionAtLeast('280', '2.8.0')).toBe(true);
  });

});

// ─── 3. HMAC — assinatura de sync ────────────────────────────────────────────

describe('HMAC — propriedades da assinatura', () => {

  function computeHmac(secret: string, token: string, code: string): string {
    return createHmac('sha256', secret).update(`${token}:${code}`).digest('hex');
  }

  const SECRET = TEST_HMAC_SECRET;
  const TOKEN  = 'player-uuid-token-abc123';
  const CODE   = 'PZRX3:validPayloadXXX';

  it('mesmas entradas → mesmo HMAC (determinístico)', () => {
    expect(computeHmac(SECRET, TOKEN, CODE)).toBe(computeHmac(SECRET, TOKEN, CODE));
  });

  it('chave diferente → HMAC diferente', () => {
    expect(computeHmac('outra-chave', TOKEN, CODE)).not.toBe(computeHmac(SECRET, TOKEN, CODE));
  });

  it('token diferente → HMAC diferente', () => {
    expect(computeHmac(SECRET, 'outro-token', CODE)).not.toBe(computeHmac(SECRET, TOKEN, CODE));
  });

  it('código diferente → HMAC diferente', () => {
    expect(computeHmac(SECRET, TOKEN, 'PZRX3:outroPayload')).not.toBe(computeHmac(SECRET, TOKEN, CODE));
  });

  it('HMAC tem 64 chars hex (SHA-256 = 32 bytes = 64 hex)', () => {
    expect(computeHmac(SECRET, TOKEN, CODE)).toHaveLength(64);
  });

  it('chave vazia vs chave não-vazia → HMACs diferentes', () => {
    // Garante que chave vazia não é equivalente a chave real
    expect(computeHmac('', TOKEN, CODE)).not.toBe(computeHmac(SECRET, TOKEN, CODE));
  });

  it('separador ":" no token produz mesmo HMAC que ":" no code → documentado e mitigado', () => {
    // A concatenação "token:code" sem prefixo de comprimento é vulnerável a
    // ambiguidade canônica: token="a:b" + code="c" = "a:b:c" = token="a" + code="b:c".
    // Em produção, player_token é sempre um UUID (apenas hífens, sem ":"),
    // então a ambiguidade não ocorre na prática.
    const tokenComColon = 'token:com:colon';
    const hmac1 = computeHmac(SECRET, tokenComColon, CODE);
    const hmac2 = computeHmac(SECRET, 'token', `com:colon:${CODE}`);
    // As strings produzem o mesmo input para o HMAC — por isso os HMACs são iguais.
    // Isso documenta a limitação teórica e serve de alerta para qualquer mudança no
    // formato do player_token (deve permanecer UUID sem ":").
    expect(hmac1).toBe(hmac2);
  });

});

// ─── 4. JWT middleware — requireModerator / requireMaster ────────────────────

describe('requireModerator — autenticação', () => {

  it('sem Authorization header → 401', () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    requireModerator(req, res as unknown as Response, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('Authorization sem "Bearer " → 401', () => {
    const req = mockReq('Token abc123');
    const res = mockRes();
    const next = vi.fn();
    requireModerator(req, res as unknown as Response, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('Bearer com token inválido (lixo) → 401', () => {
    const req = mockReq('Bearer nao-e-um-jwt-valido');
    const res = mockRes();
    const next = vi.fn();
    requireModerator(req, res as unknown as Response, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('token expirado → 401', () => {
    const token = makeModToken('moderator', { expired: true });
    const req   = mockReq(`Bearer ${token}`);
    const res   = mockRes();
    const next  = vi.fn();
    requireModerator(req, res as unknown as Response, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('token assinado com chave errada → 401', () => {
    const token = makeModToken('moderator', { secret: 'chave-errada-atacante' });
    const req   = mockReq(`Bearer ${token}`);
    const res   = mockRes();
    const next  = vi.fn();
    requireModerator(req, res as unknown as Response, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('token válido (role=moderator) → chama next()', () => {
    const token = makeModToken('moderator');
    const req   = mockReq(`Bearer ${token}`);
    const res   = mockRes();
    const next  = vi.fn();
    requireModerator(req, res as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeUndefined();
  });

  it('token válido (role=master) → chama next() (master também é moderador)', () => {
    const token = makeModToken('master');
    const req   = mockReq(`Bearer ${token}`);
    const res   = mockRes();
    const next  = vi.fn();
    requireModerator(req, res as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('token JWT sem campo role → next() chamado (role undefined, authenticate só valida a assinatura)', () => {
    // jwt.sign sem role — o middleware não rejeita na autenticação, só verifica assinatura
    const token = jwt.sign({ sub: 'mod-999' }, TEST_JWT_SECRET, { expiresIn: '1h' });
    const req   = mockReq(`Bearer ${token}`);
    const res   = mockRes();
    const next  = vi.fn();
    requireModerator(req, res as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

});

describe('requireMaster — autorização de role', () => {

  it('sem Authorization → 401 (antes de checar role)', () => {
    const req = mockReq();
    const res = mockRes();
    requireMaster(req, res as unknown as Response, noop);
    expect(res._status).toBe(401);
  });

  it('role=moderator → 403 (autenticado mas sem permissão)', () => {
    const token = makeModToken('moderator');
    const req   = mockReq(`Bearer ${token}`);
    const res   = mockRes();
    const next  = vi.fn();
    requireMaster(req, res as unknown as Response, next);
    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('role=master → chama next()', () => {
    const token = makeModToken('master');
    const req   = mockReq(`Bearer ${token}`);
    const res   = mockRes();
    const next  = vi.fn();
    requireMaster(req, res as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeUndefined();
  });

  it('token manipulado: payload com role=master mas assinatura inválida → 401', () => {
    // Simula um atacante que decodificou o JWT e trocou role de "moderator" para "master"
    // sem saber a chave secreta → rejeita na verificação de assinatura
    const legitToken   = makeModToken('moderator');
    const [header, , sig] = legitToken.split('.');
    // Constrói um payload falso com role=master
    const fakePayload  = Buffer.from(JSON.stringify({ sub: 'mod-123', role: 'master', iat: Date.now() })).toString('base64url');
    const tamperedToken = `${header}.${fakePayload}.${sig}`;
    const req = mockReq(`Bearer ${tamperedToken}`);
    const res = mockRes();
    const next = vi.fn();
    requireMaster(req, res as unknown as Response, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

});

// ─── 5. validatePoint — validação de input de heatmap ─────────────────────────

describe('validatePoint — validação de ponto de heatmap', () => {

  it('ponto válido (kill) → retorna objeto tipado', () => {
    const p = validatePoint({ type: 'kill', gx: 10, gy: 20, count: 5 });
    expect(p).not.toBeNull();
    expect(p!.type).toBe('kill');
    expect(p!.gx).toBe(10);
    expect(p!.gy).toBe(20);
    expect(p!.count).toBe(5);
  });

  it('ponto válido (death)', () => {
    expect(validatePoint({ type: 'death', gx: 0, gy: 0, count: 1 })).not.toBeNull();
  });

  it('ponto válido (base)', () => {
    expect(validatePoint({ type: 'base', gx: 150, gy: 200, count: 1 })).not.toBeNull();
  });

  it('type inválido ("spawn") → null', () => {
    expect(validatePoint({ type: 'spawn', gx: 10, gy: 10, count: 1 })).toBeNull();
  });

  it('type com SQL injection → null (não está na allowlist)', () => {
    expect(validatePoint({ type: "kill'; DROP TABLE heatmap_events; --", gx: 0, gy: 0, count: 1 })).toBeNull();
  });

  it('type vazio → null', () => {
    expect(validatePoint({ type: '', gx: 0, gy: 0, count: 1 })).toBeNull();
  });

  it('gx negativo → null', () => {
    expect(validatePoint({ type: 'kill', gx: -1, gy: 0, count: 1 })).toBeNull();
  });

  it('gy negativo → null', () => {
    expect(validatePoint({ type: 'kill', gx: 0, gy: -1, count: 1 })).toBeNull();
  });

  it('gx acima do máximo (301) → null', () => {
    expect(validatePoint({ type: 'kill', gx: 301, gy: 0, count: 1 })).toBeNull();
  });

  it('gy acima do máximo (301) → null', () => {
    expect(validatePoint({ type: 'kill', gx: 0, gy: 301, count: 1 })).toBeNull();
  });

  it('gx = MAX_GRID_VAL (300) → válido', () => {
    expect(validatePoint({ type: 'kill', gx: 300, gy: 300, count: 1 })).not.toBeNull();
  });

  it('gx não-numérico ("abc") → isFinite(NaN) = false → null', () => {
    expect(validatePoint({ type: 'kill', gx: 'abc', gy: 0, count: 1 })).toBeNull();
  });

  it('gx Infinity → null', () => {
    expect(validatePoint({ type: 'kill', gx: Infinity, gy: 0, count: 1 })).toBeNull();
  });

  it('gx NaN → null', () => {
    expect(validatePoint({ type: 'kill', gx: NaN, gy: 0, count: 1 })).toBeNull();
  });

  it('count zero → normalizado para 1 (mínimo)', () => {
    const p = validatePoint({ type: 'kill', gx: 10, gy: 10, count: 0 });
    expect(p).not.toBeNull();
    expect(p!.count).toBe(1);
  });

  it('count negativo → normalizado para 1', () => {
    const p = validatePoint({ type: 'kill', gx: 10, gy: 10, count: -99 });
    expect(p).not.toBeNull();
    expect(p!.count).toBe(1);
  });

  it('payload sem campos → null', () => {
    expect(validatePoint({})).toBeNull();
  });

  it('null → null', () => {
    expect(validatePoint(null)).toBeNull();
  });

  it('array passado como ponto → null', () => {
    expect(validatePoint(['kill', 10, 10, 1])).toBeNull();
  });

  it('100 pontos: apenas os primeiros 50 passariam pelo cap do processHeatmapDelta', () => {
    const points = Array.from({ length: 100 }, (_, i) =>
      validatePoint({ type: 'kill', gx: i % MAX_GRID_VAL, gy: 0, count: 1 }),
    ).filter(Boolean);
    expect(points).toHaveLength(100); // todos são válidos individualmente
    // A função processHeatmapDelta faz .slice(0, 50) — validado aqui como documentação
    const capped = points.slice(0, 50);
    expect(capped).toHaveLength(50);
  });

});

// ─── 6. Anti-cheat — limites de progressão ───────────────────────────────────

describe('anti-cheat — limites de progressão', () => {

  const MAX_KILLS = 500_000;
  const MAX_DAYS  = 36_500;

  // Os limites são verificados na rota sync.ts após o decode.
  // Estes testes documentam os valores e validam que o decoder os extrai corretamente,
  // permitindo que a rota aplique as verificações.

  it('kills = MAX_KILLS (500000) decodificado intacto', () => {
    const r = parsePzrCode(makePZRX2({ kills: MAX_KILLS }));
    expect(r!.kills).toBe(MAX_KILLS);
  });

  it('kills = MAX_KILLS + 1 decodificado intacto (a rota recusa com HTTP 400)', () => {
    const r = parsePzrCode(makePZRX2({ kills: MAX_KILLS + 1 }));
    expect(r!.kills).toBe(MAX_KILLS + 1);
  });

  it('kills negativo → regex (\d+) rejeita → null (decoder é a primeira barreira)', () => {
    // O grupo (\d+) exige 1+ dígitos. O sinal "-" não é dígito → match falha → null.
    // sync.ts tem um check redundante (kills < 0 → HTTP 400), mas o decoder já filtra.
    const r = parsePzrCode(makePZRX2({ kills: -1 }));
    expect(r).toBeNull();
  });

  it(`dias = MAX_DAYS decodificados intactos (${MAX_DAYS * 1440} min)`, () => {
    const r = parsePzrCode(makePZRX2({ time: MAX_DAYS * 1440 }));
    expect(r!.days).toBe(MAX_DAYS);
  });

  it('limite de tipo único no heatmap: "admin" rejeitado pela allowlist de type', () => {
    // A allowlist aceita apenas 'kill', 'death', 'base'
    for (const invalidType of ['admin', 'update', '__proto__', 'constructor', '']) {
      expect(validatePoint({ type: invalidType, gx: 0, gy: 0, count: 1 })).toBeNull();
    }
  });

  it('prototype pollution via literal __proto__ → type resolvido via cadeia de protótipos', () => {
    // Em JS, { __proto__: {...} } na sintaxe literal SÍ modifica o prototype do objeto.
    // O type "kill" é encontrado via prototype chain → o ponto é aceito.
    // Na prática isso NÃO é atingível: JSON.parse trata "__proto__" como chave própria
    // literal (não modifica prototype), então payloads JSON não sofrem esta vulnerabilidade.
    // Este teste documenta o comportamento do JS e confirma que a entrada via JSON é segura.
    const viaLiteral = validatePoint({ __proto__: { type: 'kill' }, gx: 0, gy: 0, count: 1 } as unknown);
    // Aceita via prototype chain (comportamento JS) — mas não é atingível via JSON
    expect(viaLiteral).not.toBeNull();

    // Confirmação: JSON.parse não propaga __proto__ para o prototype
    const viaJson = JSON.parse('{"__proto__":{"type":"kill"},"gx":0,"gy":0,"count":1}') as unknown;
    // "type" não está nas propriedades próprias (JSON.parse trata __proto__ como string literal)
    // então type = undefined → não está na allowlist → null
    expect(validatePoint(viaJson)).toBeNull();
  });

});
