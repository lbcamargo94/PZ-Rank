import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'criacao',     label: '2. Criação do personagem' },
  { id: 'livros',      label: '3. Livros' },
  { id: 'kit',         label: '4. Kit básico' },
  { id: 'nivel0',      label: '5. Nível 0 — antes do cimento' },
  { id: 'cimento',     label: '6. Cimento e água' },
  { id: 'blocos',      label: '7. Blocos de pedra' },
  { id: 'infra',       label: '8. Infraestrutura' },
  { id: 'paredes',     label: '9. Paredes de pedra' },
  { id: 'tijolos',     label: '10. Tijolos e fornos' },
  { id: 'xp',          label: '11. Fontes de XP' },
  { id: 'rota',        label: '12. Rota 0→10' },
  { id: 'integracao',  label: '13. Integrações' },
  { id: 'br',          label: '14. Estratégia Brasileirão' },
  { id: 'calculadora', label: '15. Calculadora' },
  { id: 'erros',       label: '16. Erros comuns' },
  { id: 'fontes',      label: '17. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const XP_RECIPES = [
  { label: 'Quebrar Pedra Grande / Fogueira de Pedra — 10 XP', value: 10 },
  { label: 'Bloco de Pedra Pobre / Parede pobre — 20 XP', value: 20 },
  { label: 'Roda de Pedra — 30 XP', value: 30 },
  { label: 'Tijolo bom / Parede de pedra boa — 50 XP', value: 50 },
  { label: 'Machado de Pedra — 60 XP', value: 60 },
  { label: 'Malho de Pedra — 70 XP', value: 70 },
  { label: 'Maça de Pedra — 80 XP', value: 80 },
];

