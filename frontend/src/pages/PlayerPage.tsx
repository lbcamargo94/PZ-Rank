import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import avatarDefault from '../../assets/avatar.png';
import { apiGetPlayerProfile, apiGetEntries } from '../lib/api';
import { parseSkillMap, SKILL_CATEGORIES, MAX_SKILL_LEVEL, TOTAL_SKILLS } from '../lib/skills';
import { parseTraitList, resolveTrait, getTraitImageUrl } from '../lib/traits';
import { getProfessionImageUrl } from '../lib/professions';
import { SPIFFOS_RESTAURANTS, BASE_ITEMS, initObjectives } from '../lib/objectives';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { PlayerProfile, Entry } from '../types';
import type { Objectives } from '../lib/objectives';
import {
  IconLoader2,
  IconAlertCircle,
  IconArrowLeft,
  IconBrandTwitch,
  IconBrandYoutube,
  IconBrandKick,
  IconBrandTiktok,
  IconHeartbeat,
  IconSkull,
  IconCalendar,
  IconClock,
  IconSword,
  IconUsers,
  IconBan,
  IconInfoCircle,
  IconStar,
  IconCheck,
  IconX,
  IconBuildingStore,
  IconCirclePlus,
  IconCircleMinus,
  IconTrophy,
} from '@tabler/icons-react';

type SocialIconName = 'ti-brand-twitch' | 'ti-brand-youtube' | 'ti-brand-kick' | 'ti-brand-tiktok';

const SOCIAL_ICON_MAP: Record<SocialIconName, React.ReactElement> = {
  'ti-brand-twitch':  <IconBrandTwitch  size={16} />,
  'ti-brand-youtube': <IconBrandYoutube size={16} />,
  'ti-brand-kick':    <IconBrandKick    size={16} />,
  'ti-brand-tiktok':  <IconBrandTiktok  size={16} />,
};

