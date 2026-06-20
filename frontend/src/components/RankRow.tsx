import type { Entry } from '../types';

interface RankRowProps {
  entry:          Entry;
  rank:           number;
  onPlayerClick?: (playerId: number) => void;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Mapeia qualquer forma não-canônica → nome PT-BR canônico.
// Cobre: IDs em inglês (mod v1.7+, safety-net caso o decoder não traduza),
// abreviações do mod ≤v1.6.0, e eras de corrupção de encoding (U+FFFD e ý).
const U = '�';
const SKILL_FIX: Record<string, string> = {
  // ── IDs em inglês (mod v1.7+ exporta IDs; decoder traduz, mas safety-net aqui) ──
  Sprinting:    'Corrida',
  Lightfooted:  'Pés Leves',
  Nimble:       'Agilidade',
  Sneaking:     'Furtividade',
  Fitness:      'Condicionamento',
  Strength:     'Força',
  Axe:          'Machado',
  LongBlunt:    'Contundente Longo',
  ShortBlunt:   'Contundente Curto',
  LongBlade:    'Lâmina Longa',
  ShortBlade:   'Lâmina Curta',
  Spear:        'Lança',
  Maintenance:  'Manutenção',
  Aiming:       'Mira',
  Reloading:    'Recarga',
  Cooking:      'Culinária',
  Fishing:      'Pesca',
  Trapping:     'Armadilhas',
  Foraging:     'Coleta',
  FirstAid:     'Primeiros Socorros',
  Carpentry:    'Carpintaria',
  Agriculture:  'Agricultura',
  Electrical:   'Eletricidade',
  Mechanics:    'Mecânica',
  MetalWelding: 'Soldagem',
  Tailoring:    'Costura',
  Knapping:     'Lascamento',
  Carving:      'Entalhamento',
  Masonry:      'Alvenaria',
  Pottery:      'Cerâmica',
  Blacksmith:   'Ferraria',
  Glassmaking:  'Vidraria',
  AnimalCare:   'Cuidado Animal',
  Butchering:   'Abate',
  Tracking:     'Rastreamento',
  // ── Abreviações do mod ≤v1.6.0 ───────────────────────────
  'Cont. Longo': 'Contundente Longo',
  'Cont. Curto': 'Contundente Curto',
  // ── U+FFFD era (antes do fix Latin-1) ────────────────────
  [`Cer${U}mica`]:          'Cerâmica',
  [`Culin${U}ria`]:         'Culinária',
  [`For${U}a`]:             'Força',
  [`Lan${U}a`]:             'Lança',
  [`L${U}mina Longa`]:      'Lâmina Longa',
  [`L${U}mina Curta`]:      'Lâmina Curta',
  [`Manuten${U}${U}o`]:     'Manutenção',
  [`Mec${U}nica`]:          'Mecânica',
  [`P${U}s Leves`]:         'Pés Leves',
  // ── ý-corruption era ─────────────────────────────────────
  'Cesýmica':               'Cerâmica',
  'Culiiýria':              'Culinária',
  'Fouýa':                  'Força',
  'Lanýa':                  'Lança',
  'Lýmina Longa':           'Lâmina Longa',
  'Lýmina Curta':           'Lâmina Curta',
  'Manutenâýo':             'Manutenção',
  'Mebýnica':               'Mecânica',
};

function fixSkillName(name: string): string {
  return SKILL_FIX[name] ?? name;
}

function SkillChip({ raw }: { raw: string }) {
  const lastSpace = raw.lastIndexOf(' ');
  const level = lastSpace !== -1 ? parseInt(raw.slice(lastSpace + 1), 10) : NaN;
  const hasLevel = !isNaN(level) && lastSpace !== -1;
  const name = fixSkillName(hasLevel ? raw.slice(0, lastSpace) : raw);

  const lvlClass = hasLevel
    ? level === 0 ? 'lvl-zero'
    : level === 1 ? 'lvl-one'
    : level === 2 ? 'lvl-two'
    : level === 3 ? 'lvl-three'
    : 'lvl-max'
    : '';

  return (
    <span className={`skill-chip ${lvlClass}`}>
      <span className="skill-name">{name}</span>
      {hasLevel && <span className="skill-level">{level}</span>}
    </span>
  );
}

export function RankRow({ entry, rank, onPlayerClick }: RankRowProps) {
  return (
    <tr className={rank <= 3 ? `rank-top rank-${rank}` : ''}>
      <td className="rank-pos">{MEDALS[rank] ?? rank}</td>
      <td className="rank-name">
        <span className="char-name">{entry.character_name || entry.name}</span>
        {entry.profession && <span className="profession-badge">{entry.profession}</span>}
        {entry.player_id
          ? (
            <button
              className="player-alias player-alias-btn"
              onClick={() => onPlayerClick?.(entry.player_id!)}
              title="Ver perfil do jogador"
            >
              {entry.name}
            </button>
          )
          : <span className="player-alias">{entry.name}</span>
        }
      </td>
      <td className="rank-alive">
        {entry.is_alive
          ? <span className="alive-badge alive"><i className="ti ti-heartbeat" /> Vivo</span>
          : <span className="alive-badge dead"><i className="ti ti-skull" /> Morto</span>
        }
      </td>
      <td className="rank-score">{(entry.score ?? 0).toLocaleString('pt-BR')}</td>
      <td className="rank-days">{entry.days}d</td>
      <td className="rank-time">{entry.time_str ?? '—'}</td>
      <td className="rank-kills">{entry.kills.toLocaleString('pt-BR')}</td>
      <td className="rank-skills">
        {entry.skills
          ? entry.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
              <SkillChip key={s} raw={s} />
            ))
          : '—'}
      </td>
      <td className="rank-proof">
        {entry.live_url && (
          <a href={entry.live_url} target="_blank" rel="noopener noreferrer"
            className="proof-link" aria-label="Link da live">
            <i className="ti ti-brand-twitch" aria-hidden="true" />
          </a>
        )}
      </td>
    </tr>
  );
}
