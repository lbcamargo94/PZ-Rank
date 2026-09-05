import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { apiGetPlayerOverlay, ApiError } from '../lib/api';
import { useSse } from '../hooks/useSse';
import { parseSkillMap, TOTAL_SKILLS, MAX_SKILL_LEVEL } from '../lib/skills';
import { SPIFFOS_RESTAURANTS, MAX_POSSIBLE_SCORE } from '../lib/objectives';
import type { PlayerProfile, Entry } from '../types';

// Alinhado ao Cache-Control: s-maxage=60 de /players/:id — pollar mais rápido
// que isso só gera Edge Requests extras sem pegar dado mais fresco (a
// resposta cacheada na borda da Vercel já é reaproveitada até 60s). Isso
// também limita em até 1 minuto o atraso pra detectar uma morte.
const REFRESH_MS = 60_000;
const DEATH_ALERT_MS = 12_000;

// Ciclo de virada do card: 20s mostrando os dados, 10s mostrando o QR code.
const DATA_SIDE_MS = 20_000;
const QR_SIDE_MS = 10_000;
const RANK_URL = 'https://www.pzrank.com.br/rank';
const RANK_URL_LABEL = 'pzrank.com.br/rank';

export function OverlayPage() {
  const { id } = useParams<{ id: string }>();
  const [profile,    setProfile]    = useState<PlayerProfile | null>(null);
  const [bestEntry,  setBestEntry]  = useState<Entry | null>(null);
  const [rank,       setRank]       = useState<number | null>(null);
  const [error,      setError]      = useState<'not_found' | 'not_allowed' | 'generic' | false>(false);
  const [deathAlert, setDeathAlert] = useState<Entry | null>(null);
  const [flipped,    setFlipped]    = useState(false);
  const [qrDataUrl,  setQrDataUrl]  = useState<string | null>(null);
  const wasAliveRef = useRef<boolean | null>(null);

  // Fundo transparente pro OBS compositar só o cartão, sem o background do site atrás.
  useEffect(() => {
    document.body.classList.add('overlay-page-active');
    return () => document.body.classList.remove('overlay-page-active');
  }, []);

  // QR code gerado localmente (sem depender de serviço externo) — o link é
  // fixo, então só precisa gerar uma vez.
  useEffect(() => {
    QRCode.toDataURL(RANK_URL, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, []);

  // Ciclo de virada do cartão (dados → QR → dados → ...), independente do
  // polling de dados.
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    function cycle() {
      setFlipped(false);
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setFlipped(true);
        timers.push(setTimeout(() => {
          if (cancelled) return;
          cycle();
        }, QR_SIDE_MS));
      }, DATA_SIDE_MS));
    }
    cycle();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);

  const load = useCallback(async function load() {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) { setError('generic'); return; }
    try {
      const prof = await apiGetPlayerOverlay(numId).catch((err: unknown) => {
        if (err instanceof ApiError) {
          if (err.status === 403) { setError('not_allowed'); return null; }
          if (err.status === 404) { setError('not_found');   return null; }
        }
        throw err;
      });
      if (!prof) return;
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
      setError('generic');
    }
  }, [id]);

  useEffect(() => {
    load();
    // Poll de 60s como fallback de segurança — o SSE já cobre atualizações em tempo real.
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Atualiza dados via SSE quando o servidor sinaliza mudança deste jogador.
  const numericId = id ? parseInt(id, 10) : NaN;
  useSse({
    'rank-updated': (d) => {
      const ev = d as { playerId: number };
      if (!isNaN(numericId) && ev.playerId === numericId) load();
    },
    'player-died': (d) => {
      const ev = d as { playerId: number };
      if (!isNaN(numericId) && ev.playerId === numericId) load();
    },
  });

  if (error || !profile || !bestEntry) {
    const msg = error === 'not_allowed'
      ? 'OVERLAY NÃO DISPONÍVEL'
      : 'DADOS INDISPONÍVEIS';
    return (
      <div className="overlay-page-wrap">
        <div className="overlay-mini-card overlay-error">
          <span className="overlay-status-badge overlay-badge-dead">{msg}</span>
        </div>
      </div>
    );
  }

  const skillMap    = parseSkillMap(bestEntry.skills);
  const maxedSkills = Array.from(skillMap.values()).filter(l => l >= MAX_SKILL_LEVEL).length;
  const basesCount  = bestEntry.objectives?.bases
    ? Object.values(bestEntry.objectives.bases).filter(b => b.has_base).length
    : 0;
  const progressPct = MAX_POSSIBLE_SCORE > 0 ? (bestEntry.score / MAX_POSSIBLE_SCORE) * 100 : 0;

  return (
    <div className="overlay-page-wrap">
      <div className="overlay-flip-wrap">
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

        <div className={`overlay-flip-card${flipped ? ' is-flipped' : ''}`}>

          {/* Frente: dados do rank */}
          <div className="overlay-flip-face overlay-flip-face--front overlay-mini-card">
            <div className="overlay-mini-row">
              <span className="overlay-mini-title">
                {rank !== null && <span className="overlay-rank-highlight">#{rank}</span>}
                {' '}- {profile.player.nick}
              </span>
              <span className="overlay-mini-score">{bestEntry.score.toLocaleString('pt-BR')}pts</span>
            </div>

            <div className="overlay-mini-row">
              <div className="overlay-mini-block">
                <span className="overlay-mini-label">Habilidades nv.10</span>
                <span className="overlay-mini-value">{maxedSkills}/{TOTAL_SKILLS}</span>
              </div>
              <div className="overlay-mini-block overlay-mini-block--right">
                <span className="overlay-mini-label">Bases Spiffo's</span>
                <span className="overlay-mini-value">{basesCount}/{SPIFFOS_RESTAURANTS.length}</span>
              </div>
            </div>

            <div className="overlay-mini-progress">
              <span className="overlay-mini-label">Progresso</span>
              <span className="overlay-mini-pct">{progressPct.toFixed(2)}%</span>
              <div className="overlay-progress-track">
                <div className="overlay-progress-fill" style={{ width: `${Math.min(100, progressPct)}%` }} />
              </div>
            </div>
          </div>

          {/* Verso: QR code pro rank completo */}
          <div className="overlay-flip-face overlay-flip-face--back overlay-mini-card overlay-qr-face">
            {qrDataUrl && <img src={qrDataUrl} alt="QR code para o ranking" className="overlay-qr-img" />}
            <span className="overlay-qr-link"><i className="ti ti-link" /> {RANK_URL_LABEL}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
