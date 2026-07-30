import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClaimAccount, apiConfirmClaimOtp, apiResendClaimOtp } from '../lib/api';
import { OtpInput } from '../components/OtpInput';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import cadastroBg from '../../assets/background/cadastro-bg.jpg';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ClaimAccountPage() {
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();

  const [nick,       setNick]       = useState('');
  const [email,      setEmail]      = useState('');
  const [gender,     setGender]     = useState<'m' | 'f' | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [step,       setStep]       = useState<'form' | 'otp'>('form');
  const [claimEmail, setClaimEmail] = useState('');
  const [otpCode,    setOtpCode]    = useState('');
  const [resendMsg,  setResendMsg]  = useState('');

  const nickOk  = nick.trim().length >= 2;
  const emailOk = RE_EMAIL.test(email.trim());
  const canSubmit = nickOk && emailOk && !!gender;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await apiClaimAccount(nick.trim(), email.trim(), gender!);
      if (res.otp_pending) {
        setClaimEmail(res.email);
        setStep('otp');
      } else {
        showToast(res.message, 'info');
      }
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
    try {
      const res = await apiConfirmClaimOtp(claimEmail, otpCode);
      navigate(`/ativar-conta?token=${encodeURIComponent(res.activate_token)}`);
    } catch (err) {
      showToast((err as Error).message || 'Código inválido ou expirado.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await apiResendClaimOtp(claimEmail);
      setResendMsg('Novo código enviado!');
      setTimeout(() => setResendMsg(''), 4000);
    } catch {
      setResendMsg('Erro ao reenviar. Tente novamente.');
    }
  }

  const bgStyle = { backgroundImage: `url(${cadastroBg})` };

  const steps = [
    { icon: 'ti-user-plus',  label: 'Dados'  },
    { icon: 'ti-mail-check', label: 'Email'  },
    { icon: 'ti-lock',       label: 'Senha'  },
  ];
  const currentStep = step === 'form' ? 0 : 1;

  const StepBar = () => (
    <div className="reg-steps">
      {steps.map((s, i) => (
        <div
          key={i}
          className={`reg-step-item${i === currentStep ? ' is-active' : i < currentStep ? ' is-done' : ''}`}
        >
          <div className="reg-step-track">
            <div className={`reg-step-half${i === 0 ? ' invisible' : i <= currentStep ? ' done' : ''}`} />
            <div className="reg-step-dot">
              {i < currentStep
                ? <i className="ti ti-check" />
                : <i className={`ti ${s.icon}`} />}
            </div>
            <div className={`reg-step-half${i === steps.length - 1 ? ' invisible' : i < currentStep ? ' done' : ''}`} />
          </div>
          <span className="reg-step-label">{s.label}</span>
        </div>
      ))}
    </div>
  );

  if (step === 'otp') {
    return (
      <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
        <div className="account-login-card reg-card">
          <Link to="/" className="reg-back-home">
            <i className="ti ti-arrow-left" /> Página inicial
          </Link>
          <div className="reg-header">
            <div className="reg-icon-wrap">
              <i className="ti ti-mail-check" />
            </div>
            <h1 className="reg-title">Confirme seu e-mail</h1>
            <p className="reg-sub">
              Enviamos um código de 6 dígitos para{' '}
              <strong className="reg-email-highlight">{claimEmail}</strong>
            </p>
          </div>

          <StepBar />

          <form onSubmit={handleOtpSubmit} className="account-login-form">
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              loading={loading}
              onResend={handleResend}
              resendMsg={resendMsg}
            />
            <button
              type="submit"
              className="btn-primary reg-submit"
              disabled={loading || otpCode.length !== 6}
            >
              {loading
                ? <><i className="ti ti-loader-2" /> Verificando...</>
                : <><i className="ti ti-arrow-right" /> Continuar</>}
            </button>
          </form>

          <p className="reg-back-link">
            <button className="btn-ghost btn-sm" onClick={() => setStep('form')}>
              <i className="ti ti-arrow-left" /> Voltar
            </button>
          </p>
        </div>
        <Toast {...toast} onClose={clearToast} />
      </div>
    );
  }

  return (
    <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
      <div className="account-login-card reg-card">

        <Link to="/" className="reg-back-home">
          <i className="ti ti-arrow-left" /> Página inicial
        </Link>

        <div className="reg-header">
          <div className="reg-icon-wrap">
            <i className="ti ti-user-plus" />
          </div>
          <h1 className="reg-title">Criar conta no PZRank</h1>
          <p className="reg-sub">
            Registre suas runs, acompanhe temporadas e suba no ranking do maior campeonato de Project Zomboid do Brasil.
          </p>
        </div>

        <StepBar />

        <form onSubmit={handleSubmit} className="account-login-form">

          {/* Nick */}
          <div className="reg-field">
            <label className="reg-label" htmlFor="reg-nick">
              <i className="ti ti-brand-discord" /> Nick no Discord
            </label>
            <div className="reg-input-wrap">
              <input
                id="reg-nick"
                className={`reg-input${nick && !nickOk ? ' reg-input--invalid' : ''}`}
                type="text"
                value={nick}
                onChange={e => setNick(e.target.value)}
                placeholder="SurvivorBR"
                autoComplete="username"
                autoFocus
              />
              {nick && nickOk && (
                <i className="ti ti-check reg-input-icon reg-input-icon--ok" />
              )}
            </div>
            <span className="reg-field-hint">
              Use o nick exato que aparece no ranking do campeonato.
            </span>
          </div>

          {/* Email */}
          <div className="reg-field">
            <label className="reg-label" htmlFor="reg-email">
              <i className="ti ti-mail" /> E-mail
            </label>
            <div className="reg-input-wrap">
              <input
                id="reg-email"
                className={`reg-input${email && !emailOk ? ' reg-input--invalid' : ''}`}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
              {email && emailOk && (
                <i className="ti ti-check reg-input-icon reg-input-icon--ok" />
              )}
              {email && !emailOk && (
                <i className="ti ti-alert-circle reg-input-icon reg-input-icon--err" />
              )}
            </div>
            <span className="reg-field-hint">
              Você receberá um código de confirmação neste endereço.
            </span>
          </div>

          {/* Aparência do personagem */}
          <div className="reg-gender-picker">
            <div className="reg-gender-label">
              <i className="ti ti-shirt" />
              <span>Aparência do personagem</span>
            </div>
            <div className="reg-gender-options">
              <button
                type="button"
                className={`reg-gender-option${gender === 'm' ? ' is-selected' : ''}`}
                onClick={() => setGender('m')}
              >
                <span className="reg-gender-icon">
                  <i className="ti ti-man" />
                </span>
                <span className="reg-gender-option-label">Masculino</span>
                {gender === 'm' && <i className="ti ti-check reg-gender-check" />}
              </button>
              <button
                type="button"
                className={`reg-gender-option${gender === 'f' ? ' is-selected' : ''}`}
                onClick={() => setGender('f')}
              >
                <span className="reg-gender-icon">
                  <i className="ti ti-woman" />
                </span>
                <span className="reg-gender-option-label">Feminino</span>
                {gender === 'f' && <i className="ti ti-check reg-gender-check" />}
              </button>
            </div>
            {!gender && (
              <p className="reg-gender-required-hint">
                <i className="ti ti-info-circle" /> Selecione a aparência para continuar.
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`btn-primary reg-submit${canSubmit ? ' reg-submit--ready' : ''}`}
            disabled={loading || !canSubmit}
          >
            {loading
              ? <><i className="ti ti-loader-2" /> Enviando...</>
              : <><i className="ti ti-user-plus" /> Criar conta</>}
          </button>
        </form>

        <div className="reg-footer">
          <span className="reg-footer-text">Já tem uma conta?</span>
          <Link to="/login" className="reg-footer-link">
            <i className="ti ti-login" /> Fazer login
          </Link>
        </div>

      </div>
      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
