import { useEffect, useState } from 'react';
import { apiGetSyncHistory, type SyncHistoryRow } from '../../lib/api';
import type { Entry } from '../../types';

// Linha do tempo dos syncs de uma run (últimos 90 dias). Mostra também os syncs recusados
// e desclassificados, que não mudam a run — é o que permite reconstruir um caso suspeito
// sem pedir o log ao jogador (docs/moderacao.md).
interface Props {
  entry:   Entry;
  token:   string;
  onClose: () => void;
}

const RESULT: Record<SyncHistoryRow['result'], { label: string; color: string; icon: string }> = {
  aceito:            { label: 'Aceito',            color: '#22c55e', icon: 'ti-check' },
  recusado:          { label: 'Recusado',          color: '#f59e0b', icon: 'ti-hand-stop' },
  desclassificado:   { label: 'Desclassificado',   color: '#ef4444', icon: 'ti-ban' },
  mod_desatualizado: { label: 'Mod desatualizado', color: '#6b7280', icon: 'ti-download' },
};

function fmtAt(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function fmtGame(min: number | null): string {
  if (min == null) return '—';
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

const cell: React.CSSProperties = { padding: '6px 8px' };

export function SyncHistoryModal({ entry, token, onClose }: Props) {
  const [rows, setRows]   = useState<SyncHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  useEffect(() => {
    apiGetSyncHistory(token, entry.id!)
      .then(r => setRows(r.history))
      .catch(err => setError((err as Error).message));
  }, [token, entry.id]);

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box" style={{ maxWidth: 960, width: '100%' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        <h2 className="modal-title">
          <i className="ti ti-history" /> Syncs — {entry.character_name || entry.name}
        </h2>

        <p className="painel-disq-desc" style={{ marginBottom: 12 }}>
          Todos os envios recebidos nos últimos 90 dias, inclusive os recusados. Horário de Brasília.
        </p>

        {error && <p className="painel-disq-desc" style={{ color: 'var(--red)' }}>{error}</p>}
        {!error && rows === null && <p className="painel-disq-desc">Carregando…</p>}
        {rows !== null && rows.length === 0 && (
          <p className="painel-disq-desc">Nenhum sync registrado. O histórico começou na v4.29.0.</p>
        )}

        {rows !== null && rows.length > 0 && (
          <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={cell}>Quando</th>
                  <th style={cell}>Resultado</th>
                  <th style={cell}>Tempo de jogo</th>
                  <th style={cell}>Abates</th>
                  <th style={cell}>Pontos</th>
                  <th style={cell}>Mod</th>
                  <th style={cell}>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const res = RESULT[r.result] ?? RESULT.recusado;
                  const detail = [
                    r.detail,
                    r.flagged && r.flagged !== r.detail ? r.flagged : null,
                    r.sandbox_ok === false ? `código marcado: ${r.code_reason ?? 'violação'}` : null,
                    r.is_alive === false ? 'morto' : null,
                  ].filter(Boolean).join(' · ');
                  return (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--border, #333)' }} title={r.skills ?? undefined}>
                      <td style={{ ...cell, whiteSpace: 'nowrap' }}>{fmtAt(r.at)}</td>
                      <td style={{ ...cell, whiteSpace: 'nowrap', color: res.color }}>
                        <i className={`ti ${res.icon}`} /> {res.label}
                      </td>
                      <td style={{ ...cell, whiteSpace: 'nowrap' }}>{fmtGame(r.time_raw)}</td>
                      <td style={cell}>{r.kills?.toLocaleString('pt-BR') ?? '—'}</td>
                      <td style={cell}>{r.score?.toLocaleString('pt-BR') ?? '—'}</td>
                      <td style={cell}>{r.mod_version ?? '—'}</td>
                      <td style={cell}>{detail || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="painel-disq-desc" style={{ marginTop: 12 }}>
          Passe o mouse sobre uma linha para ver as habilidades daquele envio.
        </p>
      </div>
    </div>
  );
}
