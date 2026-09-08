import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'criacao',     label: '2. Criação do personagem' },
  { id: 'livros',      label: '3. Livros' },
  { id: 'armadilhas',  label: '4. Tipos de armadilha' },
  { id: 'formula',     label: '5. Fórmula de captura' },
  { id: 'coelhos',     label: '6. Comportamento dos coelhos' },
  { id: 'linha',       label: '7. Linha de produção' },
  { id: 'vivos',       label: '8. Captura viva' },
  { id: 'xp',          label: '9. Fontes de XP' },
  { id: 'rota',        label: '10. Rota 0→10' },
  { id: 'br',          label: '11. Estratégia Brasileirão' },
  { id: 'calculadora', label: '12. Calculadora' },
  { id: 'erros',       label: '13. Erros comuns' },
  { id: 'fontes',      label: '14. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const TRAP_OPTIONS = [
  { label: 'Armadilha de Gaiola', value: 40 },
  { label: 'Armadilha de Caixote (Crate)', value: 35 },
  { label: 'Armadilha de Caixa (Box)', value: 35 },
  { label: 'Armadilha de Laço', value: 30 },
  { label: 'Armadilha de Graveto', value: 15 },
];

const BAIT_OPTIONS = [
  { label: 'Cenoura', value: 45 },
  { label: 'Repolho', value: 40 },
  { label: 'Alface', value: 40 },
  { label: 'Pimentão', value: 40 },
  { label: 'Milho', value: 35 },
  { label: 'Batata', value: 35 },
  { label: 'Tomate', value: 35 },
  { label: 'Fruta', value: 35 },
];

const ZONE_OPTIONS = [
  { label: 'Deep Forest / Organic', value: 15 },
  { label: 'Forest', value: 12 },
  { label: 'Vegetation', value: 10 },
  { label: 'Town / Trailer Park', value: 2 },
];

