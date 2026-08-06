import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import avatarDefault from '../../assets/avatar.png';
import perfilBg from '../../assets/background/perfil-usuario.webp';
import { apiGetPlayerProfile, apiGetEntries } from '../lib/api';
import { parseSkillMap, SKILL_CATEGORIES, MAX_SKILL_LEVEL, TOTAL_SKILLS } from '../lib/skills';
import { parseTraitList, resolveTrait, getTraitImageUrl } from '../lib/traits';
import { getProfessionImageUrl } from '../lib/professions';
import { SPIFFOS_RESTAURANTS, BASE_ITEMS, initObjectives } from '../lib/objectives';
import { ProgressBar } from '../components/ProgressBar';
import { resolveArchetype } from '../lib/archetype';
import { AchievementsSection } from '../components/AchievementsSection';
import { ArchetypeGuideModal } from '../components/ArchetypeGuideModal';
import type { PlayerProfile, Entry } from '../types';
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
          <div className={`pp-obj-badge ${obj.kills_800k ? 'pp-obj-done' : ''}`}>
            {obj.kills_800k ? <i className="ti ti-check" /> : <i className="ti ti-clock" />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">800.000 Zumbis Abatidos</span>
            <ProgressBar value={Math.min(kills, 800_000)} max={800_000} showValues />
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

function CharacterCard({ entry, rank }: { entry: Entry; rank: number | null }) {
  const [tab, setTab] = useState<'stats' | 'skills' | 'traits'>('stats');
  const [showGuide, setShowGuide] = useState(false);
  const isDisqualified = entry.sandbox_ok === false;

  return (
    <div className={`pp-char-card${isDisqualified ? ' pp-char-dead' : entry.is_alive ? '' : ' pp-char-dead'}`}>
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

      {/* Extended stats (PZRX3 — only shown when mod reports them) */}
      {(entry.animals_killed != null || entry.fish_caught != null ||
        entry.crops_harvested != null || entry.items_crafted != null ||
        entry.houses_looted != null || entry.hours_without_sleep != null) && (
        <div className="pp-ext-stats">
          {entry.animals_killed  != null && <span className="pp-ext-stat" data-tip="Animais abatidos">🏹 {entry.animals_killed.toLocaleString('pt-BR')}</span>}
          {entry.fish_caught     != null && <span className="pp-ext-stat" data-tip="Peixes capturados">🐟 {entry.fish_caught.toLocaleString('pt-BR')}</span>}
          {entry.crops_harvested != null && <span className="pp-ext-stat" data-tip="Vegetais colhidos">🌽 {entry.crops_harvested.toLocaleString('pt-BR')}</span>}
          {entry.items_crafted   != null && <span className="pp-ext-stat" data-tip="Itens fabricados">🔨 {entry.items_crafted.toLocaleString('pt-BR')}</span>}
          {entry.houses_looted   != null && <span className="pp-ext-stat" data-tip="Casas saqueadas">🏚️ {entry.houses_looted.toLocaleString('pt-BR')}</span>}
          {entry.hours_without_sleep != null && <span className="pp-ext-stat" data-tip="Horas sem dormir">😴 {entry.hours_without_sleep}h</span>}
        </div>
      )}

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
              />
            ))}
          </div>
        </div>

        <AchievementsSection
          playerId={profile.player.id}
          playerStats={(() => {
            const base = entries.reduce((best, e) => ({
              kills:               Math.max(best.kills,               e.kills               ?? 0),
              days:                Math.max(best.days,                e.days                ?? 0),
              hours_without_sleep: Math.max(best.hours_without_sleep, e.hours_without_sleep ?? 0),
              animals_killed:      Math.max(best.animals_killed,      e.animals_killed      ?? 0),
              fish_caught:         Math.max(best.fish_caught,         e.fish_caught         ?? 0),
              crops_harvested:     Math.max(best.crops_harvested,     e.crops_harvested     ?? 0),
              items_crafted:       Math.max(best.items_crafted,       e.items_crafted       ?? 0),
              houses_looted:       Math.max(best.houses_looted,       e.houses_looted       ?? 0),
              trees_cut:           Math.max(best.trees_cut,           e.trees_cut           ?? 0),
              books_read:          Math.max(best.books_read,          e.books_read          ?? 0),
              structures_built:    Math.max(best.structures_built,    e.structures_built    ?? 0),
              crops_planted:       Math.max(best.crops_planted,       e.crops_planted       ?? 0),
              spiffo_visited:      Math.max(best.spiffo_visited,      e.spiffo_visited      ?? 0),
              eggs_collected:      Math.max(best.eggs_collected,      e.eggs_collected      ?? 0),
              milk_produced:       Math.max(best.milk_produced,       e.milk_produced       ?? 0),
              stone_structures:    Math.max(best.stone_structures,    e.stone_structures    ?? 0),
              ceramic_items:       Math.max(best.ceramic_items,       e.ceramic_items       ?? 0),
              forged_weapons:      Math.max(best.forged_weapons,      e.forged_weapons      ?? 0),
              km_driven:           Math.max(best.km_driven,           e.km_driven           ?? 0),
              cities_visited:      Math.max(best.cities_visited,      e.cities_visited      ?? 0),
              military_visited:    Math.max(best.military_visited,    e.military_visited    ?? 0),
              meals_cooked:        Math.max(best.meals_cooked,        e.meals_cooked        ?? 0),
              water_collected:     Math.max(best.water_collected,     e.water_collected     ?? 0),
              materials_crafted:   Math.max(best.materials_crafted,   e.materials_crafted   ?? 0),
              animal_tracks:       Math.max(best.animal_tracks,       e.animal_tracks       ?? 0),
            }), { kills: 0, days: 0, hours_without_sleep: 0, animals_killed: 0, fish_caught: 0, crops_harvested: 0, items_crafted: 0, houses_looted: 0, trees_cut: 0, books_read: 0, structures_built: 0, crops_planted: 0, spiffo_visited: 0, eggs_collected: 0, milk_produced: 0, stone_structures: 0, ceramic_items: 0, forged_weapons: 0, km_driven: 0, cities_visited: 0, military_visited: 0, meals_cooked: 0, water_collected: 0, materials_crafted: 0, animal_tracks: 0 });
            return {
              ...base,
              spiffo_base_any:  base.spiffo_visited,
              spiffo_base_five: base.spiffo_visited,
              all_spiffo_bases: base.spiffo_visited >= 13 ? 1 : 0,
            };
          })()}
        />
      </div>
    </div>
  );
}
