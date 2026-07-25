import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

export function ResetPasswordPage() {
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
    if (!token) { setError('Token inválido.'); return; }
    if (password.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_URL}/auth/player/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const body = await res.json() as { message?: string; error?: string };
      if (res.ok) { setDone(true); }
      else        { setError(body.error ?? 'Erro ao redefinir senha.'); }
    } catch {
      setError('Não foi possível conectar ao servidor.');
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
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>O link de redefinição de senha é inválido ou expirou.</p>
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
            <h1 style={{ margin: '16px 0 8px' }}>Senha redefinida!</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Agora use a nova senha no Companion.</p>
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
              {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
              <button
                className="btn-primary btn-block"
                type="submit"
                disabled={loading || password.length < 8 || password !== confirmPassword}
              >
                {loading ? <><i className="ti ti-loader-2" /> Salvando...</> : <><i className="ti ti-check" /> Salvar nova senha</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
