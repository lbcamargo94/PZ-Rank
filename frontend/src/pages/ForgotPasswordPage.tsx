import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiForgotPassword } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import loginBg from '../../assets/background/tela-de-login.webp';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [ok,      setOk]      = useState(false);
  const [okMsg,   setOkMsg]   = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const emailOk = RE_EMAIL.test(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOk) return;
    setLoading(true);
    try {
      const res = await apiForgotPassword(email.trim());
      setOkMsg(res.message);
      setOk(true);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="account-login-wrap claim-page-wrap" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="account-login-card reg-card">
        <Link to="/login" className="reg-back-home">
          <i className="ti ti-arrow-left" /> Voltar ao login
        </Link>

        <div className="reg-header">
          <div className="reg-icon-wrap">
            <i className="ti ti-key" />
          </div>
          <h1 className="reg-title">Recuperar senha</h1>
          <p className="reg-sub">
            Informe o e-mail cadastrado e enviaremos as instruções de recuperação.
          </p>
        </div>

        {ok ? (
          <div className="reg-success-card">
            <i className="ti ti-circle-check reg-success-icon" />
            <p className="reg-success-text">{okMsg}</p>
            <Link to="/login" className="btn-primary reg-submit" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="ti ti-login" /> Ir para login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="account-login-form">
            <div className="reg-field">
              <label className="reg-label" htmlFor="fp-email">
                <i className="ti ti-mail" /> E-mail
              </label>
              <div className="reg-input-wrap">
                <input
                  id="fp-email"
                  className="reg-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoFocus
                />
                {email && emailOk && (
                  <i className="ti ti-check reg-input-icon reg-input-icon--ok" />
                )}
                {email && !emailOk && (
                  <i className="ti ti-alert-circle reg-input-icon reg-input-icon--err" />
                )}
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary reg-submit${emailOk ? ' reg-submit--ready' : ''}`}
              disabled={loading || !emailOk}
            >
              {loading
                ? <><i className="ti ti-loader-2" /> Enviando...</>
                : <><i className="ti ti-send" /> Enviar link de recuperação</>}
            </button>

            <div className="reg-aux-links">
              <Link to="/" className="reg-aux-link">
                <i className="ti ti-home" /> Ir ao Rank
              </Link>
            </div>
          </form>
        )}
      </div>
      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
