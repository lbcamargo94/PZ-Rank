import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',    label: '1. Visão geral' },
  { id: 'criacao',  label: '2. Criação do personagem' },
  { id: 'livros',   label: '3. Livros' },
  { id: 'midia',    label: '4. Mídia VHS' },
  { id: 'especies', label: '5. Espécies' },
  { id: 'recintos', label: '6. Recintos' },
  { id: 'agua',     label: '7. Água e alimentação' },
  { id: 'xp',       label: '8. XP' },
  { id: 'produtos', label: '9. Produtos e reprodução' },
  { id: 'rota',     label: '10. Rota 0→10' },
  { id: 'br',       label: '11. Estratégia Brasileirão' },
  { id: 'calc',     label: '12. Calculadora' },
  { id: 'erros',    label: '13. Erros comuns' },
  { id: 'fontes',   label: '14. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const BOOKS = [
  { label: 'Sem livro', value: 1 },
  { label: 'Cuidados I — 3×', value: 3 },
  { label: 'Cuidados II — 5×', value: 5 },
  { label: 'Cuidados III — 8×', value: 8 },
  { label: 'Cuidados IV — 12×', value: 12 },
  { label: 'Cuidados V — 16×', value: 16 },
];

const BOOSTS = [
  { label: '0 pts — 0,25×', value: 0.25 },
  { label: '1 pt — 1×', value: 1 },
  { label: '2 pts — 1,33×', value: 1.33 },
  { label: '3+ pts — 1,66×', value: 1.66 },
];

