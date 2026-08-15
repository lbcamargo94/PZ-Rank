import { useState, useEffect, useCallback } from 'react';
import { apiGetAchievements, apiGetPlayerAchievements } from '../lib/api';
import type { Achievement, PlayerAchievement, AchievementTier } from '../types';

const TIER_ORDER: AchievementTier[] = ['legendary', 'platinum', 'gold', 'silver', 'bronze'];

const TIER_META: Record<AchievementTier, { label: string; emoji: string }> = {
  legendary: { label: 'Lendária', emoji: '🔴' },
  platinum:  { label: 'Platina',  emoji: '🟣' },
  gold:      { label: 'Ouro',     emoji: '🟡' },
  silver:    { label: 'Prata',    emoji: '⚪' },
  bronze:    { label: 'Bronze',   emoji: '🟤' },
};

// Stats that are tracked in player entries (can show progress)
const TRACKED_STATS = new Set([
  'kills', 'days', 'hours_without_sleep',
  'animals_killed', 'fish_caught', 'crops_harvested',
  'items_crafted', 'houses_looted',
  'trees_cut', 'books_read', 'structures_built', 'crops_planted',
  'spiffo_visited', 'spiffo_base_any', 'spiffo_base_five', 'all_spiffo_bases',
  // PZRX6
  'eggs_collected', 'milk_produced', 'stone_structures', 'ceramic_items',
  'forged_weapons', 'km_driven', 'cities_visited', 'military_visited',
  'meals_cooked', 'water_collected', 'materials_crafted', 'animal_tracks',
]);

const STAT_LABELS: Record<string, string> = {
  kills:               'zumbis',
  days:                'dias',
  hours_without_sleep: 'h s/ dormir',
  animals_killed:      'animais',
  fish_caught:         'peixes',
  crops_harvested:     'colheitas',
  items_crafted:       'itens',
  houses_looted:       'casas',
  trees_cut:           'árvores',
  books_read:          'livros',
  structures_built:    'estruturas',
  crops_planted:       'culturas',
  spiffo_visited:      'Spiffos',
  spiffo_base_any:     'Spiffos',
  spiffo_base_five:    'Spiffos',
  all_spiffo_bases:    'Spiffos',
  // PZRX6
  eggs_collected:      'ovos',
  milk_produced:       'leites',
  stone_structures:    'estruturas',
  ceramic_items:       'itens',
  forged_weapons:      'armas',
  km_driven:           'km',
  cities_visited:      'cidades',
  military_visited:    'bases',
  meals_cooked:        'refeições',
  water_collected:     'litros',
  materials_crafted:   'materiais',
  animal_tracks:       'rastros',
};

type PlayerStats = Record<string, number>;

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="pp-ach-progress-track">
      <div className="pp-ach-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function AchCard({
  a, unlocked, playerStats,
}: {
  a: Achievement;
  unlocked: PlayerAchievement | undefined;
  playerStats: PlayerStats;
}) {
  const isTracked  = TRACKED_STATS.has(a.stat);
  const current    = isTracked ? (playerStats[a.stat] ?? 0) : 0;
  const statLabel  = STAT_LABELS[a.stat] ?? a.stat;

  return (
    <div className={`pp-ach-card${unlocked ? ` pp-ach-unlocked pp-ach-${a.tier}` : ' pp-ach-locked'}`}>
      <span className="pp-ach-icon">{a.icon}</span>
      <span className="pp-ach-name">{a.name}</span>
      <span className="pp-ach-desc">{a.description}</span>

      {unlocked ? (
        <div className="pp-ach-meta">
          <span className="pp-ach-check"><i className="ti ti-check" /></span>
          <span className="pp-ach-date">
            {new Date(unlocked.unlocked_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      ) : (
        <div className="pp-ach-meta pp-ach-meta-locked">
          {isTracked ? (
            <>
              <ProgressBar value={current} max={a.threshold} />
              <span className="pp-ach-progress-label">
                {current.toLocaleString('pt-BR')}
                <span className="pp-ach-progress-sep">/</span>
                {a.threshold.toLocaleString('pt-BR')} {statLabel}
              </span>
            </>
          ) : (
            <span className="pp-ach-threshold">
              {a.threshold.toLocaleString('pt-BR')} {statLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function AchievementsSection({
  playerId,
  characterName,
  playerStats,
}: {
  playerId:      number;
  characterName: string;
  playerStats:   PlayerStats;
}) {
  const [all,      setAll]      = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<PlayerAchievement[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [open, setOpen]         = useState<Record<AchievementTier, boolean>>({
    legendary: true, platinum: true, gold: true, silver: false, bronze: false,
  });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([apiGetAchievements(), apiGetPlayerAchievements(playerId, characterName || undefined)])
      .then(([a, p]) => { setAll(a.achievements); setUnlocked(p.achievements); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [playerId, characterName]);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;

  if (error) {
    return (
      <div className="pp-ach-section">
        <h2 className="pp-section-title"><i className="ti ti-trophy" /> Conquistas</h2>
        <div className="pp-ach-error">
          <i className="ti ti-alert-circle" />
          <span>{error}</span>
          <button className="btn-ghost btn-sm" onClick={load}>
            <i className="ti ti-refresh" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (all.length === 0) return null;

  const unlockedMap = new Map(unlocked.map(u => [u.slug, u]));
  const byTier = Object.fromEntries(
    TIER_ORDER.map(t => [t, all.filter(a => a.tier === t)])
  ) as Record<AchievementTier, Achievement[]>;

  const totalUnlocked = unlocked.length;
  const total         = all.length;

  return (
    <div className="pp-ach-section">
      <div className="pp-ach-header">
        <h2 className="pp-section-title">
          <i className="ti ti-trophy" /> Conquistas
          <span className="pp-section-count">{totalUnlocked}/{total}</span>
        </h2>
        <div className="pp-ach-total-bar">
          <div
            className="pp-ach-total-fill"
            style={{ width: `${total > 0 ? (totalUnlocked / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {TIER_ORDER.map(tier => {
        const achs = byTier[tier];
        if (!achs?.length) return null;
        const meta       = TIER_META[tier];
        const tierUnlocked = achs.filter(a => unlockedMap.has(a.slug)).length;
        const isOpen     = open[tier];

        return (
          <div key={tier} className={`pp-ach-tier-group pp-ach-tier-group-${tier}`}>
            <button
              className="pp-ach-tier-toggle"
              onClick={() => setOpen(prev => ({ ...prev, [tier]: !prev[tier] }))}
            >
              <span className={`pp-ach-tier-label pp-ach-tier-${tier}`}>
                {meta.emoji} {meta.label}
              </span>
              <span className="pp-ach-tier-count">
                {tierUnlocked}/{achs.length}
              </span>
              <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} pp-ach-chevron`} />
            </button>

            {isOpen && (
              <div className="pp-ach-grid">
                {achs.map(a => (
                  <AchCard
                    key={a.slug}
                    a={a}
                    unlocked={unlockedMap.get(a.slug)}
                    playerStats={playerStats}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
