import type { DecodedCode } from '../types';

const XOR_KEY = 'PZRank-Community-2026-Key!';
// PZRX1 = formato antigo; PZRX2 = atual; PZRX3 = estendido (stats do mod v2.6+)
const PZR_PREFIX_RE = /^PZRX[123]:([\s\S]+)$/;
// Grupos 1-9: nome|prof|kills|tempo|skills|status|sandbox|traits|motivo (opcionais a partir do 6o)
// Grupos 10-15 (PZRX3): animals_killed|fish_caught|crops_harvested|items_crafted|houses_looted|hours_without_sleep
const PZR_PAYLOAD_RE = /^PZR\|([^|]*)\|([^|]*)\|(\d+)\|(\d+)\|([^|]*)\|?([^|]*)\|?([^|]*)\|?([^|]*)\|?([^|]*)\|?(\d*)\|?(\d*)\|?(\d*)\|?(\d*)\|?(\d*)\|?(\d*)$/;

function xorBytes(bytes: Uint8Array, key: string): Uint8Array {
  const keyBytes = new TextEncoder().encode(key);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function deobfuscate(b64: string): string {
  // Kahlua (PZ's Lua engine) exposes the low byte of each UTF-16 code point,
  // which matches Latin-1. String.fromCharCode handles this correctly.
  const bytes = xorBytes(base64ToBytes(b64), XOR_KEY);
  return Array.from(bytes, b => String.fromCharCode(b)).join('');
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
    plain = deobfuscate(fileMatch[1].trim());
  } catch {
    return null;
  }
  const match = plain.match(PZR_PAYLOAD_RE);
  if (!match) return null;
  const [, characterName, profession, kills, timeRaw, skillsRaw, statusRaw, sandboxRaw, traitsRaw, reasonRaw,
    animalsKilledRaw, fishCaughtRaw, cropsHarvestedRaw, itemsCraftedRaw, housesLootedRaw, hoursWithoutSleepRaw] = match;
  const timeRawNum = parseInt(timeRaw, 10);
  const parseExt = (raw: string | undefined) => { const n = parseInt(raw ?? '', 10); return isNaN(n) ? 0 : n; };
  const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  return {
    characterName: characterName || 'Sobrevivente',
    profession: profession || 'Desconhecida',
    kills: parseInt(kills, 10),
    timeRaw: timeRawNum,
    days: Math.floor(timeRawNum / 1440),
    timeStr: formatMinutesToYDHM(timeRawNum),
    skills,
    isAlive: statusRaw !== 'morto',
    sandboxOk: sandboxRaw !== 'invalido',
    traits: traitsRaw ? traitsRaw.split(',').map(t => t.trim()).filter(Boolean) : [],
    disqualificationReason: (reasonRaw && reasonRaw.trim()) ? reasonRaw.trim() : null,
    animalsKilled:     parseExt(animalsKilledRaw),
    fishCaught:        parseExt(fishCaughtRaw),
    cropsHarvested:    parseExt(cropsHarvestedRaw),
    itemsCrafted:      parseExt(itemsCraftedRaw),
    housesLooted:      parseExt(housesLootedRaw),
    hoursWithoutSleep: parseExt(hoursWithoutSleepRaw),
  };
}
