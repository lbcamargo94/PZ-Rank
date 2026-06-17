import { useState } from 'react';
import { apiLogin } from '../../lib/api';
import type { ModSession } from '../../types';

interface Props {
  onSuccess: (session: ModSession) => void;
  onBack:    () => void;
  showToast: (msg: string, type?: string) => void;
}

export function PainelLogin({ onSuccess, onBack, showToast }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await apiLogin(email, password);
      onSuccess(session);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="painel-login-wrap">
      <div className="painel-login-scanlines" aria-hidden="true" />

      <button className="btn-ghost painel-back" onClick={onBack}>
        <i className="ti ti-arrow-left" /> Voltar ao ranking
      </button>

      <div className="painel-login-box">
        {/* ── Ícone de segurança ── */}
        <div className="painel-login-icon-wrap">
          <i className="ti ti-shield-lock painel-login-icon" />
        </div>

        <div className="painel-login-tag">// ÁREA RESTRITA</div>
        <h1 className="painel-login-title">Painel de Moderadores</h1>
        <p className="painel-login-sub">
          Acesso exclusivo para moderadores autorizados.
        </p>

        <div className="painel-login-divider" />

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="painel-login-field">
            <label className="form-label" htmlFor="mod-email">
              <i className="ti ti-at" /> E-mail
            </label>
            <input
              id="mod-email"
              className="form-input painel-login-input"
              type="email"
              placeholder="moderador@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="painel-login-field">
            <label className="form-label" htmlFor="mod-pass">
              <i className="ti ti-lock" /> Senha
            </label>
            <input
              id="mod-pass"
              className="form-input painel-login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            className="btn-primary btn-block painel-login-btn"
            type="submit"
            disabled={loading || !email || !password}
          >
            {loading
              ? <><i className="ti ti-loader-2" /> Verificando...</>
              : <><i className="ti ti-login" /> Entrar</>}
          </button>
        </form>

        <p className="painel-login-warn">
          <i className="ti ti-info-circle" />
          Tentativas de acesso não autorizado são registradas.
        </p>
      </div>
    </div>
  );
}
