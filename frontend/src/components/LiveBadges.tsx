import type { LiveStatus } from '../types';

const PLATFORM_ICON: Record<LiveStatus['platform'], string> = {
  youtube: 'ti-brand-youtube',
  twitch:  'ti-brand-twitch',
};

const PLATFORM_LABEL: Record<LiveStatus['platform'], string> = {
  youtube: 'YouTube',
  twitch:  'Twitch',
};

interface LiveBadgesProps {
  live?:     LiveStatus[];
  // Versão compacta: só ícone + ponto pulsante, sem texto "AO VIVO" — usada na
  // coluna dedicada da tabela, onde espaço horizontal é escasso.
  compact?:  boolean;
}

export function LiveBadges({ live, compact }: LiveBadgesProps) {
  if (!live || live.length === 0) return null;

  if (compact) {
    return (
      <span className="live-icons">
        {live.map(s => (
          <a
            key={s.platform}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`live-icon live-icon--${s.platform}`}
            title={`${PLATFORM_LABEL[s.platform]}${s.title ? ' — ' + s.title : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <i className={`ti ${PLATFORM_ICON[s.platform]}`} />
          </a>
        ))}
      </span>
    );
  }

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
          onClick={e => e.stopPropagation()}
        >
          <span className="live-dot" />
          <i className={`ti ${PLATFORM_ICON[s.platform]}`} />
          AO VIVO
        </a>
      ))}
    </>
  );
}
