import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiVerifyEmail } from '../lib/api';

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <i className="ti ti-loader-2" style={{ fontSize: 48, color: 'var(--green)', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16, color: 'var(--text-2)' }}>Verificando email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <i className="ti ti-circle-check" style={{ fontSize: 56, color: 'var(--green)' }} />
            <h1 style={{ fontSize: 24, margin: '16px 0 8px', color: 'var(--text-1)' }}>Email verificado!</h1>
            <p style={{ color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              <i className="ti ti-arrow-left" /> Voltar ao ranking
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <i className="ti ti-circle-x" style={{ fontSize: 56, color: 'var(--red)' }} />
            <h1 style={{ fontSize: 24, margin: '16px 0 8px', color: 'var(--text-1)' }}>Falha na verificação</h1>
            <p style={{ color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              <i className="ti ti-arrow-left" /> Voltar ao ranking
            </button>
          </>
        )}
      </div>
    </div>
  );
}
