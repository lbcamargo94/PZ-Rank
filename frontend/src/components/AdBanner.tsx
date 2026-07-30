import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import adImg from '../../assets/background/espaco-publicidade.webp';

const CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT as string) ?? '';
const SLOT   = (import.meta.env.VITE_ADSENSE_SLOT   as string) ?? '';

function readIsSupporter(): boolean {
  try {
    const raw = sessionStorage.getItem('player_session');
    if (!raw) return false;
    return (JSON.parse(raw) as { is_supporter?: boolean }).is_supporter === true;
  } catch { return false; }
}

export function AdBanner() {
  const [supporter] = useState(readIsSupporter);
  const pushed = useRef(false);

  useEffect(() => {
    if (supporter || !CLIENT || !SLOT || pushed.current) return;
    pushed.current = true;

    if (!document.querySelector('script[data-adsense]')) {
      const s = document.createElement('script');
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.setAttribute('data-adsense', 'true');
      document.head.appendChild(s);
    }

    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle ?? []).push({});
    } catch { /* ignore */ }
  }, [supporter]);

  if (supporter) return null;

  return (
    <div className="ad-placeholder">
      {CLIENT && SLOT ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={CLIENT}
          data-ad-slot={SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <Link to="/transparencia" className="ad-placeholder-img-link" title="Anuncie no Brasileirão PZ">
          <img
            src={adImg}
            alt="Anuncie aqui — Apoie o Brasileirão PZ"
            className="ad-placeholder-img"
          />
        </Link>
      )}
    </div>
  );
}
