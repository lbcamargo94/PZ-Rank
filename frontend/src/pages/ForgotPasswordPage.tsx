import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiForgotPassword } from '../lib/api';

export function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [ok,      setOk]      = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await apiForgotPassword(email.trim());
      setMsg(res.message);
      setOk(true);
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="account-login-wrap">
      <div className="account-login-card">
        <h1 className="account-login-title">Recuperar senha</h1>
        <p className="account-login-sub">
          Informe o email cadastrado. Se existir, você receberá as instruções por email.
        </p>

        {ok ? (
          <>
            <p className="account-status account-status--ok">{msg}</p>
            <div className="account-login-links" style={{ marginTop: 20 }}>
              <Link to="/minha-conta" className="account-link">
                <i className="ti ti-arrow-left" /> Voltar ao login
              </Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="account-login-form">
            <div className="account-field">
              <label className="account-label">Email</label>
              <input
                className="account-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
              />
            </div>
            {msg && <p className="account-status account-status--err">{msg}</p>}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !email.trim()}
            >
              {loading ? 'Enviando…' : 'Enviar link de recuperação'}
            </button>
            <div className="account-login-links">
              <Link to="/minha-conta" className="account-link">Voltar ao login</Link>
              <span className="account-login-sep">·</span>
              <Link to="/" className="account-link">Ir ao Rank</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
