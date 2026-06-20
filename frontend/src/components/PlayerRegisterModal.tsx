import { useState, useEffect } from 'react';
import { apiRegisterPlayer } from '../lib/api';

interface Props {
  onClose:   () => void;
  showToast: (msg: string, type?: string) => void;
}

const SOCIALS = [
  { id: 'twitch',  label: 'Twitch',  icon: 'ti-brand-twitch',  placeholder: 'twitch.tv/seunick',     cls: 'social-twitch'  },
  { id: 'youtube', label: 'YouTube', icon: 'ti-brand-youtube', placeholder: 'youtube.com/@seunick',  cls: 'social-youtube' },
  { id: 'kick',    label: 'Kick',    icon: 'ti-brand-kick',    placeholder: 'kick.com/seunick',       cls: 'social-kick'    },
  { id: 'tiktok',  label: 'TikTok',  icon: 'ti-brand-tiktok',  placeholder: 'tiktok.com/@seunick',   cls: 'social-tiktok'  },
] as const;

type SocialId = typeof SOCIALS[number]['id'];

export function PlayerRegisterModal({ onClose, showToast }: Props) {
  const [nick,    setNick]    = useState('');
  const [loading, setLoading] = useState(false);
  const [socials, setSocials] = useState<Record<SocialId, string>>({
    twitch: '', youtube: '', kick: '', tiktok: '',
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  function setSocial(id: SocialId, value: string) {
    setSocials(prev => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim()) return;
    setLoading(true);
    try {
      await apiRegisterPlayer({
        nick:        nick.trim(),
        twitch_url:  socials.twitch.trim()  || undefined,
        youtube_url: socials.youtube.trim() || undefined,
        kick_url:    socials.kick.trim()    || undefined,
        tiktok_url:  socials.tiktok.trim()  || undefined,
      });
      showToast('Cadastro enviado! Aguarde aprovação dos moderadores.', 'success');
      onClose();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box reg-modal-box" onClick={e => e.stopPropagation()}>

        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        {/* ── Cabeçalho ── */}
        <div className="reg-header">
          <span className="reg-header-tag">// NOVA INSCRIÇÃO</span>
          <h2 className="reg-title">Entrar no Ranking</h2>
          <p className="reg-subtitle">
            Preencha seus dados. Um moderador vai revisar e aprovar seu cadastro.
          </p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>

          {/* ── Nick (obrigatório) ── */}
          <div className="reg-nick-wrap">
            <label className="form-label" htmlFor="reg-nick">
              Nick do jogador <span className="required">*</span>
            </label>
            <div className="reg-nick-input-wrap">
              <i className="ti ti-user reg-nick-icon" />
              <input
                id="reg-nick"
                className="form-input reg-nick-input"
                type="text"
                placeholder="SeuNickAqui"
                value={nick}
                onChange={e => setNick(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                required
              />
            </div>
          </div>

          {/* ── Canais (opcionais) ── */}
          <div className="reg-socials-header">
            <span className="form-label">Canais</span>
            <span className="optional-chip">opcional</span>
          </div>

          <div className="reg-socials-grid">
            {SOCIALS.map(s => (
              <div key={s.id} className={`reg-social-item ${s.cls}`}>
                <label className="reg-social-label" htmlFor={`reg-${s.id}`}>
                  <i className={`ti ${s.icon}`} />
                  {s.label}
                </label>
                <input
                  id={`reg-${s.id}`}
                  className="form-input reg-social-input"
                  type="url"
                  placeholder={s.placeholder}
                  value={socials[s.id]}
                  onChange={e => setSocial(s.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            className="btn-primary btn-block"
            type="submit"
            disabled={loading || !nick.trim()}
          >
            {loading
              ? <><i className="ti ti-loader-2" /> Enviando...</>
              : <><i className="ti ti-send" /> Enviar cadastro</>}
          </button>
        </form>
      </div>
    </div>
  );
}
