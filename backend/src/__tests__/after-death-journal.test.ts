import { describe, it, expect } from 'vitest';
import { aliveAfterDeath } from '../lib/runHistory';
import { isHiddenJournalEvent } from '../lib/journalFilter';

describe('run morta + código de personagem vivo (v4.29.4)', () => {
  it('personagem recém-criado (até 1 dia) é partida nova', () => {
    expect(aliveAfterDeath(0)).toBe('new');
    expect(aliveAfterDeath(1)).toBe('new');
  });
  it('vivo com mais de 1 dia depois de morrer = save restaurado, recusado', () => {
    expect(aliveAfterDeath(2)).toBe('resurrection');
    expect(aliveAfterDeath(90)).toBe('resurrection');
  });
});

describe('Jornal esconde eventos de runs desclassificadas', () => {
  const dq = [{ player_id: '842', character_name: 'Chris Pereira', run_started_at: '2026-09-07T00:57:51Z', created_at: '2026-09-07T00:57:51Z' }];
  it('evento da run desclassificada some', () => {
    expect(isHiddenJournalEvent({ player_id: 842, char_name: 'Chris Pereira', created_at: '2026-09-27T15:13:27Z' }, dq)).toBe(true);
    expect(isHiddenJournalEvent({ player_id: 842, char_name: 'chris  pereira', created_at: '2026-09-27T15:13:27Z' }, dq)).toBe(true);
  });
  it('run anterior legítima com o mesmo nome continua', () => {
    expect(isHiddenJournalEvent({ player_id: 842, char_name: 'Chris Pereira', created_at: '2026-08-20T10:00:00Z' }, dq)).toBe(false);
  });
  it('outro jogador ou outro personagem continua', () => {
    expect(isHiddenJournalEvent({ player_id: 999, char_name: 'Chris Pereira', created_at: '2026-09-27T15:13:27Z' }, dq)).toBe(false);
    expect(isHiddenJournalEvent({ player_id: 842, char_name: 'Outro Nome', created_at: '2026-09-27T15:13:27Z' }, dq)).toBe(false);
  });
  it('run desclassificada sem data de início esconde todos os eventos dela', () => {
    expect(isHiddenJournalEvent({ player_id: 1, char_name: 'X', created_at: '2026-01-01T00:00:00Z' },
      [{ player_id: 1, character_name: 'X', run_started_at: null, created_at: null }])).toBe(true);
  });
});
