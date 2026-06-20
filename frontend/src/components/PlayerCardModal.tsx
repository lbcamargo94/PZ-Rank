import { useState, useEffect } from 'react';
import { apiGetPlayerProfile } from '../lib/api';
import type { PlayerProfile, Entry } from '../types';

interface Props {
  playerId: number;
  onClose:  () => void;
}

const SOCIALS = [
  { field: 'twitch_url',  icon: 'ti-brand-twitch',  label: 'Twitch',  cls: 'social-twitch'  },
  { field: 'youtube_url', icon: 'ti-brand-youtube', label: 'YouTube', cls: 'social-youtube' },
  { field: 'kick_url',    icon: 'ti-brand-kick',    label: 'Kick',    cls: 'social-kick'    },
  { field: 'tiktok_url',  icon: 'ti-brand-tiktok',  label: 'TikTok',  cls: 'social-tiktok'  },
] as const;

export function PlayerCardModal({ playerId, onClose }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGetPlayerProfile(playerId)
      .then(setProfile)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [playerId]);

  const bestEntry = profile?.entries.reduce<Entry | null>(
    (best, e) => (!best || e.score > best.score ? e : best),
    null,
  );

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box player-card-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        {loading && <p className="painel-loading"><i className="ti ti-loader-2 spin" /> Carregando...</p>}
        {error   && <p className="form-error">{error}</p>}

        {profile && (
          <>
            {/* ── Cabeçalho ── */}
            <div className="pc-header">
              <i className="ti ti-user-circle pc-avatar" />
              <div className="pc-header-info">
                <h2 className="pc-nick">{profile.player.nick}</h2>

                {/* Canais sociais */}
                <div className="pc-socials">
                  {SOCIALS.map(s => {
                    const url = profile.player[s.field as keyof typeof profile.player] as string | null;
                    return url ? (
                      <a key={s.field} href={url} target="_blank" rel="noopener noreferrer"
                        className={`pc-social-link ${s.cls}`} title={s.label}>
                        <i className={`ti ${s.icon}`} />
                        <span>{s.label}</span>
                      </a>
                    ) : null;
                  })}
                  {SOCIALS.every(s => !profile.player[s.field as keyof typeof profile.player]) && (
                    <span className="pc-no-socials">Sem canais cadastrados</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Melhor pontuação ── */}
            {bestEntry && (
              <div className="pc-best">
                <span className="pc-best-label"><i className="ti ti-trophy" /> Melhor pontuação</span>
                <span className="pc-best-score">{bestEntry.score.toLocaleString('pt-BR')} pts</span>
                {bestEntry.character_name && (
                  <span className="pc-best-char">com {bestEntry.character_name}</span>
                )}
              </div>
            )}

            {/* ── Personagens ── */}
            <div className="pc-chars-section">
              <p className="pc-section-title">
                <i className="ti ti-users" /> Personagens no rank
                <span className="pc-char-count">{profile.entries.length}</span>
              </p>

              {profile.entries.length === 0 && (
                <p className="painel-empty">Nenhum personagem no rank ainda.</p>
              )}

              <div className="pc-chars-list">
                {profile.entries.map(e => (
                  <div key={e.id} className={`pc-char-card${e === bestEntry ? ' pc-char-best' : ''}`}>
                    <div className="pc-char-top">
                      <div className="pc-char-identity">
                        <span className="pc-char-name">{e.character_name || '—'}</span>
                        {e.profession && <span className="profession-badge">{e.profession}</span>}
                      </div>
                      {e.is_alive
                        ? <span className="alive-badge alive"><i className="ti ti-heartbeat" /> Vivo</span>
                        : <span className="alive-badge dead"><i className="ti ti-skull" /> Morto</span>}
                    </div>

                    <div className="pc-char-stats">
                      <span className="pc-stat"><i className="ti ti-star" />{e.score.toLocaleString('pt-BR')} pts</span>
                      <span className="pc-stat"><i className="ti ti-calendar" />{e.days}d</span>
                      <span className="pc-stat"><i className="ti ti-sword" />{e.kills.toLocaleString('pt-BR')}</span>
                      {e.time_str && <span className="pc-stat"><i className="ti ti-clock" />{e.time_str}</span>}
                    </div>

                    {e.live_url && (
                      <a href={e.live_url} target="_blank" rel="noopener noreferrer"
                        className="pc-live-link">
                        <i className="ti ti-brand-twitch" /> Ver live
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
