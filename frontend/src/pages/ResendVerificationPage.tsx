import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiResendRegistrationOtp, apiConfirmRegistrationOtp } from '../lib/api';
import { OtpInput } from '../components/OtpInput';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import loginBg from '../../assets/background/tela-de-login.webp';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Step = 'email' | 'otp' | 'done' | 'verified';

export function ResendVerificationPage() {
  const [step,    setStep]    = useState<Step>('email');
  const [email,   setEmail]   = useState('');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const { toast, showToast, clearToast } = useToast();

  const emailOk = RE_EMAIL.test(email.trim());

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOk) return;
    setLoading(true);
    try {
      await apiResendRegistrationOtp(email.trim());
      setStep('otp');
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg === 'already_verified') {
        setStep('verified');
      } else {
        showToast(msg || 'Não foi possível enviar. Verifique o email e tente novamente.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await apiConfirmRegistrationOtp(email.trim(), code);
      setStep('done');
    } catch (err) {
      showToast((err as Error).message || 'Código inválido ou expirado.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendMsg('');
    try {
      await apiResendRegistrationOtp(email.trim());
      setResendMsg('Novo código enviado!');
      setTimeout(() => setResendMsg(''), 4000);
    } catch {
      setResendMsg('Erro ao reenviar. Tente novamente.');
    }
  }

  const bgStyle = { backgroundImage: `url(${loginBg})` };

  if (step === 'verified' || step === 'done') {
    const isVerified = step === 'verified';
    return (
      <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
        <div className="account-login-card reg-card">
          <div className="reg-success-card">
            <i className="ti ti-circle-check reg-success-icon" />
            <h1 className="reg-title" style={{ marginBottom: 8 }}>
              {isVerified ? 'Conta já ativa!' : 'Conta verificada!'}
            </h1>
            <p className="reg-sub" style={{ marginBottom: 24 }}>
              {isVerified
                ? <>O email <strong className="reg-email-highlight">{email}</strong> já está verificado. Faça login normalmente.</>
                : 'Seu email foi confirmado. Agora faça login com seu email e senha.'}
            </p>
            <Link to="/login" className="btn-primary reg-submit" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="ti ti-login" /> Ir para login
            </Link>
          </div>
        </div>
        <Toast {...toast} onClose={clearToast} />
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
        <div className="account-login-card reg-card">
          <button className="reg-back-home" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setStep('email'); setCode(''); }}>
            <i className="ti ti-arrow-left" /> Trocar e-mail
          </button>

          <div className="reg-header">
            <div className="reg-icon-wrap">
              <i className="ti ti-mail-check" />
            </div>
            <h1 className="reg-title">Digite o código</h1>
            <p className="reg-sub">
              Enviamos um código de 6 dígitos para{' '}
              <strong className="reg-email-highlight">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleConfirm} className="account-login-form">
            <OtpInput
              value={code}
              onChange={setCode}
              loading={loading}
              onResend={handleResend}
              resendMsg={resendMsg}
            />
            <button
              type="submit"
              className={`btn-primary reg-submit${code.length === 6 ? ' reg-submit--ready' : ''}`}
              disabled={loading || code.length !== 6}
            >
              {loading
                ? <><i className="ti ti-loader-2" /> Verificando...</>
                : <><i className="ti ti-check" /> Confirmar código</>}
            </button>
          </form>

          <div className="reg-aux-links">
            <Link to="/login" className="reg-aux-link">
              <i className="ti ti-login" /> Voltar ao login
            </Link>
          </div>
        </div>
        <Toast {...toast} onClose={clearToast} />
      </div>
    );
  }

  return (
    <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
      <div className="account-login-card reg-card">
        <Link to="/login" className="reg-back-home">
          <i className="ti ti-arrow-left" /> Voltar ao login
        </Link>

        <div className="reg-header">
          <div className="reg-icon-wrap">
            <i className="ti ti-mail-forward" />
          </div>
          <h1 className="reg-title">Verificar e-mail</h1>
          <p className="reg-sub">
            Informe o e-mail do cadastro para recebermos um novo código de verificação.
          </p>
        </div>

        <form onSubmit={handleSendCode} className="account-login-form">
          <div className="reg-field">
            <label className="reg-label" htmlFor="rv-email">
              <i className="ti ti-mail" /> E-mail do cadastro
            </label>
            <div className="reg-input-wrap">
              <input
                id="rv-email"
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
              {email && !emailOk && (
                <i className="ti ti-alert-circle reg-input-icon reg-input-icon--err" />
              )}
            </div>
          </div>

          <button
            type="submit"
            className={`btn-primary reg-submit${emailOk ? ' reg-submit--ready' : ''}`}
            disabled={loading || !emailOk}
          >
            {loading
              ? <><i className="ti ti-loader-2" /> Enviando...</>
              : <><i className="ti ti-send" /> Enviar código</>}
          </button>
        </form>

        <div className="reg-aux-links">
          <Link to="/" className="reg-aux-link">
            <i className="ti ti-home" /> Ir ao Rank
          </Link>
        </div>
      </div>
      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
