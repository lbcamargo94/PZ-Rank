import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'criacao',     label: '2. Criação do personagem' },
  { id: 'livros',      label: '3. Livros' },
  { id: 'calor',       label: '4. Fonte de calor' },
  { id: 'utensilios',  label: '5. Utensílios' },
  { id: 'xp',          label: '6. XP por receita' },
  { id: 'renovavel',   label: '7. Ingredientes renováveis' },
  { id: 'conservacao', label: '8. Conservação' },
  { id: 'podre',       label: '9. Ingredientes podres' },
  { id: 'rota',        label: '10. Rota 0→10' },
  { id: 'nutricao',    label: '11. Nutrição' },
  { id: 'brasileirao', label: '12. Estratégia Brasileirão' },
  { id: 'calculadora', label: '13. Calculadora' },
  { id: 'erros',       label: '14. Erros comuns' },
  { id: 'fontes',      label: '15. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const RECIPES = [
  { label: 'Receita simples — 3 XP base', value: 3 },
  { label: 'Receita média — 10 XP base', value: 10 },
  { label: 'Receita avançada — 20 XP base', value: 20 },
];

const BOOKS = [
  { label: 'Sem livro', value: 1 },
  { label: 'Culinária I — 3×', value: 3 },
  { label: 'Culinária II — 5×', value: 5 },
  { label: 'Culinária III — 8×', value: 8 },
  { label: 'Culinária IV — 12×', value: 12 },
  { label: 'Culinária V — 16×', value: 16 },
];

const BOOSTS = [
  { label: '0 pts — 0,25×', value: 0.25 },
  { label: '1 pt — 1×', value: 1 },
  { label: '2 pts — 1,33×', value: 1.33 },
  { label: '3+ pts — 1,66×', value: 1.66 },
];

