import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRegisterPlayer, apiConfirmRegistrationOtp, apiResendRegistrationOtp } from '../lib/api';
import { checkPassword } from '../lib/password';
import { PasswordHints } from '../components/PasswordHints';
import { OtpInput } from '../components/OtpInput';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import cadastroBg from '../../assets/background/cadastro-bg.jpg';

// ⚠️ Altere para false para suspender os cadastros.
const REGISTRATIONS_OPEN = true;

const SOCIALS = [
  { id: 'twitch',  label: 'Twitch',  icon: 'ti-brand-twitch',  placeholder: 'https://twitch.tv/seunick',    color: '#9146ff' },
  { id: 'youtube', label: 'YouTube', icon: 'ti-brand-youtube', placeholder: 'https://youtube.com/@seunick', color: '#ff0000' },
  { id: 'kick',    label: 'Kick',    icon: 'ti-brand-kick',    placeholder: 'https://kick.com/seunick',      color: '#53fc18' },
  { id: 'tiktok',  label: 'TikTok',  icon: 'ti-brand-tiktok',  placeholder: 'https://tiktok.com/@seunick',  color: '#ee1d52' },
] as const;
type SocialId = typeof SOCIALS[number]['id'];
type Step = 1 | 2 | 3 | 'done';

const STEPS = [
  { n: 1, label: 'Conta'     },
  { n: 2, label: 'Streaming' },
  { n: 3, label: 'Verificar' },
] as const;

