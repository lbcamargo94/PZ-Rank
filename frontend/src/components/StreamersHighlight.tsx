import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiGetFeaturedStreamers, apiGetLiveStatus } from '../lib/api';
import { buildLiveMap } from '../lib/live';
import { LiveBadges } from './LiveBadges';
import type { FeaturedStreamer, LiveStatus } from '../types';

function StreamerCard({ streamer, live }: { streamer: FeaturedStreamer; live?: LiveStatus[] }) {
  const { t } = useTranslation();
  const isLive = !!live && live.length > 0;

  return (
    <div className={`streamer-card${isLive ? ' streamer-card-live' : ''}`}>
      {/* Nome: link próprio para o perfil do jogador no PZ Rank */}
      <Link to={`/player/${streamer.id}`} className="streamer-card-nick">
        {streamer.nick}
      </Link>
      {/* Plataformas: um link por plataforma — ao vivo (compact) ou canal cadastrado */}
      <span className="streamer-card-platforms">
        {isLive ? (
          <LiveBadges live={live} compact />
        ) : (
          <>
            {streamer.youtube_url && (
              <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" className="streamer-platform-link" title={t('home.streamers.youtube_channel')}>
                <i className="ti ti-brand-youtube" />
              </a>
            )}
            {streamer.twitch_url && (
              <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" className="streamer-platform-link" title={t('home.streamers.twitch_channel')}>
                <i className="ti ti-brand-twitch" />
              </a>
            )}
          </>
        )}
      </span>
    </div>
  );
}

export function StreamersHighlight() {
  const { t } = useTranslation();
  const [streamers, setStreamers]         = useState<FeaturedStreamer[]>([]);
  const [liveStatuses, setLiveStatuses]   = useState<LiveStatus[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.all([apiGetFeaturedStreamers(), apiGetLiveStatus()])
      .then(([s, l]) => { setStreamers(s); setLiveStatuses(l); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const liveMap = useMemo(() => buildLiveMap(liveStatuses), [liveStatuses]);

  const sorted = useMemo(() => {
    return [...streamers].sort((a, b) => {
      const aLive = liveMap.has(a.id) ? 1 : 0;
      const bLive = liveMap.has(b.id) ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;
      return a.nick.localeCompare(b.nick);
    });
  }, [streamers, liveMap]);

  return (
    <section className="home-side-panel streamers-highlight">
      <h2 className="home-side-panel-title"><i className="ti ti-star" /> {t('home.streamers.title')}</h2>
      {loading ? (
        <div className="home-side-panel-loading"><i className="ti ti-loader-2 spin" /></div>
      ) : sorted.length === 0 ? (
        <p className="home-side-panel-empty">{t('home.streamers.empty')}</p>
      ) : (
        <div className="streamers-highlight-list">
          {sorted.map(s => (
            <StreamerCard key={s.id} streamer={s} live={liveMap.get(s.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
