import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiGetPlayerProfile } from '../lib/api';
import type { PlayerProfile, Entry } from '../types';

// Alinhado ao Cache-Control: s-maxage=60 de /players/:id — pollar mais rápido
// que isso só gera Edge Requests extras sem pegar dado mais fresco (a
// resposta cacheada na borda da Vercel já é reaproveitada até 60s). Isso
// também limita em até 1 minuto o atraso pra detectar uma morte.
const REFRESH_MS = 60_000;
const DEATH_ALERT_MS = 12_000;

export function OverlayPage() {
  const { id } = useParams<{ id: string }>();
  const [profile,    setProfile]    = useState<PlayerProfile | null>(null);
  const [bestEntry,  setBestEntry]  = useState<Entry | null>(null);
  const [rank,       setRank]       = useState<number | null>(null);
  const [error,      setError]      = useState(false);
  const [deathAlert, setDeathAlert] = useState<Entry | null>(null);
  const wasAliveRef = useRef<boolean | null>(null);

  // Fundo transparente pro OBS compositar só o cartão, sem o background do site atrás.
  useEffect(() => {
    document.body.classList.add('overlay-page-active');
    return () => document.body.classList.remove('overlay-page-active');
  }, []);

  async function load() {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) { setError(true); return; }
    try {
      const prof = await apiGetPlayerProfile(numId);
      setProfile(prof);
      const sorted = [...prof.entries].sort((a, b) => b.score - a.score);
      const best   = sorted[0] ?? null;
      setBestEntry(best);

      // Detecta a transição vivo → morto entre um poll e outro pra disparar
      // o alerta de morte na tela — mesmo personagem (mesmo id), só mudou
      // is_alive desde a última checagem.
      if (best && wasAliveRef.current === true && !best.is_alive) {
        setDeathAlert(best);
        setTimeout(() => setDeathAlert(null), DEATH_ALERT_MS);
      }
      wasAliveRef.current = best?.is_alive ?? null;

      // Rank já vem calculado pelo servidor (GET /players/:id) pra cada
      // entry viva/não-desclassificada — evita baixar a lista de entries
      // inteira (~660KB) só pra achar a posição de uma entry.
      const bestAlive = sorted.find(e => e.sandbox_ok !== false && e.is_alive) ?? null;
      setRank(bestAlive?.rank ?? null);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error || !profile || !bestEntry) {
    return (
      <div className="overlay-page-wrap">
        <div className="overlay-root overlay-error">
          <span className="overlay-status-badge overlay-badge-dead">DADOS INDISPONÍVEIS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-page-wrap">
      <div className="overlay-root">
        {deathAlert && (
          <div className="death-alert" key={deathAlert.id}>
            <i className="ti ti-skull death-alert-icon" />
            <div className="death-alert-text">
              <span className="death-alert-title">{deathAlert.character_name || profile.player.nick} morreu!</span>
              <span className="death-alert-sub">
                {deathAlert.days}d sobrevividos · {deathAlert.kills.toLocaleString('pt-BR')} zumbis · {deathAlert.score.toLocaleString('pt-BR')} pts
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="overlay-header">
          <div className="overlay-nick">{profile.player.nick}</div>
          <div className="overlay-char">
            {bestEntry.character_name || '—'}
            {bestEntry.profession && <span className="overlay-prof"> · {bestEntry.profession}</span>}
          </div>
        </div>

        {/* Rank + score */}
        <div className="overlay-score-row">
          {rank !== null && <span className="overlay-rank">#{rank}</span>}
          <span className="overlay-score">{bestEntry.score.toLocaleString('pt-BR')} pts</span>
        </div>
      </div>
    </div>
  );
}
