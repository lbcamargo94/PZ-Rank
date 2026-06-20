import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { Entry } from '../types';
import { parseSkillMap, SKILL_CATEGORIES, TOTAL_SKILLS, MAX_SKILL_LEVEL } from '../lib/skills';

interface RankRowProps {
  entry: Entry;
  rank:  number;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function SkillsModal({ skillMap, charName, onClose }: {
  skillMap: Map<string, number>;
  charName?: string;
  onClose:   () => void;
}) {
  const maxed = Array.from(skillMap.values()).filter(l => l >= MAX_SKILL_LEVEL).length;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="sm-overlay">
      <div className="sm-box" onClick={e => e.stopPropagation()}>

        <div className="sm-header">
          <div className="sm-header-info">
            <div className="sm-title">
              <i className="ti ti-sword" />
              Habilidades
              {charName && <span className="sm-char">· {charName}</span>}
            </div>
            <div className="sm-subtitle">
              <span className="sm-maxed-val">{String(maxed).padStart(2, '0')}/{TOTAL_SKILLS}</span>
              {' '}no nível máximo
            </div>
          </div>
          <button className="sm-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="sm-body">
          {SKILL_CATEGORIES.map(cat => (
            <div key={cat.label} className="scat">
              <div className="scat-label">{cat.label}</div>
              {cat.skills.map(skill => {
                const level = skillMap.get(skill.name) ?? 0;
                return (
                  <div key={skill.id} className={level >= MAX_SKILL_LEVEL ? 'srow srow-max' : 'srow'}>
                    <span className="srow-name">{skill.name}</span>
                    <span className="srow-pips">
                      {Array.from({ length: MAX_SKILL_LEVEL }, (_, i) => (
                        <span key={i} className={i < level ? 'pip pip-on' : 'pip pip-off'} />
                      ))}
                    </span>
                    <span className="srow-lvl">{level}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      </div>
    </div>,
    document.body,
  );
}

function SkillsCell({ skills, charName }: { skills: string | null; charName?: string }) {
  const [open, setOpen] = useState(false);
  const skillMap = parseSkillMap(skills);
  const maxed    = Array.from(skillMap.values()).filter(l => l >= MAX_SKILL_LEVEL).length;

  if (!skills) return <span className="skills-no-data">—</span>;

  return (
    <>
      <button
        className={`skills-counter${maxed > 0 ? ' has-maxed' : ''}`}
        onClick={() => setOpen(true)}
        title="Ver progresso das habilidades"
      >
        {String(maxed).padStart(2, '0')}<span className="skills-sep">/</span>{TOTAL_SKILLS}
      </button>
      {open && (
        <SkillsModal
          skillMap={skillMap}
          charName={charName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
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
        {entry.player_id && (
          <Link to={`/player/${entry.player_id}`} className="btn-details">
            <i className="ti ti-user" /> Ver detalhes
          </Link>
        )}
      </td>
      <td className="rank-alive">
        {entry.sandbox_ok === false
          ? (
            <span className="alive-badge disqualified" title="Configurações do sandbox divergem do desafio oficial">
              <i className="ti ti-ban" /> Desclassificado
            </span>
          )
          : entry.is_alive
            ? <span className="alive-badge alive"><i className="ti ti-heartbeat" /> Vivo</span>
            : <span className="alive-badge dead"><i className="ti ti-skull" /> Morto</span>
        }
      </td>
      <td className="rank-score">{(entry.score ?? 0).toLocaleString('pt-BR')}</td>
      <td className="rank-days">{entry.days}d</td>
      <td className="rank-time">{entry.time_str ?? '—'}</td>
      <td className="rank-kills">{entry.kills.toLocaleString('pt-BR')}</td>
      <td className="rank-skills">
        <SkillsCell skills={entry.skills} charName={entry.character_name ?? undefined} />
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
