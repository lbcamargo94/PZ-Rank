import { useState, useEffect } from 'react';
import { apiUpdatePlayerLinks } from '../../lib/api';
import type { Player } from '../../types';

interface Props {
  player:    Player;
  token:     string;
  onClose:   () => void;
  onSuccess: (updated: Player) => void;
  showToast: (msg: string, type?: string) => void;
}

const SOCIALS = [
  { id: 'twitch',  key: 'twitch_url'  as const, label: 'Twitch',  icon: 'ti-brand-twitch',  placeholder: 'https://twitch.tv/seunick',    color: '#9146ff' },
  { id: 'youtube', key: 'youtube_url' as const, label: 'YouTube', icon: 'ti-brand-youtube', placeholder: 'https://youtube.com/@seunick', color: '#ff0000' },
  { id: 'kick',    key: 'kick_url'    as const, label: 'Kick',    icon: 'ti-brand-kick',    placeholder: 'https://kick.com/seunick',      color: '#53fc18' },
  { id: 'tiktok',  key: 'tiktok_url'  as const, label: 'TikTok',  icon: 'ti-brand-tiktok',  placeholder: 'https://tiktok.com/@seunick',  color: '#ee1d52' },
];

export function EditLinksModal({ player, token, onClose, onSuccess, showToast }: Props) {
  const [links, setLinks] = useState({
    twitch_url:  player.twitch_url  ?? '',
    youtube_url: player.youtube_url ?? '',
    kick_url:    player.kick_url    ?? '',
    tiktok_url:  player.tiktok_url  ?? '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await apiUpdatePlayerLinks(token, player.id, {
        twitch_url:  links.twitch_url.trim()  || null,
        youtube_url: links.youtube_url.trim() || null,
        kick_url:    links.kick_url.trim()    || null,
        tiktok_url:  links.tiktok_url.trim()  || null,
      });
      showToast(`Links de ${player.nick} atualizados.`, 'success');
      onSuccess(updated);
      onClose();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        <h2 className="modal-title">
          <i className="ti ti-link" /> Editar Links — {player.nick}
        </h2>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="reg-socials-grid">
            {SOCIALS.map(s => (
              <div key={s.id} className="reg-social-item" style={{ '--social-color': s.color } as React.CSSProperties}>
                <label className="reg-social-label" htmlFor={`el-${s.id}`}>
                  <i className={`ti ${s.icon}`} />
                  {s.label}
                </label>
                <input
                  id={`el-${s.id}`}
                  className="form-input reg-social-input"
                  type="url"
                  placeholder={s.placeholder}
                  value={links[s.key]}
                  onChange={e => setLinks(prev => ({ ...prev, [s.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <p className="reg-socials-hint" style={{ marginTop: '0.5rem' }}>
            Deixe em branco para remover o link. URLs devem começar com https://.
          </p>

          <div className="confirm-modal-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? <><i className="ti ti-loader-2" /> Salvando...</>
                : <><i className="ti ti-check" /> Salvar links</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}