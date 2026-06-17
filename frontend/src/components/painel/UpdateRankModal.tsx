import { useState, useEffect } from 'react';
import { apiGetPlayers, apiCreateEntry } from '../../lib/api';
import { parsePzrCode } from '../../lib/decoder';
import type { Player } from '../../types';

interface Props {
  token:     string;
  onClose:   () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: string) => void;
}

export function UpdateRankModal({ token, onClose, onSuccess, showToast }: Props) {
  const [players,    setPlayers]    = useState<Player[]>([]);
  const [playerId,   setPlayerId]   = useState<number | ''>('');
  const [code,       setCode]       = useState('');
  const [liveUrl,    setLiveUrl]    = useState('');
  const [loading,    setLoading]    = useState(false);

  const decoded = parsePzrCode(code.trim());

  useEffect(() => {
    apiGetPlayers(token, 'approved')
      .then(setPlayers)
      .catch(err => showToast((err as Error).message, 'error'));
  }, [token, showToast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || !decoded) return;
    setLoading(true);
    try {
      await apiCreateEntry(token, {
        player_id: playerId as number,
        code:      code.trim(),
        live_url:  liveUrl.trim() || undefined,
      });
      showToast('Rank atualizado com sucesso!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
        <h2 className="modal-title">Atualizar Rank</h2>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <label className="form-label" htmlFor="ur-player">
            Jogador <span className="required">*</span>
          </label>
          <select id="ur-player" className="form-input form-select"
            value={playerId}
            onChange={e => setPlayerId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Selecione o jogador...</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.nick}</option>
            ))}
          </select>

          <label className="form-label" htmlFor="ur-live">Link da live (opcional)</label>
          <input id="ur-live" className="form-input" type="url"
            placeholder="https://twitch.tv/..." value={liveUrl}
            onChange={e => setLiveUrl(e.target.value)} />

          <label className="form-label" htmlFor="ur-code">
            Código do mod <span className="required">*</span>
          </label>
          <textarea id="ur-code" className="form-input code-input"
            placeholder="PZRX1:..." rows={3} spellCheck={false}
            value={code} onChange={e => setCode(e.target.value)} />

          {decoded && (
            <div className="decoded-preview">
              <div className="decoded-row"><span className="decoded-label">Personagem</span><span className="decoded-value">{decoded.characterName}</span></div>
              <div className="decoded-row"><span className="decoded-label">Profissão</span><span className="decoded-value">{decoded.profession}</span></div>
              <div className="decoded-row"><span className="decoded-label">Sobreviveu</span><span className="decoded-value">{decoded.days} dias — {decoded.timeStr}</span></div>
              <div className="decoded-row"><span className="decoded-label">Zumbis</span><span className="decoded-value">{decoded.kills.toLocaleString('pt-BR')}</span></div>
            </div>
          )}
          {!decoded && code.length > 6 && (
            <p className="form-error">Código não reconhecido.</p>
          )}

          <button className="btn-primary btn-block" type="submit"
            disabled={loading || !playerId || !decoded}>
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
}
