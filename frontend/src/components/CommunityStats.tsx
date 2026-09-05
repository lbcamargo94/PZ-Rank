import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiGetGlobalStats, apiGetActiveSeason, apiGetSteamPlayers, type GlobalStats } from '../lib/api';
import { formatCompactNumber } from '../lib/format';
import { useSse } from '../hooks/useSse';
import type { Season } from '../types';

const STATS_REFRESH_MS  = 60_000;       // fallback de polling
const STEAM_REFRESH_MS  = 5 * 60_000;  // Steam API é externa, atualiza a cada 5 min

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export function CommunityStats() {
  const { t } = useTranslation();
  const [stats,        setStats]        = useState<GlobalStats | null>(null);
  const [season,       setSeason]       = useState<Season | null>(null);
  const [steamPlayers, setSteamPlayers] = useState<number | null>(null);

  const refreshStats = useCallback(() => {
    apiGetGlobalStats().then(setStats).catch(() => {});
  }, []);

  const refreshSteam = useCallback(() => {
    apiGetSteamPlayers().then(r => setSteamPlayers(r.player_count)).catch(() => {});
  }, []);

  // Carga inicial — season é estático, não precisa de refresh
  useEffect(() => {
    refreshStats();
    refreshSteam();
    apiGetActiveSeason().then(setSeason).catch(() => {});

    const statsInterval = setInterval(refreshStats, STATS_REFRESH_MS);
    const steamInterval = setInterval(refreshSteam, STEAM_REFRESH_MS);
    return () => { clearInterval(statsInterval); clearInterval(steamInterval); };
  }, [refreshStats, refreshSteam]);

  // Atualiza stats imediatamente quando qualquer sync ou morte ocorrer
  useSse({
    'rank-updated': refreshStats,
    'player-died':  refreshStats,
  });

  if (!stats && !season) return null;

  const days = season ? daysSince(season.started_at) : 0;

  return (
    <div className="community-stats">
      <div className="cs-row">

        {season && (
          <div className="cs-item cs-item--season">
            <i className="ti ti-shield-star" />
            <span className="cs-value cs-season-name">{season.name}</span>
            <span className="cs-desc">
              {days > 0 ? t('home.stats.season_active_days', { count: days }) : t('home.stats.season_active_today')}
            </span>
          </div>
        )}

        {season && stats && <div className="cs-vdivider" />}

        {stats && (
          <>
            <div className="cs-item cs-item--kills">
              <i className="ti ti-sword" />
              <span className="cs-value">{formatCompactNumber(stats.total_kills)}</span>
              <span className="cs-desc">{t('home.stats.zombies')}</span>
            </div>
            <div className="cs-vdivider" />
            <div className="cs-item cs-item--days">
              <i className="ti ti-calendar-stats" />
              <span className="cs-value">{formatCompactNumber(stats.total_days)}</span>
              <span className="cs-desc">{t('home.stats.days_survived')}</span>
            </div>
            <div className="cs-vdivider" />
            <div className="cs-item cs-item--alive">
              <i className="ti ti-heartbeat" />
              <span className="cs-value">{formatCompactNumber(stats.alive_count)}</span>
              <span className="cs-desc">{t('home.stats.alive')}</span>
            </div>
            <div className="cs-vdivider" />
            <div className="cs-item cs-item--dead">
              <i className="ti ti-skull" />
              <span className="cs-value">{formatCompactNumber(stats.dead_count)}</span>
              <span className="cs-desc">{t('home.stats.dead')}</span>
            </div>
            {stats.active_count > 0 && (
              <>
                <div className="cs-vdivider" />
                <div className="cs-item cs-item--active">
                  <span className="cs-active-dot" aria-hidden="true" />
                  <span className="cs-value">{formatCompactNumber(stats.active_count)}</span>
                  <span className="cs-desc">{t('home.stats.playing_today')}</span>
                </div>
              </>
            )}
            {steamPlayers !== null && (
              <>
                <div className="cs-vdivider" />
                <div className="cs-item cs-item--steam">
                  <i className="ti ti-brand-steam" />
                  <span className="cs-value">{formatCompactNumber(steamPlayers)}</span>
                  <span className="cs-desc">{t('home.stats.on_pz_now')}</span>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