const SOCIALS = [
  { field: 'twitch_url',  icon: 'ti-brand-twitch'  as SocialIconName, label: 'Twitch',  cls: 'social-twitch'  },
  { field: 'youtube_url', icon: 'ti-brand-youtube' as SocialIconName, label: 'YouTube', cls: 'social-youtube' },
  { field: 'kick_url',    icon: 'ti-brand-kick'    as SocialIconName, label: 'Kick',    cls: 'social-kick'    },
  { field: 'tiktok_url',  icon: 'ti-brand-tiktok'  as SocialIconName, label: 'TikTok',  cls: 'social-tiktok'  },
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
          <IconInfoCircle size={16} />
          Objetivos ainda não registrados pelo moderador. Mostrando estado inicial.
        </div>
      )}

      {/* Special objectives */}
      <div className="pp-obj-group">
        <h4 className="pp-obj-group-title"><IconStar size={16} /> Objetivos Especiais</h4>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.kills_500k ? 'pp-obj-done' : ''}`}>
            {obj.kills_500k ? <IconCheck size={16} /> : <IconClock size={16} />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">500.000 Zumbis Abatidos</span>
            <ProgressBar value={Math.min(kills, 500_000)} max={500_000} showValues />
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.all_skills_10 ? 'pp-obj-done' : ''}`}>
            {obj.all_skills_10 ? <IconCheck size={16} /> : <IconClock size={16} />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Todas as Habilidades no Nível 10</span>
            <span className="pp-obj-note">Registrado pelo mod no momento da sincronização</span>
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.spiffo_statue ? 'pp-obj-done' : ''}`}>
            {obj.spiffo_statue ? <IconCheck size={16} /> : <IconClock size={16} />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Estátua do Spiffo (Louisville)</span>
          </div>
        </div>

        <div className="pp-obj-item">
          <div className={`pp-obj-badge ${obj.military_base ? 'pp-obj-done' : ''}`}>
            {obj.military_base ? <IconCheck size={16} /> : <IconClock size={16} />}
          </div>
          <div className="pp-obj-body">
            <span className="pp-obj-name">Base Militar de Rosewood Limpa</span>
          </div>
        </div>
      </div>

      {/* Bases Spiffo's */}
      <div className="pp-obj-group">
        <h4 className="pp-obj-group-title">
          <IconBuildingStore size={16} /> Bases nos Spiffo's
          <span className="pp-obj-count">{basesCount}/{SPIFFOS_RESTAURANTS.length}</span>
        </h4>
        <ProgressBar value={basesCount} max={SPIFFOS_RESTAURANTS.length} />
        <div className="pp-bases-grid">
          {bases.map(b => {
            const itemsDone = BASE_ITEMS.filter(i => (b as Record<string, unknown>)[i.id]).length;
            return (
              <div key={b.id} className={`pp-base ${b.has_base ? 'pp-base-done' : ''}`}>
                <span className="pp-base-icon">
                  {b.has_base ? <IconCheck size={16} /> : <IconX size={16} />}
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
          <span className="pp-trait-group-label"><IconCirclePlus size={16} /> Positivas</span>
          <div className="pp-trait-list">
            {positive.map(id => {
              const def = resolveTrait(id);
              const img = getTraitImageUrl(def);
              return (
                <span key={id} className="trait-badge trait-positive">
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
          <span className="pp-trait-group-label"><IconCircleMinus size={16} /> Negativas</span>
          <div className="pp-trait-list">
            {negative.map(id => {
              const def = resolveTrait(id);
              const img = getTraitImageUrl(def);
              return (
                <span key={id} className="trait-badge trait-negative">
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
  const isDisc  = entry.sandbox_ok === false;
  const isAlive = !isDisc && entry.is_alive;
  const isDead  = !isDisc && !entry.is_alive;

  const cardCls = `pp-char-card${isAlive ? ' pp-char-alive' : isDead ? ' pp-char-dead' : ' pp-char-disc'}`;
  const rankCls = `pp-char-rank${rank === 1 ? ' pp-rank-gold' : rank === 2 ? ' pp-rank-silver' : rank === 3 ? ' pp-rank-bronze' : ''}`;

  return (
    <div className={cardCls}>
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
          {rank !== null && <span className={rankCls}>#{rank}</span>}
          {isDisc
            ? <span className="alive-badge disqualified"><IconBan size={16} /> Desclassificado</span>
            : isAlive
              ? <span className="alive-badge alive"><IconHeartbeat size={16} /> Vivo</span>
              : <span className="alive-badge dead"><IconSkull size={16} /> Morto</span>}
        </div>
      </div>

      {/* Score highlight */}
      <div className="pp-char-score">
        <span className="pp-score-val">{entry.score.toLocaleString('pt-BR')}</span>
        <span className="pp-score-label">pontos</span>
      </div>

      {/* Quick stats row */}
      <div className="pp-char-stats-row">
        <span className="pp-stat"><IconCalendar size={14} />{entry.days}d</span>
        <span className="pp-stat"><IconClock size={14} />{entry.time_str ?? '—'}</span>
        <span className="pp-stat"><IconSword size={14} />{entry.kills.toLocaleString('pt-BR')}</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="pp-tabs-root">
        <TabsList className="pp-tabs">
          <TabsTrigger value="stats">Objetivos</TabsTrigger>
          <TabsTrigger value="skills">Habilidades</TabsTrigger>
          <TabsTrigger value="traits">Características</TabsTrigger>
        </TabsList>
        <TabsContent value="stats"  className="pp-tab-body"><ObjectivesSection objectives={entry.objectives} kills={entry.kills} /></TabsContent>
        <TabsContent value="skills" className="pp-tab-body"><SkillsSection skillsStr={entry.skills} /></TabsContent>
        <TabsContent value="traits" className="pp-tab-body"><TraitsSection traitsRaw={entry.traits} /></TabsContent>
      </Tabs>
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
          <IconLoader2 size={16} className="animate-spin" /> Carregando perfil...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="player-page player-page-state">
        <div className="container">
          <div className="player-page-error">
            <IconAlertCircle size={24} />
            <p>{error ?? 'Jogador não encontrado.'}</p>
            <Button asChild size="sm">
              <Link to="/"><IconArrowLeft size={16} /> Voltar ao ranking</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const rankMap = new Map(allEntries.map((e, i) => [e.id, i + 1]));
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
        <Button asChild size="sm" variant="ghost" className="back-btn-rank">
          <Link to="/"><IconArrowLeft size={16} /> Ranking</Link>
        </Button>

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
                      {SOCIAL_ICON_MAP[s.icon]} {s.label}
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
            <Card className="pp-sum-card">
              <CardContent className="flex flex-col gap-1 py-3 px-4">
                <span className="pp-sum-icon"><IconTrophy size={16} /></span>
                <span className="pp-sum-label">Melhor posição</span>
                <span className="pp-sum-value">{bestRank !== null ? `#${bestRank}` : '—'}</span>
              </CardContent>
            </Card>
            <Card className="pp-sum-card">
              <CardContent className="flex flex-col gap-1 py-3 px-4">
                <span className="pp-sum-icon"><IconStar size={16} /></span>
                <span className="pp-sum-label">Melhor pontuação</span>
                <span className="pp-sum-value">{bestEntry.score.toLocaleString('pt-BR')} pts</span>
              </CardContent>
            </Card>
            <Card className="pp-sum-card">
              <CardContent className="flex flex-col gap-1 py-3 px-4">
                <span className="pp-sum-icon"><IconUsers size={16} /></span>
                <span className="pp-sum-label">Personagens</span>
                <span className="pp-sum-value">{entries.length}</span>
              </CardContent>
            </Card>
            <Card className="pp-sum-card">
              <CardContent className="flex flex-col gap-1 py-3 px-4">
                <span className="pp-sum-icon"><IconSword size={16} /></span>
                <span className="pp-sum-label">Maior massacre</span>
                <span className="pp-sum-value">{bestEntry.kills.toLocaleString('pt-BR')}</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Characters */}
        <div className="pp-chars-section">
          <div className="pp-chars-header">
            <h2 className="pp-section-title">
              <IconUsers size={18} /> Personagens no Ranking
              <span className="pp-section-count">{entries.length}</span>
            </h2>
            <div className="pp-char-filter">
              <Button variant={charFilter === 'all' ? 'secondary' : 'ghost'} size="sm"
                onClick={() => setCharFilter('all')}>
                Todos ({entries.length})
              </Button>
              <Button variant={charFilter === 'alive' ? 'secondary' : 'ghost'} size="sm"
                onClick={() => setCharFilter('alive')}>
                <IconHeartbeat size={16} /> Vivos ({aliveCount})
              </Button>
              <Button variant={charFilter === 'dead' ? 'secondary' : 'ghost'} size="sm"
                onClick={() => setCharFilter('dead')}>
                <IconSkull size={16} /> Mortos ({deadCount})
              </Button>
              {descCount > 0 && (
                <Button variant={charFilter === 'disqualified' ? 'secondary' : 'ghost'} size="sm"
                  onClick={() => setCharFilter('disqualified')}>
                  <IconBan size={16} /> Desclassificados ({descCount})
                </Button>
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