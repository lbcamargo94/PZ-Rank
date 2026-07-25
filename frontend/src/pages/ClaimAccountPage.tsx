import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClaimAccount, apiConfirmClaimOtp, apiResendClaimOtp } from '../lib/api';
import { OtpInput } from '../components/OtpInput';

type Step = 'form' | 'otp';

export function ClaimAccountPage() {
  const navigate = useNavigate();

  const [step,     setStep]     = useState<Step>('form');
  const [nick,     setNick]     = useState('');
  const [email,    setEmail]    = useState('');
  const [otpCode,  setOtpCode]  = useState('');
  const [msg,      setMsg]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim() || !email.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      await apiClaimAccount(nick.trim(), email.trim());
      setStep('otp');
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await apiConfirmClaimOtp(email.trim(), otpCode);
      navigate(`/ativar-conta?token=${res.activate_token}`);
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendMsg('');
    try {
      await apiResendClaimOtp(email.trim());
      setResendMsg('Novo código enviado.');
    } catch {
      setResendMsg('Não foi possível reenviar. Tente novamente.');
    }
  }

  return (
    <div className="account-login-wrap">
      <div className="account-login-card">

        {step === 'form' ? (
          <>
            <h1 className="account-login-title">Vincular conta</h1>
            <p className="account-login-sub">
              Se você já está no ranking mas ainda não tem email e senha, informe seu nick e o email que deseja usar.
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
                {loading ? 'Enviando…' : 'Enviar código'}
              </button>
              <div className="account-login-links">
                <Link to="/minha-conta" className="btn-ghost btn-sm"><i className="ti ti-login" /> Já tenho conta</Link>
                <Link to="/"            className="btn-ghost btn-sm"><i className="ti ti-home" /> Ver o ranking</Link>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="account-login-title">Confirme seu email</h1>
            <p className="account-login-sub">
              Um código de 6 dígitos foi enviado para <strong>{email}</strong>. Digite-o abaixo para continuar.
            </p>
            <form onSubmit={handleOtpConfirm} className="account-login-form">
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                hint="Código recebido por email"
                loading={loading}
                onResend={handleResend}
                resendMsg={resendMsg}
              />
              {msg && <p className="account-status account-status--err">{msg}</p>}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? 'Verificando…' : 'Confirmar código'}
              </button>
              <div className="account-login-links">
                <button type="button" className="btn-ghost btn-sm" onClick={() => { setStep('form'); setOtpCode(''); setMsg(''); }}>
                  <i className="ti ti-arrow-left" /> Voltar
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
