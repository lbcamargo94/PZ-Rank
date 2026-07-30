import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiVerifyEmail } from '../lib/api';
import loginBg from '../../assets/background/tela-de-login.webp';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const [status,  setStatus]  = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token não encontrado na URL.');
      return;
    }

    apiVerifyEmail(token)
      .then(body => {
        setStatus('success');
        setMessage(body.message ?? 'Email verificado com sucesso!');
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message || 'Erro ao verificar email.');
      });
  }, [searchParams]);

  const bgStyle = { backgroundImage: `url(${loginBg})` };

  return (
    <div className="account-login-wrap claim-page-wrap" style={bgStyle}>
      <div className="account-login-card reg-card">

        {status === 'loading' && (
          <div className="reg-success-card">
            <i className="ti ti-loader-2 reg-success-icon" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="reg-sub">Verificando email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="reg-success-card">
            <i className="ti ti-circle-check reg-success-icon" />
            <h1 className="reg-title">Email verificado!</h1>
            <p className="reg-sub" style={{ marginBottom: 24 }}>{message}</p>
            <button className="btn-primary reg-submit reg-submit--ready" onClick={() => navigate('/')}>
              <i className="ti ti-arrow-left" /> Voltar ao ranking
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="reg-success-card">
            <i className="ti ti-circle-x reg-success-icon" style={{ color: 'var(--red)' }} />
            <h1 className="reg-title">Falha na verificação</h1>
            <p className="reg-sub" style={{ marginBottom: 24 }}>{message}</p>
            <button className="btn-primary reg-submit" onClick={() => navigate('/')}>
              <i className="ti ti-arrow-left" /> Voltar ao ranking
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
