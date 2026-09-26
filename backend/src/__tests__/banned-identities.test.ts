import { describe, it, expect } from 'vitest';
import { channelHandle, matchBan, normalizeBanValue, normalizeNick, type BanEntry } from '../lib/bannedIdentities';

describe('normalização', () => {
  it('nick: caixa, acento e símbolos não importam', () => {
    expect(normalizeNick('FabzGOD')).toBe('fabzgod');
    expect(normalizeNick(' Fabz_GOD ')).toBe('fabzgod');
    expect(normalizeNick('Fábz.God')).toBe('fabzgod');
  });

  it('canal: lê o handle de vários formatos de link', () => {
    expect(channelHandle('twitch', 'https://www.twitch.tv/FabzGOD')).toBe('fabzgod');
    expect(channelHandle('twitch', 'twitch.tv/fabzgod/videos')).toBe('fabzgod');
    expect(channelHandle('twitch', 'fabzgod')).toBe('fabzgod');
    expect(channelHandle('youtube', 'https://youtube.com/@FabzGod')).toBe('@fabzgod');
    expect(channelHandle('youtube', 'https://www.youtube.com/channel/UCabc123')).toBe('channel/ucabc123');
    expect(channelHandle('tiktok', 'https://www.tiktok.com/@fabz')).toBe('fabz');
  });

  it('link de outra plataforma não vale (twitch não aceita youtube.com)', () => {
    expect(channelHandle('twitch', 'https://youtube.com/@fabzgod')).toBeNull();
    expect(channelHandle('youtube', 'https://www.youtube.com/watch?v=x')).toBeNull();
    expect(channelHandle('twitch', '')).toBeNull();
  });

  it('valor gravado na lista', () => {
    expect(normalizeBanValue('nick', 'FabzGOD')).toBe('fabzgod');
    expect(normalizeBanValue('twitch', 'https://twitch.tv/FabzGOD')).toBe('fabzgod');
  });
});

describe('matchBan', () => {
  const bans: BanEntry[] = [
    { kind: 'nick',   value: 'fabzgod', reason: 'ofensas' },
    { kind: 'twitch', value: 'fabzgod', reason: 'ofensas' },
  ];

  it('bate pelo nick (qualquer grafia)', () => {
    expect(matchBan({ nick: 'Fabz_God', youtube_url: 'https://youtube.com/@outro' }, bans)?.kind).toBe('nick');
  });

  it('bate pelo canal mesmo com outro nick', () => {
    expect(matchBan({ nick: 'NickNovo', twitch_url: 'https://www.twitch.tv/FabzGOD' }, bans)?.kind).toBe('twitch');
  });

  it('nick parecido mas diferente não bate', () => {
    expect(matchBan({ nick: 'FabzGODx', twitch_url: 'https://twitch.tv/fabzgodx' }, bans)).toBeNull();
    expect(matchBan({ nick: 'OFabian', youtube_url: 'https://youtube.com/@OfabianPZ' }, bans)).toBeNull();
  });

  it('mesmo handle em outra plataforma não bate', () => {
    expect(matchBan({ nick: 'x', kick_url: 'https://kick.com/fabzgod' }, bans)).toBeNull();
  });
});