function RegistrationsClosed() {
  return (
    <div className="account-login-wrap claim-page-wrap" style={{ backgroundImage: `url(${cadastroBg})` }}>
      <div className="account-login-card reg-card">
        <Link to="/" className="reg-back-home">
          <i className="ti ti-arrow-left" /> Página inicial
        </Link>
        <div className="reg-card-body">
          <div className="reg-icon-wrap"><i className="ti ti-lock" /></div>
          <h1 className="reg-title">Cadastros suspensos</h1>
          <p className="reg-sub">
            Os cadastros estão temporariamente suspensos. Acompanhe o servidor para saber quando a próxima temporada abrirá.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const cur = current === 'done' ? 4 : (current as number);
  return (
    <div className="reg-steps">
      {STEPS.map(({ n, label }, i) => (
        <div key={n} className="reg-step-item">
          {i > 0 && <div className={`reg-step-track${cur > n ? ' is-done' : ''}`} />}
          <div className={`reg-step-item-inner${cur === n ? ' is-active' : cur > n ? ' is-done' : ''}`}>
            <div className="reg-step-circle">
              {cur > n ? <i className="ti ti-check" style={{ fontSize: 11 }} /> : n}
            </div>
            <span className="reg-step-label">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClaimAccountPage() {
  if (!REGISTRATIONS_OPEN) return <RegistrationsClosed />;

  const { toast, showToast, clearToast } = useToast();

  const [nick,            setNick]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [termsAccepted,   setTermsAccepted]   = useState(false);
  const [socials,         setSocials]         = useState<Record<SocialId, string>>({ twitch: '', youtube: '', kick: '', tiktok: '' });
  const [otpCode,         setOtpCode]         = useState('');
  const [otpError,        setOtpError]        = useState('');
  const [resendMsg,       setResendMsg]       = useState('');
  const [step,            setStep]            = useState<Step>(1);
  const [loading,         setLoading]         = useState(false);

  const step1Valid = nick.trim().length >= 2 && email.trim() && checkPassword(password).ok && password === confirmPassword && termsAccepted;

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!checkPassword(password).ok) { showToast('A senha não atende aos requisitos de segurança.', 'error'); return; }
    if (password !== confirmPassword) { showToast('As senhas não coincidem.', 'error'); return; }
    setStep(2);
  }

  async function submitRegistration(withSocials: boolean) {
    setLoading(true);
    try {
      await apiRegisterPlayer({
        nick:           nick.trim(),
        email:          email.trim(),
        password,
        terms_accepted: true,
        ...(withSocials && {
          twitch_url:  socials.twitch.trim()  || undefined,
          youtube_url: socials.youtube.trim() || undefined,
          kick_url:    socials.kick.trim()    || undefined,
          tiktok_url:  socials.tiktok.trim()  || undefined,
        }),
      });
      setStep(3);
    } catch (err) {
      showToast((err as Error).message, 'error');
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
      await apiConfirmRegistrationOtp(email.trim(), otpCode);
      setStep('done');
    } catch (err) {
      setOtpError((err as Error).message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await apiResendRegistrationOtp(email.trim());
      setResendMsg('Novo código enviado!');
      setTimeout(() => setResendMsg(''), 4000);
    } catch {
      setResendMsg('Erro ao reenviar. Tente novamente.');
    }
  }

  const bgStyle = { backgroundImage: `url(${cadastroBg})` };

  return (
    <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
      <div className="account-login-card reg-card reg-card--wide">
        <Link to="/" className="reg-back-home">
          <i className="ti ti-arrow-left" /> Página inicial
        </Link>

        <div className="reg-card-header">
          <div className="reg-icon-wrap">
            <i className="ti ti-user-plus" />
          </div>
          <h1 className="reg-title">Criar conta no PZRank</h1>
          <p className="reg-sub">
            Registre suas runs, acompanhe temporadas e suba no ranking do maior campeonato de Project Zomboid do Brasil.
          </p>
        </div>

        {step !== 'done' && <Stepper current={step} />}

        <div className="reg-card-body">

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="reg-success">
              <div className="reg-success-icon"><i className="ti ti-circle-check" /></div>
              <h2 className="reg-success-title">Conta ativa!</h2>
              <p className="reg-success-msg">
                Email confirmado! Sua conta já está ativa. Faça login no Companion com seu email e senha para começar a sincronizar suas runs.
              </p>
              <Link to="/login" className="btn-primary btn-block" style={{ textAlign: 'center' }}>
                <i className="ti ti-login" /> Fazer login
              </Link>
            </div>
          )}

          {/* ── Step 1: Conta ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="reg-field">
                <label className="form-label" htmlFor="reg-nick">Nick do jogador <span className="required">*</span></label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-brand-discord reg-nick-icon" />
                  <input id="reg-nick" className="form-input reg-nick-input" type="text"
                    placeholder="SeuNickAqui" value={nick} onChange={e => setNick(e.target.value)}
                    autoComplete="username" spellCheck={false} required />
                </div>
                <p className="reg-field-hint">
                  <i className="ti ti-info-circle" style={{ fontSize: 13, verticalAlign: 'middle' }} />{' '}
                  Use seu nick do Discord exatamente como aparece no servidor.
                </p>
              </div>
              <div className="reg-field">
                <label className="form-label" htmlFor="reg-email">Email <span className="required">*</span></label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-mail reg-nick-icon" />
                  <input id="reg-email" className="form-input reg-nick-input" type="email"
                    placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="email" required />
                </div>
              </div>
              <div className="reg-field">
                <label className="form-label" htmlFor="reg-password">Senha <span className="required">*</span></label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock reg-nick-icon" />
                  <input id="reg-password" className="form-input reg-nick-input"
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
                <label className="form-label" htmlFor="reg-confirm">Confirmar senha <span className="required">*</span></label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock-check reg-nick-icon" />
                  <input id="reg-confirm" className="form-input reg-nick-input"
                    type={showPass ? 'text' : 'password'} placeholder="Repita a senha"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password" required />
                  {confirmPassword && (
                    <i className={`ti reg-nick-icon ${password === confirmPassword ? 'ti-check reg-pass-match' : 'ti-x reg-pass-mismatch'}`} />
                  )}
                </div>
              </div>
              <label className="reg-terms-box">
                <input
                  type="checkbox"
                  className="reg-terms-checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                />
                <span className="reg-terms-text">
                  Li e aceito as{' '}
                  <Link to="/regras" target="_blank" rel="noopener noreferrer" className="reg-terms-link-btn"
                    onClick={e => e.stopPropagation()}>
                    <i className="ti ti-book" /> Regras de Conduta <i className="ti ti-external-link" />
                  </Link>{' '}
                  do Brasileirão PZ
                </span>
              </label>

              <button className="btn-primary btn-block" type="submit" disabled={!step1Valid} style={{ marginTop: 4 }}>
                <i className="ti ti-arrow-right" /> Próximo
              </button>
              <Link to="/login" className="btn-ghost btn-block" style={{ textAlign: 'center' }}>
                <i className="ti ti-login" /> Já tenho conta — fazer login
              </Link>
            </form>
          )}

          {/* ── Step 2: Streaming ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="reg-socials-hint" style={{ margin: 0 }}>
                Adicione seus canais para aparecer como criador de conteúdo. Você pode pular e adicionar depois em <strong>Login</strong>.
              </p>
              <div className="reg-socials-grid">
                {SOCIALS.map(s => (
                  <div key={s.id} className="reg-social-item" style={{ '--social-color': s.color } as React.CSSProperties}>
                    <label className="reg-social-label" htmlFor={`reg-${s.id}`}>
                      <i className={`ti ${s.icon}`} /> {s.label}
                    </label>
                    <input id={`reg-${s.id}`} className="form-input reg-social-input" type="url"
                      placeholder={s.placeholder} value={socials[s.id]}
                      onChange={e => setSocials(p => ({ ...p, [s.id]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="reg-step2-actions">
                <button type="button" className="btn-ghost" onClick={() => setStep(1)} disabled={loading}>
                  <i className="ti ti-arrow-left" /> Voltar
                </button>
                <button type="button" className="btn-primary" disabled={loading} onClick={() => submitRegistration(true)}>
                  {loading ? <><i className="ti ti-loader-2" /> Criando...</> : <><i className="ti ti-send" /> Criar conta</>}
                </button>
              </div>
              <button type="button" className="btn-ghost btn-block" disabled={loading} onClick={() => submitRegistration(false)}>
                Pular — criar sem canais de streaming
              </button>
            </div>
          )}

          {/* ── Step 3: OTP ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p className="reg-otp-hint">
                Enviamos um código de 6 dígitos para <strong>{email.trim()}</strong>.
              </p>
              <form onSubmit={handleOtpSubmit} noValidate style={{ marginTop: 12 }}>
                <OtpInput value={otpCode} onChange={setOtpCode} loading={loading}
                  onResend={handleResend} resendMsg={resendMsg} />
                {otpError && <p style={{ color: 'var(--red)', fontSize: 14, marginTop: 8 }}>{otpError}</p>}
                <button className="btn-primary btn-block" type="submit"
                  disabled={loading || otpCode.length !== 6} style={{ marginTop: 16 }}>
                  {loading ? <><i className="ti ti-loader-2" /> Verificando...</> : <><i className="ti ti-check" /> Confirmar</>}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
