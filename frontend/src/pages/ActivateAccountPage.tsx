import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiActivateAccount } from '../lib/api';

export function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token') ?? '';

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);
  const [error,           setError]           = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError('Link inválido.'); return; }
    if (password.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    setError('');
    try {
      await apiActivateAccount(token, password);
      setDone(true);
    } catch (err) {
      setError((err as Error).message || 'Erro ao ativar conta.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <i className="ti ti-circle-x" style={{ fontSize: 56, color: 'var(--red)' }} />
          <h1 style={{ margin: '16px 0 8px' }}>Link inválido</h1>
          <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>O link de ativação é inválido ou expirou.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Voltar ao ranking</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <i className="ti ti-circle-check" style={{ fontSize: 56, color: 'var(--green)' }} />
            <h1 style={{ margin: '16px 0 8px' }}>Conta ativada!</h1>
            <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>
              Agora faça login no Companion com seu email e senha para sincronizar suas runs.
            </p>
            <button className="btn-primary" onClick={() => navigate('/')}>Voltar ao ranking</button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>
              <i className="ti ti-key" /> Ativar conta
            </h1>
            <p style={{ color: 'var(--text-2)', marginBottom: 24, fontSize: 15 }}>
              Defina uma senha para ativar o login no Companion.
            </p>
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="reg-field">
                <label className="form-label" htmlFor="ac-password">Nova senha</label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock reg-nick-icon" />
                  <input
                    id="ac-password"
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
              <div className="reg-field">
                <label className="form-label" htmlFor="ac-confirm">Confirmar senha</label>
                <div className="reg-nick-input-wrap">
                  <i className="ti ti-lock-check reg-nick-icon" />
                  <input
                    id="ac-confirm"
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
              {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
              <button
                className="btn-primary btn-block"
                type="submit"
                disabled={loading || password.length < 8 || password !== confirmPassword}
              >
                {loading
                  ? <><i className="ti ti-loader-2" /> Ativando...</>
                  : <><i className="ti ti-check" /> Ativar conta</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
