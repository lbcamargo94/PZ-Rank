import type { Entry } from '../types';

interface RankRowProps {
  entry: Entry;
  rank:  number;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function SkillChip({ raw }: { raw: string }) {
  const lastSpace = raw.lastIndexOf(' ');
  const level = lastSpace !== -1 ? parseInt(raw.slice(lastSpace + 1), 10) : NaN;
  const hasLevel = !isNaN(level) && lastSpace !== -1;
  const name = hasLevel ? raw.slice(0, lastSpace) : raw;

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

export function RankRow({ entry, rank }: RankRowProps) {
  return (
    <tr className={rank <= 3 ? `rank-top rank-${rank}` : ''}>
      <td className="rank-pos">{MEDALS[rank] ?? rank}</td>
      <td className="rank-name">
        <span className="char-name">{entry.character_name || entry.name}</span>
        {entry.profession && <span className="profession-badge">{entry.profession}</span>}
        <span className="player-alias">{entry.name}</span>
      </td>
      <td className="rank-alive">
        {entry.is_alive
          ? <span className="alive-badge alive"><i className="ti ti-heartbeat" /> Vivo</span>
          : <span className="alive-badge dead"><i className="ti ti-skull" /> Morto</span>
        }
      </td>
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
