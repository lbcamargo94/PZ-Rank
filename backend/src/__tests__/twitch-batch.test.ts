import { describe, it, expect } from 'vitest';
import { BATCH_SIZE } from '../lib/twitch';

// A Twitch recusa (HTTP 400) queries com mais de 15 aliases de raiz. Com lotes de 50,
// nenhum streamer da Twitch aparecia ao vivo (10/10/2026). Não subir acima de 15.
describe('consulta de lives da Twitch', () => {
  it('lote respeita o limite de 15 aliases da API da Twitch', () => {
    expect(BATCH_SIZE).toBeLessThanOrEqual(15);
  });
});