export function GuiaCulinaria() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [recipeXp, setRecipeXp] = useState(10);
  const [bookMult, setBookMult] = useState(8);
  const [boostMult, setBoostMult] = useState(1);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const each = recipeXp * 0.8 * bookMult * boostMult;
    const actions = Math.ceil(need / each);
    return { need, each, actions };
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
            <h1 className="guia-title">Manual Definitivo de Culinária 0 → 10</h1>
            <p className="guia-subtitle">
              Culinária transforma <strong>ingredientes renováveis em XP e bônus de nutrição</strong>.
              No Brasileirão, a cadeia agrícola é a principal fonte de matéria-prima — quem
              já tem roça e animais chega ao nível 10 sem depender de loot urbano.
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
            Culinária depende de calor, utensílio e ingrediente ao mesmo tempo — organize esses três antes de qualquer sessão de grind.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Culinária combina sobrevivência e progressão</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">XP total</div><div className="guia-big guia-good">32.775</div><p className="guia-sub">0→10.</p></div>
              <div className="guia-card"><div className="guia-kpi">Base simples</div><div className="guia-big">3 XP</div><p className="guia-sub">Ex.: fruta misturada.</p></div>
              <div className="guia-card"><div className="guia-kpi">Base avançada</div><div className="guia-big guia-gold">20 XP</div><p className="guia-sub">Receitas complexas.</p></div>
              <div className="guia-card"><div className="guia-kpi">Melhor fonte</div><div className="guia-big">Roça</div><p className="guia-sub">Renovável e segura.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Agricultura</span><span className="guia-arrow">→</span>
              <span className="guia-node">Ingredientes</span><span className="guia-arrow">→</span>
              <span className="guia-node">Calor</span><span className="guia-arrow">→</span>
              <span className="guia-node">Receita</span><span className="guia-arrow">→</span>
              <span className="guia-node">XP + prato</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Chef é o maior bônus direto</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação / Traço</th><th>Bônus</th><th>Leitura</th></tr></thead>
              <tbody>
                <tr><td><strong>Chef</strong></td><td>Culinária +4</td><td>Maior bônus direto — entra no nível 4 imediatamente.</td></tr>
                <tr><td><strong>Virador de Hambúrguer (Burger Flipper)</strong></td><td>Culinária +2</td><td>Mais barato; bom início.</td></tr>
                <tr><td>Herbalista</td><td>+1 indireto</td><td>Acesso a ervas medicinais e alguns ingredientes.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-warning">
              <strong>Build global primeiro.</strong> +4 de Chef é excelente, mas não sacrifique combate/mobilidade só por Culinária — a roça e os livros resolvem a progressão.
            </div>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Volumes I–V</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Culinária I — Receitas para Iniciantes</td><td>Cooking for Beginners</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Culinária II — Culinária de Emergência com Dean</td><td>Dean's Emergency Cooking</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Culinária III — A Arte da Cozinha Sobrevivente</td><td>The Art of Survivor Cooking</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Culinária IV — Sabores do Apocalipse</td><td>Flavors of the Apocalypse</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Culinária V — Culinária Fina no Fim dos Tempos</td><td>Fine Cuisine at the End of Times</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="calor" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Fonte de calor</div>
            <h2>Sem calor não há receita cozida</h2>
            <table className="guia-table">
              <thead><tr><th>Fonte</th><th>Disponibilidade</th><th>Uso no campeonato</th></tr></thead>
              <tbody>
                <tr><td><strong>Fogueira de campo</strong></td><td>Lascamento + Entalhamento</td><td>Principal no início — lenha renovável.</td></tr>
                <tr><td><strong>Fogueira de pedra</strong></td><td>Alvenaria 1</td><td>Fixa e segura dentro da base.</td></tr>
                <tr><td>Fogão a gás/elétrico</td><td>Loot</td><td>Use enquanto houver; dependa da lenha para o longo prazo.</td></tr>
                <tr><td>Churraqueira</td><td>Loot / Construção</td><td>Alternativa com carvão ou lenha.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="utensilios" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Utensílios</div>
            <h2>Panela, faca e superfície de trabalho</h2>
            <table className="guia-table">
              <thead><tr><th>Item</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><strong>Panela / Frigideira</strong></td><td>Receitas cozidas e grelhadas.</td></tr>
                <tr><td><strong>Faca de cozinha</strong></td><td>Corte de ingredientes; mantenha afiada (Manutenção).</td></tr>
                <tr><td><strong>Tigela / Prato</strong></td><td>Necessário em receitas específicas.</td></tr>
                <tr><td>Cadinho (Cerâmica)</td><td>Alternativa artesanal para recipiente de calor.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">06 · XP por receita</div>
            <h2>Mais ingredientes = mais XP</h2>
            <table className="guia-table">
              <thead><tr><th>Complexidade</th><th>XP base</th><th>XP a 0,8×</th><th>Exemplo</th></tr></thead>
              <tbody>
                <tr><td>Simples</td><td>3</td><td><strong>2,4</strong></td><td>Fruta + água.</td></tr>
                <tr><td>Média</td><td>10</td><td><strong>8</strong></td><td>Ensopado básico com 4+ ingredientes.</td></tr>
                <tr><td>Avançada</td><td>20</td><td><strong>16</strong></td><td>Receitas completas com proteína + vegetal + tempero.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-info">
              <strong>Regra prática:</strong> maximize ingredientes por receita. Uma receita de 20 XP base com Livro V e bônus pode render mais de 260 XP efetivos por preparo.
            </div>
          </section>

          <section id="renovavel" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Ingredientes renováveis</div>
            <h2>Roça alimenta a Culinária indefinidamente</h2>
            <table className="guia-table">
              <thead><tr><th>Fonte</th><th>Ingredientes</th><th>Observação</th></tr></thead>
              <tbody>
                <tr><td><strong>Roça (Agricultura)</strong></td><td>Cenoura, batata, tomate, milho, alface, repolho, pimentão</td><td>Principal cadeia de ingredientes no campeonato.</td></tr>
                <tr><td><strong>Cuidados com Animais</strong></td><td>Ovos, leite</td><td>Diversificam receitas e aumentam XP.</td></tr>
                <tr><td><strong>Abate</strong></td><td>Carne de galinha, porco, vaca, veado</td><td>Proteína para receitas avançadas.</td></tr>
                <tr><td><strong>Coleta</strong></td><td>Ervas, frutos, cogumelos</td><td>Temperos e complementos — confirme identificação antes de usar.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="conservacao" className="guia-section">
            <div className="guia-eyebrow-sm">08 · Conservação</div>
            <h2>Alimento estragado = XP perdido</h2>
            <table className="guia-table">
              <thead><tr><th>Método</th><th>Requisito</th><th>Duração relativa</th></tr></thead>
              <tbody>
                <tr><td><strong>Cozinhar antes de deteriorar</strong></td><td>Calor + utensílio</td><td>Duplica a vida útil de muitos itens.</td></tr>
                <tr><td><strong>Frigideira com sal</strong></td><td>Sal (loot)</td><td>Carne frita dura mais.</td></tr>
                <tr><td><strong>Refrigerador (gerador)</strong></td><td>Gerador + combustível</td><td>Melhor opção quando energia disponível.</td></tr>
                <tr><td>Secar / Defumar</td><td>Receita específica</td><td>Conserva proteína por semanas de jogo.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="podre" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Ingredientes podres</div>
            <h2>Marco do nível 7: ingredientes deteriorados têm uso</h2>
            <p className="guia-muted">
              A partir do nível 7, alguns ingredientes levemente deteriorados podem entrar em receitas com penalidade reduzida de qualidade.
              O valor nutricional cai, mas o XP da receita é preservado.
              Não misture podre com itens frescos sem planejamento — a nutrição final piora.
            </p>
            <div className="guia-alert guia-alert-warning">
              <strong>Use com critério:</strong> ingrediente podre ainda dá XP de Culinária, mas serve mal como alimento.
              Priorize sempre itens frescos para a comida da base e use os deteriorados exclusivamente para grind de XP.
            </div>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Rota definitiva 0→10</div>
            <h2>Da fogueira às receitas avançadas</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→1 — Receitas simples</h3><p>Livro I. Misture qualquer ingrediente disponível com calor e utensílio. Caldos, sopas simples e frutas cozidas já dão XP.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>1→3 — Receitas médias</h3><p>Integre com a roça. Ensopados com 4+ ingredientes rendem 10 XP base. Use excedente agrícola sem desperdiçar colheita principal.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>3→5 — Proteína entra</h3><p>Livro II. Carne do Abate + vegetais = receitas de 10–20 XP base. Ovos e leite abrem combinações melhores.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>5→7 — Receitas avançadas</h3><p>Livro III. Priorize receitas de 20 XP base com ingredientes que você já produz em volume.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">7</div><div><h3>7→9 — Usar deteriorados</h3><p>Livro IV. Ingredientes com início de deterioração entram nas receitas de grind. Use os frescos para a alimentação real.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">9</div><div><h3>9→10 — Livro V + lote final</h3><p>Acumule os melhores ingredientes. Com 16×, cada receita avançada limpa uma faixa significativa de XP.</p></div></div>
            </div>
          </section>

          <section id="nutricao" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Nutrição</div>
            <h2>Culinária melhora os bônus dos alimentos</h2>
            <p className="guia-muted">
              Receitas cozidas têm maior valor nutricional que ingredientes crus. Em 10x–16x, manter calorias,
              carboidratos, proteínas e gorduras equilibrados reduz o impacto de penalidades físicas. A Culinária
              não altera os valores base dos ingredientes, mas receitas complexas somam componentes e tendem
              a criar refeições mais completas.
            </p>
            <div className="guia-alert guia-alert-info">
              <strong>Prioridade alimentar:</strong> proteína (carne/ovo) + vegetal + carboidrato (batata/milho) = refeição completa.
              Não cozinhe apenas para XP — planeje pratos que a base vai consumir.
            </div>
          </section>

          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Estratégia Brasileirão</div>
            <h2>Culinária é o elo entre roça, animais e base</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Fogueira de pedra antes da cozinha urbana</h3><p>Não dependa de fogão de loot. Alvenaria 1 destrava a fogueira de pedra permanente.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Livro antes do lote</h3><p>Com XP 0,8×, cozinhar sem multiplicador custa mais ingredientes para o mesmo nível.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Receita mais complexa possível</h3><p>Sempre prefira receitas com mais ingredientes — o XP base escala com a complexidade.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Organize a conservação</h3><p>Alimento estragado dentro da mochila desperdiça XP e nutrição. Cozinhe antes de deteriorar.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Regra definitiva:</strong> Culinária sem roça ativa = XP que termina. A cadeia renovável é o que distingue quem termina o nível 10 de quem fica no 5.
            </div>
          </section>

          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Calculadora</div>
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
                <label>XP base da receita</label>
                <select value={recipeXp} onChange={e => setRecipeXp(+e.target.value)}>
                  {RECIPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
                <span className="guia-sub">XP efetivo por preparo</span><br />
                <strong>{result.each.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} XP</strong><br />
                <span className="guia-sub">~{result.actions.toLocaleString('pt-BR')} preparos · {recipeXp} base × 0,8 × {bookMult} × {boostMult}</span>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Erros comuns</div>
            <h2>O que atrasa mais</h2>
            <details className="guia-details"><summary>Cozinhar sem calor permanente</summary><p>Depender apenas de fogão de loot torna a progressão frágil. Monte fogueira de pedra com Alvenaria 1.</p></details>
            <details className="guia-details"><summary>Usar receitas simples quando há ingredientes para complexas</summary><p>3 XP base × livro é muito menos eficiente do que 20 XP base × livro.</p></details>
            <details className="guia-details"><summary>Cozinhar sem livro</summary><p>Com XP 0,8× global, perder o multiplicador do livro significa gastar mais ingredientes para o mesmo resultado.</p></details>
            <details className="guia-details"><summary>Não integrar com Agricultura</summary><p>A roça é a cadeia renovável que sustenta o grind até o nível 10.</p></details>
            <details className="guia-details"><summary>Desperdiçar conservação</summary><p>Alimento estragado dentro da mochila não dá XP e perde nutrição. Cozinhe antes de deteriorar.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">15 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — Culinária: ocupações, traços e valores de XP.</li>
              <li>pype.org — livros Culinária I–V e nomes da tradução 42.20.4.</li>
              <li>GamesRef — progressão 32.775 XP e desbloqueios por nível.</li>
              <li>Project Zomboid Wiki — guia de Culinária, receitas e conservação B42.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> fogueira de pedra permanente + roça ativa + livro antes do lote + receitas complexas = Culinária 10 sem depender de loot urbano.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
