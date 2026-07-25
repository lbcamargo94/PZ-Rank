import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  apiPlayerLogin,
  apiGetMyProfile,
  apiGetMyEntries,
  apiUpdateMyLinks,
  apiSendAccountOtp,
  apiConfirmAccountOtp,
} from '../lib/api';
import { OtpInput } from '../components/OtpInput';
import type { PlayerSession, PlayerAccount, Entry } from '../types';

type AccountTab = 'conta' | 'links' | 'runs';

function FormField({
  label, type = 'text', value, onChange, placeholder, autoComplete,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="account-field">
      <label className="account-label">{label}</label>
      <input
        className="account-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function StatusMsg({ msg, ok }: { msg: string; ok: boolean }) {
  if (!msg) return null;
  return <p className={`account-status ${ok ? 'account-status--ok' : 'account-status--err'}`}>{msg}</p>;
}

// ── Login form ────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (s: PlayerSession) => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await apiPlayerLogin(email.trim(), password);
      onLogin(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="account-login-wrap">
      <div className="account-login-card">
        <h1 className="account-login-title">Minha Conta</h1>
        <p className="account-login-sub">Entre com seu email e senha para gerenciar sua conta.</p>
        <form onSubmit={handleSubmit} className="account-login-form">
          <FormField label="Email" type="email" value={email} onChange={setEmail}
            placeholder="seu@email.com" autoComplete="email" />
          <div className="account-field">
            <label className="account-label">Senha</label>
            <div className="account-pass-wrap">
              <input className="account-input" type={showPass ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Sua senha" autoComplete="current-password" />
              <button type="button" className="account-pass-toggle"
                onClick={() => setShowPass(p => !p)} aria-label="Mostrar/ocultar senha">
                <i className={`ti ti-eye${showPass ? '-off' : ''}`} />
              </button>
            </div>
          </div>
          {error && <StatusMsg msg={error} ok={false} />}
          <button type="submit" className="btn-primary account-submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <div className="account-login-links">
          <Link to="/esqueci-senha"  className="account-link">Esqueci minha senha</Link>
          <span className="account-login-sep">·</span>
          <Link to="/vincular-conta" className="account-link">Sou jogador legado</Link>
          <span className="account-login-sep">·</span>
          <Link to="/"               className="account-link">Voltar ao Rank</Link>
        </div>
      </div>
    </div>
  );
}

type OtpFlowState = 'idle' | 'sent' | 'done';

function OtpActionForm({
  title, children, otpState, otpCode, otpMsg, otpOk, otpLoading,
  onOtpChange, onOtpConfirm, onOtpResend, resendMsg,
}: {
  title: string;
  children: React.ReactNode;
  otpState: OtpFlowState;
  otpCode: string;
  otpMsg: string;
  otpOk: boolean;
  otpLoading: boolean;
  onOtpChange: (v: string) => void;
  onOtpConfirm: (e: React.FormEvent) => void;
  onOtpResend?: () => void;
  resendMsg?: string;
}) {
  return (
    <section className="account-section">
      <h2 className="account-section-title">{title}</h2>
      {otpState === 'done' ? (
        <StatusMsg msg={otpMsg} ok={true} />
      ) : otpState === 'sent' ? (
        <form onSubmit={onOtpConfirm} className="account-form">
          <OtpInput
            value={otpCode}
            onChange={onOtpChange}
            hint="Digite o código de 6 dígitos enviado por email"
            loading={otpLoading}
            onResend={onOtpResend}
            resendMsg={resendMsg}
          />
          <StatusMsg msg={otpMsg} ok={otpOk} />
          <button type="submit" className="btn-primary" disabled={otpLoading || otpCode.length !== 6}>
            {otpLoading ? 'Confirmando…' : 'Confirmar código'}
          </button>
        </form>
      ) : (
        <>
          {children}
          {otpMsg && <StatusMsg msg={otpMsg} ok={otpOk} />}
        </>
      )}
    </section>
  );
}

// ── Aba: Conta (email + senha) ────────────────────────────────
function TabConta({ session, profile, onProfileChange }: {
  session: PlayerSession;
  profile: PlayerAccount;
  onProfileChange: () => void;
}) {
  // Email state
  const [curPassEmail,   setCurPassEmail]   = useState('');
  const [newEmail,       setNewEmail]       = useState('');
  const [emailMsg,       setEmailMsg]       = useState('');
  const [emailOk,        setEmailOk]        = useState(false);
  const [emailLoading,   setEmailLoading]   = useState(false);
  const [emailOtpState,  setEmailOtpState]  = useState<OtpFlowState>('idle');
  const [emailOtpCode,   setEmailOtpCode]   = useState('');
  const [emailResendMsg, setEmailResendMsg] = useState('');

  // Senha state
  const [curPassPwd,   setCurPassPwd]   = useState('');
  const [newPwd,       setNewPwd]       = useState('');
  const [confirmPwd,   setConfirmPwd]   = useState('');
  const [pwdMsg,       setPwdMsg]       = useState('');
  const [pwdOk,        setPwdOk]        = useState(false);
  const [pwdLoading,   setPwdLoading]   = useState(false);
  const [pwdOtpState,  setPwdOtpState]  = useState<OtpFlowState>('idle');
  const [pwdOtpCode,   setPwdOtpCode]   = useState('');
  const [pwdResendMsg, setPwdResendMsg] = useState('');

  // Passo 1 email: envia OTP
  async function handleEmailSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(''); setEmailLoading(true);
    try {
      const res = await apiSendAccountOtp(session.player_token, 'change_email', {
        current_password: curPassEmail, new_email: newEmail,
      });
      setEmailMsg(res.message); setEmailOk(true); setEmailOtpState('sent');
    } catch (err) {
      setEmailMsg((err as Error).message); setEmailOk(false);
    } finally {
      setEmailLoading(false);
    }
  }

  // Passo 2 email: confirma OTP
  async function handleEmailConfirmOtp(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(''); setEmailLoading(true);
    try {
      const res = await apiConfirmAccountOtp(session.player_token, 'change_email', {
        code: emailOtpCode, current_password: curPassEmail, new_email: newEmail,
      });
      setEmailMsg(res.message); setEmailOtpState('done');
      setCurPassEmail(''); setNewEmail(''); setEmailOtpCode('');
      onProfileChange();
    } catch (err) {
      setEmailMsg((err as Error).message); setEmailOk(false);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleEmailResend() {
    setEmailResendMsg('');
    try {
      const res = await apiSendAccountOtp(session.player_token, 'change_email', {
        current_password: curPassEmail, new_email: newEmail,
      });
      setEmailResendMsg(res.message);
    } catch (err) {
      setEmailResendMsg((err as Error).message);
    }
  }

  // Passo 1 senha: envia OTP
  async function handlePwdSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg('');
    if (newPwd !== confirmPwd) { setPwdMsg('As senhas não conferem.'); setPwdOk(false); return; }
    setPwdLoading(true);
    try {
      const res = await apiSendAccountOtp(session.player_token, 'change_password', {
        current_password: curPassPwd, new_password: newPwd,
      });
      setPwdMsg(res.message); setPwdOk(true); setPwdOtpState('sent');
    } catch (err) {
      setPwdMsg((err as Error).message); setPwdOk(false);
    } finally {
      setPwdLoading(false);
    }
  }

  // Passo 2 senha: confirma OTP
  async function handlePwdConfirmOtp(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(''); setPwdLoading(true);
    try {
      const res = await apiConfirmAccountOtp(session.player_token, 'change_password', {
        code: pwdOtpCode, current_password: curPassPwd, new_password: newPwd,
      });
      setPwdMsg(res.message); setPwdOtpState('done');
      setCurPassPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdOtpCode('');
    } catch (err) {
      setPwdMsg((err as Error).message); setPwdOk(false);
    } finally {
      setPwdLoading(false);
    }
  }

  async function handlePwdResend() {
    setPwdResendMsg('');
    try {
      const res = await apiSendAccountOtp(session.player_token, 'change_password', {
        current_password: curPassPwd, new_password: newPwd,
      });
      setPwdResendMsg(res.message);
    } catch (err) {
      setPwdResendMsg((err as Error).message);
    }
  }

  return (
    <div className="account-tab-body">
      <OtpActionForm
        title="Email"
        otpState={emailOtpState}
        otpCode={emailOtpCode}
        otpMsg={emailMsg}
        otpOk={emailOk}
        otpLoading={emailLoading}
        onOtpChange={setEmailOtpCode}
        onOtpConfirm={handleEmailConfirmOtp}
        onOtpResend={handleEmailResend}
        resendMsg={emailResendMsg}
      >
        <p className="account-section-info">
          Email atual: <strong>{profile.email}</strong>
          {profile.email_verified_at
            ? <span className="account-badge account-badge--ok"> verificado</span>
            : <span className="account-badge account-badge--warn"> não verificado</span>}
        </p>
        <form onSubmit={handleEmailSendOtp} className="account-form">
          <FormField label="Senha atual" type="password" value={curPassEmail}
            onChange={setCurPassEmail} autoComplete="current-password" />
          <FormField label="Novo email" type="email" value={newEmail}
            onChange={setNewEmail} placeholder="novo@email.com" autoComplete="email" />
          <button type="submit" className="btn-primary" disabled={emailLoading || !curPassEmail || !newEmail}>
            {emailLoading ? 'Enviando código…' : 'Trocar email'}
          </button>
        </form>
      </OtpActionForm>

      <div className="account-divider" />

      <OtpActionForm
        title="Senha"
        otpState={pwdOtpState}
        otpCode={pwdOtpCode}
        otpMsg={pwdMsg}
        otpOk={pwdOk}
        otpLoading={pwdLoading}
        onOtpChange={setPwdOtpCode}
        onOtpConfirm={handlePwdConfirmOtp}
        onOtpResend={handlePwdResend}
        resendMsg={pwdResendMsg}
      >
        <form onSubmit={handlePwdSendOtp} className="account-form">
          <FormField label="Senha atual" type="password" value={curPassPwd}
            onChange={setCurPassPwd} autoComplete="current-password" />
          <FormField label="Nova senha" type="password" value={newPwd}
            onChange={setNewPwd} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
          <FormField label="Confirmar nova senha" type="password" value={confirmPwd}
            onChange={setConfirmPwd} autoComplete="new-password" />
          <button type="submit" className="btn-primary"
            disabled={pwdLoading || !curPassPwd || newPwd.length < 8 || newPwd !== confirmPwd}>
            {pwdLoading ? 'Enviando código…' : 'Trocar senha'}
          </button>
        </form>
      </OtpActionForm>
    </div>
  );
}

// ── Aba: Redes Sociais ────────────────────────────────────────
function TabLinks({ session, profile, onProfileChange }: {
  session: PlayerSession;
  profile: PlayerAccount;
  onProfileChange: () => void;
}) {
  const [twitch,   setTwitch]   = useState(profile.twitch_url ?? '');
  const [youtube,  setYoutube]  = useState(profile.youtube_url ?? '');
  const [kick,     setKick]     = useState(profile.kick_url ?? '');
  const [tiktok,   setTiktok]   = useState(profile.tiktok_url ?? '');
  const [msg,      setMsg]      = useState('');
  const [ok,       setOk]       = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setLoading(true);
    try {
      await apiUpdateMyLinks(session.player_token, {
        twitch_url:  twitch  || null,
        youtube_url: youtube || null,
        kick_url:    kick    || null,
        tiktok_url:  tiktok  || null,
      });
      setMsg('Links atualizados com sucesso.'); setOk(true);
      onProfileChange();
    } catch (err) {
      setMsg((err as Error).message); setOk(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="account-tab-body">
      <section className="account-section">
        <h2 className="account-section-title">Redes Sociais</h2>
        <p className="account-section-info">
          Seus links aparecem no perfil público e no ranking.
        </p>
        <form onSubmit={handleSave} className="account-form">
          <div className="account-field">
            <label className="account-label"><i className="ti ti-brand-twitch" /> Twitch</label>
            <input className="account-input" type="url" value={twitch}
              onChange={e => setTwitch(e.target.value)} placeholder="https://twitch.tv/seunick" />
          </div>
          <div className="account-field">
            <label className="account-label"><i className="ti ti-brand-youtube" /> YouTube</label>
            <input className="account-input" type="url" value={youtube}
              onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/@seunick" />
          </div>
          <div className="account-field">
            <label className="account-label"><i className="ti ti-brand-kick" /> Kick</label>
            <input className="account-input" type="url" value={kick}
              onChange={e => setKick(e.target.value)} placeholder="https://kick.com/seunick" />
          </div>
          <div className="account-field">
            <label className="account-label"><i className="ti ti-brand-tiktok" /> TikTok</label>
            <input className="account-input" type="url" value={tiktok}
              onChange={e => setTiktok(e.target.value)} placeholder="https://tiktok.com/@seunick" />
          </div>
          <StatusMsg msg={msg} ok={ok} />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar links'}
          </button>
        </form>
      </section>
    </div>
  );
}

// ── Aba: Minhas Runs ──────────────────────────────────────────
function TabRuns({ session }: { session: PlayerSession }) {
  const [entries,  setEntries]  = useState<Entry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    apiGetMyEntries(session.player_token)
      .then(setEntries)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [session.player_token]);

  if (loading) return <div className="account-tab-body"><p className="account-section-info">Carregando…</p></div>;
  if (error)   return <div className="account-tab-body"><StatusMsg msg={error} ok={false} /></div>;

  return (
    <div className="account-tab-body">
      <section className="account-section">
        <h2 className="account-section-title">Minhas Runs</h2>
        {entries.length === 0
          ? <p className="account-section-info">Nenhuma run registrada ainda.</p>
          : (
            <div className="account-runs">
              {entries.map(e => (
                <div key={e.id} className="account-run-card">
                  <div className="account-run-header">
                    <span className="account-run-char">{e.character_name || e.name}</span>
                    <span className={`account-run-status ${e.is_alive ? 'alive' : 'dead'}`}>
                      {e.is_alive ? 'Vivo' : 'Morto'}
                    </span>
                    {!e.sandbox_ok && (
                      <span className="account-run-status disq">Desclassificado</span>
                    )}
                  </div>
                  <div className="account-run-stats">
                    <span><i className="ti ti-skull" /> {e.kills} kills</span>
                    <span><i className="ti ti-calendar" /> {e.days} dias</span>
                    <span><i className="ti ti-star" /> {e.score.toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </section>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export function AccountPage() {
  const [session,  setSession]  = useState<PlayerSession | null>(null);
  const [profile,  setProfile]  = useState<PlayerAccount | null>(null);
  const [tab,      setTab]      = useState<AccountTab>('conta');

  const loadProfile = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiGetMyProfile(session.player_token);
      setProfile(data);
    } catch {}
  }, [session]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (!session) return <LoginForm onLogin={setSession} />;
  if (!profile) return (
    <div className="account-login-wrap">
      <p style={{ color: 'var(--text-2)' }}>Carregando…</p>
    </div>
  );

  const TABS: { id: AccountTab; label: string; icon: string }[] = [
    { id: 'conta', label: 'Conta',         icon: 'ti-user' },
    { id: 'links', label: 'Redes Sociais', icon: 'ti-share' },
    { id: 'runs',  label: 'Minhas Runs',   icon: 'ti-list' },
  ];

  return (
    <div className="account-wrap">
      <div className="account-header">
        <div>
          <h1 className="account-title">Minha Conta</h1>
          <p className="account-nick">{profile.nick}</p>
        </div>
        <div className="account-header-actions">
          <Link to={`/player/${session.player_id}`} className="btn-ghost btn-sm">
            <i className="ti ti-external-link" /> Ver perfil público
          </Link>
          <button className="btn-ghost btn-sm" onClick={() => setSession(null)}>
            <i className="ti ti-logout" /> Sair
          </button>
        </div>
      </div>

      <div className="account-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={`account-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            <i className={`ti ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'conta' && <TabConta session={session} profile={profile} onProfileChange={loadProfile} />}
      {tab === 'links' && <TabLinks session={session} profile={profile} onProfileChange={loadProfile} />}
      {tab === 'runs'  && <TabRuns  session={session} />}
    </div>
  );
}
