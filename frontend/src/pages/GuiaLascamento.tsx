import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'criacao',     label: '2. Criação do personagem' },
  { id: 'livros',      label: '3. Livros' },
  { id: 'materia',     label: '4. Matéria-prima' },
  { id: 'ferramentas', label: '5. Ferramentas' },
  { id: 'xp',          label: '6. Fontes de XP' },
  { id: 'eficiencia',  label: '7. Eficiência e grind' },
  { id: 'rota',        label: '8. Rota 0→10' },
  { id: 'integracao',  label: '9. Integrações' },
  { id: 'br',          label: '10. Estratégia Brasileirão' },
  { id: 'calculadora', label: '11. Calculadora' },
  { id: 'erros',       label: '12. Erros comuns' },
  { id: 'fontes',      label: '13. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const RECIPES = [
  { label: 'Floco de Pedra — 10 XP', value: 10 },
  { label: 'Sovela de Pedra — 10 XP', value: 10 },
  { label: 'Lâmina de Pedra — 20 XP', value: 20 },
  { label: 'Cinzel de Pedra — 20 XP', value: 20 },
  { label: 'Foice de Pedra — 30 XP', value: 30 },
  { label: 'Serra de Pedra — 40 XP', value: 40 },
  { label: 'Machado Grande de Pedra — 50 XP', value: 50 },
  { label: 'Broca de Pedra — 60 XP', value: 60 },
  { label: 'Maça de Pedra — 60 XP', value: 60 },
  { label: 'Lâmina de Pedra Longa — 70 XP', value: 70 },
];

