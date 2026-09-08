import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'criacao',     label: '2. Criação do personagem' },
  { id: 'livros',      label: '3. Livros' },
  { id: 'argila',      label: '4. Argila' },
  { id: 'kit',         label: '5. Kit mínimo' },
  { id: 'estacoes',    label: '6. Estações de trabalho' },
  { id: 'forno',       label: '7. Forno' },
  { id: 'xp',          label: '8. XP por receita' },
  { id: 'moldes',      label: '9. Moldes e formas' },
  { id: 'tijolos',     label: '10. Tijolos e telhas' },
  { id: 'rota',        label: '11. Rota 0→10' },
  { id: 'integracao',  label: '12. Integrações' },
  { id: 'br',          label: '13. Estratégia Brasileirão' },
  { id: 'calc',        label: '14. Calculadora' },
  { id: 'erros',       label: '15. Erros comuns' },
  { id: 'fontes',      label: '16. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const RECIPES = [
  { label: 'Caneca / Segmento — 15 XP / 1 argila', xp: 15, clay: 1 },
  { label: 'Cadinho Pequeno — 25 XP / 1 argila', xp: 25, clay: 1 },
  { label: 'Cadinho Grande — 25 XP / 2 argila', xp: 25, clay: 2 },
  { label: 'Tijolo / Telha — 5 XP / 1 argila', xp: 5, clay: 1 },
  { label: 'Jarra — 40 XP / 3 argila', xp: 40, clay: 3 },
];

const BOOKS = [
  { label: 'Sem livro', value: 1 },
  { label: 'Cerâmica I — 3×', value: 3 },
  { label: 'Cerâmica II — 5×', value: 5 },
  { label: 'Cerâmica III — 8×', value: 8 },
  { label: 'Cerâmica IV — 12×', value: 12 },
  { label: 'Cerâmica V — 16×', value: 16 },
];

const BOOSTS = [
  { label: '0 pts — 0,25×', value: 0.25 },
  { label: '1 pt — 1×', value: 1 },
  { label: '2 pts — 1,33×', value: 1.33 },
  { label: '3+ pts — 1,66×', value: 1.66 },
];

