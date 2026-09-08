import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',        label: '1. Visão geral' },
  { id: 'criacao',      label: '2. Criação do personagem' },
  { id: 'livros',       label: '3. Livros' },
  { id: 'kit',          label: '4. Kit mínimo' },
  { id: 'gancho',       label: '5. Gancho de Abate' },
  { id: 'xp',           label: '6. XP por animal' },
  { id: 'animais',      label: '7. Animais terrestres' },
  { id: 'peixes',       label: '8. Peixes' },
  { id: 'grandes',      label: '9. Animais grandes' },
  { id: 'subprodutos',  label: '10. Subprodutos' },
  { id: 'conservacao',  label: '11. Conservação' },
  { id: 'rota',         label: '12. Rota 0→10' },
  { id: 'br',           label: '13. Estratégia Brasileirão' },
  { id: 'calc',         label: '14. Calculadora' },
  { id: 'erros',        label: '15. Erros comuns' },
  { id: 'fontes',       label: '16. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const SOURCES = [
  { label: 'Filetar peixe — 10 XP', xp: 10 },
  { label: 'Animal pequeno (receita) — 10 XP', xp: 10 },
  { label: 'Cabeça de vaca/cervo — 25 XP', xp: 25 },
  { label: 'Pele de vaca/cervo — 75 XP', xp: 75 },
  { label: 'Cabeça de porco — 18 XP', xp: 18 },
  { label: 'Pele de porco — 54 XP', xp: 54 },
  { label: 'Cabeça de ovelha — 10 XP', xp: 10 },
  { label: 'Pele de ovelha — 30 XP', xp: 30 },
];

const BOOKS = [
  { label: 'Sem livro', value: 1 },
  { label: 'Abate I — 3×', value: 3 },
  { label: 'Abate II — 5×', value: 5 },
  { label: 'Abate III — 8×', value: 8 },
  { label: 'Abate IV — 12×', value: 12 },
  { label: 'Abate V — 16×', value: 16 },
];

const BOOSTS = [
  { label: '0 pts — 0,25×', value: 0.25 },
  { label: '1 pt — 1×', value: 1 },
  { label: '2 pts — 1,33×', value: 1.33 },
  { label: '3+ pts — 1,66×', value: 1.66 },
];

