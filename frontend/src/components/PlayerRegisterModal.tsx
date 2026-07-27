import { useState, useEffect } from 'react';
import { apiRegisterPlayer, apiConfirmRegistrationOtp, apiResendRegistrationOtp } from '../lib/api';
import { checkPassword } from '../lib/password';
import { PasswordHints } from './PasswordHints';
import { OtpInput } from './OtpInput';

interface Props {
  onClose:   () => void;
  showToast: (msg: string, type?: string) => void;
}

const SOCIALS = [
  { id: 'twitch',  label: 'Twitch',  icon: 'ti-brand-twitch',  placeholder: 'https://twitch.tv/seunick',    color: '#9146ff' },
  { id: 'youtube', label: 'YouTube', icon: 'ti-brand-youtube', placeholder: 'https://youtube.com/@seunick', color: '#ff0000' },
  { id: 'kick',    label: 'Kick',    icon: 'ti-brand-kick',    placeholder: 'https://kick.com/seunick',      color: '#53fc18' },
  { id: 'tiktok',  label: 'TikTok',  icon: 'ti-brand-tiktok',  placeholder: 'https://tiktok.com/@seunick',  color: '#ee1d52' },
] as const;

type SocialId = typeof SOCIALS[number]['id'];

export function PlayerRegisterModal({ onClose, showToast }: Props) {
  const [nick,            setNick]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [step,            setStep]            = useState<'form' | 'otp' | 'done'>('form');
  const [otpCode,         setOtpCode]         = useState('');
  const [otpError,        setOtpError]        = useState('');
  const [resendMsg,       setResendMsg]       = useState('');
  const [socials, setSocials] = useState<Record<SocialId, string>>({
    twitch: '', youtube: '', kick: '', tiktok: '',
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  function setSocial(id: SocialId, value: string) {
    setSocials(prev => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim() || !email.trim() || !password) return;
    if (!checkPassword(password).ok) {
      showToast('A senha não atende aos requisitos de segurança.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    setLoading(true);
    try {
      await apiRegisterPlayer({
        nick:        nick.trim(),
        email:       email.trim(),
        password,
        twitch_url:  socials.twitch.trim()  || undefined,
        youtube_url: socials.youtube.trim() || undefined,
        kick_url:    socials.kick.trim()    || undefined,
        tiktok_url:  socials.tiktok.trim()  || undefined,
      });
      setStep('otp');
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

  const canSubmit = nick.trim() && email.trim() && checkPassword(password).ok && password === confirmPassword;

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box reg-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        {step === 'done' ? (
          <div className="reg-success">
            <div className="reg-success-icon"><i className="ti ti-circle-check" /></div>
            <h2 className="reg-success-title">Conta ativa!</h2>
            <p className="reg-success-msg">
              Email confirmado! Sua conta já está ativa. Faça login no Companion com seu email e senha.
            </p>
            <button className="btn-primary btn-block" onClick={onClose}>
              <i className="ti ti-arrow-left" /> Voltar ao Ranking
            </button>
          </div>
        ) : step === 'otp' ? (
          <div>
            <div className="reg-header">
              <div className="reg-header-icon"><i className="ti ti-mail-check" /></div>
              <h2 className="reg-title">Confirme seu email</h2>
              <p className="reg-subtitle">
                Enviamos um código de 6 dígitos para <strong>{email.trim()}</strong>.
              </p>
            </div>
            <form onSubmit={handleOtpSubmit} noValidate style={{ marginTop: 16 }}>
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                loading={loading}
                onResend={handleResend}
                resendMsg={resendMsg}
              />
              {otpError && <p style={{ color: 'var(--red)', fontSize: 14, marginTop: 8 }}>{otpError}</p>}
              <button
                className="btn-primary btn-block"
                type="submit"
                disabled={loading || otpCode.length !== 6}
                style={{ marginTop: 16 }}
              >
                {loading ? <><i className="ti ti-loader-2" /> Verificando...</> : <><i className="ti ti-check" /> Confirmar</>}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="reg-header">
              <div className="reg-header-icon"><i className="ti ti-trophy" /></div>
              <h2 className="reg-title">Entrar no Ranking</h2>
              <p className="reg-subtitle">
                Crie sua conta e confirme seu email para entrar no ranking.
              </p>
            </div>

            <form className="modal-form" onSubmit={handleSubmit} noValidate>

              {/* Nick */}
              <div className="reg-field">
                <label className="form-label" htmlFor="reg-nick">
                  Nick do jogador <span className="required">*</span>
                </label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-user reg-nick-icon" />
                  <input
                    id="reg-nick"
                    className="form-input reg-nick-input"
                    type="text"
                    placeholder="SeuNickAqui"
                    value={nick}
                    onChange={e => setNick(e.target.value)}
                    autoComplete="username"
                    spellCheck={false}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="reg-field">
                <label className="form-label" htmlFor="reg-email">
                  Email <span className="required">*</span>
                </label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-mail reg-nick-icon" />
                  <input
                    id="reg-email"
                    className="form-input reg-nick-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="reg-field">
                <label className="form-label" htmlFor="reg-password">
                  Senha <span className="required">*</span>
                </label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock reg-nick-icon" />
                  <input
                    id="reg-password"
                    className="form-input reg-nick-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
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

              {/* Confirmar senha */}
              <div className="reg-field">
                <label className="form-label" htmlFor="reg-confirm-password">
                  Confirmar senha <span className="required">*</span>
                </label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock-check reg-nick-icon" />
                  <input
                    id="reg-confirm-password"
                    className="form-input reg-nick-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  {confirmPassword && (
                    <i className={`ti reg-nick-icon ${password === confirmPassword ? 'ti-check reg-pass-match' : 'ti-x reg-pass-mismatch'}`} />
                  )}
                </div>
              </div>

              {/* Canais de streaming */}
              <div className="reg-socials-section">
                <div className="reg-socials-header">
                  <span className="form-label">Canais de streaming</span>
                  <span className="optional-chip">opcional</span>
                </div>
                <p className="reg-socials-hint">
                  Adicione seus canais para aparecer como criador de conteúdo no ranking.
                </p>
                <div className="reg-socials-grid">
                  {SOCIALS.map(s => (
                    <div key={s.id} className="reg-social-item" style={{ '--social-color': s.color } as React.CSSProperties}>
                      <label className="reg-social-label" htmlFor={`reg-${s.id}`}>
                        <i className={`ti ${s.icon}`} />
                        {s.label}
                      </label>
                      <input
                        id={`reg-${s.id}`}
                        className="form-input reg-social-input"
                        type="url"
                        placeholder={s.placeholder}
                        value={socials[s.id]}
                        onChange={e => setSocial(s.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="reg-info-box">
                <i className="ti ti-shield-lock" />
                <span>
                  Seu email é usado para login no Companion e notificações do ranking.
                  Após confirmar o código enviado por email, sua conta estará ativa.
                </span>
              </div>

              <button
                className="btn-primary btn-block"
                type="submit"
                disabled={loading || !canSubmit}
              >
                {loading
                  ? <><i className="ti ti-loader-2" /> Enviando...</>
                  : <><i className="ti ti-send" /> Criar conta</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
