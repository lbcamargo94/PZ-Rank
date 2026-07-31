import { useState, useEffect, useCallback } from 'react';
import { apiGetAchievements, apiGetPlayerAchievements } from '../lib/api';
import type { Achievement, PlayerAchievement } from '../types';

const TIER_ORDER = ['gold', 'silver', 'bronze'] as const;
const TIER_LABELS: Record<string, string> = { gold: 'Ouro', silver: 'Prata', bronze: 'Bronze' };

const EXTENDED_STATS = new Set([
  'animals_killed', 'fish_caught', 'crops_harvested',
  'items_crafted', 'houses_looted', 'hours_without_sleep',
]);

const STAT_LABELS: Record<string, string> = {
  kills:               'kills',
  days:                'dias',
  animals_killed:      'animais',
  fish_caught:         'peixes',
  crops_harvested:     'colheitas',
  items_crafted:       'itens',
  houses_looted:       'casas',
  hours_without_sleep: 'h s/ dormir',
};

export function AchievementsSection({ playerId }: { playerId: number }) {
  const [all,      setAll]      = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<PlayerAchievement[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([apiGetAchievements(), apiGetPlayerAchievements(playerId)])
      .then(([a, p]) => { setAll(a.achievements); setUnlocked(p.achievements); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;

  if (error) {
    return (
      <div className="pp-ach-section">
        <h2 className="pp-section-title">
          <i className="ti ti-trophy" /> Conquistas
        </h2>
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
  const byTier = Object.fromEntries(TIER_ORDER.map(t => [t, all.filter(a => a.tier === t)]));

  return (
    <div className="pp-ach-section">
      <h2 className="pp-section-title">
        <i className="ti ti-trophy" /> Conquistas
        <span className="pp-section-count">{unlocked.length}/{all.length}</span>
      </h2>

      {TIER_ORDER.map(tier => {
        const achs = byTier[tier];
        if (!achs?.length) return null;
        return (
          <div key={tier} className="pp-ach-tier-group">
            <span className={`pp-ach-tier-label pp-ach-tier-${tier}`}>{TIER_LABELS[tier]}</span>
            <div className="pp-ach-grid">
              {achs.map(a => {
                const u = unlockedMap.get(a.slug);
                return (
                  <div
                    key={a.slug}
                    className={`pp-ach-card${u ? ` pp-ach-unlocked pp-ach-${a.tier}` : ' pp-ach-locked'}`}
                    title={u
                      ? `Desbloqueado em ${new Date(u.unlocked_at).toLocaleDateString('pt-BR')}`
                      : a.description}
                  >
                    <span className="pp-ach-icon">{a.icon}</span>
                    <span className="pp-ach-name">{a.name}</span>
                    <span className="pp-ach-desc">{a.description}</span>
                    {u ? (
                      <div className="pp-ach-meta">
                        <span className="pp-ach-date">
                          {new Date(u.unlocked_at).toLocaleDateString('pt-BR')}
                        </span>
                        {u.entry_id != null && (
                          <span className="pp-ach-run">Run #{u.entry_id}</span>
                        )}
                      </div>
                    ) : (
                      <div className="pp-ach-meta pp-ach-meta-locked">
                        <span className="pp-ach-threshold">
                          {a.threshold.toLocaleString('pt-BR')} {STAT_LABELS[a.stat] ?? a.stat}
                        </span>
                        {EXTENDED_STATS.has(a.stat) && (
                          <span className="pp-ach-mod-req">mod v2.7+</span>
                        )}
                        <i className="ti ti-lock pp-ach-lock" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
