import { useState } from 'react';
import { parsePzrCode } from '../../lib/decoder';
import { computeScore } from '../../lib/objectives';
import type { DecodedCode } from '../../types';

function verdict(d: DecodedCode): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!d.sandboxOk) reasons.push('Configurações do sandbox divergem do desafio oficial');
  return { ok: reasons.length === 0, reasons };
}

function TraitBadge({ trait }: { trait: string }) {
  const label = trait.replace(/^base:/, '').replace(/_/g, ' ');
  return <span className="dc-trait-badge">{label}</span>;
}

function SkillRow({ raw }: { raw: string }) {
  const [name, lvl] = raw.split(':');
  const level = parseInt(lvl ?? '0', 10);
  return (
    <div className={`dc-skill-row${level >= 10 ? ' dc-skill-max' : ''}`}>
      <span className="dc-skill-name">{name}</span>
      <span className="dc-skill-lvl">{level}</span>
    </div>
  );
}

export function CodeDecoder() {
  const [code,   setCode]   = useState('');
  const [result, setResult] = useState<DecodedCode | null>(null);
  const [error,  setError]  = useState<string | null>(null);

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
  }

  const v      = result ? verdict(result) : null;
  const score  = result ? computeScore(result.kills, null) : 0;

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2><i className="ti ti-zoom-code" /> Decodificador de Código PZR</h2>
      </div>

      {/* Input */}
      <div className="dc-input-area">
        <label className="form-label" htmlFor="dc-code-input">
          Código do jogador <span className="dc-hint">(gerado pelo mod in-game)</span>
        </label>
        <textarea
          id="dc-code-input"
          className="form-input dc-textarea"
          placeholder={"PZRX2:..."}
          value={code}
          onChange={e => { setCode(e.target.value); setResult(null); setError(null); }}
          rows={4}
          spellCheck={false}
        />
        <div className="dc-input-actions">
          <button className="btn-primary" onClick={decode} disabled={!code.trim()}>
            <i className="ti ti-zoom-code" /> Decodificar
          </button>
          {(result || error) && (
            <button className="btn-ghost btn-sm" onClick={clear}>
              <i className="ti ti-x" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="dc-error">
          <i className="ti ti-alert-circle" />
          {error}
        </div>
      )}

      {/* Resultado */}
      {result && v && (
        <div className="dc-result">

          {/* Veredicto */}
          <div className={`dc-verdict${v.ok ? ' dc-verdict-ok' : ' dc-verdict-fail'}`}>
            <i className={`ti ${v.ok ? 'ti-circle-check' : 'ti-circle-x'}`} />
            <div className="dc-verdict-body">
              <span className="dc-verdict-label">
                {v.ok ? 'Classificado' : 'Desclassificado'}
              </span>
              {v.reasons.map(r => (
                <span key={r} className="dc-verdict-reason">{r}</span>
              ))}
            </div>
          </div>

          {/* Stats principais */}
          <div className="dc-stats-grid">
            <div className="dc-stat">
              <span className="dc-stat-label"><i className="ti ti-user" /> Personagem</span>
              <span className="dc-stat-value">{result.characterName}</span>
            </div>
            <div className="dc-stat">
              <span className="dc-stat-label"><i className="ti ti-briefcase" /> Profissão</span>
              <span className="dc-stat-value">{result.profession}</span>
            </div>
            <div className="dc-stat">
              <span className="dc-stat-label">
                {result.isAlive
                  ? <><i className="ti ti-heartbeat" /> Status</>
                  : <><i className="ti ti-skull" /> Status</>}
              </span>
              <span className={`dc-stat-value ${result.isAlive ? 'dc-alive' : 'dc-dead'}`}>
                {result.isAlive ? 'Vivo' : 'Morto'}
              </span>
            </div>
            <div className="dc-stat">
              <span className="dc-stat-label"><i className="ti ti-calendar" /> Dias</span>
              <span className="dc-stat-value">{result.days}d</span>
            </div>
            <div className="dc-stat">
              <span className="dc-stat-label"><i className="ti ti-clock" /> Tempo</span>
              <span className="dc-stat-value">{result.timeStr}</span>
            </div>
            <div className="dc-stat">
              <span className="dc-stat-label"><i className="ti ti-sword" /> Zumbis</span>
              <span className="dc-stat-value">{result.kills.toLocaleString('pt-BR')}</span>
            </div>
            <div className="dc-stat">
              <span className="dc-stat-label"><i className="ti ti-shield-check" /> Sandbox</span>
              <span className={`dc-stat-value ${result.sandboxOk ? 'dc-ok' : 'dc-fail'}`}>
                {result.sandboxOk ? 'Válido' : 'Inválido'}
              </span>
            </div>
            <div className="dc-stat">
              <span className="dc-stat-label"><i className="ti ti-star" /> Pontuação base</span>
              <span className="dc-stat-value dc-score">
                {v.ok ? score.toLocaleString('pt-BR') + ' pts' : '0 pts (desclassificado)'}
              </span>
            </div>
          </div>

          {/* Traits */}
          {result.traits.length > 0 && (
            <div className="dc-section">
              <span className="dc-section-title">
                <i className="ti ti-dna" /> Traços ({result.traits.length})
              </span>
              <div className="dc-traits-wrap">
                {result.traits.map(t => <TraitBadge key={t} trait={t} />)}
              </div>
            </div>
          )}

          {/* Habilidades */}
          {result.skills.length > 0 && (
            <div className="dc-section">
              <span className="dc-section-title">
                <i className="ti ti-list-check" /> Habilidades com progresso ({result.skills.length})
              </span>
              <div className="dc-skills-grid">
                {result.skills.map(s => <SkillRow key={s} raw={s} />)}
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