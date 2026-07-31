import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  apiGetModeratorInvite,
  apiRegisterModerator,
  apiConfirmModeratorOtp,
  apiResendModeratorOtp,
} from '../lib/api';
import { checkPassword } from '../lib/password';
import { PasswordHints } from '../components/PasswordHints';
import { OtpInput } from '../components/OtpInput';
import cadastroBg from '../../assets/background/cadastro-bg.jpg';

type Step = 'loading' | 'invalid' | 1 | 2 | 'done';

export function ModeratorRegisterPage() {
  const { token } = useParams<{ token: string }>();

  const [step,            setStep]            = useState<Step>('loading');
  const [email,           setEmail]           = useState('');
  const [login,           setLogin]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [otpCode,         setOtpCode]         = useState('');
  const [otpError,        setOtpError]        = useState('');
  const [resendMsg,       setResendMsg]       = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  useEffect(() => {
    if (!token) { setStep('invalid'); return; }
    apiGetModeratorInvite(token)
      .then(res => { setEmail(res.email); setStep(1); })
      .catch(() => setStep('invalid'));
  }, [token]);

  const step1Valid = login.trim().length >= 2 && checkPassword(password).ok && password === confirmPassword;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!step1Valid || !token) return;
    setLoading(true);
    setError('');
    try {
      await apiRegisterModerator({ invite_token: token, login: login.trim(), password });
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setLoading(true);
    setOtpError('');
    try {
      await apiConfirmModeratorOtp(email, otpCode);
      setStep('done');
    } catch (err) {
      setOtpError((err as Error).message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      await apiResendModeratorOtp(email);
      setOtpCode('');
      setOtpError('');
      setResendMsg('Novo código enviado! Verifique seu email.');
      setTimeout(() => setResendMsg(''), 5000);
    } catch (err) {
      setResendMsg((err as Error).message || 'Erro ao reenviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const bgStyle = { backgroundImage: `url(${cadastroBg})` };

  if (step === 'loading') {
    return (
      <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
        <div className="account-login-card reg-card">
          <div className="reg-card-body" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <i className="ti ti-loader-2" style={{ fontSize: 36, color: 'var(--green)', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Validando convite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'invalid') {
    return (
      <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
        <div className="account-login-card reg-card">
          <div className="reg-card-body" style={{ textAlign: 'center' }}>
            <div className="reg-icon-wrap"><i className="ti ti-link-off" /></div>
            <h1 className="reg-title">Convite inválido</h1>
            <p className="reg-sub">
              Este link de convite é inválido ou já expirou. Solicite um novo convite ao administrador.
            </p>
            <Link to="/painel" className="btn-primary btn-block" style={{ textAlign: 'center', marginTop: 16 }}>
              <i className="ti ti-arrow-left" /> Ir ao painel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
      <div className="account-login-card reg-card reg-card--wide">
        <Link to="/painel" className="reg-back-home">
          <i className="ti ti-arrow-left" /> Ir ao painel
        </Link>

        <div className="reg-card-header">
          <div className="reg-icon-wrap">
            <i className="ti ti-shield-check" />
          </div>
          <h1 className="reg-title">Criar conta de moderador</h1>
          <p className="reg-sub">
            Você foi convidado para moderar o <strong>PZ Community Rank</strong>.
            Configure suas credenciais de acesso abaixo.
          </p>
        </div>

        <div className="reg-card-body">

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="reg-success">
              <div className="reg-success-icon"><i className="ti ti-circle-check" /></div>
              <h2 className="reg-success-title">Conta ativa!</h2>
              <p className="reg-success-msg">
                Sua conta de moderador está pronta. Faça login com seu email e senha para acessar o painel.
              </p>
              <Link to="/painel" className="btn-primary btn-block" style={{ textAlign: 'center' }}>
                <i className="ti ti-login" /> Ir ao painel
              </Link>
            </div>
          )}

          {/* ── Step 1: Cadastro ── */}
          {step === 1 && (
            <form onSubmit={handleRegister} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="reg-field">
                <label className="form-label">Email (convite)</label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-mail reg-nick-icon" />
                  <input className="form-input reg-nick-input" type="email" value={email} disabled />
                </div>
              </div>

              <div className="reg-field">
                <label className="form-label" htmlFor="mr-login">Login (apelido no painel) <span className="required">*</span></label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-user reg-nick-icon" />
                  <input id="mr-login" className="form-input reg-nick-input" type="text"
                    placeholder="seu_login" value={login}
                    onChange={e => setLogin(e.target.value)}
                    autoComplete="username" spellCheck={false} required />
                </div>
              </div>

              <div className="reg-field">
                <label className="form-label" htmlFor="mr-password">Senha <span className="required">*</span></label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock reg-nick-icon" />
                  <input id="mr-password" className="form-input reg-nick-input"
                    type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password" required />
                  <button type="button" className="reg-pass-toggle" onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}>
                    <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} />
                  </button>
                </div>
              </div>

              <PasswordHints password={password} />

              <div className="reg-field">
                <label className="form-label" htmlFor="mr-confirm">Confirmar senha <span className="required">*</span></label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock-check reg-nick-icon" />
                  <input id="mr-confirm" className="form-input reg-nick-input"
                    type={showPass ? 'text' : 'password'} placeholder="Repita a senha"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password" required />
                  {confirmPassword && (
                    <i className={`ti reg-nick-icon ${password === confirmPassword ? 'ti-check reg-pass-match' : 'ti-x reg-pass-mismatch'}`} />
                  )}
                </div>
              </div>

              {error && <p style={{ color: 'var(--red)', fontSize: 14 }}>{error}</p>}

              <button className="btn-primary btn-block" type="submit"
                disabled={loading || !step1Valid} style={{ marginTop: 4 }}>
                {loading
                  ? <><i className="ti ti-loader-2" /> Criando conta...</>
                  : <><i className="ti ti-arrow-right" /> Criar conta</>}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
              <p className="reg-otp-hint">
                Enviamos um código de 6 dígitos para <strong>{email}</strong>.
              </p>
              <form onSubmit={handleOtpSubmit} noValidate
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
                <OtpInput value={otpCode} onChange={setOtpCode} loading={loading}
                  onResend={handleResend} resendMsg={resendMsg} />
                {otpError && <p style={{ color: 'var(--red)', fontSize: 14 }}>{otpError}</p>}
                <button className="btn-primary btn-block" type="submit"
                  disabled={loading || otpCode.length !== 6} style={{ marginTop: 4 }}>
                  {loading
                    ? <><i className="ti ti-loader-2" /> Verificando...</>
                    : <><i className="ti ti-check" /> Confirmar</>}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
