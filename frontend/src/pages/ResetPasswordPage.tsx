import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { checkPassword } from '../lib/password';
import { PasswordHints } from '../components/PasswordHints';
import { apiResetPassword } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import loginBg from '../../assets/background/tela-de-login.webp';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token') ?? '';

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const pwOk      = checkPassword(password).ok;
  const matchOk   = password === confirmPassword;
  const canSubmit = pwOk && matchOk && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiResetPassword(token, password);
      setDone(true);
    } catch (err) {
      showToast((err as Error).message || 'Erro ao redefinir senha.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const bgStyle = { backgroundImage: `url(${loginBg})` };

  if (!token) {
    return (
      <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
        <div className="account-login-card reg-card">
          <div className="reg-success-card">
            <i className="ti ti-circle-x reg-success-icon" style={{ color: 'var(--red)' }} />
            <h1 className="reg-title">Link inválido</h1>
            <p className="reg-sub" style={{ marginBottom: 24 }}>
              O link de redefinição de senha é inválido ou expirou.
            </p>
            <button className="btn-primary reg-submit" onClick={() => navigate('/esqueci-senha')}>
              <i className="ti ti-key" /> Solicitar novo link
            </button>
          </div>
        </div>
        <Toast {...toast} onClose={clearToast} />
      </div>
    );
  }

  if (done) {
    return (
      <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
        <div className="account-login-card reg-card">
          <div className="reg-success-card">
            <i className="ti ti-circle-check reg-success-icon" />
            <h1 className="reg-title">Senha redefinida!</h1>
            <p className="reg-sub" style={{ marginBottom: 24 }}>
              Use a nova senha no Companion ou acesse <strong>Login</strong> no site.
            </p>
            <button className="btn-primary reg-submit reg-submit--ready" onClick={() => navigate('/login')}>
              <i className="ti ti-login" /> Ir para login
            </button>
          </div>
        </div>
        <Toast {...toast} onClose={clearToast} />
      </div>
    );
  }

  return (
    <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
      <div className="account-login-card reg-card">

        <button
          className="reg-back-home"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/login')}
        >
          <i className="ti ti-arrow-left" /> Voltar ao login
        </button>

        <div className="reg-header">
          <div className="reg-icon-wrap">
            <i className="ti ti-key" />
          </div>
          <h1 className="reg-title">Redefinir senha</h1>
          <p className="reg-sub">Escolha uma nova senha segura para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="account-login-form">

          <div className="reg-field">
            <label className="reg-label" htmlFor="rp-password">
              <i className="ti ti-lock" /> Nova senha
            </label>
            <div className="reg-input-wrap">
              <input
                id="rp-password"
                className="reg-input reg-input--pass"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
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
            <PasswordHints password={password} />
          </div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="rp-confirm">
              <i className="ti ti-lock-check" /> Confirmar senha
            </label>
            <div className="reg-input-wrap">
              <input
                id="rp-confirm"
                className={`reg-input reg-input--pass${confirmPassword && !matchOk ? ' reg-input--invalid' : ''}`}
                type={showPass ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {confirmPassword && matchOk && (
                <i className="ti ti-check reg-input-icon reg-input-icon--ok" style={{ right: 42 }} />
              )}
              {confirmPassword && !matchOk && (
                <i className="ti ti-x reg-input-icon reg-input-icon--err" style={{ right: 42 }} />
              )}
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
            className={`btn-primary reg-submit${canSubmit ? ' reg-submit--ready' : ''}`}
            type="submit"
            disabled={loading || !canSubmit}
          >
            {loading
              ? <><i className="ti ti-loader-2" /> Salvando...</>
              : <><i className="ti ti-check" /> Salvar nova senha</>}
          </button>
        </form>

      </div>
      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