export function GuiaLascamento() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [recipeIdx, setRecipeIdx] = useState(9);
  const [bookMult, setBookMult] = useState(16);
  const [boostMult, setBoostMult] = useState(1);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const rec = RECIPES[recipeIdx];
    const each = rec.value * 0.8 * bookMult * boostMult;
    const n = Math.ceil(need / each);
    return { need, each, n };
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
            <h1 className="guia-title">Manual Definitivo de Lascamento 0 → 10</h1>
            <p className="guia-subtitle">
              Lascamento é a <strong>skill de criar ferramentas de pedra lascada</strong>.
              No campeonato, ela garante acesso a instrumentos de corte, perfuração e combate primitivos
              independentemente de loot — e o XP por peça é alto o suficiente para atingir 10 com poucas centenas de ações.
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
            Pedras são infinitas — o único custo real é o tempo de clicar.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Ferramentas de pedra do zero ao 10</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">Matéria-prima</div><div className="guia-big guia-good">Infinita</div><p className="guia-sub">Pedras e lascas em qualquer área externa.</p></div>
              <div className="guia-card"><div className="guia-kpi">XP máximo</div><div className="guia-big guia-gold">70 base</div><p className="guia-sub">Lâmina de Pedra Longa.</p></div>
              <div className="guia-card"><div className="guia-kpi">VHS</div><div className="guia-big guia-red">Nenhum</div><p className="guia-sub">Sem boost de mídia.</p></div>
              <div className="guia-card"><div className="guia-kpi">Bônus</div><div className="guia-big">Guarda-Parque +1</div><p className="guia-sub">Trilheiro e Bushcrafter também.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Pedra grande</span><span className="guia-arrow">→</span>
              <span className="guia-node">Lasca</span><span className="guia-arrow">→</span>
              <span className="guia-node">Lascar pedra</span><span className="guia-arrow">→</span>
              <span className="guia-node">Ferramenta (XP)</span><span className="guia-arrow">→</span>
              <span className="guia-node">Usar/descartar</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Dois bônus diretos — Guarda-Parque é o melhor pacote</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação</th><th>Bônus</th><th>Leitura competitiva</th></tr></thead>
              <tbody>
                <tr><td><strong>Guarda-Parque</strong></td><td>Lascamento <strong>+1</strong>, Coleta +1, Primeiros Socorros +1</td><td>Excelente — inclui Coleta, que comparte a mesma saída rural.</td></tr>
                <tr><td><strong>Bushcrafter</strong></td><td>Lascamento <strong>+1</strong>, Coleta +1, Culinária +1, Armadilhas +1, Rastreamento +1</td><td>Pacote primitivo completo — muitas skills no mesmo build.</td></tr>
                <tr><td>Sem bônus</td><td>0</td><td>Plenamente viável; livro V compensa durante o grind tardio.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Cinco volumes — sem mídia de XP</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Lascamento I — A Vida Primitiva</td><td>Primitive Living</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Lascamento II — Flintknapping: Um Guia do Iniciante</td><td>Flintknapping: A Beginner's Guide</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Lascamento III — Arte das Pederneiras</td><td>The Art of the Flintknappers</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Lascamento IV — Lascamento Avançado</td><td>Advanced Flintknapping</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Lascamento V — O Guia Definitivo do Lascamento</td><td>The Definitive Guide to Flintknapping</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="materia" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Matéria-prima</div>
            <h2>Pedra e lascas — recurso renovável</h2>
            <table className="guia-table">
              <thead><tr><th>Item</th><th>Obtenção</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><strong>Pedra Grande</strong></td><td>Área externa (chão, floresta, beira de estrada)</td><td>Lasca para gerar Pedras Lascadas ou Lascas.</td></tr>
                <tr><td><strong>Pedra Lascada</strong></td><td>Lasca Pedra Grande</td><td>Matéria-prima principal de todas as receitas.</td></tr>
                <tr><td><strong>Lasca de Pedra</strong></td><td>Subproduto do lascamento</td><td>Usada em Sovela, Floco e como ferramenta auxiliar.</td></tr>
                <tr><td><strong>Bastão de Madeira</strong></td><td>Galho longo ou madeira processada</td><td>Cabo de algumas ferramentas compostas.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-info">
              <strong>Coleta ilimitada:</strong> Pedras Grandes respawnam lentamente no mundo. Colete em quantidade durante deslocamentos e armazene perto da bancada de trabalho.
            </div>
          </section>

          <section id="ferramentas" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Ferramentas</div>
            <h2>O que você pode criar — e para que serve</h2>
            <table className="guia-table">
              <thead><tr><th>Ferramenta</th><th>XP base</th><th>Requisito</th><th>Uso principal</th></tr></thead>
              <tbody>
                <tr><td>Floco de Pedra</td><td>10</td><td>0</td><td>Substituto de faca para Coleta.</td></tr>
                <tr><td>Sovela de Pedra</td><td>10</td><td>0</td><td>Perfuração (Costura primitiva).</td></tr>
                <tr><td>Lâmina de Pedra</td><td>20</td><td>1</td><td>Corte básico, ferramenta de sobrevivência.</td></tr>
                <tr><td>Cinzel de Pedra</td><td>20</td><td>1</td><td>Alternativa de cinzel para Carpintaria.</td></tr>
                <tr><td>Foice de Pedra</td><td>30</td><td>2</td><td>Coleta de vegetais.</td></tr>
                <tr><td>Serra de Pedra</td><td>40</td><td>3</td><td>Alternativa de serrar.</td></tr>
                <tr><td>Machado Grande de Pedra</td><td>50</td><td>4</td><td>Cortar árvores.</td></tr>
                <tr><td>Broca de Pedra</td><td>60</td><td>5</td><td>Perfuração avançada.</td></tr>
                <tr><td>Maça de Pedra</td><td>60</td><td>5</td><td>Arma corpo-a-corpo.</td></tr>
                <tr><td><strong>Lâmina de Pedra Longa</strong></td><td><strong>70</strong></td><td>6</td><td>Maior XP por ação — ideal para grind.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">06 · Fontes de XP</div>
            <h2>XP real confirmado na 42.20.4</h2>
            <div className="guia-alert guia-alert-info">
              Todos os valores abaixo são o XP base (antes de 0,8× e livro).
              O jogo aplica 0,8× automaticamente — a calculadora já leva isso em conta.
            </div>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">Floco/Sovela</div><div className="guia-big">10 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Lâmina/Cinzel</div><div className="guia-big">20 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Foice</div><div className="guia-big">30 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Serra</div><div className="guia-big">40 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Machado Grande</div><div className="guia-big">50 XP</div></div>
              <div className="guia-card"><div className="guia-kpi">Broca/Maça</div><div className="guia-big">60 XP</div></div>
              <div className="guia-card"><div className="guia-kpi guia-gold">Lâmina Longa</div><div className="guia-big guia-gold">70 XP</div></div>
            </div>
          </section>

          <section id="eficiencia" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Eficiência e grind</div>
            <h2>Sempre crie a receita de maior XP disponível</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Níveis 0–1 — Floco e Sovela</h3><p>Apenas receitas disponíveis. Livro I multiplica bem.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Níveis 1–2 — Lâmina e Cinzel (20 XP)</h3><p>Dobra o XP por ação. Troque imediatamente ao desbloquear.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Níveis 2–3 — Foice (30 XP)</h3><p>Aumento de 50% sobre Lâmina.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Níveis 3–4 — Serra (40 XP)</h3><p>Continue subindo conforme desbloqueia.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Níveis 4–6 — Machado Grande (50 XP)</h3><p>Alta XP, relativamente acessível.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>Níveis 5+ — Broca/Maça ou Lâmina Longa</h3><p>Com livro V (16×), Lâmina Longa (70 × 0,8 × 16 = 896 XP/peça) é a receita mais eficiente do jogo para essa skill.</p></div></div>
            </div>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">08 · Rota definitiva 0→10</div>
            <h2>Progressão linear, sem desperdício</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→1 — Setup</h3><p>Colete 50+ Pedras Grandes. Livro I. Crie Flocos até nível 1.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>1→3 — Lâminas</h3><p>Livro II. Crie Lâminas (20 XP). Reserve para Coleta e Entalhamento.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>3→5 — Serra</h3><p>Livro III. Use Serra (40 XP) como principal até liberar o Machado Grande.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>5→7 — Broca/Maça</h3><p>Livro IV. 60 XP base por peça; com 12×: 576 XP/peça real.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">7</div><div><h3>7→10 — Lâmina Longa</h3><p>Livro V (16×). 70 × 0,8 × 16 = <strong>896 XP por peça</strong>. Finalize aqui.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Total 0→10:</strong> com livros e Lâmina Longa, 32.775 XP real / 896 ≈ <strong>37 peças</strong> — o grind mais curto de toda a lista de skills do campeonato.
            </div>
          </section>

          <section id="integracao" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Integrações</div>
            <h2>Lascamento como fornecedor de ferramentas</h2>
            <div className="guia-grid4">
              <div className="guia-card"><strong>Coleta</strong><p className="guia-muted">Floco de Pedra substitui faca de luxo.</p></div>
              <div className="guia-card"><strong>Entalhamento</strong><p className="guia-muted">Lâmina de Pedra como ferramenta de entalhe.</p></div>
              <div className="guia-card"><strong>Alvenaria</strong><p className="guia-muted">Cinzel de Pedra pode substituir cinzel metálico.</p></div>
              <div className="guia-card"><strong>Combate</strong><p className="guia-muted">Maça e Machado como armas corpo-a-corpo de emergência.</p></div>
            </div>
          </section>

          <section id="br" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Estratégia Brasileirão</div>
            <h2>A skill mais barata de maxar</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Colete pedras durante deslocamentos</h3><p>Não faça uma sessão específica — pegue pedras no caminho de tudo o mais.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Leia livros antes de grind intenso</h3><p>Livro V + Lâmina Longa = ~37 ações para 0→10.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Integre Coleta na mesma sessão</h3><p>Sair para coletar pedras = mesma área para Coleta de ervas/plantas.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Reserve ferramentas para uso real</h3><p>Não desperdice Lâminas criadas — elas servem em Coleta e Entalhamento.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Não deixe Lascamento para o fim.</strong> É barato e desbloqueia ferramentas que outras skills precisam. Máxe cedo.
            </div>
          </section>

          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Calculadora</div>
            <h2>Ações necessárias por receita</h2>
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
                <label>Multiplicador livro</label>
                <select value={bookMult} onChange={e => setBookMult(+e.target.value)}>
                  {[1,3,5,8,12,16].map(v => <option key={v} value={v}>{v}×</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label>Boost adicional</label>
                <input type="number" value={boostMult} min={1} step={0.1} onChange={e => setBoostMult(+e.target.value)} />
              </div>
            </div>
            {result ? (
              <div className="guia-result">
                <span className="guia-sub">XP necessário</span><br />
                <strong>{result.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">XP real por peça (0,8× + livro + boost)</span><br />
                <strong>{result.each.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} XP</strong><br /><br />
                <span className="guia-sub">Peças estimadas</span><br />
                <strong className="guia-good">~{result.n.toLocaleString('pt-BR')} peças</strong>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Erros comuns</div>
            <h2>O que mais atrasa o progresso</h2>
            <details className="guia-details"><summary>Ficar em Flocos quando já desbloqueou Lâminas</summary><p>Assim que subir de nível, troque para a receita de maior XP disponível.</p></details>
            <details className="guia-details"><summary>Não ler os livros antes do grind</summary><p>Livro V converte uma sessão de 500+ ações em 37. Leia antes de começar o grind intenso.</p></details>
            <details className="guia-details"><summary>Não coletar pedras durante deslocamentos</summary><p>Pedras existem em qualquer área externa. Colete no caminho sem desvio extra.</p></details>
            <details className="guia-details"><summary>Descartar Lâminas e Flocos criados</summary><p>Use-os em Coleta e Entalhamento. Zero desperdício.</p></details>
            <details className="guia-details"><summary>Deixar Lascamento para o final</summary><p>É a skill mais barata de maxar. Faça cedo — desbloqueia ferramentas que outras skills precisam.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — definição mecânica de Flintknapping, XP por receita.</li>
              <li>pype.org — Lascamento I–V, nomes traduzidos 42.20.4.</li>
              <li>Bamboo Gaming — 5 livros, 0 mídia, snapshot 42.20.4.</li>
              <li>Project Zomboid Wiki — receitas de pedra lascada e XP confirmado na 42.20.2.</li>
              <li>Guarda-Parque +1, Bushcrafter +1 — confirmados nos arquivos base da 42.20.4.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> colete pedras durante deslocamentos + leia livros antecipadamente + crie sempre a receita de maior XP disponível + Lâmina Longa com livro V finaliza em ~37 ações.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
