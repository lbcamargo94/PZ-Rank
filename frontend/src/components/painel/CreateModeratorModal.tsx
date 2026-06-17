import { useState } from 'react';
import { apiCreateModerator } from '../../lib/api';

interface Props {
  token:     string;
  onClose:   () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: string) => void;
}

export function CreateModeratorModal({ token, onClose, onSuccess, showToast }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await apiCreateModerator(token, { email, password });
      showToast(`Moderador ${email} criado com sucesso.`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
        <h2 className="modal-title">Novo Moderador</h2>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <label className="form-label" htmlFor="cm-email">E-mail</label>
          <input id="cm-email" className="form-input" type="email"
            placeholder="novo@moderador.com" value={email}
            onChange={e => setEmail(e.target.value)} required />

          <label className="form-label" htmlFor="cm-pass">Senha inicial</label>
          <input id="cm-pass" className="form-input" type="password"
            placeholder="mínimo 8 caracteres" value={password}
            onChange={e => setPassword(e.target.value)} required />

          <button className="btn-primary btn-block" type="submit"
            disabled={loading || !email || !password}>
            {loading ? 'Criando...' : 'Criar moderador'}
          </button>
        </form>
      </div>
    </div>
  );
}
