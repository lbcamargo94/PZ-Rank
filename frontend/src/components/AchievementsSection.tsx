import { useState, useEffect } from 'react';
import { apiGetAchievements, apiGetPlayerAchievements } from '../lib/api';
import type { Achievement, PlayerAchievement } from '../types';

const TIER_ORDER = ['gold', 'silver', 'bronze'] as const;
const TIER_LABELS: Record<string, string> = { gold: 'Ouro', silver: 'Prata', bronze: 'Bronze' };

export function AchievementsSection({ playerId }: { playerId: number }) {
  const [all,      setAll]      = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<PlayerAchievement[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([apiGetAchievements(), apiGetPlayerAchievements(playerId)])
      .then(([a, p]) => { setAll(a.achievements); setUnlocked(p.achievements); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading || all.length === 0) return null;

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
                    {u
                      ? <span className="pp-ach-date">{new Date(u.unlocked_at).toLocaleDateString('pt-BR')}</span>
                      : <i className="ti ti-lock pp-ach-lock" />
                    }
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