export function GuiaAlvenaria() {
  const [compact, setCompact] = useState(false);

  // Part 1 — XP calculator
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [recipeIdx, setRecipeIdx] = useState(6);
  const [bookMult, setBookMult] = useState(8);
  const [boostMult, setBoostMult] = useState(1.33);

  // Part 2 — Wall resistance
  const [wallLevel, setWallLevel] = useState(10);
  const [segments, setSegments] = useState(20);
  const [blocks, setBlocks] = useState(120);
  const [cement, setCement] = useState(40);

  function calcXp() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const rec = XP_RECIPES[recipeIdx];
    const each = rec.value * 0.8 * bookMult * boostMult;
    const n = Math.ceil(need / each);
    return { need, each, n };
  }

  function calcWall() {
    const hp = 400 * wallLevel;
    const maxSeg = Math.min(Math.floor(blocks / 6), Math.floor(cement / 2));
    const usedSeg = Math.min(segments, maxSeg);
    const totalHp = hp * usedSeg;
    return { hp, maxSeg, usedSeg, totalHp };
  }

  const xpResult = calcXp();
  const wallResult = calcWall();

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
            <h1 className="guia-title">Manual Definitivo de Alvenaria 0 → 10</h1>
            <p className="guia-subtitle">
              Alvenaria é a <strong>skill de construção com pedra, tijolo e cimento</strong>.
              No campeonato ela converte a base de madeira em uma fortaleza permanente de pedra — estruturas mais resistentes,
              paredes que zumbis não arrombam facilmente e fornos para Culinária e Cerâmica sem depender de gás.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">10x–16x zumbis</span>
              <span className="guia-pill">Loot 0,04</span>
              <span className="guia-pill">XP global 0,8×</span>
              <span className="guia-pill">5 livros</span>
              <span className="guia-pill">0 VHS</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Configuração oficial:</strong> 10x–16x zumbis, loot 0,04, água e energia cortadas no dia 1 e XP global 0,8×.
            Sem água canalizada, Alvenaria muda o jogo: fornos e fogueiras de pedra independem de combustível elétrico.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Construção permanente de pedra</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">Função</div><div className="guia-big guia-good">Defesa</div><p className="guia-sub">Paredes de pedra resistem muito mais que madeira.</p></div>
              <div className="guia-card"><div className="guia-kpi">Resistência</div><div className="guia-big guia-gold">400 × nível</div><p className="guia-sub">HP por segmento de parede (nível definido na criação).</p></div>
              <div className="guia-card"><div className="guia-kpi">VHS</div><div className="guia-big guia-red">Nenhum</div><p className="guia-sub">Sem boost de mídia.</p></div>
              <div className="guia-card"><div className="guia-kpi">Bônus</div><div className="guia-big">Pedreiro +2</div><p className="guia-sub">Trabalhador da Construção também +2.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Pedra Grande</span><span className="guia-arrow">→</span>
              <span className="guia-node">Bloco de Pedra</span><span className="guia-arrow">→</span>
              <span className="guia-node">Cimento + Água</span><span className="guia-arrow">→</span>
              <span className="guia-node">Parede de Pedra (XP)</span><span className="guia-arrow">→</span>
              <span className="guia-node">Fortaleza</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Pedreiro e Trabalhador da Construção — melhores bônus</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação</th><th>Bônus</th><th>Leitura competitiva</th></tr></thead>
              <tbody>
                <tr><td><strong>Pedreiro (Mason)</strong></td><td>Alvenaria <strong>+2</strong></td><td>Melhor bônus direto — começa no 2.</td></tr>
                <tr><td><strong>Trabalhador da Construção</strong></td><td>Alvenaria <strong>+2</strong>, Carpintaria +2</td><td>Melhor para quem quer Carpintaria e Alvenaria juntas.</td></tr>
                <tr><td>Carpinteiro</td><td>Alvenaria +1, Carpintaria +3</td><td>Foco em Carpintaria, Alvenaria secundária.</td></tr>
                <tr><td>Engenheiro / Especialista / Habilidoso</td><td>Alvenaria +1 (entre outros)</td><td>Viável se o pacote geral justificar.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Cinco volumes — sem mídia de XP</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Alvenaria I — Assentar Tijolos para Iniciantes</td><td>Bricklaying for Beginners</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Alvenaria II — Pedreiro Confiante</td><td>The Confident Mason</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Alvenaria III — Técnicas Avançadas de Assentamento</td><td>Advanced Bricklaying Techniques</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Alvenaria IV — Paredes Externas Resistentes às Intempéries</td><td>Weather-Resistant Exterior Walls</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Alvenaria V — Construção em Pedra Natural</td><td>Building with Natural Stone</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="kit" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Kit básico</div>
            <h2>O que você precisa para começar</h2>
            <table className="guia-table">
              <thead><tr><th>Item</th><th>Uso</th><th>Obtenção</th></tr></thead>
              <tbody>
                <tr><td><strong>Colher de Pedreiro</strong></td><td>Ferramenta principal para construir</td><td>Lojas de ferramentas / hardware stores</td></tr>
                <tr><td><strong>Marreta / Picareta</strong></td><td>Quebrar pedras grandes</td><td>Mesmos locais acima</td></tr>
                <tr><td><strong>Pedras Grandes</strong></td><td>Matéria-prima de blocos</td><td>Área externa, coleta</td></tr>
                <tr><td><strong>Saco de Cimento</strong></td><td>Argamassa para paredes boas</td><td>Lojas de construção</td></tr>
                <tr><td><strong>Água</strong></td><td>Misturar com cimento</td><td>Poço, chuva, reservatório</td></tr>
              </tbody>
            </table>
          </section>

          <section id="nivel0" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Nível 0 — antes do cimento</div>
            <h2>Fogueiras de Pedra — fonte garantida de XP inicial</h2>
            <div className="guia-alert guia-alert-info">
              <strong>Fogueira de Pedra (Stone Fireplace):</strong> requer Alvenaria 0 e dá <strong>10 XP base</strong> por unidade construída. Construa e desmonte em loop até sair da faixa crítica.
            </div>
            <p className="guia-muted">
              Quebrar Pedra Grande também dá 10 XP base por ação. É um bom aquecimento que ainda gera blocos para uso posterior.
            </p>
          </section>

          <section id="cimento" className="guia-section">
            <div className="guia-eyebrow-sm">06 · Cimento e água</div>
            <h2>Argamassa é a chave para paredes duráveis</h2>
            <table className="guia-table">
              <thead><tr><th>Tipo de parede</th><th>Requisito</th><th>HP por segmento</th></tr></thead>
              <tbody>
                <tr><td>Parede de Pedra Pobre (sem cimento)</td><td>Alvenaria 0, só blocos</td><td>400 × 2 = <strong>800 HP</strong></td></tr>
                <tr><td><strong>Parede de Pedra Boa (com cimento)</strong></td><td>Alvenaria 2+, 6 blocos + 2 cimentos</td><td>400 × nível HP — vai até <strong>4.000 HP</strong> no 10</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-warning">
              <strong>O nível da parede é fixado no momento da construção.</strong> Construa com o nível mais alto possível. Paredes não "sobem" depois de prontas.
            </div>
          </section>

          <section id="blocos" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Blocos de pedra</div>
            <h2>Matéria-prima base</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Colete Pedras Grandes</h3><p>Qualquer área externa. Coleta em massa durante saídas de Coleta e Rastreamento.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Quebre com Marreta</h3><p>Cada Pedra Grande gera Blocos de Pedra (quantidade varia por ação).</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Calcule o estoque necessário</h3><p>1 segmento de parede boa = 6 blocos + 2 cimentos. Calcule o perímetro antes de começar.</p></div></div>
            </div>
          </section>

          <section id="infra" className="guia-section">
            <div className="guia-eyebrow-sm">08 · Infraestrutura</div>
            <h2>O que Alvenaria desbloqueia além de paredes</h2>
            <div className="guia-grid3">
              <div className="guia-card"><strong>Roda de Pedra</strong><div className="guia-big guia-gold">30 XP</div><p className="guia-sub">Essencial para Cerâmica (torno). Requer Alvenaria 2.</p></div>
              <div className="guia-card"><strong>Forno Primitivo</strong><div className="guia-big">Cerâmica</div><p className="guia-sub">20 argilas + Colher de Pedreiro. Sem combustível elétrico.</p></div>
              <div className="guia-card"><strong>Fogueira de Pedra</strong><div className="guia-big">Culinária</div><p className="guia-sub">Fonte de calor permanente para cozinhar.</p></div>
            </div>
          </section>

          <section id="paredes" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Paredes de pedra</div>
            <h2>A fortaleza definitiva</h2>
            <table className="guia-table">
              <thead><tr><th>Nível de Alvenaria</th><th>HP por segmento</th></tr></thead>
              <tbody>
                {[2,3,4,5,6,7,8,9,10].map(lv => (
                  <tr key={lv}><td>{lv}</td><td>{(400 * lv).toLocaleString('pt-BR')} HP</td></tr>
                ))}
              </tbody>
            </table>
            <div className="guia-alert guia-alert-danger">
              <strong>Construa sempre no nível mais alto disponível.</strong> A HP é definida pelo nível no momento da construção — não retroage.
            </div>
          </section>

          <section id="tijolos" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Tijolos e fornos</div>
            <h2>Manufatura de tijolos para estruturas especiais</h2>
            <p className="guia-muted">
              Tijolos de Argila cozidos em um Forno de Alvenaria permitem construir estruturas diferentes dos blocos de pedra.
              O processo integra Cerâmica (argila) com Alvenaria (forno) — uma combinação natural dentro da rota da base permanente.
            </p>
            <table className="guia-table">
              <thead><tr><th>Etapa</th><th>Ação</th></tr></thead>
              <tbody>
                <tr><td>1</td><td>Construa Forno de Alvenaria (requer Alvenaria 4+)</td></tr>
                <tr><td>2</td><td>Molde tijolos de argila crua</td></tr>
                <tr><td>3</td><td>Queime no forno</td></tr>
                <tr><td>4</td><td>Use tijolos cozidos em construções</td></tr>
              </tbody>
            </table>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Fontes de XP</div>
            <h2>XP confirmado por ação — 42.20.4</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">Quebrar Pedra / Fogueira</div><div className="guia-big">10 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Bloco / Parede pobre</div><div className="guia-big">20 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Roda de Pedra</div><div className="guia-big">30 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Tijolo bom / Parede boa</div><div className="guia-big">50 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Machado de Pedra</div><div className="guia-big">60 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Malho de Pedra</div><div className="guia-big">70 XP</div></div>
              <div className="guia-card"><div className="guia-kpi guia-gold">Maça de Pedra</div><div className="guia-big guia-gold">80 XP</div></div>
            </div>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Rota definitiva 0→10</div>
            <h2>Construção que gera XP e resultado</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→2 — Fogueiras de Pedra</h3><p>Construa e desmonte. Livro I. Cada Fogueira = 10 XP base. Quebrar Pedra Grande também vale.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>2→4 — Paredes Pobres e Roda de Pedra</h3><p>Livro II. Roda de Pedra (30 XP) é mais rápida e você vai precisar dela para Cerâmica.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>4→6 — Paredes Boas</h3><p>Livro III. Comece a construção permanente: 6 blocos + 2 cimentos por segmento. 50 XP cada.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">6</div><div><h3>6→8 — Malho de Pedra (70 XP)</h3><p>Livro IV. Mais eficiente que paredes em termos de XP puro por ação.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">8</div><div><h3>8→10 — Maça de Pedra (80 XP)</h3><p>Livro V (16×). Cada Maça = 80 × 0,8 × 16 = <strong>1.024 XP</strong>. Finalize com volume.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Híbrido construção + grind:</strong> use paredes reais da base durante 0–8 e Maças para o sprint final.
            </div>
          </section>

          <section id="integracao" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Integrações</div>
            <h2>Alvenaria no centro da base permanente</h2>
            <div className="guia-grid4">
              <div className="guia-card"><strong>Cerâmica</strong><p className="guia-muted">Forno Primitivo (20 argilas) + Roda de Pedra (Alvenaria 2).</p></div>
              <div className="guia-card"><strong>Culinária</strong><p className="guia-muted">Fogueira de Pedra = cozinhar sem gás.</p></div>
              <div className="guia-card"><strong>Lascamento</strong><p className="guia-muted">Cinzel de Pedra como ferramenta alternativa.</p></div>
              <div className="guia-card"><strong>Carpintaria</strong><p className="guia-muted">Trabalhador da Construção sobe ambas ao mesmo tempo.</p></div>
            </div>
          </section>

          <section id="br" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Estratégia Brasileirão</div>
            <h2>A skill que transforma a base em fortaleza</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Estoque pedras e cimento antes de começar</h3><p>Calcule o perímetro da base × 6 blocos + 2 cimentos. Tenha tudo antes de iniciar.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Construa a Roda de Pedra cedo (Alvenaria 2)</h3><p>Desbloqueia Cerâmica e dá 30 XP por unidade.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Construa as paredes de verdade</h3><p>Integre XP e defesa — não faça paredes "de teste" em nível baixo que você vai demolir.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Sprint final com Maças + livro V</h3><p>1.024 XP real por Maça. Com 32.775 XP no total, o sprint de 8→10 custa ~21 Maças.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Nunca construa paredes definitivas com nível baixo.</strong> HP é definida no momento — não sobe. Espere pelo menos o nível 6 para o muro externo.
            </div>
          </section>

          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow-sm">15 · Calculadora</div>
            <h2>Parte 1 — Ações para subir de nível</h2>
            <div className="guia-calc guia-calc-5">
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
                <label>Ação / receita</label>
                <select value={recipeIdx} onChange={e => setRecipeIdx(+e.target.value)}>
                  {XP_RECIPES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Multiplicador livro</label>
                <select value={bookMult} onChange={e => setBookMult(+e.target.value)}>
                  {[1,3,5,8,12,16].map(v => <option key={v} value={v}>{v}×</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Boost (ex: 1,33)</label>
                <input type="number" value={boostMult} min={1} step={0.01} onChange={e => setBoostMult(+e.target.value)} />
              </div>
            </div>
            {xpResult ? (
              <div className="guia-result">
                <span className="guia-sub">XP necessário</span><br />
                <strong>{xpResult.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">XP real por ação</span><br />
                <strong>{xpResult.each.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} XP</strong><br /><br />
                <span className="guia-sub">Ações estimadas</span><br />
                <strong className="guia-good">~{xpResult.n.toLocaleString('pt-BR')} ações</strong>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}

            <h2 style={{ marginTop: '2rem' }}>Parte 2 — Resistência das paredes</h2>
            <p className="guia-sub">Calcule o HP total do muro com os recursos disponíveis.</p>
            <div className="guia-calc guia-calc-4">
              <div className="guia-field">
                <label>Nível de Alvenaria (2–10)</label>
                <input type="number" value={wallLevel} min={2} max={10} onChange={e => setWallLevel(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Segmentos desejados</label>
                <input type="number" value={segments} min={1} onChange={e => setSegments(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Blocos disponíveis</label>
                <input type="number" value={blocks} min={0} onChange={e => setBlocks(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Cimentos disponíveis</label>
                <input type="number" value={cement} min={0} onChange={e => setCement(+e.target.value)} />
              </div>
            </div>
            <div className="guia-result">
              <span className="guia-sub">HP por segmento (nível {wallLevel})</span><br />
              <strong>{wallResult.hp.toLocaleString('pt-BR')} HP</strong><br /><br />
              <span className="guia-sub">Máx. segmentos possíveis (blocos/6 ou cimento/2)</span><br />
              <strong>{wallResult.maxSeg.toLocaleString('pt-BR')} seg.</strong><br /><br />
              <span className="guia-sub">Segmentos construídos</span><br />
              <strong>{wallResult.usedSeg.toLocaleString('pt-BR')}</strong>
              {wallResult.usedSeg < segments && <span className="guia-muted"> (limitado por material)</span>}
              <br /><br />
              <span className="guia-sub">HP total do muro</span><br />
              <strong className="guia-gold">{wallResult.totalHp.toLocaleString('pt-BR')} HP</strong>
            </div>
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">16 · Erros comuns</div>
            <h2>O que mais compromete a base</h2>
            <details className="guia-details"><summary>Construir o muro externo no nível 2</summary><p>HP definida na construção. Espere no mínimo nível 6 — preferencialmente 10 para o muro externo.</p></details>
            <details className="guia-details"><summary>Não calcular material antes de começar</summary><p>Falta de cimento no meio do muro é o erro mais comum. 6 blocos + 2 cimentos por segmento — conte antes.</p></details>
            <details className="guia-details"><summary>Ignorar Fogueiras de Pedra no nível 0</summary><p>São a melhor fonte de XP antes de ter cimento. Construa e desmonte em loop enquanto coleta pedras.</p></details>
            <details className="guia-details"><summary>Não fazer a Roda de Pedra cedo</summary><p>Requer Alvenaria 2 e desbloqueia Cerâmica. Construa na primeira oportunidade.</p></details>
            <details className="guia-details"><summary>Usar livros fora da faixa correta</summary><p>Leia o livro da faixa em que você vai grindar, não antes.</p></details>
            <details className="guia-details"><summary>Ignorar Maça de Pedra no sprint final</summary><p>80 XP base — a mais alta da skill. Com livro V, são 1.024 XP reais por peça. Use para fechar 8→10.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">17 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — definição mecânica de Masonry, resistência 400×nível por segmento.</li>
              <li>pype.org — Alvenaria I–V, nomes traduzidos 42.20.4.</li>
              <li>Bamboo Gaming — 5 livros, 0 mídia, Pedreiro +2 e Trabalhador da Construção +2, snapshot 42.20.4.</li>
              <li>Project Zomboid Wiki — Paredes de Pedra: 6 blocos + 2 cimentos, HP fixa na construção.</li>
              <li>Steam Community — Roda de Pedra para Cerâmica, Forno Primitivo de 20 argilas.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> Pedreiro/Trabalhador +2 + Fogueiras de Pedra no 0 + Roda de Pedra no 2 + paredes reais a partir do 6 + Maça com livro V para o sprint final 8→10.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
