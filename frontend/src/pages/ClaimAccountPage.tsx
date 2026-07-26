import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClaimAccount } from '../lib/api';
import { checkPassword } from '../lib/password';
import { PasswordHints } from '../components/PasswordHints';

export function ClaimAccountPage() {
  const [nick,            setNick]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [msg,             setMsg]             = useState('');
  const [done,            setDone]            = useState(false);
  const [loading,         setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim() || !email.trim() || !password) return;
    if (!checkPassword(password).ok) {
      setMsg('A senha não atende aos requisitos de segurança.');
      return;
    }
    if (password !== confirmPassword) {
      setMsg('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      await apiClaimAccount(nick.trim(), email.trim(), password);
      setDone(true);
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = nick.trim() && email.trim() && checkPassword(password).ok && password === confirmPassword;

  if (done) {
    return (
      <div className="account-login-wrap">
        <div className="account-login-card">
          <div className="reg-success">
            <div className="reg-success-icon"><i className="ti ti-circle-check" /></div>
            <h2 className="reg-success-title">Conta vinculada!</h2>
            <p className="reg-success-msg">
              Seu email e senha foram cadastrados. Um moderador vai revisar e aprovar sua conta em breve.
              Após a aprovação, você poderá fazer login normalmente.
            </p>
            <div className="account-login-links">
              <Link to="/minha-conta" className="btn-primary btn-sm"><i className="ti ti-login" /> Fazer login</Link>
              <Link to="/"            className="btn-ghost btn-sm"><i className="ti ti-home" /> Ver o ranking</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-login-wrap">
      <div className="account-login-card">
        <h1 className="account-login-title">Vincular conta</h1>
        <p className="account-login-sub">
          Já está no ranking mas ainda não tem email e senha? Informe seu nick e crie seu acesso.
          Um moderador vai revisar e aprovar em breve.
        </p>
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
            <label className="account-label">Email</label>
            <input
              className="account-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>
          <div className="account-field">
            <label className="account-label">Senha</label>
            <div className="reg-nick-input-wrap">
              <i className="ti ti-lock reg-nick-icon" />
              <input
                className="form-input reg-nick-input"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-pass-toggle"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} />
              </button>
            </div>
          </div>
          <PasswordHints password={password} />
          <div className="account-field">
            <label className="account-label">Confirmar senha</label>
            <div className="reg-nick-input-wrap">
              <i className="ti ti-lock-check reg-nick-icon" />
              <input
                className="form-input reg-nick-input"
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
              {confirmPassword && (
                <i className={`ti reg-nick-icon ${password === confirmPassword ? 'ti-check reg-pass-match' : 'ti-x reg-pass-mismatch'}`} />
              )}
            </div>
          </div>
          {msg && <p className="account-status account-status--err">{msg}</p>}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !canSubmit}
          >
            {loading
              ? <><i className="ti ti-loader-2" /> Enviando...</>
              : <><i className="ti ti-link" /> Vincular conta</>}
          </button>
          <div className="account-login-links">
            <Link to="/minha-conta" className="btn-ghost btn-sm"><i className="ti ti-login" /> Já tenho conta</Link>
            <Link to="/"            className="btn-ghost btn-sm"><i className="ti ti-home" /> Ver o ranking</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
