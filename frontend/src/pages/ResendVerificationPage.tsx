import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiResendRegistrationOtp, apiConfirmRegistrationOtp } from '../lib/api';
import { OtpInput } from '../components/OtpInput';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';

type Step = 'email' | 'otp' | 'done' | 'verified';

export function ResendVerificationPage() {
  const [step,    setStep]    = useState<Step>('email');
  const [email,   setEmail]   = useState('');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const { toast, showToast, clearToast } = useToast();

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
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

  return (
    <div className="account-login-wrap">
      <div className="account-login-card">

        {step === 'verified' ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-circle-check" style={{ fontSize: 48, color: 'var(--green)' }} />
            <h1 className="account-login-title" style={{ margin: 0 }}>Conta já ativa!</h1>
            <p className="account-login-sub" style={{ marginBottom: 8 }}>
              O email <strong>{email}</strong> já está verificado. Faça login normalmente com seu email e senha.
            </p>
            <Link to="/minha-conta" className="btn-primary" style={{ textDecoration: 'none' }}>
              <i className="ti ti-login" /> Ir para login
            </Link>
          </div>
        ) : step === 'done' ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <i className="ti ti-circle-check" style={{ fontSize: 48, color: 'var(--green)' }} />
            <h1 className="account-login-title" style={{ margin: 0 }}>Conta verificada!</h1>
            <p className="account-login-sub" style={{ marginBottom: 8 }}>
              Seu email foi confirmado. Agora faça login com seu email e senha.
            </p>
            <Link to="/minha-conta" className="btn-primary" style={{ textDecoration: 'none' }}>
              <i className="ti ti-login" /> Ir para login
            </Link>
          </div>
        ) : step === 'otp' ? (
          <>
            <h1 className="account-login-title">Digite o código</h1>
            <p className="account-login-sub">
              Enviamos um código de 6 dígitos para <strong>{email}</strong>.
            </p>
            <form onSubmit={handleConfirm} className="account-login-form">
              <OtpInput
                value={code}
                onChange={setCode}
                loading={loading}
                onResend={handleResend}
                resendMsg={resendMsg}
              />
              <button type="submit" className="btn-primary" disabled={loading || code.length !== 6}>
                {loading ? <><i className="ti ti-loader-2" /> Verificando…</> : <><i className="ti ti-check" /> Confirmar</>}
              </button>
              <div className="account-login-links">
                <button type="button" className="btn-ghost btn-sm" onClick={() => { setStep('email'); setCode(''); }}>
                  <i className="ti ti-arrow-left" /> Trocar email
                </button>
                <Link to="/minha-conta" className="btn-ghost btn-sm"><i className="ti ti-login" /> Voltar ao login</Link>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="account-login-title">Verificar email</h1>
            <p className="account-login-sub">
              Informe o email que você usou no cadastro e enviaremos um novo código de verificação.
            </p>
            <form onSubmit={handleSendCode} className="account-login-form">
              <div className="account-field">
                <label className="account-label">Email do cadastro</label>
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
              <button type="submit" className="btn-primary" disabled={loading || !email.trim()}>
                {loading ? <><i className="ti ti-loader-2" /> Enviando…</> : <><i className="ti ti-send" /> Enviar código</>}
              </button>
              <div className="account-login-links">
                <Link to="/minha-conta" className="btn-ghost btn-sm"><i className="ti ti-arrow-left" /> Voltar ao login</Link>
                <Link to="/"            className="btn-ghost btn-sm"><i className="ti ti-home" /> Ir ao Rank</Link>
              </div>
            </form>
          </>
        )}

      </div>
      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
