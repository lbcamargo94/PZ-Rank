import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import avatarDefault from '../../assets/avatar.png';
import perfilBg from '../../assets/background/perfil-usuario.webp';
import { apiGetPlayerProfile, apiGetEntries, apiGetLiveStatus } from '../lib/api';
import { parseSkillMap, SKILL_CATEGORIES, MAX_SKILL_LEVEL, TOTAL_SKILLS } from '../lib/skills';
import { parseTraitList, resolveTrait, getTraitImageUrl } from '../lib/traits';
import { getProfessionImageUrl } from '../lib/professions';
import { SPIFFOS_RESTAURANTS, BASE_ITEMS, initObjectives } from '../lib/objectives';
import { ProgressBar } from '../components/ProgressBar';
import { resolveArchetype } from '../lib/archetype';
import { ArchetypeGuideModal } from '../components/ArchetypeGuideModal';
import { hasLiveWarning } from '../lib/live';
import { LiveBadges } from '../components/LiveBadges';
import type { PlayerProfile, Entry, LiveStatus } from '../types';
import type { Objectives } from '../lib/objectives';

const SOCIALS = [
  { field: 'twitch_url',  icon: 'ti-brand-twitch',  label: 'Twitch',  cls: 'social-twitch'  },
  { field: 'youtube_url', icon: 'ti-brand-youtube', label: 'YouTube', cls: 'social-youtube' },
  { field: 'kick_url',    icon: 'ti-brand-kick',    label: 'Kick',    cls: 'social-kick'    },
  { field: 'tiktok_url',  icon: 'ti-brand-tiktok',  label: 'TikTok',  cls: 'social-tiktok'  },
] as const;

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

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
          <div className={`pp-obj-badge ${kills >= 800_000 ? 'pp-obj-done' : ''}`}>
            {kills >= 800_000 ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">800.000 Zumbis Abatidos</span>
            <ProgressBar value={Math.min(kills, 800_000)} max={800_000} showValues />
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.spiffo_hq ? 'pp-obj-done' : ''}`}>
            {obj.spiffo_hq ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Sede do Spiffo's Conquistada (Louisville HQ)</span>
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.spiffo_relic ? 'pp-obj-done' : ''}`}>
            {obj.spiffo_relic ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Relíquia do Spiffo Coletada</span>
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.military_base ? 'pp-obj-done' : ''}`}>
            {obj.military_base ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Base Militar de Rosewood Conquistada</span>
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
                <span key={id} className="trait-badge trait-positive" data-tip={def.description}>
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
                <span key={id} className="trait-badge trait-negative" data-tip={def.description}>
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

const PP_DISQ_TOOLTIPS: Record<string, string> = {
  sandbox:     'Configurações do sandbox divergem do desafio oficial',
  debug:       'Jogador utilizou modo debug durante o desafio Brasileirão',
  mods:        'Jogador utilizou mods não permitidos no desafio Brasileirão',
  manual:      'Desclassificado manualmente pelo moderador',
  mod_removed: 'Mod do desafio foi removido durante a run',
};

function parseModViolations(reason: string | null | undefined): string[] {
  if (!reason?.startsWith('mods:')) return [];
  return reason.slice(5).split(',').map(v => {
    if (v.startsWith('NAO_PERMITIDO:')) return v.slice(14);
    if (v.startsWith('AUSENTE:'))       return `${v.slice(8)} (ausente)`;
    return v;
  }).filter(Boolean);
}

function ppDisqTooltip(reason: string | null | undefined): string {
  if (!reason) return PP_DISQ_TOOLTIPS.sandbox;
  if (reason.startsWith('mods:')) {
    const ids = parseModViolations(reason);
    return ids.length > 0 ? `Mods não permitidos: ${ids.join(', ')}` : PP_DISQ_TOOLTIPS.mods;
  }
  return PP_DISQ_TOOLTIPS[reason] ?? PP_DISQ_TOOLTIPS.mods;
}

function CharacterCard({ entry, rank, live }: { entry: Entry; rank: number | null; live?: LiveStatus[] }) {
  const [tab, setTab] = useState<'stats' | 'skills' | 'traits'>('stats');
  const [showGuide, setShowGuide] = useState(false);
  const isDisqualified = entry.sandbox_ok === false;

  return (
    <div className={`pp-char-card${isDisqualified ? ' pp-char-dead' : entry.is_alive ? '' : ' pp-char-dead'}`}>
      {/* Card header */}
      <div className="pp-char-header">
        <div className="pp-char-identity">
          <LiveBadges live={live} />
          <span className="pp-char-name">{entry.character_name || '—'}</span>
          {entry.profession && (
            <span className="profession-badge">
              {getProfessionImageUrl(entry.profession) && (
                <img src={getProfessionImageUrl(entry.profession)} alt="" className="profession-img" />
              )}
              {entry.profession}
            </span>
          )}
          {hasLiveWarning(entry) && (
            <span className="live-warning-badge" title="Vários syncs seguidos sem transmissão confirmada no YouTube ou na Twitch (obrigatória pelas regras)">
              <i className="ti ti-alert-triangle" /> Sem transmissão
            </span>
          )}
        </div>
        <div className="pp-char-right">
          {rank !== null && !isDisqualified && <span className="pp-char-rank">#{rank}</span>}
          {isDisqualified
            ? (
              <div className="pp-disq-block">
                <span
                  className="alive-badge disqualified"
                  title={ppDisqTooltip(entry.disqualification_reason)}
                >
                  <i className="ti ti-ban" /> Desclassificado
                </span>
                {parseModViolations(entry.disqualification_reason).length > 0 && (
                  <span className="pp-disq-mods">
                    <i className="ti ti-plug-x" />
                    {parseModViolations(entry.disqualification_reason).join(', ')}
                  </span>
                )}
              </div>
            )
            : entry.is_alive
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

      {/* Extended stats (PZRX3 — only shown when mod reports them and value > 0) */}
      {(() => {
        const extStats = [
          { key: 'animals',  tip: 'Animais abatidos',   icon: '🏹', v: entry.animals_killed },
          { key: 'fish',     tip: 'Peixes capturados',  icon: '🐟', v: entry.fish_caught },
          { key: 'crops',    tip: 'Vegetais colhidos',  icon: '🌽', v: entry.crops_harvested },
          { key: 'crafted',  tip: 'Itens fabricados',   icon: '🔨', v: entry.items_crafted },
          { key: 'looted',   tip: 'Casas saqueadas',    icon: '🏚️', v: entry.houses_looted },
          { key: 'sleep',    tip: 'Horas sem dormir',   icon: '😴', v: entry.hours_without_sleep, suffix: 'h' },
        ].filter(s => s.v != null && s.v > 0);
        if (extStats.length === 0) return null;
        return (
          <div className="pp-ext-stats">
            {extStats.map(s => (
              <span key={s.key} className="pp-ext-stat" data-tip={s.tip}>
                {s.icon} {s.v!.toLocaleString('pt-BR')}{s.suffix ?? ''}
              </span>
            ))}
          </div>
        );
      })()}

      {/* Perfil Psicológico */}
      {(() => {
        const { primary, secondary, traits, tags } = resolveArchetype(entry);
        return (
          <div className="pp-archetype" style={{ '--arch-color': primary.color } as React.CSSProperties}>
            <div className="pp-arch-badge">
              <span className="pp-arch-icon">{primary.icon}</span>
            </div>
            <div className="pp-arch-info">
              <span className="pp-arch-eyebrow">Perfil Psicológico</span>
              <div className="pp-arch-names">
                <span className="pp-arch-name">{primary.name}</span>
                {secondary && (
                  <span
                    className="pp-arch-secondary"
                    style={{ '--secondary-color': secondary.color } as React.CSSProperties}
                    data-tip={secondary.desc}
                  >
                    {secondary.icon} {secondary.name}
                  </span>
                )}
              </div>
              <span className="pp-arch-desc">{primary.desc}</span>
              {traits.length > 0 && (
                <div className="pp-arch-traits">
                  {traits.map(t => {
                    const pct = Math.round((t.score / t.max) * 100);
                    return (
                      <div key={t.key} className="pp-arch-trait">
                        <span className="pp-arch-trait-label">
                          <span className="pp-arch-trait-icon">{t.icon}</span>
                          {t.label}
                        </span>
                        <div className="pp-arch-trait-track">
                          <div
                            className="pp-arch-trait-fill"
                            style={{
                              width: `${pct}%`,
                              '--trait-glow': t.color,
                            } as React.CSSProperties}
                          />
                        </div>
                        <span className="pp-arch-trait-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {tags.length > 0 && (
                <div className="pp-arch-tags">
                  {tags.map(tag => (
                    <span
                      key={tag.id}
                      className="pp-arch-tag"
                      style={{ '--tag-color': tag.color } as React.CSSProperties}
                    >
                      {tag.icon} {tag.label}
                    </span>
                  ))}
                </div>
              )}
              <button
                className="pp-arch-guide-btn"
                onClick={() => setShowGuide(true)}
              >
                <i className="ti ti-books" />
                <span>Ver guia completo de perfis</span>
                <i className="ti ti-arrow-right pp-arch-guide-arrow" />
              </button>
            </div>
          </div>
        );
      })()}

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

      {showGuide && <ArchetypeGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

type CharFilter = 'all' | 'alive' | 'dead' | 'disqualified';

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile]       = useState<PlayerProfile | null>(null);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState<string | null>(null);
  const [charFilter, setCharFilter] = useState<CharFilter>('all');
  const [liveStatuses, setLiveStatuses] = useState<LiveStatus[]>([]);

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

    apiGetLiveStatus()
      .then(statuses => setLiveStatuses(statuses.filter(s => s.player_id === numId)))
      .catch(() => {});
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

  // Rank position map — igual ao public rank tab (só vivos e não-desclassificados, ordenados por score)
  // Isso garante que #N aqui corresponde ao #N que o usuário vê na aba "Rank" da página principal.
  const publicRankEntries = allEntries.filter(e => e.sandbox_ok !== false && e.is_alive);
  const rankMap = new Map(publicRankEntries.map((e, i) => [e.id, i + 1]));

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

  // Melhor entry viva para mostrar posição no rank público; se não houver viva, usa a melhor geral
  const bestAliveEntry = entries.find(e => e.sandbox_ok !== false && e.is_alive) ?? null;
  const bestEntry      = entries[0] ?? null;
  const bestRank       = bestAliveEntry?.id !== undefined ? (rankMap.get(bestAliveEntry.id) ?? null) : null;

  const hasSocials = SOCIALS.some(
    s => !!(profile.player[s.field as keyof typeof profile.player])
  );

  return (
    <div className="player-page" style={{ '--pp-bg-img': `url(${perfilBg})` } as React.CSSProperties}>
      <div className="container">
        {/* Back link */}
        <button className="btn-primary btn-sm back-btn-rank" onClick={() => navigate(-1)}>
          <i className="ti ti-arrow-left" /> Voltar
        </button>

        {/* Player header */}
        <div className="pp-header">
          <div className={`pp-avatar-wrap${profile.player.gender ? ` pp-avatar-wrap--${profile.player.gender}` : ''}`}>
            <img src={avatarDefault} alt="Avatar" className="pp-avatar-img" />
            {profile.player.gender && (
              <span className={`pp-avatar-gender-badge pp-avatar-gender-badge--${profile.player.gender}`}>
                <i className={`ti ${profile.player.gender === 'm' ? 'ti-man' : 'ti-woman'}`} />
              </span>
            )}
          </div>
          <div className="pp-header-info">
            <h1 className="pp-nick">{profile.player.nick}</h1>
            {hasSocials && (
              <div className="pp-socials">
                {SOCIALS.map(s => {
                  const url = profile.player[s.field as keyof typeof profile.player] as string | null;
                  return url ? (
                    <a key={s.field} href={normalizeUrl(url)} target="_blank" rel="noopener noreferrer"
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
                live={entry.is_alive ? liveStatuses : undefined}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
