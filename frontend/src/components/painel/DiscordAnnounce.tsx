import { useState } from 'react';
import { apiSendAnnouncement } from '../../lib/api';

const COLORS = [
  { key: 'blue',   label: 'Informativo', hex: '#3B82F6' },
  { key: 'green',  label: 'Sucesso',     hex: '#22C55E' },
  { key: 'yellow', label: 'Aviso',       hex: '#F59E0B' },
  { key: 'red',    label: 'Urgente',     hex: '#EF4444' },
] as const;

type Color = typeof COLORS[number]['key'];

interface Props {
  token:     string;
  showToast: (msg: string, type?: string) => void;
}

export function DiscordAnnounce({ token, showToast }: Props) {
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [color,   setColor]   = useState<Color>('blue');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const selectedColor = COLORS.find(c => c.key === color)!;

  async function handleSend() {
    if (!title.trim() || !message.trim()) return;
    setLoading(true);
    try {
      await apiSendAnnouncement(token, { title: title.trim(), message: message.trim(), color });
      showToast('Comunicado enviado para o Discord!', 'success');
      setSent(true);
      setTitle('');
      setMessage('');
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2><i className="ti ti-brand-discord" /> Comunicado Discord</h2>
      </div>

      <p className="announce-help">
        Envia um embed formatado para o canal configurado em{' '}
        <code>DISCORD_ANNOUNCE_WEBHOOK_URL</code> (ou <code>DISCORD_WEBHOOK_URL</code> como fallback).
      </p>

      <div className="announce-field">
        <span className="form-label">Cor do comunicado</span>
        <div className="announce-colors">
          {COLORS.map(c => (
            <button
              key={c.key}
              type="button"
              className={`announce-color-btn${color === c.key ? ' active' : ''}`}
              style={{ '--ac': c.hex } as React.CSSProperties}
              onClick={() => setColor(c.key)}
            >
              <span className="announce-color-dot" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="announce-field">
        <label className="form-label" htmlFor="ann-title">Título *</label>
        <input
          id="ann-title"
          className="form-input"
          type="text"
          maxLength={256}
          placeholder="Ex: Atualização das regras da temporada"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="announce-field">
        <label className="form-label" htmlFor="ann-msg">Mensagem *</label>
        <textarea
          id="ann-msg"
          className="form-input announce-textarea"
          rows={5}
          maxLength={2000}
          placeholder="Escreva o comunicado. Suporte a Markdown do Discord: **negrito**, *itálico*, `código`, > citação..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <span className="announce-char-count">{message.length}/2000</span>
      </div>

      {(title || message) && (
        <div className="announce-preview" style={{ '--ac': selectedColor.hex } as React.CSSProperties}>
          <div className="announce-preview-bar" />
          <div className="announce-preview-body">
            {title   && <p className="announce-preview-title">{title}</p>}
            {message && <p className="announce-preview-msg">{message}</p>}
            <p className="announce-preview-footer">PZ Rank • Brasileirão de Sobrevivência</p>
          </div>
        </div>
      )}

      <button
        className="btn-primary"
        disabled={loading || !title.trim() || !message.trim()}
        onClick={handleSend}
      >
        {loading
          ? <><i className="ti ti-loader-2 ti-spin" /> Enviando...</>
          : sent
          ? <><i className="ti ti-check" /> Enviado!</>
          : <><i className="ti ti-send" /> Enviar Comunicado</>}
      </button>
    </div>
  );
}
