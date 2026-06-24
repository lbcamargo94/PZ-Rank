import { useState, useRef, useEffect } from 'react';
import { parsePzrCode } from '../../lib/decoder';
import { computeScore, SCORE_KILLS_MAX } from '../../lib/objectives';
import { resolveTrait, getTraitImageUrl } from '../../lib/traits';
import { SKILLS } from '../../lib/skills';
import type { DecodedCode } from '../../types';

const KILLS_TARGET = SCORE_KILLS_MAX;

// PT-BR lookup por ID da skill (e.g. "Fitness" → "Aptidão Física")
const SKILL_NAME_BY_ID = new Map(SKILLS.map(s => [s.id, s.name]));

// Parseia "Fitness 4" → { id: "Fitness", ptName: "Aptidão Física", level: 4 }
function parseSkillRaw(raw: string): { id: string; ptName: string; level: number } {
  const lastSpace = raw.lastIndexOf(' ');
  const id    = lastSpace !== -1 ? raw.slice(0, lastSpace) : raw;
  const level = lastSpace !== -1 ? parseInt(raw.slice(lastSpace + 1), 10) : 0;
  return { id, ptName: SKILL_NAME_BY_ID.get(id) ?? id, level: isNaN(level) ? 0 : level };
}

function verdict(d: DecodedCode): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!d.sandboxOk) reasons.push('Configurações do sandbox divergem do desafio oficial');
  return { ok: reasons.length === 0, reasons };
}

function TraitBadge({ raw }: { raw: string }) {
  const def    = resolveTrait(raw);
  const imgUrl = getTraitImageUrl(def);
  return (
    <span className={`dc-trait-badge dc-trait-${def.type}`}>
      {imgUrl && <img src={imgUrl} alt="" className="dc-trait-img" />}
      {def.name}
    </span>
  );
}

function SkillPips({ raw }: { raw: string }) {
  const { ptName, level } = parseSkillRaw(raw);
  const isMax = level >= 10;
  return (
    <div className={`dc-skill-row${isMax ? ' dc-skill-max' : ''}`}>
      <span className="dc-skill-name">{ptName}</span>
      <span className="srow-pips">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={i < level ? 'pip pip-on' : 'pip pip-off'} />
        ))}
      </span>
      <span className="dc-skill-lvl">{level}</span>
    </div>
  );
}

function KillsBar({ kills }: { kills: number }) {
  const pct  = Math.min(100, (kills / KILLS_TARGET) * 100);
  const done = kills >= KILLS_TARGET;
  return (
    <div className="dc-kills-bar-wrap">
      <div className="rk-bar-track">
        <div className={`rk-bar-fill${done ? ' rk-bar-done' : ''}`} style={{ width: pct + '%' }} />
      </div>
      <span className={`rk-bar-pct${done ? ' rk-bar-pct-done' : ''}`}>
        {pct.toFixed(1)}{'%'}{done ? ' ✓ meta atingida' : ' de 500k'}
      </span>
    </div>
  );
}

