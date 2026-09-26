import { describe, it, expect } from 'vitest';
import { channelPathOf, nextQuotaReset } from '../lib/youtube';

describe('channelPathOf', () => {
  it('extrai o caminho do canal dos formatos cadastrados', () => {
    expect(channelPathOf('https://www.youtube.com/@TioLhamaGAMEPLAY')).toBe('@TioLhamaGAMEPLAY');
    expect(channelPathOf('https://youtube.com/@zzzsmokezzzpz?si=R8G74rq26WFCzRL7')).toBe('@zzzsmokezzzpz');
    expect(channelPathOf('http://www.youtube.com/@DTGB-PZ/')).toBe('@DTGB-PZ');
    expect(channelPathOf('@carniçagames666')).toBe('@carniçagames666');
    expect(channelPathOf('https://www.youtube.com/user/fulano')).toBe('user/fulano');
    expect(channelPathOf('https://www.youtube.com/c/Fulano')).toBe('c/Fulano');
    expect(channelPathOf('https://youtube.com/BoneYT')).toBe('BoneYT');
    expect(channelPathOf('https://twitch.tv/fulano')).toBeNull();
  });
});

describe('nextQuotaReset', () => {
  it('meia-noite do Pacífico (+5 min): 07:05 UTC no horário de verão, 08:05 no inverno', () => {
    expect(new Date(nextQuotaReset(new Date('2026-09-26T15:40:00Z'))).toISOString()).toBe('2026-09-27T07:05:00.000Z');
    expect(new Date(nextQuotaReset(new Date('2026-09-27T06:00:00Z'))).toISOString()).toBe('2026-09-27T07:05:00.000Z');
    expect(new Date(nextQuotaReset(new Date('2026-12-10T12:00:00Z'))).toISOString()).toBe('2026-12-11T08:05:00.000Z');
  });
});
