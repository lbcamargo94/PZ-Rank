import { Fragment, useEffect, useMemo, useState } from 'react';
import { apiGetModStats, type ModStatsResponse, type ModUsageItem } from '../../lib/api';

// Aba "Estatísticas" em Mods: quantos participantes do campeonato usam cada mod (v4.30.0).
// Fotografia do momento — cada sync substitui a lista de mods da run (backend/src/lib/modStats.ts).
interface Props {
  token:     string;
  showToast: (msg: string, type?: string) => void;
}

type Period = 7 | 14 | 30 | 'all';
type StatusFilter = 'todos' | ModUsageItem['status'];

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: '7 dias' }, { value: 14, label: '14 dias' }, { value: 30, label: '30 dias' }, { value: 'all', label: 'Todas as vivas' },
];

const STATUS: Record<ModUsageItem['status'], { label: string; color: string; icon: string }> = {
  permitido:      { label: 'Permitido',      color: '#22c55e', icon: 'ti-circle-check' },
  bloqueado:      { label: 'Bloqueado',      color: '#ef4444', icon: 'ti-ban' },
  misto:          { label: 'Misto',          color: '#f59e0b', icon: 'ti-adjustments' },
  nao_cadastrado: { label: 'Não cadastrado', color: '#a855f7', icon: 'ti-question-mark' },
};

const cell: React.CSSProperties = { padding: '8px 10px', fontSize: 16 };

function Card({ icon, label, value, hint }: { icon: string; label: string; value: string | number; hint?: string }) {
  return (
    <div style={{ flex: '1 1 180px', padding: 14, borderRadius: 10, border: '1px solid var(--border, #333)', background: 'var(--surface-2, rgba(255,255,255,0.03))' }}>
      <div style={{ fontSize: 16, opacity: 0.8 }}><i className={`ti ${icon}`} /> {label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 16, opacity: 0.7, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

export function ModStatsPanel({ token, showToast }: Props) {
  const [period, setPeriod]   = useState<Period>(14);
  const [data, setData]       = useState<ModStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState<StatusFilter>('todos');
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiGetModStats(token, period)
      .then(setData)
      .catch(err => showToast((err as Error).message, 'error'))
      .finally(() => setLoading(false));
  }, [token, period, showToast]);

  const items = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.items.filter(i =>
      (status === 'todos' || i.status === status) &&
      (!q || i.name.toLowerCase().includes(q) || i.mod_ids.some(id => id.toLowerCase().includes(q))));
  }, [data, search, status]);

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2><i className="ti ti-chart-bar" /> Uso dos mods pelos participantes</h2>
      </div>
      <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 12 }}>
        Participantes = jogadores com run viva e válida que sincronizaram no período. Cada sync atualiza a lista de mods
        da run, então os números mostram o momento atual. Mods com vários IDs no mesmo item da Oficina contam o jogador uma vez.
      </p>

      <div className="painel-section-filter">
        <div className="filter-bar">
          {PERIODS.map(p => (
            <button key={String(p.value)} className={`sort-btn${period === p.value ? ' active' : ''}`} onClick={() => setPeriod(p.value)}>
              <i className="ti ti-calendar" /> {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && <p style={{ fontSize: 16 }}>Carregando…</p>}

      {data && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '12px 0 16px' }}>
            <Card icon="ti-users" label="Participantes analisados" value={data.participants} />
            <Card icon="ti-puzzle" label="Média de mods por participante" value={data.summary.avg_mods_per_participant.toLocaleString('pt-BR')} />
            <Card icon="ti-chart-pie" label="Mods diferentes em uso" value={data.summary.mods_in_use} />
            <Card icon="ti-zzz" label="Cadastrados sem uso" value={data.summary.registered_unused} hint="nenhum participante usa" />
            <Card icon="ti-alert-triangle" label="Em uso fora do cadastro" value={data.summary.unregistered_in_use} hint="IDs que ainda não estão no cadastro" />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <input className="form-input" style={{ flex: '1 1 240px', fontSize: 16 }} placeholder="Buscar por nome ou ID do mod…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="filter-bar">
              {(['todos', 'permitido', 'bloqueado', 'misto', 'nao_cadastrado'] as StatusFilter[]).map(s => (
                <button key={s} className={`sort-btn${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>
                  {s === 'todos' ? 'Todos' : STATUS[s].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={cell}>Mod</th>
                  <th style={cell}>Participantes</th>
                  <th style={{ ...cell, minWidth: 160 }}>Uso</th>
                  <th style={cell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => {
                  const st = STATUS[i.status];
                  const open = openKey === i.key;
                  return (
                    <Fragment key={i.key}>
                      <tr style={{ borderTop: '1px solid var(--border, #333)', cursor: i.players ? 'pointer' : 'default' }}
                        onClick={() => i.players && setOpenKey(open ? null : i.key)}
                        title={i.players ? 'Clique para ver quem usa' : undefined}>
                        <td style={cell}>
                          {i.players > 0 && <i className={`ti ${open ? 'ti-chevron-down' : 'ti-chevron-right'}`} />}{' '}
                          <strong>{i.name}</strong>
                          {i.required && <span style={{ marginLeft: 8, color: '#22c55e' }}><i className="ti ti-star" /> obrigatório</span>}
                          <div style={{ fontSize: 16, opacity: 0.65 }}>{i.mod_ids.join(', ')}</div>
                        </td>
                        <td style={cell}>{i.players} <span style={{ opacity: 0.7 }}>de {data.participants}</span></td>
                        <td style={cell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--border, #333)' }}>
                              <div style={{ width: `${Math.min(i.percent, 100)}%`, height: '100%', borderRadius: 5, background: st.color }} />
                            </div>
                            <span style={{ minWidth: 56, textAlign: 'right' }}>{i.percent.toLocaleString('pt-BR')}%</span>
                          </div>
                        </td>
                        <td style={{ ...cell, color: st.color, whiteSpace: 'nowrap' }}><i className={`ti ${st.icon}`} /> {st.label}</td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={4} style={{ ...cell, background: 'var(--surface-2, rgba(255,255,255,0.03))' }}>
                            {i.player_ids.map(pid => {
                              const p = data.players[pid];
                              return <span key={pid} style={{ display: 'inline-block', margin: '2px 12px 2px 0' }}>
                                <i className="ti ti-user" /> {p?.nick ?? `#${pid}`} <span style={{ opacity: 0.7 }}>({p?.character ?? '?'})</span>
                              </span>;
                            })}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={4} style={cell}>Nenhum mod com esse filtro.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
