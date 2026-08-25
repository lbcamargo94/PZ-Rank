import type { LiveStatus } from '../types';

const PLATFORM_ICON: Record<LiveStatus['platform'], string> = {
  youtube: 'ti-brand-youtube',
  twitch:  'ti-brand-twitch',
};

export function LiveBadges({ live }: { live?: LiveStatus[] }) {
  if (!live || live.length === 0) return null;

  return (
    <>
      {live.map(s => (
        <a
          key={s.platform}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`live-badge live-badge--${s.platform}`}
          title={s.title || 'Transmitindo agora'}
        >
          <span className="live-dot" />
          <i className={`ti ${PLATFORM_ICON[s.platform]}`} />
          AO VIVO
        </a>
      ))}
    </>
  );
}
