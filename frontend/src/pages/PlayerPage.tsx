import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import avatarDefault from '../../assets/avatar.png';
import { apiGetPlayerProfile, apiGetEntries } from '../lib/api';
import { parseSkillMap, SKILL_CATEGORIES, MAX_SKILL_LEVEL, TOTAL_SKILLS } from '../lib/skills';
import { parseTraitList, resolveTrait, getTraitImageUrl } from '../lib/traits';
import { getProfessionImageUrl } from '../lib/professions';
import { SPIFFOS_RESTAURANTS, BASE_ITEMS, initObjectives } from '../lib/objectives';
import { ProgressBar } from '../components/ProgressBar';
import type { PlayerProfile, Entry } from '../types';
import type { Objectives } from '../lib/objectives';

const SOCIALS = [
  { field: 'twitch_url',  icon: 'ti-brand-twitch',  label: 'Twitch',  cls: 'social-twitch'  },
  { field: 'youtube_url', icon: 'ti-brand-youtube', label: 'YouTube', cls: 'social-youtube' },
  { field: 'kick_url',    icon: 'ti-brand-kick',    label: 'Kick',    cls: 'social-kick'    },
  { field: 'tiktok_url',  icon: 'ti-brand-tiktok',  label: 'TikTok',  cls: 'social-tiktok'  },
] as const;

