import { useState } from 'react';
import { apiLogin, apiModForgotPassword } from '../../lib/api';
import type { ModSession } from '../../types';

interface Props {
  onSuccess: (session: ModSession) => void;
  onBack:    () => void;
  showToast: (msg: string, type?: string) => void;
}

type View = 'login' | 'forgot' | 'forgot-sent';

export function PainelLogin({ onSuccess, onBack, showToast }: Props) {
  const [view,     setView]     = useState<View>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [fpEmail,  setFpEmail]  = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await apiLogin(email, password);
      onSuccess(session);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fpEmail.trim()) return;
    setLoading(true);
    try {
      await apiModForgotPassword(fpEmail.trim());
      setView('forgot-sent');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="painel-login-wrap">
      <div className="painel-login-scanlines" aria-hidden="true" />

      <button className="btn-primary painel-back" onClick={onBack}>
        <i className="ti ti-arrow-left" /> Voltar ao Ranking
      </button>

      <div className="painel-login-box">
        <div className="painel-login-icon-wrap">
          <i className={`ti ${view === 'login' ? 'ti-shield-lock' : 'ti-mail-forward'} painel-login-icon`} />
        </div>

        <div className="painel-login-tag">// ÁREA RESTRITA</div>
        <h1 className="painel-login-title">
          {view === 'login' ? 'Painel de Moderadores' : 'Recuperar senha'}
        </h1>
        <p className="painel-login-sub">
          {view === 'login'
            ? 'Acesso exclusivo para moderadores autorizados.'
            : view === 'forgot'
            ? 'Informe o email da sua conta de moderador.'
            : 'Verifique seu email e clique no link para redefinir a senha.'}
        </p>

        <div className="painel-login-divider" />

        {/* ── Login ── */}
        {view === 'login' && (
          <form className="modal-form" onSubmit={handleSubmit} noValidate>
            <div className="painel-login-field">
              <label className="form-label" htmlFor="mod-email">
                <i className="ti ti-mail" /> Email
              </label>
              <input
                id="mod-email"
                className="form-input painel-login-input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="painel-login-field">
              <label className="form-label" htmlFor="mod-pass">
                <i className="ti ti-lock" /> Senha
              </label>
              <input
                id="mod-pass"
                className="form-input painel-login-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="btn-primary btn-block painel-login-btn"
              type="submit"
              disabled={loading || !email || !password}
            >
              {loading
                ? <><i className="ti ti-loader-2" /> Verificando...</>
                : <><i className="ti ti-login" /> Entrar</>}
            </button>

            <button
              type="button"
              className="btn-link painel-forgot-link"
              onClick={() => setView('forgot')}
            >
              Esqueci minha senha
            </button>
          </form>
        )}

        {/* ── Esqueci minha senha ── */}
        {view === 'forgot' && (
          <form className="modal-form" onSubmit={handleForgotSubmit} noValidate>
            <div className="painel-login-field">
              <label className="form-label" htmlFor="fp-email">
                <i className="ti ti-mail" /> Email do moderador
              </label>
              <input
                id="fp-email"
                className="form-input painel-login-input"
                type="email"
                placeholder="seu@email.com"
                value={fpEmail}
                onChange={e => setFpEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button
              className="btn-primary btn-block painel-login-btn"
              type="submit"
              disabled={loading || !fpEmail.trim()}
            >
              {loading
                ? <><i className="ti ti-loader-2" /> Enviando...</>
                : <><i className="ti ti-send" /> Enviar link de recuperação</>}
            </button>

            <button
              type="button"
              className="btn-link painel-forgot-link"
              onClick={() => setView('login')}
            >
              <i className="ti ti-arrow-left" /> Voltar ao login
            </button>
          </form>
        )}

        {/* ── Email enviado ── */}
        {view === 'forgot-sent' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 48, color: 'var(--green)' }}>
              <i className="ti ti-circle-check" />
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Se o email <strong style={{ color: 'var(--text)' }}>{fpEmail}</strong> estiver cadastrado,
              você receberá um link para redefinir a senha em instantes.
            </p>
            <button
              type="button"
              className="btn-link painel-forgot-link"
              onClick={() => { setView('login'); setFpEmail(''); }}
            >
              <i className="ti ti-arrow-left" /> Voltar ao login
            </button>
          </div>
        )}

        {view === 'login' && (
          <p className="painel-login-warn">
            <i className="ti ti-info-circle" />
            Tentativas de acesso não autorizado são registradas.
          </p>
        )}
      </div>
    </div>
  );
}