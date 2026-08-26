import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiGetPlayerProfile, apiGetEntries } from '../lib/api';
import { parseSkillMap, TOTAL_SKILLS, MAX_SKILL_LEVEL } from '../lib/skills';
import type { PlayerProfile, Entry } from '../types';

// Alinhado ao Cache-Control: s-maxage=60 de /players/:id e /entries — pollar
// mais rápido que isso só gera Edge Requests extras sem pegar dado mais
// fresco (a resposta cacheada na borda da Vercel já é reaproveitada até 60s).
// Isso também limita em até 1 minuto o atraso pra detectar uma morte.
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
      const [prof, all] = await Promise.all([
        apiGetPlayerProfile(numId),
        apiGetEntries('score'),
      ]);
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

      // Rank = posição entre entries vivos e não-desclassificados (igual ao public rank tab)
      const publicRank = all.filter(e => e.sandbox_ok !== false && e.is_alive);
      const bestAlive  = sorted.find(e => e.sandbox_ok !== false && e.is_alive) ?? null;
      if (bestAlive?.id !== undefined) {
        const pos = publicRank.findIndex(e => e.id === bestAlive.id);
        setRank(pos >= 0 ? pos + 1 : null);
      } else {
        setRank(null);
      }
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
      <div className="overlay-root overlay-error">
        <span className="overlay-status-badge overlay-badge-dead">DADOS INDISPONÍVEIS</span>
      </div>
    );
  }

  const skillMap   = parseSkillMap(bestEntry.skills);
  const maxedSkills = Array.from(skillMap.values()).filter(l => l >= MAX_SKILL_LEVEL).length;

  const basesCount = bestEntry.objectives?.bases
    ? Object.values(bestEntry.objectives.bases).filter(b => b.has_base).length
    : 0;

  return (
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
        {bestEntry.is_alive
          ? <span className="overlay-status-badge overlay-badge-alive"><i className="ti ti-heartbeat" /> VIVO</span>
          : <span className="overlay-status-badge overlay-badge-dead"><i className="ti ti-skull" /> MORTO</span>}
      </div>

      {/* Stats row */}
      <div className="overlay-stats">
        <div className="overlay-stat">
          <i className="ti ti-sword" />
          <span>{bestEntry.kills.toLocaleString('pt-BR')}</span>
          <small>zumbis</small>
        </div>
        <div className="overlay-stat">
          <i className="ti ti-calendar" />
          <span>{bestEntry.days}d</span>
          <small>sobrevivido</small>
        </div>
        <div className="overlay-stat">
          <i className="ti ti-bolt" />
          <span>{maxedSkills}/{TOTAL_SKILLS}</span>
          <small>habilidades</small>
        </div>
        <div className="overlay-stat">
          <i className="ti ti-building-store" />
          <span>{basesCount}/9</span>
          <small>bases</small>
        </div>
      </div>

      {/* Objectives dots */}
      <div className="overlay-objs">
        {[
          { label: 'HQ Spiffo', done: bestEntry.objectives?.spiffo_hq ?? false },
          { label: 'Relíquia', done: bestEntry.objectives?.spiffo_relic ?? false },
          { label: 'Base Mil.', done: bestEntry.objectives?.military_base ?? false },
        ].map(o => (
          <span key={o.label} className={`overlay-obj-dot ${o.done ? 'overlay-obj-done' : ''}`}>
            {o.done ? <i className="ti ti-check" /> : <i className="ti ti-circle" />}
            {o.label}
          </span>
        ))}
      </div>
    </div>
  );
}