export function GuiaAbate() {
  const [compact, setCompact] = useState(false);
  // Calc 1: XP de fonte conhecida
  const [sourceXp, setSourceXp] = useState(25);
  const [qty, setQty] = useState(10);
  const [book1, setBook1] = useState(8);
  const [boost1, setBoost1] = useState(1);
  // Calc 2: sessão real
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [sessionXp, setSessionXp] = useState(100);
  const [carcasses, setCarcasses] = useState(5);

  function calcKnown() {
    const total = sourceXp * 0.8 * book1 * boost1 * qty;
    return total;
  }

  function calcSession() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const sessions = Math.ceil(need / (sessionXp || 1));
    const xpPerCarcass = sessionXp / (carcasses || 1);
    return { need, sessions, xpPerCarcass };
  }

  const known = calcKnown();
  const session = calcSession();

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
            <h1 className="guia-title">Manual Definitivo de Abate 0 → 10</h1>
            <p className="guia-subtitle">
              Abate converte <strong>animais e peixes em carne, couro, peles e XP</strong>.
              No Brasileirão, a cadeia Armadilhas → Cuidados → Abate é a fonte mais segura
              de proteína — sem incursões urbanas, sem perseguição de caça em área infestada.
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
            Priorize abate dentro do recinto ou junto à base — não persiga animais selvagens em área desconhecida só para XP.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Abate fecha a cadeia rural de proteína</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">XP total</div><div className="guia-big guia-good">32.775</div><p className="guia-sub">0→10.</p></div>
              <div className="guia-card"><div className="guia-kpi">Maior XP</div><div className="guia-big guia-gold">Pele</div><p className="guia-sub">Pele = 3× o XP da cabeça.</p></div>
              <div className="guia-card"><div className="guia-kpi">Mais eficiente</div><div className="guia-big">Vaca/Cervo</div><p className="guia-sub">25 XP cabeça + 75 XP pele.</p></div>
              <div className="guia-card"><div className="guia-kpi">Ferramenta</div><div className="guia-big">Gancho</div><p className="guia-sub">Carpintaria 3 + Ferraria 1.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Animal/Peixe</span><span className="guia-arrow">→</span>
              <span className="guia-node">Abate</span><span className="guia-arrow">→</span>
              <span className="guia-node">Carne + Pele</span><span className="guia-arrow">→</span>
              <span className="guia-node">Culinária + Costura</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Fazendeiro de Gado dá o maior pacote</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação / Traço</th><th>Bônus em Abate</th><th>Leitura</th></tr></thead>
              <tbody>
                <tr><td><strong>Fazendeiro de Gado (Rancher)</strong></td><td><strong>Abate +3</strong></td><td>Também dá Cuidados +4 — pacote perfeito.</td></tr>
                <tr><td><strong>Chef</strong></td><td>Abate +2</td><td>Boa sinergia com Culinária.</td></tr>
                <tr><td><strong>Guia de Pesca</strong></td><td>Abate +1</td><td>Para filetar peixes de forma mais eficiente.</td></tr>
                <tr><td>Cozinheiro Habilidoso</td><td>Abate +1</td><td>Complemento culinário.</td></tr>
                <tr><td>Caçador (Hunter)</td><td>Abate +1</td><td>Combina com Rastreamento e Pontaria.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Volumes I–V</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Abate I — Guia do Iniciante para Abate</td><td>Beginner's Guide to Butchering</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Abate II — Abatendo com Dean</td><td>Butchering with Dean</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Abate III — A Arte do Açougue Rural</td><td>The Art of Rural Butchery</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Abate IV — Processamento Completo de Animais</td><td>Complete Animal Processing</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Abate V — Manual Profissional de Açougue</td><td>Professional Butchery Manual</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="kit" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Kit mínimo</div>
            <h2>Faca é o essencial; gancho multiplica</h2>
            <table className="guia-table">
              <thead><tr><th>Item</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><strong>Faca de açougue / de caça</strong></td><td>Abate de todos os animais.</td></tr>
                <tr><td><strong>Gancho de Abate</strong></td><td>Permite abater animais grandes (vaca/cervo) com mais eficiência e XP.</td></tr>
                <tr><td>Machado (para cervos)</td><td>Alternativa para animais grandes sem gancho.</td></tr>
                <tr><td>Baldes para limpeza</td><td>Higiene e conservação do produto.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="gancho" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Gancho de Abate</div>
            <h2>Artesanal mas indispensável</h2>
            <div className="guia-alert guia-alert-info">
              <strong>Fabricar Gancho de Abate</strong> (Carpintaria 3): 2 Tábuas + 2 Pregos + 1 Gancho Grande + Martelo.<br />
              <strong>Forjar Gancho Grande</strong> (Ferraria 1): 4 Carvão + 1 Barra de Ferro/Aço.
            </div>
            <p className="guia-muted">
              O Gancho de Abate é a ferramenta que viabiliza o processamento completo de vacas e cervos —
              os animais de maior XP. Sem ele, o abate é possível mas mais limitado. Monte-o assim que
              Carpintaria 3 e Ferraria 1 estiverem disponíveis.
            </p>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">06 · XP por animal</div>
            <h2>Pele = 3× o XP da cabeça</h2>
            <table className="guia-table">
              <thead><tr><th>Animal</th><th>XP cabeça</th><th>XP pele</th><th>XP a 0,8×</th></tr></thead>
              <tbody>
                <tr><td><strong>Vaca / Cervo</strong></td><td>25</td><td>75</td><td>20 / 60</td></tr>
                <tr><td>Bezerro / Cervo jovem</td><td>18</td><td>54</td><td>14,4 / 43,2</td></tr>
                <tr><td>Porco</td><td>18</td><td>54</td><td>14,4 / 43,2</td></tr>
                <tr><td>Leitão</td><td>12</td><td>36</td><td>9,6 / 28,8</td></tr>
                <tr><td>Ovelha / Guaxinim</td><td>10</td><td>30</td><td>8 / 24</td></tr>
                <tr><td>Cordeiro</td><td>6</td><td>18</td><td>4,8 / 14,4</td></tr>
                <tr><td>Galinha / Peru / Coelho / Rato</td><td>7</td><td>21</td><td>5,6 / 16,8</td></tr>
                <tr><td>Pintinho / Coelho jovem</td><td>3</td><td>9</td><td>2,4 / 7,2</td></tr>
                <tr><td>Camundongo</td><td>5</td><td>15</td><td>4 / 12</td></tr>
              </tbody>
            </table>
          </section>

          <section id="animais" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Animais terrestres</div>
            <h2>Priorize o XP de pele quando possível</h2>
            <p className="guia-muted">
              Para animais médios e grandes, sempre que possível processe a pele além da cabeça — é 3× mais XP.
              Crie estoque suficiente de animais no plantel (Cuidados) antes de abater em quantidade para grind.
              Abate excedente de pintinhos e leitões quando o plantel estabilizar.
            </p>
          </section>

          <section id="peixes" className="guia-section">
            <div className="guia-eyebrow-sm">08 · Peixes</div>
            <h2>Filetar rende XP fixo e é simples</h2>
            <table className="guia-table">
              <thead><tr><th>Ação</th><th>XP base</th><th>XP a 0,8×</th></tr></thead>
              <tbody>
                <tr><td><strong>Filetar peixe</strong></td><td>10</td><td>8</td></tr>
                <tr><td>Abater animal pequeno (receita fixa)</td><td>10</td><td>8</td></tr>
              </tbody>
            </table>
            <div className="guia-alert">
              <strong>Sinergia com Pesca:</strong> peixe capturado vai direto para o Abate. Sessões de pesca integradas com abate maximizam o XP de ambas as skills por saída.
            </div>
          </section>

          <section id="grandes" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Animais grandes</div>
            <h2>Vaca e cervo = maior XP do campeonato</h2>
            <p className="guia-muted">
              Vaca (25 XP cabeça + 75 XP pele = 100 XP base) e cervo (mesmo valor) são os alvos mais
              eficientes de Abate. A vaca vem do plantel (Cuidados); o cervo requer Rastreamento para
              localizar e uma arma para abater com segurança.
            </p>
            <div className="guia-alert guia-alert-warning">
              <strong>Segurança primeiro:</strong> não persiga cervo em zona infestada. Plantel próprio de bovinos é mais previsível.
            </div>
          </section>

          <section id="subprodutos" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Subprodutos</div>
            <h2>Aproveite tudo do carcaço</h2>
            <table className="guia-table">
              <thead><tr><th>Subproduto</th><th>Destino</th></tr></thead>
              <tbody>
                <tr><td><strong>Carne</strong></td><td>Culinária — fonte primária de proteína.</td></tr>
                <tr><td><strong>Couro / Pele</strong></td><td>Costura — roupas, mochilas e equipamentos.</td></tr>
                <tr><td><strong>Gordura</strong></td><td>Culinária e sabão (se disponível).</td></tr>
                <tr><td>Ossos</td><td>Artesanato — alças, ferramentas primitivas.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="conservacao" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Conservação</div>
            <h2>Carne fresca deteriora rápido</h2>
            <p className="guia-muted">
              Após o abate, a carne começa a deteriorar. Cozinhe imediatamente (Culinária) ou use
              defumação/salga para conservação. Com gerador disponível, o freezer estende a vida útil.
              Não abata mais do que pode processar em um dia de jogo.
            </p>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Rota definitiva 0→10</div>
            <h2>Peixe → animal pequeno → animal grande</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→2 — Filetar peixes e animais pequenos</h3><p>Livro I. Integre com Pesca e Armadilhas — coelhos, pássaros e peixes já rendem XP de Abate.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>2→4 — Plantel de galinhas</h3><p>Livro II. Excedente de pintinhos vai para Abate. Processe cedo para não desperdiçar.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>4→6 — Animais médios</h3><p>Livro III. Porco e ovelha do plantel. Pele + cabeça = XP dobrado.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">6</div><div><h3>6→8 — Vacas e cervos</h3><p>Livro IV. Monte o Gancho de Abate (Carpintaria 3 + Ferraria 1). Vaca = 100 XP base por abate completo.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">8</div><div><h3>8→10 — Livro V + produção contínua</h3><p>Use a cadeia que mostrou melhor XP/sessão. Com 16×, cada vaca abatida vale ~1.280 XP efetivo.</p></div></div>
            </div>
          </section>

          <section id="br" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Estratégia Brasileirão</div>
            <h2>Abate dentro da base, não caça em zona desconhecida</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Plantel primeiro</h3><p>Cuidados com Animais + Armadilhas fornecem animais sem risco de incursão.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Processe tudo do carcaço</h3><p>Pele, couro e gordura alimentam Costura e Culinária — não desperdice.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Gancho de Abate é infraestrutura</h3><p>Invista em Carpintaria 3 e Ferraria 1 cedo para desbloquear o maior XP da skill.</p></div></div>
            </div>
          </section>

          <section id="calc" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Calculadora</div>
            <h2>XP por fonte conhecida</h2>
            <div className="guia-calc guia-calc-4">
              <div className="guia-field">
                <label>Fonte de XP</label>
                <select value={sourceXp} onChange={e => setSourceXp(+e.target.value)}>
                  {SOURCES.map(s => <option key={s.xp + s.label} value={s.xp}>{s.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Quantidade</label>
                <input type="number" value={qty} min={1} onChange={e => setQty(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Livro ativo</label>
                <select value={book1} onChange={e => setBook1(+e.target.value)}>
                  {BOOKS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Bônus inicial</label>
                <select value={boost1} onChange={e => setBoost1(+e.target.value)}>
                  {BOOSTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
            </div>
            <div className="guia-result">
              <strong>{known.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} XP</strong><br />
              <span className="guia-sub">{qty} × {sourceXp} base × 0,8 × {book1} × {boost1}</span>
            </div>

            <h3 style={{ marginTop: '1.5rem' }}>Sessão real</h3>
            <p className="guia-sub">Use XP medido no servidor — não aplique 0,8× novamente.</p>
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
                <label>XP real por sessão</label>
                <input type="number" value={sessionXp} min={1} onChange={e => setSessionXp(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Carcaças por sessão</label>
                <input type="number" value={carcasses} min={1} onChange={e => setCarcasses(+e.target.value)} />
              </div>
            </div>
            {session ? (
              <div className="guia-result">
                <span className="guia-sub">XP necessário</span><br />
                <strong>{session.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">Sessões estimadas</span><br />
                <strong>~{session.sessions.toLocaleString('pt-BR')} sessões</strong><br />
                <span className="guia-sub">~{session.xpPerCarcass.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} XP/carcaça.</span>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">15 · Erros comuns</div>
            <h2>O que desperdiça carne e XP</h2>
            <details className="guia-details"><summary>Abater mais do que consegue conservar</summary><p>Carne deteriora rápido. Abate na demanda — não em massa sem conservação planejada.</p></details>
            <details className="guia-details"><summary>Ignorar a pele</summary><p>Pele = 3× o XP da cabeça. Sempre que possível, processe o animal completo.</p></details>
            <details className="guia-details"><summary>Não montar o Gancho de Abate</summary><p>Sem o gancho, vacas e cervos ficam com processamento limitado.</p></details>
            <details className="guia-details"><summary>Perseguir cervo em floresta desconhecida</summary><p>Em 16x, o risco não compensa. Plantel interno é mais seguro e previsível.</p></details>
            <details className="guia-details"><summary>Abater sem livro</summary><p>Com 0,8× global, o multiplicador do livro é ainda mais valioso — não desperdice sessões sem ele.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">16 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>Bamboo Gaming — XP de abate por espécie, confirmado 42.20.4.</li>
              <li>PZ Guide — ocupações, traços e receita do Gancho de Abate.</li>
              <li>pype.org — livros Abate I–V e nomes da tradução 42.20.4.</li>
              <li>Project Zomboid Wiki — guia de Abate e processamento de animais B42.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> peixe e animal pequeno primeiro + plantel via Cuidados/Armadilhas + Gancho de Abate (Carpintaria 3 + Ferraria 1) + pele sempre que possível + livro antes da sessão = Abate 10 renovável e seguro.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
