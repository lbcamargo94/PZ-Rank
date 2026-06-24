import { useState } from 'react';
import { toast } from 'sonner';
import { apiLogin } from '../../lib/api';
import type { ModSession } from '../../types';
import { Button } from '@/components/ui/button';
import {
  IconArrowLeft,
  IconShieldLock,
  IconUser,
  IconLock,
  IconLoader2,
  IconLogin,
  IconInfoCircle,
} from '@tabler/icons-react';

interface Props {
  onSuccess: (session: ModSession) => void;
  onBack:    () => void;
}

export function PainelLogin({ onSuccess, onBack }: Props) {
  const [login,    setLogin]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await apiLogin(login, password);
      onSuccess(session);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="painel-login-wrap">
      <div className="painel-login-scanlines" aria-hidden="true" />

      <Button variant="ghost" className="painel-back" onClick={onBack}>
        <IconArrowLeft size={16} /> Voltar ao ranking
      </Button>

      <div className="painel-login-box">
        <div className="painel-login-icon-wrap">
          <IconShieldLock size={20} className="painel-login-icon" />
        </div>

        <div className="painel-login-tag">// ÁREA RESTRITA</div>
        <h1 className="painel-login-title">Painel de Moderadores</h1>
        <p className="painel-login-sub">
          Acesso exclusivo para moderadores autorizados.
        </p>

        <div className="painel-login-divider" />

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="painel-login-field">
            <label className="form-label" htmlFor="mod-login">
              <IconUser size={16} /> Login
            </label>
            <input
              id="mod-login"
              className="form-input painel-login-input"
              type="text"
              placeholder="seu_login"
              value={login}
              onChange={e => setLogin(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="painel-login-field">
            <label className="form-label" htmlFor="mod-pass">
              <IconLock size={16} /> Senha
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

          <Button
            type="submit"
            className="w-full painel-login-btn"
            disabled={loading || !login || !password}
          >
            {loading
              ? <><IconLoader2 size={16} className="animate-spin" /> Verificando...</>
              : <><IconLogin size={16} /> Entrar</>}
          </Button>
        </form>

        <p className="painel-login-warn">
          <IconInfoCircle size={16} />
          Tentativas de acesso não autorizado são registradas.
        </p>
      </div>
    </div>
  );
}