import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Entry, LiveStatus } from '../types';
import { parseSkillMap, SKILL_CATEGORIES, TOTAL_SKILLS, MAX_SKILL_LEVEL } from '../lib/skills';
import { MAX_POSSIBLE_SCORE } from '../lib/objectives';
import { getDivision } from '../lib/divisions';
import { hasLiveWarning } from '../lib/live';
import { formatNumber, formatDate, formatTime } from '../lib/format';
import { LiveBadges } from './LiveBadges';

export const KILLS_TARGET = 800_000;

interface RankRowProps {
  entry:          Entry;
  rank:           number;
  hideStatus?:    boolean;
  iconOnly?:      boolean;
  live?:          LiveStatus[];
  onPlayerClick?: (id: number) => void;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function disqTooltip(t: TFunction, reason: string | null | undefined): string {
  if (!reason) return t('rank.disq.sandbox');
  if (reason.startsWith('mods:')) {
    const ids = reason.slice(5).split(',').map(v => {
      if (v.startsWith('NAO_PERMITIDO:')) return v.slice(14);
      if (v.startsWith('AUSENTE:'))       return v.slice(8) + ' (ausente)';
      return v;
    }).filter(Boolean);
    return ids.length > 0
      ? t('rank.disq.mods_list', { list: ids.join(', ') })
      : t('rank.disq.mods');
  }
  switch (reason) {
    case 'debug':       return t('rank.disq.debug');
    case 'manual':      return t('rank.disq.manual');
    case 'mod_removed': return t('rank.disq.mod_removed_row');
    case 'mods':        return t('rank.disq.mods');
    default:             return t('rank.disq.mods');
  }
}

function SkillsModal({ skillMap, charName, onClose }: {
  skillMap: Map<string, number>;
  charName?: string;
  onClose:   () => void;
}) {
  const { t } = useTranslation();
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
              {t('rank.skills.title')}
              {charName && <span className="sm-char">· {charName}</span>}
            </div>
            <div className="sm-subtitle">
              <span className="sm-maxed-val">{String(maxed).padStart(2, '0')}/{TOTAL_SKILLS}</span>
              {' '}{t('rank.skills.max_level')}
            </div>
          </div>
          <button className="sm-close" onClick={onClose} aria-label={t('rank.skills.close')}>
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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const skillMap = parseSkillMap(skills);
  const maxed    = Array.from(skillMap.values()).filter(l => l >= MAX_SKILL_LEVEL).length;

  if (!skills) return <span className="skills-no-data">—</span>;

  return (
    <>
      <button
        className={`skills-counter${maxed > 0 ? ' has-maxed' : ''}`}
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        title={t('rank.skills.view_progress')}
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

function fmtDateParts(iso: string | null | undefined): { date: string; time: string } | null {
  if (!iso) return null;
  return { date: formatDate(iso), time: formatTime(iso) };
}

function MiniBar({ value, max, done }: { value: number; max: number; done?: boolean }) {
  const raw = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="rk-bar-row">
      <div className="rk-bar-track">
        <div className={`rk-bar-fill${done ? ' rk-bar-done' : ''}`} style={{ width: raw + '%' }} />
      </div>
      <span className={`rk-bar-pct${done ? ' rk-bar-pct-done' : ''}`}>{raw.toFixed(2)}%</span>
    </div>
  );
}

export function RankRow({ entry, rank, hideStatus, iconOnly, live, onPlayerClick }: RankRowProps) {
  const { t } = useTranslation();
  const score     = entry.score ?? 0;
  const killsDone = entry.kills >= KILLS_TARGET;
  const division  = getDivision(rank > 0 ? rank : 1);
  const isTestMod = entry.is_test_mod === true;
  const clickable = entry.player_id != null && !!onPlayerClick;

  let trClass = isTestMod ? 'rank-test-mod' : (rank <= 3 ? `rank-top rank-${rank}` : '');
  if (clickable) trClass += ' rank-row-clickable';

  return (
    <tr
      className={trClass}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onPlayerClick!(entry.player_id!) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlayerClick!(entry.player_id!); } } : undefined}
    >
      <td className="rank-pos">
        {isTestMod
          ? <span className="test-mod-badge" title={t('rank.test_mod_title')}><i className="ti ti-microscope" /> {t('rank.test_mod')}</span>
          : <>
              {MEDALS[rank] ?? rank}
              <span
                className={`division-badge division-badge--${division.division.toLowerCase()}`}
                data-tip={`${division.label} · ${division.range}`}
                data-tip-pos="bottom"
              >
                {division.label}
              </span>
            </>
        }
      </td>
      <td className="rank-live">
        <LiveBadges live={live} compact />
      </td>
      <td className="rank-name">
        <span className="char-name">
          {entry.character_name || entry.name}
        </span>
        <span className="player-alias">{entry.name}</span>
        {hasLiveWarning(entry) && (
          <span className="live-warning-badge" title={t('rank.live_warning_title')}>
            <i className="ti ti-alert-triangle" /> {t('rank.live_warning')}
          </span>
        )}
      </td>
      {!hideStatus && (
        <td className="rank-alive">
          {entry.sandbox_ok === false
            ? (
              iconOnly
                ? <span className="status-icon status-disq" data-tip={disqTooltip(t, entry.disqualification_reason)}><i className="ti ti-ban" /></span>
                : <span className="alive-badge disqualified" data-tip={disqTooltip(t, entry.disqualification_reason)}><i className="ti ti-ban" /> {t('rank.status.disqualified')}</span>
            )
            : entry.is_alive
              ? (iconOnly
                  ? <span className="status-icon status-alive" data-tip={t('rank.status.alive')}><i className="ti ti-heartbeat" /></span>
                  : <span className="alive-badge alive"><i className="ti ti-heartbeat" /> {t('rank.status.alive')}</span>)
              : (iconOnly
                  ? <span className="status-icon status-dead" data-tip={t('rank.status.dead')}><i className="ti ti-skull" /></span>
                  : <span className="alive-badge dead"><i className="ti ti-skull" /> {t('rank.status.dead')}</span>)
          }
        </td>
      )}
      <td className="rank-score">
        <div className="rk-bar-cell">
          <span>{formatNumber(score)}</span>
          <MiniBar value={score} max={MAX_POSSIBLE_SCORE} />
        </div>
      </td>
      <td className="rank-days">{entry.days}d</td>
      <td className="rank-kills">
        <div className="rk-bar-cell">
          <span>{formatNumber(entry.kills)}</span>
          <MiniBar value={entry.kills} max={KILLS_TARGET} done={killsDone} />
        </div>
      </td>
      <td className="rank-skills">
        <SkillsCell skills={entry.skills} charName={entry.character_name ?? undefined} />
      </td>
      <td className="rank-updated">
        {(() => {
          const p = fmtDateParts(entry.updated_at ?? entry.created_at);
          return p
            ? <><span className="rank-updated-date">{p.date}</span><span className="rank-updated-time">{p.time}</span></>
            : '—';
        })()}
      </td>
    </tr>
  );
}