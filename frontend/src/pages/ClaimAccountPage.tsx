import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClaimAccount } from '../lib/api';

export function ClaimAccountPage() {
  const [nick,    setNick]    = useState('');
  const [email,   setEmail]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [ok,      setOk]      = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim() || !email.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await apiClaimAccount(nick.trim(), email.trim());
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
        <h1 className="account-login-title">Vincular conta</h1>
        <p className="account-login-sub">
          Se você já está no ranking mas ainda não tem email e senha, informe seu nick e o email que deseja usar.
          Você receberá um link para definir sua senha.
        </p>

        {ok ? (
          <>
            <p className="account-status account-status--ok">{msg}</p>
            <div className="account-login-links" style={{ marginTop: 20 }}>
              <Link to="/minha-conta" className="account-link">
                <i className="ti ti-arrow-left" /> Ir para login
              </Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="account-login-form">
            <div className="account-field">
              <label className="account-label">Nick no ranking</label>
              <input
                className="account-input"
                type="text"
                value={nick}
                onChange={e => setNick(e.target.value)}
                placeholder="Seu nick exato (ex: SurvivorBR)"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="account-field">
              <label className="account-label">Email para vincular</label>
              <input
                className="account-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
            {msg && <p className="account-status account-status--err">{msg}</p>}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !nick.trim() || !email.trim()}
            >
              {loading ? 'Enviando…' : 'Enviar link de ativação'}
            </button>
            <div className="account-login-links">
              <Link to="/minha-conta" className="account-link">Já tenho conta</Link>
              <span className="account-login-sep">·</span>
              <Link to="/" className="account-link">Ver o ranking</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
