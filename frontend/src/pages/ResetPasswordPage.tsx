import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { checkPassword } from '../lib/password';
import { PasswordHints } from '../components/PasswordHints';
import { apiResetPassword } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token') ?? '';

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const { toast, showToast, clearToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { showToast('Token inválido.', 'error'); return; }
    if (!checkPassword(password).ok) { showToast('A senha não atende aos requisitos de segurança.', 'error'); return; }
    if (password !== confirmPassword) { showToast('As senhas não coincidem.', 'error'); return; }

    setLoading(true);
    try {
      await apiResetPassword(token, password);
      setDone(true);
    } catch (err) {
      showToast((err as Error).message || 'Erro ao redefinir senha.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <i className="ti ti-circle-x" style={{ fontSize: 56, color: 'var(--red)' }} />
          <h1 style={{ margin: '16px 0 8px' }}>Link inválido</h1>
          <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>O link de redefinição de senha é inválido ou expirou.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Voltar ao ranking</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <i className="ti ti-circle-check" style={{ fontSize: 56, color: 'var(--green)' }} />
            <h1 style={{ margin: '16px 0 8px' }}>Senha redefinida!</h1>
            <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>Agora use a nova senha no Companion ou em <strong>Minha Conta</strong> no site.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Voltar ao ranking</button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, marginBottom: 24 }}>
              <i className="ti ti-key" /> Redefinir senha
            </h1>
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="reg-field">
                <label className="form-label" htmlFor="rp-password">Nova senha</label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock reg-nick-icon" />
                  <input
                    id="rp-password"
                    className="form-input reg-nick-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" className="reg-pass-toggle" onClick={() => setShowPass(p => !p)}>
                    <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} />
                  </button>
                </div>
              </div>
              <PasswordHints password={password} />
              <div className="reg-field">
                <label className="form-label" htmlFor="rp-confirm">Confirmar senha</label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock-check reg-nick-icon" />
                  <input
                    id="rp-confirm"
                    className="form-input reg-nick-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {confirmPassword && (
                    <i className={`ti reg-nick-icon ${password === confirmPassword ? 'ti-check reg-pass-match' : 'ti-x reg-pass-mismatch'}`} />
                  )}
                </div>
              </div>
              <button
                className="btn-primary btn-block"
                type="submit"
                disabled={loading || !checkPassword(password).ok || password !== confirmPassword}
              >
                {loading ? <><i className="ti ti-loader-2" /> Salvando...</> : <><i className="ti ti-check" /> Salvar nova senha</>}
              </button>
            </form>
          </>
        )}
      </div>
    <Toast {...toast} onClose={clearToast} />
    </div>
  );
}
