import type { DecodedCode } from '../types';
import { SKILL_NAMES } from './skills';

const XOR_KEY = 'PZRank-Community-2026-Key!';
// PZRX1 = formato antigo (6 campos, sem status); PZRX2 = atual (7 campos, com status)
const PZR_PREFIX_RE = /^PZRX[12]:([\s\S]+)$/;
// Grupo 5 = skills, grupo 6 = status (morto|vivo), grupo 7 = sandbox (ok|invalido) — opcional
const PZR_PAYLOAD_RE = /^PZR\|([^|]*)\|([^|]*)\|(\d+)\|(\d+)\|([^|]*)\|?([^|]*)\|?([^|]*)$/;

function xorBuffer(data: Buffer, key: string): Buffer {
  const keyBuf = Buffer.from(key, 'utf8');
  const out = Buffer.allocUnsafe(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i]! ^ keyBuf[i % keyBuf.length]!;
  }
  return out;
}

function deobfuscate(b64: string): string {
  const decoded = Buffer.from(b64.replace(/\s+/g, ''), 'base64');
  // Kahlua (PZ's Lua engine) exposes the low byte of each UTF-16 code point,
  // which matches Latin-1 for all characters in the Latin Extended range.
  return xorBuffer(decoded, XOR_KEY).toString('latin1');
}

function formatMinutesToYDHM(totalMinutes: number): string {
  const m = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const h = totalHours % 24;
  const totalDays = Math.floor(totalHours / 24);
  const y = Math.floor(totalDays / 365);
  const d = totalDays % 365;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y}a`);
  if (y > 0 || d > 0) parts.push(`${d}d`);
  parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export function parsePzrCode(raw: string): DecodedCode | null {
  const fileMatch = raw.trim().match(PZR_PREFIX_RE);
  if (!fileMatch) return null;

  let plain: string;
  try {
    plain = deobfuscate(fileMatch[1]!.trim());
  } catch {
    return null;
  }

  const match = plain.match(PZR_PAYLOAD_RE);
  if (!match) return null;

  const [, characterName, profession, kills, timeRaw, skillsRaw, statusRaw, sandboxRaw] = match;
  const timeRawNum = parseInt(timeRaw!, 10);

  // Traduz tokens de skill: mod v1.7+ exporta IDs em inglês ("Axe 6"), versões anteriores
  // exportavam nomes em PT-BR ("Machado 6"). SKILL_NAMES só tem chaves em inglês, então
  // nomes PT-BR passam inalterados (lookup retorna undefined → mantém original).
  const skills = skillsRaw
    ? skillsRaw.split(',').map(s => {
        const t = s.trim();
        if (!t) return '';
        const lastSpace = t.lastIndexOf(' ');
        if (lastSpace === -1) return SKILL_NAMES[t] ?? t;
        const id    = t.slice(0, lastSpace);
        const level = t.slice(lastSpace + 1);
        return `${SKILL_NAMES[id] ?? id} ${level}`;
      }).filter(Boolean)
    : [];

  return {
    characterName: characterName || 'Sobrevivente',
    profession: profession || 'Desconhecida',
    kills: parseInt(kills!, 10),
    timeRaw: timeRawNum,
    days: Math.floor(timeRawNum / 1440),
    timeStr: formatMinutesToYDHM(timeRawNum),
    skills,
    isAlive: statusRaw !== 'morto',
    sandboxOk: sandboxRaw !== 'invalido',  // ausente em códigos antigos → true (retrocompat)
  };
}
