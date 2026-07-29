import { useState, useEffect, useCallback } from 'react';
import type { Season, HallOfFameEntry } from '../../types';
import { apiGetSeasons, apiGetHallOfFame, apiCreateSeason, apiCloseSeason } from '../../lib/api';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysBetween(a: string, b?: string | null): number {
  const end = b ? new Date(b) : new Date();
  return Math.floor((end.getTime() - new Date(a).getTime()) / 86_400_000);
}

interface Props {
  token:     string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function SeasonManager({ token, showToast }: Props) {
  const [seasons, setSeasons]   = useState<Season[]>([]);
  const [hof, setHof]           = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [creating, setCreating] = useState(false);
  const [closing, setClosing]   = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const activeSeason = seasons.find(s => s.is_active) ?? null;
  const pastSeasons  = seasons.filter(s => !s.is_active);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([apiGetSeasons(), apiGetHallOfFame()]);
      setSeasons(s);
      setHof(h);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiCreateSeason(token, { name: newName.trim(), theme_slug: newTheme.trim() || undefined });
      showToast('Temporada criada com sucesso.', 'success');
      setShowCreate(false);
      setNewName('');
      setNewTheme('');
      load();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleClose() {
    if (!activeSeason) return;
    setConfirmClose(false);
    setClosing(true);
    try {
      const result = await apiCloseSeason(token, activeSeason.id);
      showToast(`Temporada encerrada. ${result.archived} jogador(es) arquivado(s) no Hall da Fama.`, 'success');
      load();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div className="painel-section">
        <div className="painel-section-header">
          <h2><i className="ti ti-trophy" /> Sistema de Temporadas</h2>
        </div>
        <div className="painel-loading"><i className="ti ti-loader-2 spin" /> Carregando...</div>
      </div>
    );
  }

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2><i className="ti ti-trophy" /> Sistema de Temporadas</h2>
        <button className="btn-primary btn-sm" onClick={load}>
          <i className="ti ti-refresh" /> Atualizar
        </button>
      </div>

      {/* ── Temporada Ativa ── */}
      <div className="season-active-box">
        {activeSeason ? (
          <>
            <div className="season-active-label">
              <i className="ti ti-flame season-active-icon" />
              Temporada Ativa
            </div>
            <div className="season-card season-card--active">
              <div className="season-card-main">
                <span className="season-card-name">{activeSeason.name}</span>
                {activeSeason.theme_slug && (
                  <span className="season-chip-sm">{activeSeason.theme_slug}</span>
                )}
                <div className="season-card-meta">
                  <span><i className="ti ti-calendar-event" /> Início: {fmtDate(activeSeason.started_at)}</span>
                  <span><i className="ti ti-clock" /> {daysBetween(activeSeason.started_at)} dias em andamento</span>
                </div>
              </div>
              <div className="season-card-actions">
                {confirmClose ? (
                  <div className="season-confirm">
                    <span className="season-confirm-text">
                      <i className="ti ti-alert-triangle" /> Encerrar arquiva o Top 3 no Hall da Fama. Confirmar?
                    </span>
                    <button className="btn-danger btn-sm" onClick={handleClose} disabled={closing}>
                      {closing ? <><i className="ti ti-loader-2 spin" /> Encerrando...</> : 'Confirmar'}
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => setConfirmClose(false)}>Cancelar</button>
                  </div>
                ) : (
                  <button className="btn-danger btn-sm" onClick={() => setConfirmClose(true)} disabled={closing}>
                    <i className="ti ti-lock" /> Encerrar Temporada
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="season-no-active">
            <i className="ti ti-trophy-off season-inactive-icon" />
            <span>Nenhuma temporada ativa no momento.</span>
          </div>
        )}
      </div>

      {/* ── Criar nova temporada ── */}
      {!activeSeason && (
        <div className="season-create-area">
          {showCreate ? (
            <div className="season-create-form">
              <h3 className="season-create-title"><i className="ti ti-plus" /> Nova Temporada</h3>
              <div className="season-form-row">
                <label className="season-form-label">Nome <span className="required">*</span></label>
                <input
                  className="season-form-input"
                  type="text"
                  placeholder="Ex: Temporada 2 — O Retorno"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="season-form-row">
                <label className="season-form-label">Tema <span className="optional">(opcional)</span></label>
                <input
                  className="season-form-input"
                  type="text"
                  placeholder="Ex: inverno, fogo, sangue..."
                  value={newTheme}
                  onChange={e => setNewTheme(e.target.value)}
                  maxLength={40}
                />
              </div>
              <div className="season-form-actions">
                <button
                  className="btn-primary"
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                >
                  {creating ? <><i className="ti ti-loader-2 spin" /> Criando...</> : <><i className="ti ti-check" /> Criar Temporada</>}
                </button>
                <button className="btn-ghost" onClick={() => { setShowCreate(false); setNewName(''); setNewTheme(''); }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <i className="ti ti-plus" /> Criar Nova Temporada
            </button>
          )}
        </div>
      )}

      {/* ── Hall da Fama — temporadas passadas ── */}
      {pastSeasons.length > 0 && (
        <div className="season-history">
          <h3 className="season-history-title"><i className="ti ti-award" /> Hall da Fama</h3>
          <div className="season-history-list">
            {pastSeasons.map(season => {
              const hofEntries = hof
                .filter(h => h.season_id === season.id)
                .sort((a, b) => a.position - b.position);
              return (
                <div key={season.id} className="season-past-card">
                  <div className="season-past-header">
                    <div className="season-past-info">
                      <span className="season-past-name">{season.name}</span>
                      {season.theme_slug && <span className="season-chip-sm">{season.theme_slug}</span>}
                      <span className="season-past-dates">
                        {fmtDate(season.started_at)} – {season.ended_at ? fmtDate(season.ended_at) : '?'}
                        {season.ended_at && (
                          <span className="season-past-duration">
                            {' '}· {daysBetween(season.started_at, season.ended_at)} dias
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {hofEntries.length > 0 ? (
                    <div className="hof-podium">
                      {hofEntries.map(h => (
                        <div key={h.id} className={`hof-entry hof-pos-${h.position}`}>
                          <span className="hof-medal">{MEDALS[h.position] ?? `#${h.position}`}</span>
                          <div className="hof-info">
                            <span className="hof-char">{h.character_name || h.entry_name}</span>
                            <span className="hof-player">{h.entry_name}</span>
                          </div>
                          <div className="hof-stats">
                            <span title="Score">{h.score.toLocaleString('pt-BR')} pts</span>
                            <span title="Dias">{h.days}d</span>
                            <span title="Kills">{h.kills.toLocaleString('pt-BR')} kills</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="hof-empty">Sem registros no Hall da Fama para esta temporada.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pastSeasons.length === 0 && !activeSeason && (
        <div className="painel-empty">
          <i className="ti ti-calendar-off" />
          <span>Nenhuma temporada criada ainda.</span>
        </div>
      )}
    </div>
  );
}