export function GuiaArmadilhas() {
  const [compact, setCompact] = useState(false);

  // Part 1 — elegibilidade
  const [trapIdx, setTrapIdx] = useState(0);
  const [baitIdx, setBaitIdx] = useState(0);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [nivel, setNivel] = useState(3);

  // Part 2 — XP capturas
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [size, setSize] = useState(3);
  const [captureBook, setCaptureBook] = useState(8);

  function calcElig() {
    const trap = TRAP_OPTIONS[trapIdx].value;
    const bait = BAIT_OPTIONS[baitIdx].value;
    const zone = ZONE_OPTIONS[zoneIdx].value;
    const r1 = Math.min(100, trap + bait + 1.5 * nivel);
    const r2 = Math.min(100, zone + 1.5 * nivel);
    const j = (r1 * r2) / 100;
    return { r1: r1.toFixed(1), r2: r2.toFixed(1), j: j.toFixed(1) };
  }

  function calcXp() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const base = Math.max(3, size / 3);
    const each = base * 0.8 * captureBook;
    const n = Math.ceil(need / each);
    return { need, base, each, n };
  }

  const elig = calcElig();
  const xpResult = calcXp();

  return (
    <div className={`guia-page${compact ? ' guia-compact' : ''}`}>
      <header className="guia-header">
        <div className="guia-header-inner">
          <Link to="/dicas" className="guia-back">
            <i className="ti ti-arrow-left" /> Guias
          </Link>
          <div className="guia-header-actions">
            <button className="guia-btn" onClick={() => window.print()}>
              <i className="ti ti-printer" /> Imprimir / PDF
            </button>
            <button className="guia-btn" onClick={() => setCompact(c => !c)}>
              <i className="ti ti-layout-sidebar" /> Modo compacto
            </button>
          </div>
        </div>
      </header>

      <div className="guia-wrap">
        <aside className="guia-side">
          <div className="guia-side-label">Manual definitivo</div>
          {TOC.map(item => (
            <a key={item.id} href={`#${item.id}`} className="guia-side-link">{item.label}</a>
          ))}
          <p className="guia-side-note">Construção 42.20.4 · 10x–16x zumbis · XP 0,8× · loot 0,04.</p>
        </aside>

        <main className="guia-main">
          <div className="guia-hero">
            <div className="guia-eyebrow">Construção 42.20.4 · Português do Brasil</div>
            <h1 className="guia-title">Manual Definitivo de Armadilhas 0 → 10</h1>
            <p className="guia-subtitle">
              Armadilhas é a <strong>skill de captura passiva de pequena fauna</strong>.
              Bem gerenciada no campeonato, ela garante proteína constante e XP simultâneo com Rastreamento e Abate —
              sem precisar perseguir nada em uma zona infestada.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">10x–16x zumbis</span>
              <span className="guia-pill">Loot 0,04</span>
              <span className="guia-pill">XP global 0,8×</span>
              <span className="guia-pill">5 livros</span>
              <span className="guia-pill">Life &amp; Living dia 5</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Configuração oficial:</strong> 10x–16x zumbis, loot 0,04, água e energia cortadas no dia 1 e XP global 0,8×.
            Armadilhas são passivas — o risco está no posicionamento inicial e na coleta, não na espera.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Captura passiva integrada à cadeia de caça</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">Função</div><div className="guia-big guia-good">Passiva</div><p className="guia-sub">Armadilhas trabalham enquanto você faz outra coisa.</p></div>
              <div className="guia-card"><div className="guia-kpi">Resultado</div><div className="guia-big">Proteína</div><p className="guia-sub">Coelhos e pequena fauna para Abate e Culinária.</p></div>
              <div className="guia-card"><div className="guia-kpi">VHS</div><div className="guia-big guia-gold">+400 XP</div><p className="guia-sub">Life &amp; Living dia 5 — 18h a 23h30. Vale muito.</p></div>
              <div className="guia-card"><div className="guia-kpi">Bônus</div><div className="guia-big">Trilheiro +1</div><p className="guia-sub">Único bônus direto confirmado por ocupação.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Área de fauna</span><span className="guia-arrow">→</span>
              <span className="guia-node">Posicionar armadilha</span><span className="guia-arrow">→</span>
              <span className="guia-node">Isca certa</span><span className="guia-arrow">→</span>
              <span className="guia-node">Esperar</span><span className="guia-arrow">→</span>
              <span className="guia-node">Coletar (XP)</span><span className="guia-arrow">→</span>
              <span className="guia-node">Abate ou cercado</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Trilheiro — único com bônus direto confirmado</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação</th><th>Bônus</th><th>Leitura competitiva</th></tr></thead>
              <tbody>
                <tr><td><strong>Trilheiro</strong></td><td>Armadilhas <strong>+1</strong>, Coleta +1, Rastreamento +1, Culinária +1</td><td>Pacote excelente — quatro skills úteis no campeonato.</td></tr>
                <tr><td>Caçador</td><td>Rastreamento +1, Pontaria +1, outros</td><td>Libera receitas avançadas de Armadilhas, mas <strong>sem bônus direto</strong> confirmado na 42.20.4.</td></tr>
                <tr><td>Sem bônus</td><td>0</td><td>Viável — livros compensam.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Cinco volumes + VHS valioso</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Armadilhas I — O Garoto-Armadilha</td><td>The Trap Boy</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Armadilhas II — A Arte de Armar a Armadilha</td><td>The Art of the Snare</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Armadilhas III — Armadilhas Avançadas para Animais</td><td>Advanced Animal Trapping</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Armadilhas IV — Vida Selvagem: Uma Abordagem Prática</td><td>Living Wild: A Practical Approach</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Armadilhas V — Armadilhas do Novo Mundo</td><td>New World Traps</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-info">
              <strong>Life &amp; Living — Canal Life &amp; Living, dia 5, 18h–23h30:</strong> +400 XP base (320 com 0,8×) + receita da Armadilha de Caixote.
              Não perca — o caixote é a segunda melhor armadilha para coelhos.
            </div>
          </section>

          <section id="armadilhas" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Tipos de armadilha</div>
            <h2>Cinco modelos, dois primeiros acessíveis</h2>
            <table className="guia-table">
              <thead><tr><th>Armadilha</th><th>Materiais</th><th>Chance base (isca)</th><th>Observação</th></tr></thead>
              <tbody>
                <tr><td><strong>Gaiola</strong></td><td>5 Arames + Alicate</td><td><strong>+40</strong></td><td>Melhor opção para captura viva.</td></tr>
                <tr><td><strong>Caixote (Crate)</strong></td><td>3 Tábuas + 5 Pregos</td><td><strong>+35</strong></td><td>Receita do Life &amp; Living — fácil de produzir em escala.</td></tr>
                <tr><td><strong>Caixa (Box)</strong></td><td>4 Tábuas + 7 Pregos</td><td><strong>+35</strong></td><td>Similar ao Crate.</td></tr>
                <tr><td><strong>Laço</strong></td><td>1 Tábua + 2 Barbantes</td><td><strong>+30</strong></td><td>Mata o animal. Sem captura viva.</td></tr>
                <tr><td><strong>Graveto</strong></td><td>4 Hastes + 1 Barbante</td><td><strong>+15</strong></td><td>Pior chance — apenas emergência.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-warning">
              <strong>Laço mata o animal.</strong> Use Gaiola ou Caixote quando quiser coelhos vivos para o cercado de Rastreamento.
            </div>
          </section>

          <section id="formula" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Fórmula de captura</div>
            <h2>Como calcular a chance real</h2>
            <div className="guia-alert guia-alert-info">
              <strong>Duas rolagens independentes:</strong>
              <br />R1 = min(100, armadilha + isca + 1,5 × nível) — leva em conta a qualidade da armadilha e isca
              <br />R2 = min(100, zona + 1,5 × nível) — leva em conta onde a armadilha está
              <br /><strong>Chance final = R1 × R2 / 100</strong> — ambas precisam "passar" para a captura ocorrer
            </div>
            <table className="guia-table">
              <thead><tr><th>Variável</th><th>Valores</th></tr></thead>
              <tbody>
                <tr><td><strong>Armadilha</strong></td><td>Gaiola +40, Caixote/Caixa +35, Laço +30, Graveto +15</td></tr>
                <tr><td><strong>Isca</strong></td><td>Cenoura +45, Repolho/Alface/Pimentão +40, Milho/Batata/Tomate/Fruta +35</td></tr>
                <tr><td><strong>Zona</strong></td><td>Deep Forest/Organic +15, Forest +12, Vegetation +10, Town/Trailer +2</td></tr>
                <tr><td><strong>Nível</strong></td><td>+1,5 por nível (afeta R1 e R2 separadamente)</td></tr>
              </tbody>
            </table>
          </section>

          <section id="coelhos" className="guia-section">
            <div className="guia-eyebrow-sm">06 · Comportamento dos coelhos</div>
            <h2>Janela ativa e pressão de fuga</h2>
            <div className="guia-grid3">
              <div className="guia-card"><strong>Hora ativa</strong><div className="guia-big guia-gold">19h–05h</div><p className="guia-sub">Coelhos se movem à noite. Posicione armadilhas no fim da tarde.</p></div>
              <div className="guia-card"><strong>Fuga</strong><div className="guia-big guia-red">~24h</div><p className="guia-sub">Após ~24h preso, o coelho foge. Colete diariamente.</p></div>
              <div className="guia-card"><strong>Zona</strong><div className="guia-big">Forest+</div><p className="guia-sub">Deep Forest e Organic são os melhores biomas.</p></div>
            </div>
          </section>

          <section id="linha" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Linha de produção</div>
            <h2>Configuração de uma linha eficiente</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Mapeie corredores de coelho próximos à base</h3><p>Observe fauna em deslocamentos normais. Zonas Forest e Organic são prioritárias.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Posicione 6–12 armadilhas</h3><p>Spread de 2–3 tiles de distância. Gaiolas e Caixotes quando quiser captura viva.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Use a melhor isca disponível</h3><p>Cenoura primeiro; depois repolho/pimentão.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Colete uma vez por dia (manhã)</h3><p>Evite perder coelhos por fuga após 24h.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>Reponha isca e reloque armadilhas vazias</h3><p>Após 3–4 dias no mesmo tile, considere mover o conjunto.</p></div></div>
            </div>
          </section>

          <section id="vivos" className="guia-section">
            <div className="guia-eyebrow-sm">08 · Captura viva</div>
            <h2>Integração com Rastreamento</h2>
            <div className="guia-alert guia-alert-info">
              <strong>Gaiola ou Caixote</strong> capturam coelhos vivos. Em vez de abater todos, reserve 4–8 para o cercado de treino de Rastreamento.
            </div>
            <div className="guia-route">
              <span className="guia-node">Gaiola (XP)</span><span className="guia-arrow">→</span>
              <span className="guia-node">Coelho vivo</span><span className="guia-arrow">→</span>
              <span className="guia-node">Antecâmara cercado</span><span className="guia-arrow">→</span>
              <span className="guia-node">Zona de Animais</span><span className="guia-arrow">→</span>
              <span className="guia-node">Treino Rastreamento</span>
            </div>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Fontes de XP</div>
            <h2>XP por captura — tamanho ÷ 3</h2>
            <table className="guia-table">
              <thead><tr><th>Fonte</th><th>XP base</th><th>Com 0,8×</th></tr></thead>
              <tbody>
                <tr><td>Life &amp; Living dia 5</td><td>400</td><td>320 (+ receita Caixote)</td></tr>
                <tr><td>Captura (tamanho ÷ 3, mín. 3)</td><td>varia</td><td>aplica 0,8× e multiplicador de livro</td></tr>
                <tr><td>Coelho (tamanho ≈ 9)</td><td>3 XP</td><td>2,4 × livro × boost</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-warning">
              <strong>Mínimo de 3 XP base por captura.</strong> O valor exato depende do tamanho do animal — coelhos ficam geralmente nessa faixa.
            </div>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Rota definitiva 0→10</div>
            <h2>Progressão integrada</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→1 — Setup imediato</h3><p>Assista Life &amp; Living dia 5 (+320 XP real). Monte 6+ Gaiolas/Caixotes na primeira zona Forest próxima. Livro I.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>1→3 — Consolidar a linha</h3><p>Expanda para 10–12 armadilhas. Colete todo dia de manhã. Livre I + início do II.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>3→5 — Otimizar isca e zona</h3><p>Ajuste para Cenoura e Deep Forest se possível. Livro II → III.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>5→7 — Linha madura</h3><p>12+ armadilhas, isca ótima, coleta matinal, cercado de coelhos vivos ativo. Livro III → IV.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">7</div><div><h3>7→10 — Volume puro</h3><p>Livro IV → V. XP por sessão alto graças ao mult 12×/16×. Integre Abate e Culinária nas coletas.</p></div></div>
            </div>
          </section>

          <section id="br" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Estratégia Brasileirão</div>
            <h2>Passivo e integrado — custo de risco mínimo</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Life &amp; Living dia 5 é obrigatório</h3><p>+320 XP base e receita do Caixote. Não falhe esse horário.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Setup de armadilhas dentro do perímetro de segurança</h3><p>Escolha uma zona Forest/Organic dentro de 3–5 min da base.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Coleta matinal = rotina diária</h3><p>Sempre de manhã, nunca à noite ou durante horda.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Integre Abate e Culinária na mesma saída</h3><p>Toda coleta de armadilha vira Abate; Abate vira Culinária. Um único deslocamento gera XP em três skills.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Não posicione armadilhas em zonas que exijam combate para acessar.</strong> Em 16x, o XP de Armadilhas nunca compensa uma morte.
            </div>
          </section>

          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Calculadora</div>
            <h2>Parte 1 — Elegibilidade de captura</h2>
            <p className="guia-sub">Calcule a chance de captura com base na configuração atual.</p>
            <div className="guia-calc guia-calc-4">
              <div className="guia-field">
                <label>Armadilha</label>
                <select value={trapIdx} onChange={e => setTrapIdx(+e.target.value)}>
                  {TRAP_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label} (+{o.value})</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Isca</label>
                <select value={baitIdx} onChange={e => setBaitIdx(+e.target.value)}>
                  {BAIT_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label} (+{o.value})</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Zona</label>
                <select value={zoneIdx} onChange={e => setZoneIdx(+e.target.value)}>
                  {ZONE_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label} (+{o.value})</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Nível de Armadilhas</label>
                <input type="number" value={nivel} min={0} max={10} onChange={e => setNivel(+e.target.value)} />
              </div>
            </div>
            <div className="guia-result">
              <span className="guia-sub">R1 (armadilha + isca)</span><br />
              <strong>{elig.r1}%</strong>
              <span style={{ marginLeft: '2rem' }} />
              <span className="guia-sub">R2 (zona)</span><br />
              <strong>{elig.r2}%</strong>
              <br /><br />
              <span className="guia-sub">Chance final de captura</span><br />
              <strong className="guia-gold">{elig.j}%</strong>
            </div>

            <h2 style={{ marginTop: '2rem' }}>Parte 2 — XP por capturas</h2>
            <p className="guia-sub">Quantas capturas são necessárias para subir de nível?</p>
            <div className="guia-calc guia-calc-4">
              <div className="guia-field">
                <label>Nível atual</label>
                <select value={startLv} onChange={e => setStartLv(+e.target.value)}>
                  {[0,1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Nível alvo</label>
                <select value={targetLv} onChange={e => setTargetLv(+e.target.value)}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Tamanho do animal</label>
                <input type="number" value={size} min={1} onChange={e => setSize(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Multiplicador livro</label>
                <select value={captureBook} onChange={e => setCaptureBook(+e.target.value)}>
                  {[1,3,5,8,12,16].map(v => <option key={v} value={v}>{v}×</option>)}
                </select>
              </div>
            </div>
            {xpResult ? (
              <div className="guia-result">
                <span className="guia-sub">XP necessário</span><br />
                <strong>{xpResult.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">XP base / por captura (0,8×)</span><br />
                <strong>{xpResult.base.toFixed(1)} / {xpResult.each.toFixed(1)} XP</strong><br /><br />
                <span className="guia-sub">Capturas estimadas</span><br />
                <strong className="guia-good">~{xpResult.n.toLocaleString('pt-BR')} capturas</strong>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Erros comuns</div>
            <h2>O que mais prejudica o progresso</h2>
            <details className="guia-details"><summary>Colocar armadilhas em zonas Town</summary><p>Chance miserável (+2). Prefira Forest/Organic mesmo que exija 3 min a mais de caminhada.</p></details>
            <details className="guia-details"><summary>Não assistir o Life &amp; Living dia 5</summary><p>+400 XP base + receita do Caixote. Ajuste a agenda do dia 5 para estar online entre 18h e 23h30.</p></details>
            <details className="guia-details"><summary>Coletar à noite</summary><p>Coelhos são mais ativos à noite — não os atrapalhe. Colete de manhã.</p></details>
            <details className="guia-details"><summary>Usar Laço quando quer captura viva</summary><p>O Laço mata. Gaiola e Caixote preservam o animal.</p></details>
            <details className="guia-details"><summary>Não reabastecer a isca</summary><p>Armadilha sem isca tem chance muito menor. Sempre verifique ao coletar.</p></details>
            <details className="guia-details"><summary>Poucas armadilhas</summary><p>6 armadilhas capturam de 0 a 6 por dia. 12 capturam de 0 a 12. Volume é a chave na faixa 5–10.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — definição mecânica de Trapping, fórmula R1×R2.</li>
              <li>pype.org — Armadilhas I–V, nomes traduzidos 42.20.4.</li>
              <li>Bamboo Gaming — 5 livros, Life &amp; Living dia 5 +400 XP, snapshot 42.20.4.</li>
              <li>Project Zomboid Wiki — tipos de armadilha, iscas, biomas e fuga após 24h.</li>
              <li>Steam Community — coelhos vivos, captura viva para cercado de Rastreamento.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> Life &amp; Living dia 5 + Gaiolas/Caixotes em Forest/Organic + Cenoura + coleta matinal + cinco volumes + integre Abate e Rastreamento.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
