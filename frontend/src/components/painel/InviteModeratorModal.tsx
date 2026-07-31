import { useState, useEffect } from 'react';
import { apiSendModeratorInvite } from '../../lib/api';

interface Props {
  token:     string;
  onClose:   () => void;
  showToast: (msg: string, type?: string) => void;
}

export function InviteModeratorModal({ token, onClose, showToast }: Props) {
  const [email,   setEmail]   = useState('');
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
    if (!email.trim()) return;
    setLoading(true);
    try {
      await apiSendModeratorInvite(token, email.trim());
      showToast(`Convite enviado para ${email.trim()}.`, 'success');
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
        <h2 className="modal-title">Convidar Moderador</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
          O destinatário receberá um link por email para criar sua conta de moderador.
        </p>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <label className="form-label" htmlFor="inv-email">
            <i className="ti ti-mail" /> Email do convidado
          </label>
          <input
            id="inv-email"
            className="form-input"
            type="email"
            placeholder="moderador@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
            required
          />

          <button className="btn-primary btn-block" type="submit"
            disabled={loading || !email.trim()}>
            {loading
              ? <><i className="ti ti-loader-2" /> Enviando...</>
              : <><i className="ti ti-send" /> Enviar convite</>}
          </button>
        </form>
      </div>
    </div>
  );
}
