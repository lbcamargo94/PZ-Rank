import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { Entry } from '../types';
import { parseSkillMap, SKILL_CATEGORIES, TOTAL_SKILLS, MAX_SKILL_LEVEL } from '../lib/skills';
import { getProfessionImageUrl } from '../lib/professions';

export const KILLS_TARGET = 500_000;

interface RankRowProps {
  entry:       Entry;
  rank:        number;
  hideStatus?: boolean;
  maxScore:    number;
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

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + '/' + d.getFullYear() + ' - ' + hh + ':' + min;
}

function MiniBar({ value, max, done }: { value: number; max: number; done?: boolean }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="rk-bar-row">
      <div className="rk-bar-track">
        <div className={`rk-bar-fill${done ? ' rk-bar-done' : ''}`} style={{ width: pct + '%' }} />
      </div>
      <span className={`rk-bar-pct${done ? ' rk-bar-pct-done' : ''}`}>{pct}%</span>
    </div>
  );
}

export function RankRow({ entry, rank, hideStatus, maxScore }: RankRowProps) {
  const score     = entry.score ?? 0;
  const killsDone = entry.kills >= KILLS_TARGET;

  return (
    <tr className={rank <= 3 ? `rank-top rank-${rank}` : ''}>
      <td className="rank-pos">{MEDALS[rank] ?? rank}</td>
      <td className="rank-name">
        <span className="char-name">{entry.character_name || entry.name}</span>
        {entry.profession && (
          <span className="profession-badge">
            {getProfessionImageUrl(entry.profession) && (
              <img src={getProfessionImageUrl(entry.profession)} alt="" className="profession-img" />
            )}
            {entry.profession}
          </span>
        )}
        <span className="player-alias">{entry.name}</span>
        {entry.player_id && (
          <Link to={`/player/${entry.player_id}`} className="btn-details">
            <i className="ti ti-user" /> Ver detalhes
          </Link>
        )}
      </td>
      {!hideStatus && (
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
      )}
      <td className="rank-score">
        <div className="rk-bar-cell">
          <span>{score.toLocaleString('pt-BR')}</span>
          <MiniBar value={score} max={maxScore} />
        </div>
      </td>
      <td className="rank-days">{entry.days}d</td>
      <td className="rank-time">{entry.time_str ?? '—'}</td>
      <td className="rank-kills">
        <div className="rk-bar-cell">
          <span>{entry.kills.toLocaleString('pt-BR')}</span>
          <MiniBar value={entry.kills} max={KILLS_TARGET} done={killsDone} />
        </div>
      </td>
      <td className="rank-skills">
        <SkillsCell skills={entry.skills} charName={entry.character_name ?? undefined} />
      </td>
      <td className="rank-updated">{fmtDate(entry.updated_at)}</td>
    </tr>
  );
}