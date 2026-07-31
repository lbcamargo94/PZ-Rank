import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import loginBg from '../../assets/background/tela-de-login.webp';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { apiPlayerLogin } from '../lib/api';
import type { PlayerSession } from '../types';

const PLAYER_SESSION_KEY = 'player_session';
const RE_EMAIL_LOGIN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Login form ────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (s: PlayerSession) => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const emailOk   = RE_EMAIL_LOGIN.test(email.trim());
  const canSubmit = emailOk && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const data = await apiPlayerLogin(email.trim(), password);
      onLogin(data);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="account-login-wrap claim-page-wrap" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="account-login-card reg-card">
        <Link to="/" className="reg-back-home">
          <i className="ti ti-arrow-left" /> Página inicial
        </Link>

        <div className="login-header">
          <div className="reg-icon-wrap">
            <i className="ti ti-lock" />
          </div>
          <h1 className="reg-title">Entrar na conta</h1>
          <p className="reg-sub">Acesse sua conta para acompanhar suas runs e o ranking.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="reg-field">
            <label className="reg-label" htmlFor="login-email">
              <i className="ti ti-mail" /> E-mail
            </label>
            <div className="reg-input-wrap">
              <input
                id="login-email"
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
            </div>
          </div>

          <div className="reg-field">
            <div className="login-password-header">
              <label className="reg-label" htmlFor="login-password">
                <i className="ti ti-lock" /> Senha
              </label>
              <Link to="/esqueci-senha" className="login-forgot-link">
                Esqueci minha senha
              </Link>
            </div>
            <div className="reg-input-wrap">
              <input
                id="login-password"
                className="reg-input reg-input--pass"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="reg-pass-toggle"
                onClick={() => setShowPass(p => !p)}
                aria-label="Mostrar/ocultar senha"
              >
                <i className={`ti ti-eye${showPass ? '-off' : ''}`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn-primary reg-submit${canSubmit ? ' reg-submit--ready' : ''}`}
            disabled={loading || !canSubmit}
          >
            {loading
              ? <><i className="ti ti-loader-2" /> Entrando...</>
              : <><i className="ti ti-login" /> Entrar</>}
          </button>
        </form>

        <div className="login-divider"><span>ou</span></div>

        <Link to="/cadastrar-conta" className="btn-ghost btn-block login-register-btn">
          <i className="ti ti-user-plus" /> Criar minha conta
        </Link>
      </div>
      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}

// ── Página de login ───────────────────────────────────────────

export function AccountPage() {
  const navigate = useNavigate();

  const [hasSession] = useState(() => {
    try { return !!sessionStorage.getItem(PLAYER_SESSION_KEY); } catch { return false; }
  });

  useEffect(() => {
    if (hasSession) navigate('/perfil', { replace: true });
  }, [hasSession, navigate]);

  function handleLogin(s: PlayerSession) {
    sessionStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(s));
    navigate('/perfil', { replace: true });
  }

  if (hasSession) return null;
  return <LoginForm onLogin={handleLogin} />;
}