export function GuiaCeramica() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [recipeIdx, setRecipeIdx] = useState(1);
  const [bookMult, setBookMult] = useState(8);
  const [boostMult, setBoostMult] = useState(1);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const rec = RECIPES[recipeIdx];
    const each = rec.xp * 0.8 * bookMult * boostMult;
    const actions = Math.ceil(need / each);
    const argilas = actions * rec.clay;
    return { need, each, actions, argilas, xpBase: rec.xp, clay: rec.clay };
  }

  const result = calcResult();

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
            <h1 className="guia-title">Manual Definitivo de Cerâmica 0 → 10</h1>
            <p className="guia-subtitle">
              Cerâmica transforma <strong>argila em cadinhos, tijolos, jarras e componentes industriais</strong>.
              No Brasileirão, os cadinhos de Cerâmica são peça-chave da Ferraria e os tijolos
              alimentam a Alvenaria — sem incursão urbana, com matéria-prima renovável.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">10x–16x zumbis</span>
              <span className="guia-pill">Loot 0,04</span>
              <span className="guia-pill">XP global 0,8×</span>
              <span className="guia-pill">32.775 XP</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Configuração oficial:</strong> 10x–16x zumbis, loot 0,04, água e energia cortadas no dia 1 e XP global 0,8×.
            Argila compete com Alvenaria e cimento — defina um orçamento de argila antes de grindear em massa.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Cerâmica é a ponte entre argila e indústria</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">XP total</div><div className="guia-big guia-good">32.775</div><p className="guia-sub">0→10.</p></div>
              <div className="guia-card"><div className="guia-kpi">Maior XP</div><div className="guia-big guia-gold">40 XP</div><p className="guia-sub">Jarra — 3 argilas.</p></div>
              <div className="guia-card"><div className="guia-kpi">Mais eficiente</div><div className="guia-big">Cadinho</div><p className="guia-sub">25 XP / 1 argila.</p></div>
              <div className="guia-card"><div className="guia-kpi">Bônus traço</div><div className="guia-big">Artesão</div><p className="guia-sub">+1 Cerâmica + 1 Vidraria.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Argila</span><span className="guia-arrow">→</span>
              <span className="guia-node">Moldar</span><span className="guia-arrow">→</span>
              <span className="guia-node">Forno Primitivo</span><span className="guia-arrow">→</span>
              <span className="guia-node">Queimar</span><span className="guia-arrow">→</span>
              <span className="guia-node">Cadinho/Tijolo/Jarra</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Artesão é o único bônus direto atual</h2>
            <table className="guia-table">
              <thead><tr><th>Traço</th><th>Bônus</th><th>Leitura</th></tr></thead>
              <tbody>
                <tr><td><strong>Artesão (Artisan)</strong></td><td>Cerâmica +1, Vidraria +1</td><td>Útil se a build já inclui crafting avançado.</td></tr>
                <tr><td>Sem bônus</td><td>0</td><td>Totalmente viável; livros e argila renovável resolvem.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Volumes I–V</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Cerâmica I — Cerâmica para Iniciantes</td><td>Ceramics for Beginners</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Cerâmica II — Olaria com Dean</td><td>Pottery with Dean</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Cerâmica III — A Arte das Argilas</td><td>The Art of Clays</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Cerâmica IV — Técnicas Avançadas de Olaria</td><td>Advanced Pottery Techniques</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Cerâmica V — Tradições Cerâmicas do Sul dos EUA</td><td>Southern US Ceramic Traditions</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="argila" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Argila</div>
            <h2>Argila compete com Alvenaria — planeje o estoque</h2>
            <p className="guia-muted">
              A argila é obtida em depósitos próximos de rios, lagos e terreno argiloso via Coleta ou extração direta.
              É o mesmo recurso que Alvenaria usa para tijolos e cimento de argila.
              <strong>Separe estoques por finalidade</strong> antes de modelar lotes grandes.
            </p>
            <div className="guia-alert guia-alert-warning">
              <strong>Regra de orçamento:</strong> defina quanta argila vai para Cerâmica (cadinhos + tijolos + XP) e quanta vai para Alvenaria (cimento). Não esvaze um estoque para grindear o outro.
            </div>
          </section>

          <section id="kit" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Kit mínimo</div>
            <h2>Ferramentas básicas de Cerâmica</h2>
            <table className="guia-table">
              <thead><tr><th>Item</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><strong>Argila</strong></td><td>Matéria-prima de todas as receitas.</td></tr>
                <tr><td><strong>Colher de Pedreiro</strong></td><td>Necessária para o Forno Primitivo.</td></tr>
                <tr><td><strong>Forno Primitivo</strong></td><td>20 Argilas + Colher de Pedreiro — queima os itens moldados.</td></tr>
                <tr><td><strong>Torno de Cerâmica</strong></td><td>Roda de Pedra (Alvenaria 2) + Carpintaria — aumenta variedade e qualidade.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="estacoes" className="guia-section">
            <div className="guia-eyebrow-sm">06 · Estações de trabalho</div>
            <h2>Forno e Torno definem o que é possível</h2>
            <div className="guia-grid2">
              <div className="guia-card">
                <strong>Forno Primitivo</strong>
                <p className="guia-muted">20 Argilas + Colher de Pedreiro. Construído pelo próprio jogador. Queima tijolos, telhas, cadinhos e jarras.</p>
              </div>
              <div className="guia-card">
                <strong>Torno de Cerâmica</strong>
                <p className="guia-muted">Roda de Pedra (Alvenaria 2) + Carpintaria. Desbloqueia receitas mais avançadas e melhora eficiência.</p>
              </div>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Dependência de cadeia:</strong> Torno precisa da Roda de Pedra que vem de Alvenaria 2. Monte o Forno Primitivo primeiro para começar o grind sem esperar.
            </div>
          </section>

          <section id="forno" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Forno</div>
            <h2>Queima: onde o item vira produto final</h2>
            <p className="guia-muted">
              Após moldar o item (caneca, cadinho, jarra, tijolo ou telha), ele precisa ser queimado no forno.
              O processo consome combustível (lenha). Faça lotes — não desperdice calor queimando um item por vez.
            </p>
            <div className="guia-alert">
              <strong>Lote sempre:</strong> coloque o máximo de itens por queima. Lenha é renovável (Entalhamento + Coleta), mas o tempo dentro do forno é fixo por ciclo.
            </div>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">08 · XP por receita</div>
            <h2>Cadinho Pequeno = melhor XP por argila</h2>
            <table className="guia-table">
              <thead><tr><th>Item</th><th>XP base</th><th>Argilas</th><th>XP/argila</th><th>XP a 0,8×</th></tr></thead>
              <tbody>
                <tr><td><strong>Cadinho Pequeno</strong></td><td>25</td><td>1</td><td><strong>25</strong></td><td>20</td></tr>
                <tr><td><strong>Caneca / Segmento</strong></td><td>15</td><td>1</td><td>15</td><td>12</td></tr>
                <tr><td><strong>Jarra</strong></td><td>40</td><td>3</td><td>13,3</td><td>32</td></tr>
                <tr><td>Cadinho Grande</td><td>25</td><td>2</td><td>12,5</td><td>20</td></tr>
                <tr><td>Tijolo / Telha</td><td>5</td><td>1</td><td>5</td><td>4</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-info">
              <strong>Prioridade:</strong> Cadinho Pequeno quando o objetivo é XP puro (25 XP/argila). Tijolo quando a Alvenaria precisa de material — aceite o XP menor pelo produto útil.
            </div>
          </section>

          <section id="moldes" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Moldes e formas</div>
            <h2>Cada item tem sua técnica de moldagem</h2>
            <p className="guia-muted">
              Canecas, jarras e cadinhos são moldados à mão ou no torno, dependendo da receita e do nível.
              O processo é simples: selecione argila, escolha a receita e execute — não há mecânica de
              "minigame" de moldagem na 42.20.4. O XP vem da receita concluída (após queima ou moldagem, conforme o item).
            </p>
          </section>

          <section id="tijolos" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Tijolos e telhas</div>
            <h2>Tijolo alimenta Alvenaria sem precisar de Blocos de Pedra</h2>
            <p className="guia-muted">
              Tijolos e telhas (5 XP base / 1 argila) têm baixo XP por argila, mas são produtos
              estratégicos para Alvenaria. Quando a base precisa fechar paredes antes de ter Blocos de
              Pedra suficientes, tijolos são a ponte. Faça lotes de tijolos integrados ao grind de XP —
              mesmo com XP menor, o produto tem uso imediato.
            </p>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Rota definitiva 0→10</div>
            <h2>Forno primeiro, depois Torno</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→2 — Forno Primitivo + Canecas</h3><p>Livro I. Monte o Forno com 20 argilas + Colher de Pedreiro. Moldagem de canecas e segmentos para começar.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>2→4 — Cadinhos Pequenos</h3><p>Livro II. Cadinho Pequeno = 25 XP / 1 argila. Faça lotes para Ferraria e como XP principal.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>4→6 — Torno de Cerâmica</h3><p>Livro III. Roda de Pedra (Alvenaria 2) + Carpintaria = Torno. Desbloqueia mais variedade.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">6</div><div><h3>6→8 — Jarras e lotes mistos</h3><p>Livro IV. Jarra = 40 XP / 3 argilas. Use quando a reserva permitir; intercale com tijolos para Alvenaria.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">8</div><div><h3>8→10 — Livro V + lote final</h3><p>Acumule argila antes da leitura. Com 16×, um lote de Cadinhos ou Jarras limpa uma faixa grande de XP.</p></div></div>
            </div>
          </section>

          <section id="integracao" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Integrações</div>
            <h2>Cerâmica conecta mineração e indústria</h2>
            <div className="guia-grid4">
              <div className="guia-card"><strong>Ferraria</strong><p className="guia-muted">Cadinhos são componentes essenciais de fundição.</p></div>
              <div className="guia-card"><strong>Alvenaria</strong><p className="guia-muted">Tijolos e telhas entram na construção de paredes e coberturas.</p></div>
              <div className="guia-card"><strong>Coleta</strong><p className="guia-muted">Argila pode ser obtida por Coleta focada.</p></div>
              <div className="guia-card"><strong>Culinária</strong><p className="guia-muted">Jarras e recipientes para conservação de alimentos.</p></div>
            </div>
          </section>

          <section id="br" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Estratégia Brasileirão</div>
            <h2>Argila tem orçamento — respeite-o</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Defina o orçamento antes de modelar</h3><p>Cerâmica e Alvenaria compartilham argila. Decida proporções antes de iniciar o grind.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Cadinho Pequeno para Ferraria primeiro</h3><p>A indústria depende dos cadinhos. Produza o estoque industrial antes de grindear XP puro.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Forno em lote</h3><p>Nunca queime um item por vez. A lenha é renovável, mas o tempo é limitado em 16x.</p></div></div>
            </div>
          </section>

          <section id="calc" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Calculadora</div>
            <h2>Ações e argilas necessárias</h2>
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
                <label>Receita</label>
                <select value={recipeIdx} onChange={e => setRecipeIdx(+e.target.value)}>
                  {RECIPES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Livro ativo</label>
                <select value={bookMult} onChange={e => setBookMult(+e.target.value)}>
                  {BOOKS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Bônus inicial</label>
                <select value={boostMult} onChange={e => setBoostMult(+e.target.value)}>
                  {BOOSTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
            </div>
            {result ? (
              <div className="guia-result">
                <span className="guia-sub">XP necessário</span><br />
                <strong>{result.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">XP efetivo por ação</span><br />
                <strong>{result.each.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} XP</strong><br />
                <span className="guia-sub">~{result.actions.toLocaleString('pt-BR')} ações · ~{result.argilas.toLocaleString('pt-BR')} argilas necessárias · {result.xpBase} base × 0,8 × {bookMult} × {boostMult}</span>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">15 · Erros comuns</div>
            <h2>O que desperdiça argila</h2>
            <details className="guia-details"><summary>Grindear tijolos para XP</summary><p>5 XP/argila é o pior XP por argila. Use tijolos quando Alvenaria precisar, não para XP puro.</p></details>
            <details className="guia-details"><summary>Esgotar argila de Alvenaria</summary><p>Cimento de argila + tijolos + cadinhos competem pelo mesmo recurso. Orçamento primeiro.</p></details>
            <details className="guia-details"><summary>Queimar um item por vez no forno</summary><p>Desperdício de lenha e tempo. Lote sempre.</p></details>
            <details className="guia-details"><summary>Não montar o Forno Primitivo cedo</summary><p>Sem forno, os itens moldados não podem ser finalizados. É o pré-requisito de tudo.</p></details>
            <details className="guia-details"><summary>Ignorar os cadinhos que Ferraria precisa</summary><p>A demanda industrial de cadinhos é alta. Produza o estoque antes de grindear XP puro.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">16 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — Cerâmica: ocupações, traços e receitas com XP.</li>
              <li>pype.org — livros Cerâmica I–V e nomes da tradução 42.20.4.</li>
              <li>GamesRef — progressão 32.775 XP e desbloqueios por nível.</li>
              <li>Project Zomboid Wiki — guia de Cerâmica, forno e torno B42.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> Forno Primitivo primeiro + orçamento de argila separado de Alvenaria + Cadinho Pequeno para XP e indústria + lotes no forno + Torno (Alvenaria 2) para escalar = Cerâmica 10 renovável.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
