import { useState, useEffect, useMemo } from 'react';
import { apiGetFeaturedStreamers, apiGetLiveStatus } from '../lib/api';
import { buildLiveMap } from '../lib/live';
import type { FeaturedStreamer, LiveStatus } from '../types';

function StreamerCard({ streamer, live }: { streamer: FeaturedStreamer; live?: LiveStatus[] }) {
  const isLive  = !!live && live.length > 0;
  // Ao vivo: leva direto pra transmissão. Offline: leva pro canal principal cadastrado.
  const fallbackUrl = streamer.youtube_url ?? streamer.twitch_url ?? undefined;
  const href = isLive ? live![0].url : fallbackUrl;

  return (
    <a
      href={href}
      target={href ? '_blank' : undefined}
      rel="noopener noreferrer"
      className={`streamer-card${isLive ? ' streamer-card-live' : ''}${href ? '' : ' streamer-card-no-link'}`}
    >
      <span className="streamer-card-nick">{streamer.nick}</span>
      <span className="streamer-card-platforms">
        {isLive
          ? live!.map(s => (
              <span key={s.platform} className={`streamer-live-dot streamer-live-dot--${s.platform}`} />
            ))
          : (
            <>
              {streamer.youtube_url && <i className="ti ti-brand-youtube" />}
              {streamer.twitch_url  && <i className="ti ti-brand-twitch" />}
            </>
          )}
      </span>
    </a>
  );
}

export function StreamersHighlight() {
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
      <h2 className="home-side-panel-title"><i className="ti ti-star" /> Streamers Oficiais</h2>
      {loading ? (
        <div className="home-side-panel-loading"><i className="ti ti-loader-2 spin" /></div>
      ) : sorted.length === 0 ? (
        <p className="home-side-panel-empty">Nenhum streamer oficial no momento.</p>
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
