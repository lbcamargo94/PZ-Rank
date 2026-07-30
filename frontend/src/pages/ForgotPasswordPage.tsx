import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiForgotPassword } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';

export function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [ok,      setOk]      = useState(false);
  const [okMsg,   setOkMsg]   = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
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
    <div className="account-login-wrap">
      <div className="account-login-card">
        <h1 className="account-login-title">Recuperar senha</h1>
        <p className="account-login-sub">
          Informe o email cadastrado. Se existir, você receberá as instruções por email.
        </p>

        {ok ? (
          <>
            <p className="account-status account-status--ok">{okMsg}</p>
            <div className="account-login-links" style={{ marginTop: 20 }}>
              <Link to="/minha-conta" className="btn-ghost btn-sm"><i className="ti ti-arrow-left" /> Voltar ao login</Link>
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
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !email.trim()}
            >
              {loading ? 'Enviando…' : 'Enviar link de recuperação'}
            </button>
            <div className="account-login-links">
              <Link to="/minha-conta" className="btn-ghost btn-sm"><i className="ti ti-arrow-left" /> Voltar ao login</Link>
              <Link to="/"            className="btn-ghost btn-sm"><i className="ti ti-home" /> Ir ao Rank</Link>
            </div>
          </form>
        )}
      </div>
      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
