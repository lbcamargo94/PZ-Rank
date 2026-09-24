import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiGetPlayerRuns, type PreviousRun } from '../lib/api';
import { formatNumber } from '../lib/format';

// Um jogador pode ter vários cards de personagem na mesma página — busca o
// histórico uma vez por jogador e cada card filtra o seu personagem.
const cache = new Map<number, Promise<PreviousRun[]>>();
function loadRuns(playerId: number): Promise<PreviousRun[]> {
  if (!cache.has(playerId)) {
    const p = apiGetPlayerRuns(playerId);
    p.catch(() => cache.delete(playerId)); // não guarda falha: próxima abertura tenta de novo
    cache.set(playerId, p);
  }
  return cache.get(playerId)!;
}

/** Partidas anteriores com o mesmo nome de personagem (arquivadas em run_history
 *  quando uma partida nova sobrescreveu a run no rank). */
export function PreviousRunsSection({ playerId, characterName }: { playerId: number; characterName: string }) {
  const { t, i18n } = useTranslation();
  const [runs, setRuns]   = useState<PreviousRun[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setRuns(null); setError(false);
    loadRuns(playerId)
      .then(all => { if (alive) setRuns(all.filter(r => r.character_name === characterName)); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [playerId, characterName]);

  if (error) return <p className="pp-history-msg"><i className="ti ti-alert-circle" /> {t('player.history.error')}</p>;
  if (!runs)  return <p className="pp-history-msg"><i className="ti ti-loader-2 spin" /> {t('player.history.loading')}</p>;
  if (runs.length === 0) return <p className="pp-history-msg">{t('player.history.empty')}</p>;

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(i18n.language || 'pt-BR');

  return (
    <div className="pp-history">
      <p className="pp-history-msg">{t('player.history.intro')}</p>
      <ul className="pp-history-list">
        {runs.map(r => (
          <li key={r.id} className="pp-history-item">
            <div className="pp-history-head">
              <span className="pp-history-date">{t('player.history.ended', { date: fmtDate(r.run_ended_at) })}</span>
              {r.profession && <span className="pp-history-prof">{r.profession}</span>}
              {r.is_partial && <span className="pp-history-badge" data-tip={t('player.history.partial_tip')}>{t('player.history.partial')}</span>}
              {r.is_alive && <span className="pp-history-badge" data-tip={t('player.history.abandoned_tip')}>{t('player.history.abandoned')}</span>}
              {r.sandbox_ok === false && <span className="pp-history-badge pp-history-badge--dq">{t('rank.status.disqualified')}</span>}
            </div>
            <div className="pp-char-stats-row">
              <span className="pp-stat"><i className="ti ti-calendar" />{r.days}d</span>
              {r.time_str && <span className="pp-stat"><i className="ti ti-clock" />{r.time_str}</span>}
              <span className="pp-stat"><i className="ti ti-sword" />{formatNumber(r.kills)}</span>
              <span className="pp-stat"><i className="ti ti-star" />{formatNumber(r.score)}</span>
              {!r.is_alive && (
                <span className="pp-stat"><i className="ti ti-skull" />
                  {r.death_cause ? t(`journal.cause.${r.death_cause}`, { defaultValue: r.death_cause }) : t('player.history.unknown_cause')}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