function ObjectivesSection({ objectives, kills }: { objectives: Objectives | null | undefined; kills: number }) {
  const obj = objectives ?? initObjectives();
  const pending = !objectives;

  const bases = SPIFFOS_RESTAURANTS.map(r => ({ ...r, ...obj.bases[r.id] }));
  const basesCount = bases.filter(b => b.has_base).length;

  return (
    <div className="pp-objectives">
      {pending && (
        <div className="pp-obj-pending-banner">
          <i className="ti ti-info-circle" />
          Objetivos ainda não registrados pelo moderador. Mostrando estado inicial.
        </div>
      )}

      {/* Special objectives */}
      <div className="pp-obj-group">
        <h4 className="pp-obj-group-title"><i className="ti ti-star" /> Objetivos Especiais</h4>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.kills_500k ? 'pp-obj-done' : ''}`}>
            {obj.kills_500k ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">500.000 Zumbis Abatidos</span>
            <ProgressBar value={Math.min(kills, 500_000)} max={500_000} showValues />
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.all_skills_10 ? 'pp-obj-done' : ''}`}>
            {obj.all_skills_10 ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Todas as Habilidades no Nível 10</span>
            <span className="pp-obj-note">Registrado pelo mod no momento da sincronização</span>
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.spiffo_statue ? 'pp-obj-done' : ''}`}>
            {obj.spiffo_statue ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Estátua do Spiffo (Louisville)</span>
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.military_base ? 'pp-obj-done' : ''}`}>
            {obj.military_base ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Base Militar de Rosewood Limpa</span>
          </div>
        </div>
      </div>

      {/* Bases Spiffo's */}
      <div className="pp-obj-group">
        <h4 className="pp-obj-group-title">
          <i className="ti ti-building-store" /> Bases nos Spiffo's
          <span className="pp-obj-count">{basesCount}/{SPIFFOS_RESTAURANTS.length}</span>
        </h4>
        <ProgressBar value={basesCount} max={SPIFFOS_RESTAURANTS.length} />
        <div className="pp-bases-grid">
          {bases.map(b => {
            const itemsDone = BASE_ITEMS.filter(i => (b as Record<string, unknown>)[i.id]).length;
            return (
              <div key={b.id} className={`pp-base ${b.has_base ? 'pp-base-done' : ''}`}>
                <span className="pp-base-icon">
                  {b.has_base ? <i className="ti ti-check" /> : <i className="ti ti-x" />}
                </span>
                <span className="pp-base-name">{b.name}</span>
                {b.has_base && (
                  <span className="pp-base-items">{itemsDone}/{BASE_ITEMS.length}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SkillsSection({ skillsStr }: { skillsStr: string | null }) {
  const skillMap = parseSkillMap(skillsStr);
  const maxedCount = Array.from(skillMap.values()).filter(l => l >= MAX_SKILL_LEVEL).length;

  return (
    <div className="pp-skills">
      <div className="pp-skills-summary">
        <span className="pp-skills-counter">
          <span className="pp-skills-maxed">{String(maxedCount).padStart(2, '0')}</span>
          <span className="pp-skills-sep">/</span>
          <span className="pp-skills-total">{TOTAL_SKILLS}</span>
        </span>
        <span className="pp-skills-label">habilidades no nível máximo</span>
      </div>

      <div className="pp-skills-grid">
        {SKILL_CATEGORIES.map(cat => (
          <div key={cat.label} className="pp-scat">
            <div className="pp-scat-label">{cat.label}</div>
            {cat.skills.map(skill => {
              const level = skillMap.get(skill.name) ?? 0;
              const maxed = level >= MAX_SKILL_LEVEL;
              return (
                <div key={skill.id} className={`pp-srow${maxed ? ' pp-srow-max' : ''}`}>
                  <span className="pp-srow-name">{skill.name}</span>
                  <div className="pp-srow-pips">
                    {Array.from({ length: MAX_SKILL_LEVEL }, (_, i) => (
                      <span key={i} className={i < level ? 'pip pip-on' : 'pip pip-off'} />
                    ))}
                  </div>
                  <span className="pp-srow-lvl">{level}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TraitsSection({ traitsRaw }: { traitsRaw: string | null | undefined }) {
  const ids = parseTraitList(traitsRaw);
  if (ids.length === 0) return <p className="pp-no-data">Características não registradas nesta entrada.</p>;

  const positive = ids.filter(id => resolveTrait(id).type === 'positive');
  const negative = ids.filter(id => resolveTrait(id).type === 'negative');

  return (
    <div className="pp-traits">
      {positive.length > 0 && (
        <div className="pp-trait-group">
          <span className="pp-trait-group-label"><i className="ti ti-circle-plus" /> Positivas</span>
          <div className="pp-trait-list">
            {positive.map(id => {
              const def = resolveTrait(id);
              const img = getTraitImageUrl(def);
              return (
                <span key={id} className="trait-badge trait-positive" title={def.description}>
                  {img && <img src={img} alt="" className="trait-img" />}
                  {def.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {negative.length > 0 && (
        <div className="pp-trait-group">
          <span className="pp-trait-group-label"><i className="ti ti-circle-minus" /> Negativas</span>
          <div className="pp-trait-list">
            {negative.map(id => {
              const def = resolveTrait(id);
              const img = getTraitImageUrl(def);
              return (
                <span key={id} className="trait-badge trait-negative" title={def.description}>
                  {img && <img src={img} alt="" className="trait-img" />}
                  {def.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CharacterCard({ entry, rank }: { entry: Entry; rank: number | null }) {
  const [tab, setTab] = useState<'stats' | 'skills' | 'traits'>('stats');

  return (
    <div className={`pp-char-card${entry.is_alive ? '' : ' pp-char-dead'}`}>
      {/* Card header */}
      <div className="pp-char-header">
        <div className="pp-char-identity">
          <span className="pp-char-name">{entry.character_name || '—'}</span>
          {entry.profession && (
            <span className="profession-badge">
              {getProfessionImageUrl(entry.profession) && (
                <img src={getProfessionImageUrl(entry.profession)} alt="" className="profession-img" />
              )}
              {entry.profession}
            </span>
          )}
        </div>
        <div className="pp-char-right">
          {rank !== null && <span className="pp-char-rank">#{rank}</span>}
          {entry.is_alive
            ? <span className="alive-badge alive"><i className="ti ti-heartbeat" /> Vivo</span>
            : <span className="alive-badge dead"><i className="ti ti-skull" /> Morto</span>}
        </div>
      </div>

      {/* Score highlight */}
      <div className="pp-char-score">
        <span className="pp-score-val">{entry.score.toLocaleString('pt-BR')}</span>
        <span className="pp-score-label">pontos</span>
      </div>

      {/* Quick stats row */}
      <div className="pp-char-stats-row">
        <span className="pp-stat"><i className="ti ti-calendar" />{entry.days}d</span>
        <span className="pp-stat"><i className="ti ti-clock" />{entry.time_str ?? '—'}</span>
        <span className="pp-stat"><i className="ti ti-sword" />{entry.kills.toLocaleString('pt-BR')}</span>
      </div>

      {/* Tabs */}
      <div className="pp-tabs">
        <button className={`pp-tab${tab === 'stats' ? ' active' : ''}`} onClick={() => setTab('stats')}>
          Objetivos
        </button>
        <button className={`pp-tab${tab === 'skills' ? ' active' : ''}`} onClick={() => setTab('skills')}>
          Habilidades
        </button>
        <button className={`pp-tab${tab === 'traits' ? ' active' : ''}`} onClick={() => setTab('traits')}>
          Características
        </button>
      </div>

      <div className="pp-tab-body">
        {tab === 'stats'  && <ObjectivesSection objectives={entry.objectives} kills={entry.kills} />}
        {tab === 'skills' && <SkillsSection skillsStr={entry.skills} />}
        {tab === 'traits' && <TraitsSection traitsRaw={entry.traits} />}
      </div>
    </div>
  );
}

type CharFilter = 'all' | 'alive' | 'dead' | 'disqualified';

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile]       = useState<PlayerProfile | null>(null);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState<string | null>(null);
  const [charFilter, setCharFilter] = useState<CharFilter>('all');

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      setError('ID de jogador inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([apiGetPlayerProfile(numId), apiGetEntries('score')])
      .then(([prof, entries]) => { setProfile(prof); setAllEntries(entries); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="player-page player-page-state">
        <div className="container">
          <i className="ti ti-loader-2 spin" /> Carregando perfil...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="player-page player-page-state">
        <div className="container">
          <i className="ti ti-alert-circle" /> {error ?? 'Jogador não encontrado.'}
          <br />
          <Link to="/" className="back-link" style={{ marginTop: 16, display: 'inline-block' }}>
            ← Voltar ao Ranking
          </Link>
        </div>
      </div>
    );
  }

  // Rank position map (index in global sorted-by-score list)
  const rankMap = new Map(allEntries.map((e, i) => [e.id, i + 1]));

  // Sort this player's entries by score desc
  const entries = [...profile.entries].sort((a, b) => b.score - a.score);

  const filteredEntries = entries.filter(e => {
    if (charFilter === 'alive')        return e.sandbox_ok !== false && e.is_alive;
    if (charFilter === 'dead')         return e.sandbox_ok !== false && !e.is_alive;
    if (charFilter === 'disqualified') return e.sandbox_ok === false;
    return true;
  });

  const aliveCount  = entries.filter(e => e.sandbox_ok !== false && e.is_alive).length;
  const deadCount   = entries.filter(e => e.sandbox_ok !== false && !e.is_alive).length;
  const descCount   = entries.filter(e => e.sandbox_ok === false).length;

  const bestEntry = entries[0] ?? null;
  const bestRank  = bestEntry?.id !== undefined ? (rankMap.get(bestEntry.id) ?? null) : null;

  const hasSocials = SOCIALS.some(
    s => !!(profile.player[s.field as keyof typeof profile.player])
  );

  return (
    <div className="player-page">
      <div className="container">
        {/* Back link */}
        <Link to="/" className="btn-primary btn-sm back-btn-rank">
          <i className="ti ti-arrow-left" /> Voltar ao Ranking
        </Link>

        {/* Player header */}
        <div className="pp-header">
          <div className="pp-avatar-wrap">
            <img src={avatarDefault} alt="Avatar" className="pp-avatar-img" />
          </div>
          <div className="pp-header-info">
            <h1 className="pp-nick">{profile.player.nick}</h1>
            {hasSocials && (
              <div className="pp-socials">
                {SOCIALS.map(s => {
                  const url = profile.player[s.field as keyof typeof profile.player] as string | null;
                  return url ? (
                    <a key={s.field} href={url} target="_blank" rel="noopener noreferrer"
                      className={`pc-social-link ${s.cls}`} title={s.label}>
                      <i className={`ti ${s.icon}`} /> {s.label}
                    </a>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Summary bar */}
        {bestEntry && (
          <div className="pp-summary">
            <div className="pp-sum-card">
              <span className="pp-sum-label">Melhor posição</span>
              <span className="pp-sum-value">{bestRank !== null ? `#${bestRank}` : '—'}</span>
            </div>
            <div className="pp-sum-card">
              <span className="pp-sum-label">Melhor pontuação</span>
              <span className="pp-sum-value">{bestEntry.score.toLocaleString('pt-BR')} pts</span>
            </div>
            <div className="pp-sum-card">
              <span className="pp-sum-label">Personagens</span>
              <span className="pp-sum-value">{entries.length}</span>
            </div>
            <div className="pp-sum-card">
              <span className="pp-sum-label">Maior massacre</span>
              <span className="pp-sum-value">{bestEntry.kills.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}

        {/* Characters */}
        <div className="pp-chars-section">
          <div className="pp-chars-header">
            <h2 className="pp-section-title">
              <i className="ti ti-users" /> Personagens no Ranking
              <span className="pp-section-count">{entries.length}</span>
            </h2>
            <div className="pp-char-filter">
              <button
                className={`sort-btn${charFilter === 'all' ? ' active' : ''}`}
                onClick={() => setCharFilter('all')}
              >
                Todos ({entries.length})
              </button>
              <button
                className={`sort-btn filter-alive${charFilter === 'alive' ? ' active' : ''}`}
                onClick={() => setCharFilter('alive')}
              >
                <i className="ti ti-heartbeat" /> Vivos ({aliveCount})
              </button>
              <button
                className={`sort-btn filter-dead${charFilter === 'dead' ? ' active' : ''}`}
                onClick={() => setCharFilter('dead')}
              >
                <i className="ti ti-skull" /> Mortos ({deadCount})
              </button>
              {descCount > 0 && (
                <button
                  className={`sort-btn filter-disq${charFilter === 'disqualified' ? ' active' : ''}`}
                  onClick={() => setCharFilter('disqualified')}
                >
                  <i className="ti ti-ban" /> Desclassificados ({descCount})
                </button>
              )}
            </div>
          </div>

          {filteredEntries.length === 0 && (
            <p className="pp-no-data">Nenhum personagem nesta categoria.</p>
          )}

          <div className="pp-chars-list">
            {filteredEntries.map(entry => (
              <CharacterCard
                key={entry.id}
                entry={entry}
                rank={entry.id !== undefined ? (rankMap.get(entry.id) ?? null) : null}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
