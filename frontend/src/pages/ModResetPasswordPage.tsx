import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { checkPassword } from '../lib/password';
import { PasswordHints } from '../components/PasswordHints';
import { apiModResetPassword } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';

export function ModResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token') ?? '';

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const pwOk      = checkPassword(password).ok;
  const matchOk   = password === confirmPassword;
  const canSubmit = pwOk && matchOk && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiModResetPassword(token, password);
      setDone(true);
    } catch (err) {
      showToast((err as Error).message || 'Erro ao redefinir senha.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="painel-login-wrap">
      <div className="painel-login-scanlines" aria-hidden="true" />

      <button className="btn-primary painel-back" onClick={() => navigate('/painel')}>
        <i className="ti ti-arrow-left" /> Voltar ao Painel
      </button>

      <div className="painel-login-box">
        <div className="painel-login-icon-wrap">
          <i className={`ti ${done ? 'ti-circle-check' : token ? 'ti-key' : 'ti-circle-x'} painel-login-icon`} />
        </div>

        <div className="painel-login-tag">// ÁREA RESTRITA</div>

        {/* Token ausente */}
        {!token && (
          <>
            <h1 className="painel-login-title">Link inválido</h1>
            <p className="painel-login-sub">O link de redefinição é inválido ou expirou.</p>
            <div className="painel-login-divider" />
            <button
              className="btn-primary btn-block painel-login-btn"
              onClick={() => navigate('/painel')}
            >
              <i className="ti ti-login" /> Ir para o painel
            </button>
          </>
        )}

        {/* Concluído */}
        {token && done && (
          <>
            <h1 className="painel-login-title">Senha redefinida!</h1>
            <p className="painel-login-sub">Use a nova senha para entrar no painel.</p>
            <div className="painel-login-divider" />
            <button
              className="btn-primary btn-block painel-login-btn"
              onClick={() => navigate('/painel')}
            >
              <i className="ti ti-login" /> Ir para o login
            </button>
          </>
        )}

        {/* Formulário */}
        {token && !done && (
          <>
            <h1 className="painel-login-title">Redefinir senha</h1>
            <p className="painel-login-sub">Escolha uma nova senha para sua conta de moderador.</p>
            <div className="painel-login-divider" />

            <form className="modal-form" onSubmit={handleSubmit} noValidate>
              <div className="painel-login-field">
                <label className="form-label" htmlFor="mrp-password">
                  <i className="ti ti-lock" /> Nova senha
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="mrp-password"
                    className="form-input painel-login-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoFocus
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    className="reg-pass-toggle"
                    onClick={() => setShowPass(p => !p)}
                    aria-label="Mostrar/ocultar senha"
                  >
                    <i className={`ti ti-eye${showPass ? '-off' : ''}`} />
                  </button>
                </div>
                <PasswordHints password={password} />
              </div>

              <div className="painel-login-field">
                <label className="form-label" htmlFor="mrp-confirm">
                  <i className="ti ti-lock-check" /> Confirmar senha
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="mrp-confirm"
                    className="form-input painel-login-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: 36 }}
                  />
                  {confirmPassword && (
                    <i
                      className={`ti ${matchOk ? 'ti-check' : 'ti-x'} reg-nick-icon`}
                      style={{ color: matchOk ? 'var(--green)' : 'var(--red)', right: 36 }}
                    />
                  )}
                  <button
                    type="button"
                    className="reg-pass-toggle"
                    onClick={() => setShowPass(p => !p)}
                    aria-label="Mostrar/ocultar senha"
                  >
                    <i className={`ti ti-eye${showPass ? '-off' : ''}`} />
                  </button>
                </div>
              </div>

              <button
                className="btn-primary btn-block painel-login-btn"
                type="submit"
                disabled={loading || !canSubmit}
              >
                {loading
                  ? <><i className="ti ti-loader-2" /> Salvando...</>
                  : <><i className="ti ti-check" /> Salvar nova senha</>}
              </button>
            </form>
          </>
        )}
      </div>

      <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