export function CodeDecoder() {
  const [code,   setCode]   = useState('');
  const [result, setResult] = useState<DecodedCode | null>(null);
  const [error,  setError]  = useState<string | null>(null);
  const [pasted, setPasted] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const hasResult = result !== null || error !== null;

  function decode() {
    const trimmed = code.trim();
    if (!trimmed) return;
    const parsed = parsePzrCode(trimmed);
    if (!parsed) {
      setResult(null);
      setError('Código inválido ou corrompido. Verifique se copiou o código completo do mod.');
      return;
    }
    setError(null);
    setResult(parsed);
  }

  function clear() {
    setCode('');
    setResult(null);
    setError(null);
    textRef.current?.focus();
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
      setResult(null);
      setError(null);
      setPasted(true);
      setTimeout(() => setPasted(false), 1500);
    } catch {
      textRef.current?.focus();
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'Enter') decode();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const v     = result ? verdict(result) : null;
  const score = result ? computeScore(result.kills, null) : 0;

  const positiveTraits = result?.traits.filter(t => resolveTrait(t).type === 'positive') ?? [];
  const negativeTraits = result?.traits.filter(t => resolveTrait(t).type === 'negative') ?? [];

  const maxedSkills = result?.skills.filter(s => parseSkillRaw(s).level >= 10).length ?? 0;

  return (
    <div className="painel-section dc-page">
      <div className="painel-section-header">
        <h2><i className="ti ti-zoom-code" /> Decodificador de Código PZR</h2>
      </div>

      {/* ── Input card ── */}
      <div className={`dc-input-card${hasResult ? ' dc-input-compact' : ''}`}>

        {!hasResult && (
          <div className="dc-guide">
            <i className="ti ti-qrcode dc-guide-icon" />
            <div className="dc-guide-text">
              <p>Cole o código gerado pelo mod in-game para inspecionar os dados do jogador antes de submetê-lo ao ranking.</p>
              <p className="dc-format-note">
                Formato esperado: <code>{'PZRX2:<payload>'}</code>
              </p>
            </div>
          </div>
        )}

        <div className="dc-input-row">
          <textarea
            ref={textRef}
            className="form-input dc-textarea"
            placeholder="Cole o código aqui...  PZRX2:..."
            value={code}
            rows={hasResult ? 2 : 4}
            spellCheck={false}
            onChange={e => { setCode(e.target.value); setResult(null); setError(null); }}
          />
          <div className="dc-input-actions">
            <button
              className="btn-primary"
              onClick={decode}
              disabled={!code.trim()}
              title="Decodificar (Ctrl+Enter)"
            >
              <i className="ti ti-zoom-code" /> Decodificar
            </button>
            <button
              className={`btn-secondary btn-sm dc-paste-btn${pasted ? ' dc-pasted' : ''}`}
              onClick={handlePaste}
              title="Colar da área de transferência"
            >
              <i className={`ti ${pasted ? 'ti-check' : 'ti-clipboard-text'}`} />
              {pasted ? 'Colado!' : 'Colar'}
            </button>
            {hasResult && (
              <button className="btn-ghost btn-sm" onClick={clear} title="Limpar resultado">
                <i className="ti ti-x" /> Limpar
              </button>
            )}
            {!hasResult && (
              <span className="dc-kbd-hint">
                ou <kbd>Ctrl</kbd>+<kbd>Enter</kbd>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="dc-error">
          <i className="ti ti-alert-circle" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Resultado ── */}
      {result && v && (
        <div className="dc-result">

          {/* Verdict banner */}
          <div className={`dc-verdict${v.ok ? ' dc-verdict-ok' : ' dc-verdict-fail'}`}>
            <div className="dc-verdict-left">
              <i className={`ti ${v.ok ? 'ti-circle-check' : 'ti-circle-x'} dc-verdict-icon`} />
              <div className="dc-verdict-body">
                <span className="dc-verdict-label">
                  {v.ok ? 'Classificado' : 'Desclassificado'}
                </span>
                <span className="dc-verdict-identity">
                  {result.characterName}
                  {result.profession && <> &middot; {result.profession}</>}
                  {' · '}
                  <span className={result.isAlive ? 'dc-alive' : 'dc-dead'}>
                    {result.isAlive ? 'Vivo' : 'Morto'}
                  </span>
                </span>
                {v.reasons.map(r => (
                  <span key={r} className="dc-verdict-reason">
                    <i className="ti ti-alert-triangle" /> {r}
                  </span>
                ))}
              </div>
            </div>
            {v.ok && (
              <div className="dc-verdict-score">
                <span className="dc-verdict-score-val">{score.toLocaleString('pt-BR')}</span>
                <span className="dc-verdict-score-lbl">pontos base</span>
              </div>
            )}
          </div>

          {/* Stats horizontal */}
          <div className="dc-stats-bar">
            <div className="dc-stat-item">
              <i className="ti ti-calendar" />
              <span className="dc-stat-val">{result.days}d</span>
              <span className="dc-stat-lbl">dias</span>
            </div>
            <div className="dc-stat-divider" />
            <div className="dc-stat-item">
              <i className="ti ti-clock" />
              <span className="dc-stat-val">{result.timeStr}</span>
              <span className="dc-stat-lbl">tempo total</span>
            </div>
            <div className="dc-stat-divider" />
            <div className="dc-stat-item dc-stat-kills-wrap">
              <div className="dc-stat-kills-top">
                <i className="ti ti-sword" />
                <span className="dc-stat-val">{result.kills.toLocaleString('pt-BR')}</span>
                <span className="dc-stat-lbl">zumbis</span>
              </div>
              <KillsBar kills={result.kills} />
            </div>
            <div className="dc-stat-divider" />
            <div className={`dc-stat-item dc-sandbox-item${result.sandboxOk ? ' dc-ok' : ' dc-fail'}`}>
              <i className={`ti ${result.sandboxOk ? 'ti-shield-check' : 'ti-shield-x'}`} />
              <span className="dc-stat-val">{result.sandboxOk ? 'Válido' : 'Inválido'}</span>
              <span className="dc-stat-lbl">sandbox</span>
            </div>
          </div>

          {/* Traços */}
          {result.traits.length > 0 && (
            <div className="dc-section">
              <div className="dc-section-title">
                <i className="ti ti-dna" /> Traços
                <span className="dc-section-count">{result.traits.length}</span>
                {positiveTraits.length > 0 && (
                  <span className="dc-trait-counter dc-trait-counter-pos">+{positiveTraits.length} positivos</span>
                )}
                {negativeTraits.length > 0 && (
                  <span className="dc-trait-counter dc-trait-counter-neg">-{negativeTraits.length} negativos</span>
                )}
              </div>
              <div className="dc-traits-wrap">
                {positiveTraits.map(t => <TraitBadge key={t} raw={t} />)}
                {negativeTraits.map(t => <TraitBadge key={t} raw={t} />)}
              </div>
            </div>
          )}

          {/* Habilidades */}
          {result.skills.length > 0 && (
            <div className="dc-section">
              <div className="dc-section-title">
                <i className="ti ti-list-check" /> Habilidades com progresso
                <span className="dc-section-count">{result.skills.length}</span>
                {maxedSkills > 0 && (
                  <span className="dc-trait-counter dc-skill-maxed">{maxedSkills} no nível máximo</span>
                )}
              </div>
              <div className="dc-skills-grid">
                {result.skills.map(s => <SkillPips key={s} raw={s} />)}
              </div>
            </div>
          )}

          {result.traits.length === 0 && result.skills.length === 0 && (
            <p className="dc-empty-note">Nenhum traço ou habilidade registrado no código.</p>
          )}
        </div>
      )}
    </div>
  );
}