export function GuiaAnimais() {
  const [compact, setCompact] = useState(false);
  // Calculadora 1: rotina diária
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [dailyXp, setDailyXp] = useState(50);
  const [animals, setAnimals] = useState(5);
  // Calculadora 2: XP de ovos
  const [eggs, setEggs] = useState(10);
  const [eggBook, setEggBook] = useState(8);
  const [eggBoost, setEggBoost] = useState(1);

  function calcRoutine() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const days = Math.ceil(need / (dailyXp || 1));
    const xpPerAnimal = (dailyXp / (animals || 1));
    return { need, days, xpPerAnimal };
  }

  function calcEggs() {
    const base = 1;
    const each = base * 0.8 * eggBook * eggBoost;
    const total = each * (eggs || 0);
    return { each, total };
  }

  const routine = calcRoutine();
  const eggResult = calcEggs();

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
            <h1 className="guia-title">Manual Definitivo de Cuidados com Animais 0 → 10</h1>
            <p className="guia-subtitle">
              Cuidados com Animais transforma <strong>um recinto seguro em fonte renovável de proteína, ovos e couro</strong>.
              No Brasileirão, galinhas primeiro, ovelhas depois e vacas por último — a complexidade dos recintos
              cresce junto com os recursos disponíveis.
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
            Animal sem água, comida ou recinto adequado não produz XP — cuide da infraestrutura antes de trazer animais.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Animal cuidado = XP passivo diário</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">XP total</div><div className="guia-big guia-good">32.775</div><p className="guia-sub">0→10.</p></div>
              <div className="guia-card"><div className="guia-kpi">Base por água</div><div className="guia-big">2 XP</div><p className="guia-sub">A cada 0,05 L fornecido.</p></div>
              <div className="guia-card"><div className="guia-kpi">Base por ovo</div><div className="guia-big guia-gold">1 XP</div><p className="guia-sub">Coletado da galinha/peru.</p></div>
              <div className="guia-card"><div className="guia-kpi">Ordem</div><div className="guia-big">Galinha</div><p className="guia-sub">Depois ovelha, depois vaca.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Recinto</span><span className="guia-arrow">→</span>
              <span className="guia-node">Animal</span><span className="guia-arrow">→</span>
              <span className="guia-node">Água + Comida</span><span className="guia-arrow">→</span>
              <span className="guia-node">XP diário</span><span className="guia-arrow">→</span>
              <span className="guia-node">Produtos</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Fazendeiro de Gado é o maior bônus</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação / Traço</th><th>Bônus</th><th>Leitura</th></tr></thead>
              <tbody>
                <tr><td><strong>Fazendeiro de Gado (Rancher)</strong></td><td>Cuidados +4, Abate +3</td><td>Maior bônus direto; o +3 em Abate economiza muito tempo.</td></tr>
                <tr><td><strong>Agricultor (Farmer)</strong></td><td>Cuidados +1, Agricultura +4</td><td>Bom pacote se a roça for prioridade.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Volumes I–V</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Cuidados I — Animais de Fazenda para Principiantes</td><td>Farm Animals for Beginners</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Cuidados II — Criando com Dean</td><td>Raising with Dean</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Cuidados III — Saúde Animal em Tempos Difíceis</td><td>Animal Health in Hard Times</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Cuidados IV — A Fazenda Sustentável</td><td>The Sustainable Farm</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Cuidados V — Manual de Veterinária Rural</td><td>Rural Veterinary Manual</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="midia" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Mídia VHS</div>
            <h2>Dois programas com XP de Cuidados</h2>
            <table className="guia-table">
              <thead><tr><th>Programa</th><th>XP base</th><th>XP a 0,8×</th></tr></thead>
              <tbody>
                <tr><td><strong>Um Dia na Fazenda (A Day on the Farm)</strong></td><td>75</td><td>60</td></tr>
                <tr><td><strong>O Zoológico de Contato (The Contact Zoo)</strong></td><td>75</td><td>60</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-warning">
              Com energia cortada no dia 1, a TV é um bônus oportunista — não dependa dela como fonte principal de XP.
            </div>
          </section>

          <section id="especies" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Espécies</div>
            <h2>Galinha → Ovelha → Vaca</h2>
            <table className="guia-table">
              <thead><tr><th>Animal</th><th>Produto</th><th>Requer</th><th>Prioridade</th></tr></thead>
              <tbody>
                <tr><td><strong>Galinha / Peru</strong></td><td>Ovos + carne (Abate)</td><td>Recinto 40 tiles</td><td>★★★★★ — mais fácil e XP diário de ovos.</td></tr>
                <tr><td><strong>Ovelha</strong></td><td>Lã + leite + carne</td><td>Recinto 40 tiles</td><td>★★★★☆ — lã para Costura.</td></tr>
                <tr><td><strong>Porco</strong></td><td>Carne + couro (Abate)</td><td>Recinto 40 tiles</td><td>★★★☆☆ — bom para proteína.</td></tr>
                <tr><td><strong>Vaca</strong></td><td>Leite + carne + couro</td><td>Recinto 80 tiles</td><td>★★★☆☆ — última na fila; recinto grande.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="recintos" className="guia-section">
            <div className="guia-eyebrow-sm">06 · Recintos</div>
            <h2>Tamanho mínimo por espécie</h2>
            <table className="guia-table">
              <thead><tr><th>Animal</th><th>Tiles mínimos (adulto)</th><th>Observação</th></tr></thead>
              <tbody>
                <tr><td>Galinha / Peru / Ovelha / Porco</td><td><strong>40 tiles</strong></td><td>Cercas + tela ou madeira sólida.</td></tr>
                <tr><td>Vaca</td><td><strong>80 tiles</strong></td><td>Recinto maior exige mais material e mais água.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-info">
              <strong>Zona de Animais:</strong> desenhe uma Zona de Animais cobrindo apenas o interior do recinto para vincular os animais ao local. Facilita manejo e evita fuga.
            </div>
          </section>

          <section id="agua" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Água e alimentação</div>
            <h2>Água é a principal fonte de XP diário</h2>
            <p className="guia-muted">
              O XP de Cuidados é gerado ao fornecer água (2 XP base por 0,05 L) e ao coletar ovos (1 XP base por ovo).
              A fórmula a 0,8×: <strong>1,6 XP por 0,05 L de água</strong> e <strong>0,8 XP por ovo</strong>.
              Manter baldes cheios dentro do recinto é a rotina mais eficiente.
            </p>
            <div className="guia-alert guia-alert-warning">
              <strong>Alimentação:</strong> animais precisam de feno/grama além de água. A roça pode fornecer excedente de milho/capim para o comedouro — integre com Agricultura.
            </div>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">08 · XP</div>
            <h2>XP base confirmado na Build 42.20.4</h2>
            <table className="guia-table">
              <thead><tr><th>Ação</th><th>XP base</th><th>XP a 0,8×</th></tr></thead>
              <tbody>
                <tr><td><strong>Fornecer água (por 0,05 L)</strong></td><td>2</td><td><strong>1,6</strong></td></tr>
                <tr><td><strong>Coletar ovo</strong></td><td>1</td><td><strong>0,8</strong></td></tr>
                <tr><td>VHS "Um Dia na Fazenda"</td><td>75</td><td>60</td></tr>
                <tr><td>VHS "O Zoológico de Contato"</td><td>75</td><td>60</td></tr>
              </tbody>
            </table>
          </section>

          <section id="produtos" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Produtos e reprodução</div>
            <h2>Excedente alimenta Abate e Culinária</h2>
            <table className="guia-table">
              <thead><tr><th>Produto</th><th>Animal</th><th>Destino</th></tr></thead>
              <tbody>
                <tr><td>Ovos</td><td>Galinha / Peru</td><td>Culinária + XP de Cuidados ao coletar.</td></tr>
                <tr><td>Lã</td><td>Ovelha</td><td>Costura.</td></tr>
                <tr><td>Leite</td><td>Vaca / Ovelha</td><td>Culinária.</td></tr>
                <tr><td>Filhotes / pintinhos excedentes</td><td>Todos</td><td>Abate quando plantel estabilizar.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Rota definitiva 0→10</div>
            <h2>Galinha primeiro — ovelha depois — vaca no late game</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→2 — Recinto de galinhas</h3><p>Livro I. Monte recinto de 40+ tiles, Zona de Animais, água e comedouro. 4–8 galinhas geram XP diário de coleta de ovos + água.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>2→5 — Rotina diária</h3><p>Livro II. Água + coleta de ovos toda sessão. Excedente de pintinhos vai para Abate. Integre lã de ovelha se o recinto já suportar.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>5→7 — Plantel estabilizado</h3><p>Livro III. Mantenha o plantel com 4–8 galinhas adultas em produção constante de ovos.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">7</div><div><h3>7→9 — Diversificação</h3><p>Livro IV. Ovelhas e porcos se o espaço permitir. Cada espécie adicional diversifica a produção e aumenta o XP diário.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">9</div><div><h3>9→10 — Livro V + rotina final</h3><p>Use a combinação de animais que mostrou melhor XP/dia. Com 16×, a diferença em tempo é grande.</p></div></div>
            </div>
          </section>

          <section id="br" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Estratégia Brasileirão</div>
            <h2>Recinto seguro dentro da base, não campo aberto</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Segunda camada da base</h3><p>Animais precisam de proteção. Recinto na borda externa é risco constante em 16x.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Antecâmara no recinto</h3><p>Dois portões em série evitam que o animal fuja durante o manejo diário.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Água dedicada</h3><p>Reserve recipientes para o recinto — não compete com cimento de Alvenaria.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Galinha tem o melhor custo-benefício</h3><p>Menor recinto, ovos diários, carne disponível (Abate) — prioridade absoluta.</p></div></div>
            </div>
          </section>

          <section id="calc" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Calculadora</div>
            <h2>Rotina diária</h2>
            <p className="guia-sub">Use o XP real medido no servidor — já inclui 0,8× e bônus ativos.</p>
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
                <label>XP real por dia</label>
                <input type="number" value={dailyXp} min={1} onChange={e => setDailyXp(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Animais no plantel</label>
                <input type="number" value={animals} min={1} onChange={e => setAnimals(+e.target.value)} />
              </div>
            </div>
            {routine ? (
              <div className="guia-result">
                <span className="guia-sub">XP necessário</span><br />
                <strong>{routine.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">Dias estimados</span><br />
                <strong>~{routine.days.toLocaleString('pt-BR')} dias de jogo</strong><br />
                <span className="guia-sub">~{routine.xpPerAnimal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} XP/animal/dia.</span>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}

            <h3 style={{ marginTop: '1.5rem' }}>XP por coleta de ovos</h3>
            <div className="guia-calc guia-calc-4">
              <div className="guia-field">
                <label>Ovos coletados</label>
                <input type="number" value={eggs} min={0} onChange={e => setEggs(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Livro ativo</label>
                <select value={eggBook} onChange={e => setEggBook(+e.target.value)}>
                  {BOOKS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Bônus inicial</label>
                <select value={eggBoost} onChange={e => setEggBoost(+e.target.value)}>
                  {BOOSTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Resultado</label>
                <div className="guia-result" style={{ marginTop: 0 }}>
                  <strong>{eggResult.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} XP</strong><br />
                  <span className="guia-sub">{eggs} ovos × 1 base × 0,8 × {eggBook} × {eggBoost}</span>
                </div>
              </div>
            </div>
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Erros comuns</div>
            <h2>O que mata o plantel</h2>
            <details className="guia-details"><summary>Recinto sem antecâmara</summary><p>Fuga de animal durante o manejo diário é comum. Dois portões em série previnem isso.</p></details>
            <details className="guia-details"><summary>Animal sem água</summary><p>Sem água, sem XP. Verifique baldes diariamente — é a principal fonte de pontos.</p></details>
            <details className="guia-details"><summary>Começar pela vaca</summary><p>Recinto de 80 tiles é caro no início. Galinha primeiro, vaca no late game.</p></details>
            <details className="guia-details"><summary>Recinto muito lotado</summary><p>Superpopulação causa estresse, queda de produção e bugs de IA. 4–8 animais por espécie é o ideal.</p></details>
            <details className="guia-details"><summary>Ignorar a Zona de Animais</summary><p>Sem ela, os animais vagam pelo recinto de forma imprevisível. Com ela, permanecem vinculados ao local.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — Cuidados com Animais: ocupações, traços e XP de ações.</li>
              <li>pype.org — livros Cuidados I–V e nomes da tradução 42.20.4.</li>
              <li>Bamboo Gaming — XP de água e ovos confirmados 42.20.4.</li>
              <li>Project Zomboid Wiki — Zona de Animais, recintos e manejo B42.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> recinto seguro com antecâmara + galinha primeiro + água diária + Zona de Animais ativa + livro antes da sessão = Cuidados com Animais 10 sem depender de incursão.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
