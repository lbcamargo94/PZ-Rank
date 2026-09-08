import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'criacao',     label: '2. Criação do personagem' },
  { id: 'livros',      label: '3. Livros' },
  { id: 'combate',     label: '4. XP em combate' },
  { id: 'armas',       label: '5. Armas de treino' },
  { id: 'receitas',    label: '6. XP por receitas' },
  { id: 'reparo',      label: '7. Reparos e afiação' },
  { id: 'durabilidade',label: '8. Durabilidade' },
  { id: 'rota',        label: '9. Rota 0→10' },
  { id: 'loot',        label: '10. Loot 0,04' },
  { id: 'brasileirao', label: '11. Estratégia 10x–16x' },
  { id: 'calculadora', label: '12. Calculadora' },
  { id: 'erros',       label: '13. Erros comuns' },
  { id: 'fontes',      label: '14. Fontes e versão' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const BOOKS = [
  { label: 'Sem livro', value: 1 },
  { label: 'Vol. I — 3×', value: 3 },
  { label: 'Vol. II — 5×', value: 5 },
  { label: 'Vol. III — 8×', value: 8 },
  { label: 'Vol. IV — 12×', value: 12 },
  { label: 'Vol. V — 16×', value: 16 },
];

const BOOSTS = [
  { label: '0 pontos — 0,25×', value: 0.25 },
  { label: '1 ponto — 1×', value: 1 },
  { label: '2 pontos — 1,33×', value: 1.33 },
  { label: '3+ pontos — 1,66×', value: 1.66 },
];

const RECIPES = [5, 10, 15, 20, 30, 40, 50];

export function GuiaManutencao() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [bookIdx, setBookIdx] = useState(3);
  const [boostIdx, setBoostIdx] = useState(2);
  const [recipeXp, setRecipeXp] = useState(10);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const book = BOOKS[bookIdx].value;
    const boost = BOOSTS[boostIdx].value;
    const meleeCheck = 2 * 0.8 * book * boost;
    const avgPerHit = 0.5 * meleeCheck;
    const hits = Math.ceil(need / avgPerHit);
    const recipeEach = recipeXp * 0.8 * book * boost;
    const crafts = Math.ceil(need / recipeEach);
    return { need, hits, crafts, recipeEach };
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
          <p className="guia-side-note">Build 42.20.4 · 10x–16x zumbis · loot 0,04 · XP global 0,8× · água/energia dia 1.</p>
        </aside>

        <main className="guia-main">
          <div className="guia-hero">
            <div className="guia-eyebrow">Construção 42.20.4 · Português do Brasil</div>
            <h1 className="guia-title">Manual Definitivo de Manutenção 0 → 10</h1>
            <p className="guia-subtitle">
              Manutenção é uma das habilidades que mais combinam com o Brasileirão: em vez de fazer grind
              artificial, você pode evoluí-la enquanto combate, repara, afia e monta armas que já seriam
              usadas numa temporada com <strong>10x–16x zumbis</strong>.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">10x–16x zumbis</span>
              <span className="guia-pill">Loot 0,04</span>
              <span className="guia-pill">XP global 0,8×</span>
              <span className="guia-pill">32.775 XP total</span>
              <span className="guia-pill">Livros I–V</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Configuração oficial do campeonato:</strong> 10x–16x zumbis, loot 0,04, água e
            energia cortadas no primeiro dia e XP global 0,8×. O guia prioriza{' '}
            <strong>armas comuns, reparos úteis e progressão durante combate real</strong>, não consumo
            de itens raros só por XP.
          </div>

          {/* 1 — visão geral */}
          <section id="visao" className="guia-section">
            <div className="guia-eyebrow">01 · Visão geral</div>
            <h2 className="guia-section-title">Manutenção prolonga a vida de cada arma encontrada</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">Função principal</div>
                <div className="guia-metric guia-green">Durabilidade</div>
                <p className="guia-sub">Reduz a frequência com que armas corpo a corpo perdem condição.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Fonte principal de XP</div>
                <div className="guia-metric">Combate</div>
                <p className="guia-sub">Golpes corpo a corpo válidos podem gerar XP.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Fonte secundária</div>
                <div className="guia-metric guia-gold">Receitas</div>
                <p className="guia-sub">Reparar, afiar, montar e fabricar itens específicos.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Gargalo em 0,04</div>
                <div className="guia-metric guia-red">Armas boas</div>
                <p className="guia-sub">Preserve raridades; treine com itens substituíveis.</p>
              </div>
            </div>
            <div className="guia-alert">
              <strong>Filosofia:</strong> em loot 0,04, cada ponto de Manutenção vale mais porque reduz
              o consumo do recurso mais caro do combate: <strong>armas em boa condição</strong>.
            </div>
          </section>

          {/* 2 — criação */}
          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow">02 · Criação do personagem</div>
            <h2 className="guia-section-title">Há várias formas de começar com bônus sem sacrificar a build inteira</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Profissão / Traço</th><th>Bônus</th><th>Leitura para o Brasileirão</th></tr></thead>
                <tbody>
                  <tr><td><strong>Especialista em Faça-Você-Mesmo</strong> (DIY Expert)</td><td><strong>Manutenção +2</strong></td><td>Melhor início puro para a skill; também ajuda Carpintaria, Contundente Curta e Alvenaria.</td></tr>
                  <tr><td>Virador de Hambúrguer</td><td>+1</td><td>Barato e combina com Culinária/Lâmina Curta.</td></tr>
                  <tr><td>Carpinteiro</td><td>+1</td><td>Já é forte em Carpintaria e oferece boa sinergia geral.</td></tr>
                  <tr><td>Chef</td><td>+1</td><td>Combina com Culinária e Abate.</td></tr>
                  <tr><td>Trabalhador da Construção</td><td>+1</td><td>Boa combinação com Contundentes.</td></tr>
                  <tr><td>Lenhador</td><td>+1</td><td>Excelente para Machado, Força e uso intensivo de ferramentas.</td></tr>
                  <tr><td>Ferreiro</td><td>+1</td><td>Sinergia direta com produção de armas.</td></tr>
                  <tr><td><strong>Funileiro</strong> (Tinkerer)</td><td>+1</td><td>Traço dedicado relativamente barato.</td></tr>
                  <tr><td>Habilidoso</td><td>+1</td><td>Também ajuda Carpintaria, Entalhamento e Alvenaria.</td></tr>
                  <tr><td>Conhecimento de Sobrevivência</td><td>+1</td><td>Combina com Coleta, Lascamento e Entalhamento.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Não monte a build só para Manutenção.</strong> Como a skill sobe naturalmente em
              um campeonato com muito combate, um bônus inicial de +1 pode ser suficiente se vier
              acompanhado de vantagens úteis em outras habilidades.
            </div>
          </section>

          {/* 3 — livros */}
          <section id="livros" className="guia-section">
            <div className="guia-eyebrow">03 · Livros</div>
            <h2 className="guia-section-title">Leia antes de um dia pesado de combate</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Faixa</th><th>Nome em português</th><th>Nome original</th><th>Páginas</th><th>Mult.</th></tr></thead>
                <tbody>
                  <tr><td>1–2</td><td>Manutenção I — Reparos Básicos</td><td>Basic Repairs</td><td>220</td><td><strong>3×</strong></td></tr>
                  <tr><td>3–4</td><td>Manutenção II — Ferramentas Melhores, de Forma Fácil</td><td>Better Tools, Made Easy</td><td>260</td><td><strong>5×</strong></td></tr>
                  <tr><td>5–6</td><td>Manutenção III — Guia Doméstico de Reparo de Ferramentas</td><td>Home Guide to Tool Repairs</td><td>300</td><td><strong>8×</strong></td></tr>
                  <tr><td>7–8</td><td>Manutenção IV — Mantendo Ferramentas de Alta Qualidade</td><td>Maintaining High Grade Tools</td><td>340</td><td><strong>12×</strong></td></tr>
                  <tr><td>9–10</td><td>Manutenção V — Entendendo a Biomecânica do Uso de Ferramentas</td><td>Understanding Biomechanics of Tool Use</td><td>380</td><td><strong>16×</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>XP do campeonato:</strong> valores de XP base devem ser multiplicados por{' '}
              <strong>0,8</strong> antes do livro e do bônus inicial. Em uma habilidade que ganha muitos
              pequenos ticks durante combate, esquecer o livro custa centenas de golpes.
            </div>
          </section>

          {/* 4 — XP em combate */}
          <section id="combate" className="guia-section">
            <div className="guia-eyebrow">04 · XP em combate</div>
            <h2 className="guia-section-title">Golpes reais são a fonte mais sustentável</h2>
            <p className="guia-muted">
              Na linha atual da Build 42, ataques corpo a corpo válidos fazem uma checagem de XP de
              Manutenção com frequência aproximada de metade dos golpes. Um sucesso costuma conceder
              cerca de <strong>2 XP base</strong>, mas armas muito duráveis podem pagar um pouco menos
              por checagem.
            </p>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Ação</th><th>Treina Manutenção?</th><th>Observação</th></tr></thead>
                <tbody>
                  <tr><td>Golpe corpo a corpo com arma</td><td><strong>Sim</strong></td><td>Fonte principal.</td></tr>
                  <tr><td>Golpe em zumbi</td><td><strong>Sim</strong></td><td>Melhor opção porque também avança a categoria da arma.</td></tr>
                  <tr><td>Golpe em porta / objeto quebrável</td><td>Sim</td><td>Funciona, mas desgasta arma e alvo; não é farm infinito.</td></tr>
                  <tr><td>Empurrão</td><td><strong>Não</strong></td><td>Não conta como XP.</td></tr>
                  <tr><td>Pisada</td><td><strong>Não</strong></td><td>Não treina Manutenção.</td></tr>
                  <tr><td>Arma de fogo</td><td>Não</td><td>Usa sistema de condição separado.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Em 10x–16x, não aumente risco só para criar golpes extras.</strong> O campeonato
              já oferece volume de combate suficiente. Manutenção deve subir como consequência de clears
              necessários.
            </div>
          </section>

          {/* 5 — armas de treino */}
          <section id="armas" className="guia-section">
            <div className="guia-eyebrow">05 · Armas de treino</div>
            <h2 className="guia-section-title">Use o que é substituível; preserve o que é raro</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Categoria</th><th>Exemplo</th><th>Uso recomendado</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Comum / descartável</strong></td>
                    <td>Cano de Ferro, tábuas, armas improvisadas</td>
                    <td><span className="guia-rank">TREINO</span> — bom para packs comuns e golpes que já seriam dados.</td>
                  </tr>
                  <tr>
                    <td><strong>Durável</strong></td>
                    <td>Pé-de-cabra</td>
                    <td>Excelente arma de longo prazo; muito durável, mas o XP por checagem pode ser um pouco menor.</td>
                  </tr>
                  <tr>
                    <td><strong>Renovável</strong></td>
                    <td>Lanças montadas, armas de osso/pedra</td>
                    <td><span className="guia-rank">S 0,04</span> — matéria-prima recuperável ou fabricável na base.</td>
                  </tr>
                  <tr>
                    <td><strong>Rara / premium</strong></td>
                    <td>Machete, machados bons, lâminas especiais</td>
                    <td>Preserve para combate onde o dano realmente importa.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert">
              <strong>Loot 0,04 muda a resposta:</strong> a melhor arma de treino não é necessariamente
              a que dá mais XP por minuto; é a que você consegue substituir sem abrir outra rota de
              saque.
            </div>
          </section>

          {/* 6 — XP por receitas */}
          <section id="receitas" className="guia-section">
            <div className="guia-eyebrow">06 · XP por receitas</div>
            <h2 className="guia-section-title">Receitas transformam manutenção real em XP garantido</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Nível</th><th>Receita</th><th>XP base</th><th>XP a 0,8×</th><th>Uso</th></tr></thead>
                <tbody>
                  <tr><td>0</td><td>Reparar com Fita Adesiva Forte</td><td>10</td><td><strong>8</strong></td><td>Útil, mas não gaste fita só por XP.</td></tr>
                  <tr><td>0</td><td>Afiar Lâmina</td><td>5</td><td>4</td><td>Excelente porque preserva ferramentas reais.</td></tr>
                  <tr><td>0</td><td>Reparar com Cola / Cola de Madeira</td><td>5</td><td>4</td><td>Use em armas que serão mantidas.</td></tr>
                  <tr><td>1</td><td>Faca de Escova de Dentes</td><td><strong>30</strong></td><td><strong>24</strong></td><td>Alto XP, utilidade limitada.</td></tr>
                  <tr><td>1</td><td>Chave de Fenda Improvisada / Faca Improvisada</td><td>20</td><td>16</td><td>Boa quando o produto é necessário.</td></tr>
                  <tr><td>1</td><td>Montar Lança / prender cabeça de lança</td><td>10</td><td>8</td><td><span className="guia-rank">ÓTIMA SINERGIA</span></td></tr>
                  <tr><td>2</td><td>Reparar Serra</td><td>20</td><td>16</td><td>Excelente em uma base que usa Carpintaria.</td></tr>
                  <tr><td>2</td><td>Armadura de pneu de canela/antebraço</td><td>20</td><td>16</td><td>Faça só se quiser usar.</td></tr>
                  <tr><td>3</td><td>Armadura de pneu / Machado de Mandíbula</td><td>30</td><td>24</td><td>Receitas úteis e XP razoável.</td></tr>
                  <tr><td>3</td><td>Reparar com Epóxi</td><td>15</td><td>12</td><td>Epóxi é raro no loot 0,04; preserve.</td></tr>
                  <tr><td>4</td><td>Maça de Chaleira</td><td>40</td><td>32</td><td>Alto XP; produto específico.</td></tr>
                  <tr><td>5</td><td>Armadura Corporal de Pneu / Maça de Balde</td><td><strong>50</strong></td><td><strong>40</strong></td><td>Maior XP direto da lista atual.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Receita com XP alto não significa grind eficiente.</strong> Em loot 0,04, fita,
              epóxi, pneus e peças raras só devem ser consumidos quando o produto ou reparo tiver valor
              real.
            </div>
          </section>

          {/* 7 — reparos */}
          <section id="reparo" className="guia-section">
            <div className="guia-eyebrow">07 · Reparos e afiação</div>
            <h2 className="guia-section-title">Manutenção recompensa exatamente o comportamento que o campeonato exige</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Afiar</strong>
                <div className="guia-metric">5 XP base</div>
                <p className="guia-muted">Pedra de amolar, lima ou esmeril conforme receita e item.</p>
              </div>
              <div className="guia-card">
                <strong>Fita forte</strong>
                <div className="guia-metric">10 XP base</div>
                <p className="guia-muted">Bom retorno, mas fita é recurso estratégico.</p>
              </div>
              <div className="guia-card">
                <strong>Epóxi</strong>
                <div className="guia-metric">15 XP base</div>
                <p className="guia-muted">Alto XP, porém extremamente valioso em loot 0,04.</p>
              </div>
            </div>
            <div className="guia-alert">
              <strong>Prioridade correta:</strong> primeiro decida se a arma merece ser salva. Só depois
              escolha o reparo que também concede XP. O objetivo é reduzir consumo de loot, não
              converter todo adesivo em barra de experiência.
            </div>
          </section>

          {/* 8 — durabilidade */}
          <section id="durabilidade" className="guia-section">
            <div className="guia-eyebrow">08 · Durabilidade</div>
            <h2 className="guia-section-title">Manutenção e habilidade da arma trabalham juntas</h2>
            <p className="guia-muted">
              A proteção contra perda de condição considera Manutenção e parte do nível da categoria da
              arma. Por isso, treinar Machado com machados, Contundente Longa com pé-de-cabra e assim
              por diante melhora a conservação do mesmo equipamento por duas frentes.
            </p>
            <div className="guia-route">
              <span className="guia-node">Manutenção alta</span>
              <span className="guia-arrow">+</span>
              <span className="guia-node">Skill da arma alta</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">menos perda de condição</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">menos loot necessário</span>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Estratégia de campeonato:</strong> escolha um conjunto principal de categorias de
              arma e mantenha consistência. Espalhar combate por muitas categorias reduz a sinergia de
              durabilidade do equipamento que você mais usa.
            </div>
          </section>

          {/* 9 — rota */}
          <section id="rota" className="guia-section">
            <div className="guia-eyebrow">09 · Rota definitiva 0 → 10</div>
            <h2 className="guia-section-title">A melhor rota mistura combate necessário e receitas úteis</h2>
            {[
              { num: '0', title: 'Nível 0 → 1 — sobreviva e não desperdice adesivos', body: 'Leia Manutenção I. Use armas comuns/renováveis em clears necessários. Afiar e reparar itens que você realmente pretende manter complementa o XP.' },
              { num: '1', title: 'Nível 1 → 3 — lanças e armas improvisadas', body: 'Monte lanças e implementos quando já precisar deles. Cada montagem pode conceder XP direto; combine isso com combate usando a mesma categoria que pretende evoluir.' },
              { num: '3', title: 'Nível 3 → 5 — reparos melhores', body: 'Leia Manutenção II. Epóxi abre mais XP, mas não deve virar farm em 0,04. Use em armas premium danificadas. O grosso continua vindo do combate.' },
              { num: '5', title: 'Nível 5 → 7 — rotina de alto volume', body: 'Leia Manutenção III. Neste ponto o campeonato já deve ter gerado muitas lutas. Use os multiplicadores altos para transformar cada clear normal em progresso pesado.' },
              { num: '7', title: 'Nível 7 → 9 — preserve o arsenal raro', body: 'Leia Manutenção IV. Mude gradualmente de armas descartáveis para seu arsenal definitivo: a skill já protege muito melhor condição e você também estará evoluindo a categoria de combate.' },
              { num: '9', title: 'Nível 9 → 10 — livro V antes de qualquer horda grande', body: 'Leia Manutenção V. Com multiplicador 16× e XP global 0,8×, combates inevitáveis do endgame devem fechar a habilidade sem necessidade de farms artificiais.' },
            ].map(s => (
              <div key={s.num + s.title} className="guia-step">
                <div className="guia-step-num">{s.num}</div>
                <div>
                  <h3 className="guia-h3">{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
            <div className="guia-alert">
              <strong>Resumo:</strong> livro certo → arma renovável/comum → combate necessário → reparos
              úteis → montagem de armas → arma principal conforme a skill sobe → nível 10.
            </div>
          </section>

          {/* 10 — loot */}
          <section id="loot" className="guia-section">
            <div className="guia-eyebrow">10 · Loot 0,04</div>
            <h2 className="guia-section-title">Manutenção existe para reduzir o custo do loot escasso</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Recurso</th><th>Política</th><th>Por quê</th></tr></thead>
                <tbody>
                  <tr><td><strong>Fita Adesiva Forte</strong></td><td>Guardar</td><td>Versátil e rara; não gastar só por 10 XP base.</td></tr>
                  <tr><td><strong>Epóxi</strong></td><td>Reserva premium</td><td>Reparo forte e 15 XP, mas difícil de substituir.</td></tr>
                  <tr><td><strong>Cola de Madeira</strong></td><td>Uso seletivo</td><td>Também serve Carpintaria; não monopolizar.</td></tr>
                  <tr><td><strong>Pedra de Amolar / Lima</strong></td><td>★★★★★</td><td>Ferramentas reutilizáveis para manter lâminas.</td></tr>
                  <tr><td><strong>Galhos / madeira / osso / pedra</strong></td><td>Priorizar</td><td>Fontes renováveis de armas e implementos.</td></tr>
                  <tr><td><strong>Armas raras</strong></td><td>Preservar</td><td>Use quando o dano necessário supera o custo de condição.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Regra 0,04:</strong> se uma rota de XP consome um item que você não consegue
              repor na base, ela não é rota principal; é apenas bônus quando o uso já era necessário.
            </div>
          </section>

          {/* 11 — brasileirão */}
          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow">11 · Estratégia 10x–16x</div>
            <h2 className="guia-section-title">Quanto mais zumbis, menos sentido faz "farmar" Manutenção fora do combate real</h2>
            {[
              { num: '1', title: 'Livro antes da horda', body: 'Se existe uma operação grande planejada, leia o volume da faixa antes. O mesmo número de golpes vale várias vezes mais.' },
              { num: '2', title: 'Use armas renováveis em grupos menores', body: 'Guarde machados, lâminas e peças raras para momentos em que dano e alcance justificam o custo.' },
              { num: '3', title: 'Não ataque portas apenas por XP', body: 'Funciona mecanicamente, mas gasta arma, resistência e tempo. Em população 16x, ruído e imobilidade são custo real.' },
              { num: '4', title: 'Repare depois da operação', body: 'Volte à base, avalie o que merece ser salvo e converta reparos necessários em XP adicional.' },
              { num: '5', title: 'Monte armas na base', body: 'Lanças, ferramentas e armas improvisadas geram XP direto e reduzem dependência de loot de contêiner.' },
              { num: '6', title: 'Suba junto com a categoria de arma', body: 'Manutenção + skill da arma formam um pacote. Treinar uma categoria que você não pretende usar no endgame desperdiça parte da sinergia.' },
              { num: '7', title: 'XP 0,8× exige consistência, não desperdício', body: 'Você precisa de cerca de 25% mais ações que em 1× antes de bônus. A resposta não é gastar 25% mais loot raro; é multiplicar melhor cada combate com livros.' },
            ].map(s => (
              <div key={s.num + s.title} className="guia-step">
                <div className="guia-step-num">{s.num}</div>
                <div>
                  <h3 className="guia-h3">{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
            <div className="guia-alert guia-alert-danger">
              <strong>Regra definitiva:</strong> a melhor rota de Manutenção é a que deixa seu arsenal
              mais forte e sua reserva de loot maior ao mesmo tempo.
            </div>
          </section>

          {/* 12 — calculadora */}
          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow">12 · Calculadora</div>
            <h2 className="guia-section-title">Projeção de golpes e receitas</h2>
            <p className="guia-sub">
              Estimativa teórica. Para golpes, considera aproximadamente 50% de checagens válidas e
              2 XP base por sucesso; armas muito duráveis podem pagar menos por checagem.
            </p>
            <div className="guia-calc">
              <div className="guia-field">
                <label className="guia-label">Nível atual</label>
                <select className="guia-input" value={startLv} onChange={e => setStartLv(+e.target.value)}>
                  {[0,1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label className="guia-label">Nível desejado</label>
                <select className="guia-input" value={targetLv} onChange={e => setTargetLv(+e.target.value)}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label className="guia-label">Livro</label>
                <select className="guia-input" value={bookIdx} onChange={e => setBookIdx(+e.target.value)}>
                  {BOOKS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label className="guia-label">Bônus inicial</label>
                <select className="guia-input" value={boostIdx} onChange={e => setBoostIdx(+e.target.value)}>
                  {BOOSTS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label className="guia-label">XP base da receita</label>
                <select className="guia-input" value={recipeXp} onChange={e => setRecipeXp(+e.target.value)}>
                  {RECIPES.map(v => <option key={v} value={v}>{v} XP</option>)}
                </select>
              </div>
            </div>
            <div className="guia-result">
              {result ? (
                <>
                  <span className="guia-sub">XP restante</span><br />
                  <strong>{result.need.toLocaleString('pt-BR')} XP</strong>
                  <br /><br />
                  <span className="guia-sub">Combate — estimativa teórica</span><br />
                  <strong>~{result.hits.toLocaleString('pt-BR')} golpes válidos</strong><br />
                  <span className="guia-sub">
                    Usa 50% de checagens × 2 XP base × 0,8 × livro × bônus. Armas muito duráveis podem
                    exigir mais golpes.
                  </span>
                  <br /><br />
                  <strong>~{result.crafts.toLocaleString('pt-BR')} ações de receita</strong>{' '}
                  <span className="guia-sub">({result.recipeEach.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} XP efetivos cada).</span>
                </>
              ) : (
                <strong>Escolha um nível desejado maior que o atual.</strong>
              )}
            </div>
          </section>

          {/* 13 — erros (era 14) */}
          <section id="erros" className="guia-section">
            <div className="guia-eyebrow">13 · Erros comuns</div>
            <h2 className="guia-section-title">O que não fazer</h2>
            {[
              { title: '1. Empurrar e pisar esperando XP', body: 'Essas ações não alimentam Manutenção. O ganho vem de ataques válidos com arma e de receitas específicas.' },
              { title: '2. Bater em porta infinitamente', body: 'Porta quebra e arma perde condição. É um treino possível, não um exploit infinito.' },
              { title: '3. Usar Pé-de-Cabra como "arma perfeita de XP"', body: 'É extremamente durável e excelente para sobreviver, mas armas muito duráveis podem pagar um pouco menos de XP por checagem. Escolha pela sustentabilidade, não pelo mito.' },
              { title: '4. Gastar epóxi por barra de XP', body: 'Em loot 0,04, epóxi é mais valioso como recurso de reparo premium.' },
              { title: '5. Ignorar a habilidade da arma', body: 'Manutenção trabalha junto da categoria de arma para preservar condição. Treine o conjunto, não só a passiva.' },
              { title: '6. Não ler livros porque "a skill sobe sozinha"', body: 'É exatamente por subir durante combate que o livro é tão importante: você multiplica centenas de ações inevitáveis.' },
              { title: '7. Usar arma rara contra todo zumbi', body: 'Em 10x–16x e loot 0,04, use o dano premium quando ele tiver retorno de segurança. Grupos simples podem ser tratados com armas substituíveis.' },
            ].map((e, i) => (
              <details key={i} className="guia-details">
                <summary>{e.title}</summary>
                <div className="guia-details-body"><p>{e.body}</p></div>
              </details>
            ))}
          </section>

          {/* 14 — fontes (era 15) */}
          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow">14 · Fontes e versão</div>
            <h2 className="guia-section-title">Base técnica do manual</h2>
            <p className="guia-muted">
              Consolidado em setembro de 2026 para a versão estável <strong>42.20.4</strong>. Receitas e
              XP direto foram extraídos da 42.20.2; nomes de livros foram conferidos na linha 42.20.4.
              O comportamento de XP por golpe foi cruzado com documentação recente da Build 42.
            </p>
            <ol className="guia-sources">
              <li><a href="https://projectzomboid.com/blog/status-and-build-history/" target="_blank" rel="noopener noreferrer">The Indie Stone — versão estável 42.20.4</a></li>
              <li><a href="https://pype.org/en/zomboid/skills/maintenance/xp-list/" target="_blank" rel="noopener noreferrer">pype.org — 50 receitas com XP de Manutenção na B42.20.2</a></li>
              <li><a href="https://pype.org/pt-br/zomboid/tools/book-checklist/" target="_blank" rel="noopener noreferrer">pype.org — livros I–V e nomes atuais</a></li>
              <li><a href="https://pz-guide.com/en/skill/maintenance/" target="_blank" rel="noopener noreferrer">PZ Guide — função, profissões e traços que aumentam Manutenção</a></li>
              <li><a href="https://pzfans.com/how-to-level-up-the-maintenance-skill-quickly-and-safely-in-project-zomboid/" target="_blank" rel="noopener noreferrer">PZFans — XP de combate, durabilidade e plano de treino B42</a></li>
              <li><a href="https://pz-guide.com/en/item/Base.SpearShort/" target="_blank" rel="noopener noreferrer">PZ Guide — montagem de lança e receitas de reparo/afiação</a></li>
              <li><a href="https://pz-guide.com/en/item/Base.MetalPipe/" target="_blank" rel="noopener noreferrer">PZ Guide — Cano de Ferro B42</a></li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo definitivo:</strong> em 10x–16x com loot 0,04 e XP 0,8×, leia os livros,
              combata com armas renováveis/comuns, preserve o arsenal raro, use reparos e afiações reais
              como XP complementar e deixe a própria temporada carregar Manutenção até o nível 10.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
