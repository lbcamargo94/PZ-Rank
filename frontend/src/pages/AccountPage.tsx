import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  apiPlayerLogin,
  apiGetMyProfile,
  apiGetMyEntries,
  apiChangePassword,
  apiChangeEmail,
  apiUpdateMyLinks,
} from '../lib/api';
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
          <Link to="/esqueci-senha" className="account-link">Esqueci minha senha</Link>
          <span className="account-login-sep">·</span>
          <Link to="/" className="account-link">Voltar ao Rank</Link>
        </div>
      </div>
    </div>
  );
}

// ── Aba: Conta (email + senha) ────────────────────────────────
function TabConta({ session, profile, onProfileChange }: {
  session: PlayerSession;
  profile: PlayerAccount;
  onProfileChange: () => void;
}) {
  const [curPassEmail,  setCurPassEmail]  = useState('');
  const [newEmail,      setNewEmail]      = useState('');
  const [emailMsg,      setEmailMsg]      = useState('');
  const [emailOk,       setEmailOk]       = useState(false);
  const [emailLoading,  setEmailLoading]  = useState(false);

  const [curPassPwd,    setCurPassPwd]    = useState('');
  const [newPwd,        setNewPwd]        = useState('');
  const [confirmPwd,    setConfirmPwd]    = useState('');
  const [pwdMsg,        setPwdMsg]        = useState('');
  const [pwdOk,         setPwdOk]         = useState(false);
  const [pwdLoading,    setPwdLoading]    = useState(false);

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(''); setEmailLoading(true);
    try {
      const res = await apiChangeEmail(session.player_token, curPassEmail, newEmail);
      setEmailMsg(res.message); setEmailOk(true);
      setCurPassEmail(''); setNewEmail('');
      onProfileChange();
    } catch (err) {
      setEmailMsg((err as Error).message); setEmailOk(false);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg('');
    if (newPwd !== confirmPwd) { setPwdMsg('As senhas não conferem.'); setPwdOk(false); return; }
    setPwdLoading(true);
    try {
      const res = await apiChangePassword(session.player_token, curPassPwd, newPwd);
      setPwdMsg(res.message); setPwdOk(true);
      setCurPassPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setPwdMsg((err as Error).message); setPwdOk(false);
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="account-tab-body">
      {/* Email */}
      <section className="account-section">
        <h2 className="account-section-title">Email</h2>
        <p className="account-section-info">
          Email atual: <strong>{profile.email}</strong>
          {profile.email_verified_at
            ? <span className="account-badge account-badge--ok"> verificado</span>
            : <span className="account-badge account-badge--warn"> não verificado</span>}
        </p>
        <form onSubmit={handleEmailChange} className="account-form">
          <FormField label="Senha atual" type="password" value={curPassEmail}
            onChange={setCurPassEmail} autoComplete="current-password" />
          <FormField label="Novo email" type="email" value={newEmail}
            onChange={setNewEmail} placeholder="novo@email.com" autoComplete="email" />
          <StatusMsg msg={emailMsg} ok={emailOk} />
          <button type="submit" className="btn-primary" disabled={emailLoading}>
            {emailLoading ? 'Salvando…' : 'Trocar email'}
          </button>
        </form>
      </section>

      <div className="account-divider" />

      {/* Senha */}
      <section className="account-section">
        <h2 className="account-section-title">Senha</h2>
        <form onSubmit={handlePasswordChange} className="account-form">
          <FormField label="Senha atual" type="password" value={curPassPwd}
            onChange={setCurPassPwd} autoComplete="current-password" />
          <FormField label="Nova senha" type="password" value={newPwd}
            onChange={setNewPwd} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
          <FormField label="Confirmar nova senha" type="password" value={confirmPwd}
            onChange={setConfirmPwd} autoComplete="new-password" />
          <StatusMsg msg={pwdMsg} ok={pwdOk} />
          <button type="submit" className="btn-primary" disabled={pwdLoading}>
            {pwdLoading ? 'Salvando…' : 'Trocar senha'}
          </button>
        </form>
      </section>
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
      <p style={{ color: 'var(--text-muted)' }}>Carregando…</p>
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
