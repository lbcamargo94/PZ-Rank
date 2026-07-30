import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClaimAccount, apiConfirmClaimOtp, apiResendClaimOtp } from '../lib/api';
import { OtpInput } from '../components/OtpInput';
import cadastroBg from '../../assets/background/cadastro-bg.jpg';

export function ClaimAccountPage() {
  const navigate = useNavigate();

  const [nick,      setNick]      = useState('');
  const [email,     setEmail]     = useState('');
  const [msg,       setMsg]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [step,      setStep]      = useState<'form' | 'otp'>('form');
  const [claimEmail, setClaimEmail] = useState('');
  const [otpCode,   setOtpCode]   = useState('');
  const [otpError,  setOtpError]  = useState('');
  const [resendMsg, setResendMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nick.trim() || !email.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await apiClaimAccount(nick.trim(), email.trim());
      if (res.otp_pending) {
        setClaimEmail(res.email);
        setStep('otp');
      } else {
        setMsg(res.message);
      }
    } catch (err) {
      setMsg((err as Error).message);
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
      const res = await apiConfirmClaimOtp(claimEmail, otpCode);
      navigate(`/ativar-conta?token=${encodeURIComponent(res.activate_token)}`);
    } catch (err) {
      setOtpError((err as Error).message || 'Código inválido ou expirado.');
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

  if (step === 'otp') {
    return (
      <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
        <div className="account-login-card">
          <h1 className="account-login-title">Confirme seu email</h1>
          <p className="account-login-sub">
            Enviamos um código de 6 dígitos para <strong>{claimEmail}</strong>.
            Insira abaixo para continuar.
          </p>
          <form onSubmit={handleOtpSubmit} className="account-login-form">
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              loading={loading}
              onResend={handleResend}
              resendMsg={resendMsg}
            />
            {otpError && <p className="account-status account-status--err">{otpError}</p>}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || otpCode.length !== 6}
            >
              {loading
                ? <><i className="ti ti-loader-2" /> Verificando...</>
                : <><i className="ti ti-check" /> Confirmar</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
      <div className="account-login-card">
        <h1 className="account-login-title">Vincular conta</h1>
        <p className="account-login-sub">
          Já está no ranking mas ainda não tem email e senha? Informe seu nick e cadastre seu email.
          Você receberá um código para confirmar e depois definir sua senha.
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
          {msg && <p className="account-status account-status--err">{msg}</p>}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !nick.trim() || !email.trim()}
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
