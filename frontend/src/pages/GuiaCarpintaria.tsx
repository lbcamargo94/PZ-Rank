import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',        label: '1. Visão geral' },
  { id: 'efeitos',      label: '2. Função' },
  { id: 'criacao',      label: '3. Criação do personagem' },
  { id: 'livros',       label: '4. Livros' },
  { id: 'midia',        label: '5. TV e VHS' },
  { id: 'desmontagem',  label: '6. Desmontagem' },
  { id: 'kit',          label: '7. Kit mínimo' },
  { id: 'madeira',      label: '8. Madeira' },
  { id: 'pregos',       label: '9. Pregos' },
  { id: 'receitas',     label: '10. Receitas e XP' },
  { id: 'rota',         label: '11. Rota 0→10' },
  { id: 'base',         label: '12. Marcos de base' },
  { id: 'defesa',       label: '13. Defesa' },
  { id: 'brasileirao',  label: '14. Estratégia Brasileirão' },
  { id: 'calculadora',  label: '15. Calculadora' },
  { id: 'erros',        label: '16. Erros comuns' },
  { id: 'fontes',       label: '17. Fontes e versão' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const RECIPES = [
  { label: 'Piso — 10 XP / 1 tábua / 1 prego',           xp: 10, planks: 1, nails: 1 },
  { label: 'Poste — 20 XP / 1 tábua / 1 prego',          xp: 20, planks: 1, nails: 1 },
  { label: 'Cerca Nv.1 — 30 XP / 2 tábuas / 2 pregos',   xp: 30, planks: 2, nails: 2 },
  { label: 'Cerca Nv.2 — 50 XP / 2 tábuas / 2 pregos',   xp: 50, planks: 2, nails: 2 },
  { label: 'Cerca Nv.3 — 70 XP / 2 tábuas / 2 pregos',   xp: 70, planks: 2, nails: 2 },
];

export function GuiaCarpintaria() {
  const [compact, setCompact]       = useState(false);
  const [startLv, setStartLv]       = useState(3);
  const [targetLv, setTargetLv]     = useState(10);
  const [recipeIdx, setRecipeIdx]   = useState(4);
  const [xpMult, setXpMult]         = useState(0.8);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const xpNeed = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const rec = RECIPES[recipeIdx];
    const xpEach = rec.xp * xpMult;
    const count = Math.ceil(xpNeed / xpEach);
    const totalP = count * rec.planks;
    const totalN = count * rec.nails;
    const logs = Math.ceil(totalP / 3);
    return { xpNeed, count, totalP, totalN, logs };
  }

  const result = calcResult();

  return (
    <div className={`guia-page${compact ? ' guia-compact' : ''}`}>
      {/* ── header ── */}
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
        {/* ── sidebar ── */}
        <aside className="guia-side">
          <div className="guia-side-label">Manual definitivo</div>
          {TOC.map(item => (
            <a key={item.id} href={`#${item.id}`} className="guia-side-link">{item.label}</a>
          ))}
          <p className="guia-side-note">Construção estável 42.20.4. A rota prioriza estruturas úteis e economia de pregos.</p>
        </aside>

        {/* ── main ── */}
        <main className="guia-main">
          {/* hero */}
          <div className="guia-hero">
            <div className="guia-eyebrow">Construção 42.20.4 · Português do Brasil</div>
            <h1 className="guia-title">Manual Definitivo de Carpintaria 0 → 10</h1>
            <p className="guia-subtitle">
              A rota completa para transformar árvores, pregos e tempo de base em{' '}
              <strong>Carpintaria nível 10</strong>, sem depender de métodos antigos de
              desmontagem e sem desperdiçar material raro no Brasileirão.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">32.775 XP total</span>
              <span className="guia-pill">10x zumbis</span>
              <span className="guia-pill">Energia: corte no dia 1</span>
              <span className="guia-pill">Água: corte no dia 1</span>
              <span className="guia-pill">Madeira renovável</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Configuração oficial do Brasileirão:</strong> este manual considera um mundo com{' '}
            <strong>população de zumbis em 10x</strong>,{' '}
            <strong>energia elétrica cortada no primeiro dia</strong> e{' '}
            <strong>água encanada cortada no primeiro dia</strong>. Por isso, segurança, água e
            autonomia vêm antes de qualquer rota teórica de XP.
          </div>

          <div className="guia-alert guia-alert-info">
            <strong>Configuração oficial usada neste manual:</strong>{' '}
            <strong>população de zumbis 10x</strong>,{' '}
            <strong>água cortada no primeiro dia</strong>,{' '}
            <strong>energia cortada no primeiro dia</strong> e{' '}
            <strong>XP global 0,8×</strong>.
            {' '}Fórmula: <strong>XP efetivo = XP base × 0,8 × bônus inicial × livro × modificadores</strong>.
          </div>

          {/* 1 — visão geral */}
          <section id="visao" className="guia-section">
            <div className="guia-eyebrow">01 · Visão geral</div>
            <h2 className="guia-section-title">Carpintaria precisa resolver água e segurança antes de resolver XP</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">População</div>
                <div className="guia-metric guia-red">10x</div>
                <p className="guia-sub">Toda ida à cidade custa muito mais risco.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Energia</div>
                <div className="guia-metric guia-red">Dia 1</div>
                <p className="guia-sub">TV ao vivo deixa de ser uma rota confiável.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Água</div>
                <div className="guia-metric guia-red">Dia 1</div>
                <p className="guia-sub">Coletores passam a ser prioridade estratégica.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Recurso renovável</div>
                <div className="guia-metric guia-green">Madeira</div>
                <p className="guia-sub">Árvores locais sustentam quase toda a progressão.</p>
              </div>
            </div>
            <div className="guia-alert">
              <strong>Princípio do Brasileirão:</strong> Carpintaria não é apenas uma habilidade de
              construção. Ela é uma habilidade de <strong>sobrevivência de infraestrutura</strong>. Cada
              tábua e cada prego devem aproximar a base de quatro objetivos: água, segurança,
              armazenamento e autonomia.
            </div>
            <div className="guia-route">
              <span className="guia-node">Ferramentas + Livros</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Serrar madeira</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Pisos / Postes</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Coletores no Nv.3</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Perímetro</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Cerca Nv.3</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">10</span>
            </div>
          </section>

          {/* 2 — função */}
          <section id="efeitos" className="guia-section">
            <div className="guia-eyebrow">02 · Função</div>
            <h2 className="guia-section-title">Carpintaria é a espinha dorsal da base</h2>
            <p className="guia-muted">
              A habilidade libera e melhora construções de madeira: pisos, paredes, portas, cercas,
              caixas, escadas, coletores de chuva, compostagem e várias estruturas ligadas a outras
              habilidades.
            </p>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Segurança</strong>
                <p className="guia-muted">Paredes, portões, cercas e barricadas transformam uma casa em base defensiva.</p>
              </div>
              <div className="guia-card">
                <strong>Infraestrutura</strong>
                <p className="guia-muted">Água, armazenamento, escadas, plataformas e mobiliário.</p>
              </div>
              <div className="guia-card">
                <strong>Integração</strong>
                <p className="guia-muted">Moldes, foles, estruturas agrícolas e peças usadas em Ferraria, Cerâmica e outras cadeias.</p>
              </div>
            </div>
          </section>

          {/* 3 — criação */}
          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow">03 · Criação do personagem</div>
            <h2 className="guia-section-title">Carpinteiro é a opção de velocidade, mas a build global vem primeiro</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Escolha</th><th>Bônus de Carpintaria</th><th>Leitura para o Brasileirão</th></tr></thead>
                <tbody>
                  <tr><td><strong>Carpinteiro</strong> (Carpenter)</td><td><strong>+4</strong></td><td>Começa no nível 4 e ainda recebe bônus em Entalhamento, Contundente Curta, Alvenaria e Manutenção. Melhor escolha se a build realmente quer priorizar construção.</td></tr>
                  <tr><td>Trabalhador da Construção</td><td>+1</td><td>Bom meio-termo para não concentrar a criação em uma única skill.</td></tr>
                  <tr><td>Engenheiro</td><td>+1</td><td>Sinergia maior com fabricação geral.</td></tr>
                  <tr><td>Especialista em Faça-Você-Mesmo</td><td>+1</td><td>Alternativa generalista.</td></tr>
                  <tr><td><strong>Habilidoso</strong> (Handy)</td><td>+1</td><td>Também ajuda Entalhamento, Manutenção e Alvenaria; custa pontos de traço.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Não escolha Carpinteiro automaticamente só porque este é o manual de Carpintaria.</strong>{' '}
              No Brasileirão, a build precisa servir às 35 habilidades e aos objetivos da temporada.
              Carpinteiro é a rota mais curta desta skill; não necessariamente a melhor build geral.
            </div>
          </section>

          {/* 4 — livros */}
          <section id="livros" className="guia-section">
            <div className="guia-eyebrow">04 · Livros</div>
            <h2 className="guia-section-title">Leia antes de gastar pregos</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Faixa</th><th>Livro em português</th><th>Nome original</th><th>Páginas</th><th>Multiplicador</th></tr></thead>
                <tbody>
                  <tr><td>1–2</td><td>Carpintaria I — Guia para Pregar</td><td>A Guide to Nailing</td><td>220</td><td><strong>3×</strong></td></tr>
                  <tr><td>3–4</td><td>Carpintaria II — Carpintaria no Estilo Artesanal</td><td>Carpentry, Woodcraft Style</td><td>260</td><td><strong>5×</strong></td></tr>
                  <tr><td>5–6</td><td>Carpintaria III — Prateleiras e Armazenamento Feitos à Mão</td><td>Hand Crafted Shelving and Storage</td><td>300</td><td><strong>8×</strong></td></tr>
                  <tr><td>7–8</td><td>Carpintaria IV — Construindo Sua Própria Cabana do Zero</td><td>Making Your Own Cabin From Scratch</td><td>340</td><td><strong>12×</strong></td></tr>
                  <tr><td>9–10</td><td>Carpintaria V — Marcenaria de Obra e Carpintaria Arquitetônica</td><td>Site Joinery and Architectural Carpentry</td><td>380</td><td><strong>16×</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Pregos são preciosos no saque 0,04.</strong> Construir antes de terminar o livro
              correto é um dos piores desperdícios deste manual.
            </div>
          </section>

          {/* 5 — TV e VHS */}
          <section id="midia" className="guia-section">
            <div className="guia-eyebrow">05 · TV e VHS</div>
            <h2 className="guia-section-title">No Brasileirão, TV ao vivo deixa de ser parte da rota principal</h2>
            <p className="guia-muted">
              Em condições normais, Marcenaria (Woodcraft) seria uma excelente fonte de XP nos primeiros
              dias. Porém, no campeonato a <strong>energia é cortada já no primeiro dia</strong>. Isso
              torna a programação de TV uma oportunidade circunstancial, não uma etapa obrigatória.
            </p>
            <div className="guia-grid2">
              <div className="guia-card">
                <strong>TV ao vivo</strong>
                <div className="guia-metric guia-red">Baixa prioridade</div>
                <p className="guia-muted">A janela é curta e desaparece com o corte de energia. Não monte a estratégia de Carpintaria em torno dela.</p>
              </div>
              <div className="guia-card">
                <strong>VHS + energia própria</strong>
                <div className="guia-metric guia-green">Útil</div>
                <p className="guia-muted">Se mais tarde houver gerador, combustível e aparelho funcional, VHS pode recuperar parte do XP perdido.</p>
              </div>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Não arrisque uma incursão em área urbana 10x apenas para assistir TV ou buscar VHS.</strong>{' '}
              Livro + madeira local + construção útil já fornecem uma rota completa até o nível 10.
            </div>
            <details className="guia-details">
              <summary>Programação padrão de Marcenaria</summary>
              <div className="guia-details-body">
                <div className="guia-table-wrap">
                  <table className="guia-table">
                    <thead><tr><th>Dia padrão</th><th>Horário</th><th>Programa</th><th>XP bruto da emissão</th></tr></thead>
                    <tbody>
                      <tr><td>1</td><td>12:00</td><td>Marcenaria (Woodcraft)</td><td>300</td></tr>
                      <tr><td>2</td><td>12:00</td><td>Marcenaria</td><td>300</td></tr>
                      <tr><td>3</td><td>12:00</td><td>Marcenaria</td><td>400</td></tr>
                      <tr><td>4</td><td>12:00</td><td>Marcenaria</td><td>300</td></tr>
                      <tr><td>5</td><td>12:00</td><td>Marcenaria</td><td>450</td></tr>
                      <tr><td>6</td><td>12:00</td><td>Marcenaria</td><td>300</td></tr>
                      <tr><td>7</td><td>12:00</td><td>Marcenaria</td><td>450</td></tr>
                      <tr><td>8</td><td>18:00</td><td>Marcenaria</td><td>150</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>Esta tabela continua útil como referência, mas <strong>não representa a rota recomendada do campeonato</strong>.</p>
              </div>
            </details>
            <div className="guia-alert guia-alert-info">
              <strong>Regra de decisão:</strong> se a TV já estiver funcionando onde você está, aproveite.
              Se exigir deslocamento, gerador, combustível ou luta contra uma horda, ignore e continue a
              progressão por construção.
            </div>
          </section>

          {/* 6 — desmontagem */}
          <section id="desmontagem" className="guia-section">
            <div className="guia-eyebrow">06 · Desmontagem</div>
            <h2 className="guia-section-title">O velho truque das camas morreu na Build 42</h2>
            <div className="guia-grid2">
              <div className="guia-card">
                <strong>Presets padrão B42</strong>
                <div className="guia-metric guia-red">0</div>
                <p className="guia-muted">Nível Máximo de XP por Desmontagem de Carpintaria = 0.</p>
              </div>
              <div className="guia-card">
                <strong>O que desmontar ainda faz</strong>
                <div className="guia-metric guia-green">Materiais</div>
                <p className="guia-muted">Tábuas, pregos e sucata continuam úteis. Só não trate isso como grind de XP.</p>
              </div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Ignore guias antigos que mandam desmontar camas, mesas e portas para upar Carpintaria.</strong>{' '}
              Isso só volta a funcionar se o servidor alterar explicitamente o limite de desmontagem.
            </div>
          </section>

          {/* 7 — kit */}
          <section id="kit" className="guia-section">
            <div className="guia-eyebrow">07 · Kit mínimo</div>
            <h2 className="guia-section-title">Ferramentas e materiais essenciais</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Prioridade</th><th>Item</th><th>Como obter / alternativa</th></tr></thead>
                <tbody>
                  <tr><td>★★★★★</td><td><strong>Martelo</strong></td><td>Ferragens, garagens, construção e depósitos. Martelo de Pedra é fabricável com Manutenção 1.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Serra</strong></td><td>Lojas de ferramentas, armazéns e caixas de carpintaria. Ferraria também consegue fabricar Serra Simples.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Pregos</strong></td><td>Ferragens, caixas de carpintaria, armazéns e oficinas. Ferraria permite produção de longo prazo.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Machado</strong></td><td>Para derrubar árvores rapidamente; há alternativas improvisadas e forjadas.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Tábua / Tora</strong></td><td>Produza localmente; evite transportar grandes quantidades se a base tem floresta.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Sacos de lixo / Lona</strong></td><td>Para coletores de chuva; 1 lona substitui 4 sacos nos modelos atuais.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Dobradiças / Maçanetas</strong></td><td>Portas/portões específicos; recupere por desmontagem ou saque.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 8 — madeira */}
          <section id="madeira" className="guia-section">
            <div className="guia-eyebrow">08 · Madeira</div>
            <h2 className="guia-section-title">Árvores transformam Carpintaria em uma skill quase renovável</h2>
            <div className="guia-route">
              <span className="guia-node">Árvore</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Tora</span>
              <span className="guia-arrow">+</span>
              <span className="guia-node">Serra</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">3 Tábuas + 5 XP base</span>
            </div>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Entrada</th><th>Resultado</th><th>XP base</th><th>Uso</th></tr></thead>
                <tbody>
                  <tr><td>1 Tora</td><td><strong>3 Tábuas</strong></td><td>5</td><td>Melhor cadeia padrão.</td></tr>
                  <tr><td>1 Galho Grande</td><td>1 Tábua</td><td>5</td><td>Aproveite madeira encontrada.</td></tr>
                  <tr><td>Haste longa compatível</td><td>Peças menores</td><td>5</td><td>Mais útil para outras cadeias.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert">
              <strong>Serrar não é a rota principal de XP.</strong> É um bônus enquanto você produz a
              matéria-prima das construções.
            </div>
          </section>

          {/* 9 — pregos */}
          <section id="pregos" className="guia-section">
            <div className="guia-eyebrow">09 · Pregos</div>
            <h2 className="guia-section-title">O recurso que decide a velocidade</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Saquear</strong>
                <div className="guia-metric">100</div>
                <p className="guia-muted">Uma Caixa de Pregos contém 100 pregos. Ferragens e caixas de carpintaria são prioridade S.</p>
              </div>
              <div className="guia-card">
                <strong>Recuperar</strong>
                <div className="guia-metric">♻</div>
                <p className="guia-muted">Desmontagem pode devolver pregos e tábuas mesmo sem XP.</p>
              </div>
              <div className="guia-card">
                <strong>Fabricar</strong>
                <div className="guia-metric guia-green">∞</div>
                <p className="guia-muted">Ferraria pode fabricar pregos a partir de ferro, reduzindo dependência de saque.</p>
              </div>
            </div>
            <h3 className="guia-h3">Integração com Ferraria</h3>
            <div className="guia-route">
              <span className="guia-node">2 Carvões</span>
              <span className="guia-arrow">+</span>
              <span className="guia-node">1 Chunk de Ferro</span>
              <span className="guia-arrow">+</span>
              <span className="guia-node">Ferramentas de Ferraria</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">10 Pregos</span>
            </div>
            <p className="guia-sub">Consulte o Manual Definitivo de Ferraria para a cadeia completa.</p>
            <div className="guia-alert guia-alert-warning">
              <strong>Se os pregos acabarem, pare o grind.</strong> Não transforme um recurso raro em
              construções ruins apenas para continuar ganhando XP.
            </div>
          </section>

          {/* 10 — receitas */}
          <section id="receitas" className="guia-section">
            <div className="guia-eyebrow">10 · XP por receita</div>
            <h2 className="guia-section-title">As construções mais eficientes</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Nível</th><th>Construção</th><th>XP base</th><th>Materiais</th><th>Leitura</th></tr></thead>
                <tbody>
                  <tr><td>0</td><td>Serrar Tora / Galho Grande</td><td>5</td><td>Madeira + Serra</td><td><span className="guia-rank">Sem prego</span></td></tr>
                  <tr><td>0</td><td>Parede de Toras</td><td>10</td><td>4 Toras + 4 amarrações</td><td>Defesa útil; ruim para XP/material.</td></tr>
                  <tr><td>1</td><td>Piso de Madeira</td><td>10</td><td><strong>1 Tábua + 1 Prego</strong></td><td>Excelente.</td></tr>
                  <tr><td>2</td><td><strong>Poste de Madeira</strong></td><td><strong>20</strong></td><td><strong>1 Tábua + 1 Prego</strong></td><td><span className="guia-rank">S material</span></td></tr>
                  <tr><td>2</td><td>Estrutura de Parede</td><td>20</td><td>2 Tábuas + 2 Pregos</td><td>Use quando será parede real.</td></tr>
                  <tr><td>3</td><td>Cerca de Madeira Nv.1</td><td>30</td><td>2 Tábuas + 2 Pregos</td><td><span className="guia-rank">Ótima</span></td></tr>
                  <tr><td>3</td><td>Caixa Rústica</td><td>30</td><td>4 Tábuas + 4 Pregos</td><td>Armazenamento útil.</td></tr>
                  <tr><td>3</td><td>Coletor Pequeno</td><td>30</td><td>4 Tábuas + 4 Pregos + 4 Sacos ou 1 Lona</td><td>Infraestrutura.</td></tr>
                  <tr><td>4</td><td>Parede/Janela Nv.2</td><td>40</td><td>2 Tábuas + 4 Pregos</td><td>Fortificação.</td></tr>
                  <tr><td>5</td><td><strong>Cerca Nv.2</strong></td><td><strong>50</strong></td><td><strong>2 Tábuas + 2 Pregos</strong></td><td><span className="guia-rank">S</span></td></tr>
                  <tr><td>5</td><td>Coletor Grande</td><td>50</td><td>6 Tábuas + 5 Pregos + 4 Sacos ou 1 Lona</td><td>600 L.</td></tr>
                  <tr><td>6</td><td>Parede/Janela Nv.3</td><td>60</td><td>2 Tábuas + 4 Pregos</td><td>Defesa forte.</td></tr>
                  <tr><td>6</td><td>Composteira</td><td>60</td><td>4 Tábuas + 4 Pregos</td><td>Boa se há Agricultura.</td></tr>
                  <tr><td>7+</td><td><strong>Cerca Nv.3</strong></td><td><strong>70</strong></td><td><strong>2 Tábuas + 2 Pregos</strong></td><td><span className="guia-rank">MELHOR GRIND</span></td></tr>
                  <tr><td>7+</td><td>Caixa/Porta/Contador Nv.3</td><td>70</td><td>Varia</td><td>Use se precisa do produto.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Não existe obrigação de usar receita de nível 9.</strong> As melhores opções já
              estão abertas no 7; do 8 ao 10 você continua com elas usando os livros IV e V.
            </div>
          </section>

          {/* 11 — rota */}
          <section id="rota" className="guia-section">
            <div className="guia-eyebrow">11 · Rota definitiva 0 → 10</div>
            <h2 className="guia-section-title">Rota oficial para 10x zumbis, energia dia 1 e água dia 1</h2>
            {[
              { num: '0', title: 'Nível 0 → 1 — sobreviver antes de construir', body: 'Leia Carpintaria I e serre toras/galhos grandes em local seguro. Se houver TV funcionando sem desvio de rota, aproveite; caso contrário ignore. Parede de Toras só entra se a base realmente precisar de uma barreira imediata contra a população 10x.' },
              { num: '1', title: 'Nível 1 → 2 — piso com função real', body: 'Piso de Madeira. 10 XP por 1 tábua + 1 prego. Faça passarelas, cobertura, área elevada e espaço preparado para os futuros coletores. Não construa piso aleatório só por XP.' },
              { num: '2', title: 'Nível 2 → 3 — Poste de Madeira', body: '20 XP por 1 tábua + 1 prego. É a melhor eficiência material inicial. O objetivo desta etapa é chegar ao nível 3 o quanto antes, porque a água encanada já acabou.' },
              { num: '3', title: 'Nível 3 — PRIORIDADE ABSOLUTA: água', body: 'Construa os Coletores Pequenos de Chuva necessários para a base antes de voltar ao grind. Cada coletor representa autonomia e reduz a necessidade de incursões perigosas atrás de líquidos.' },
              { num: '3', title: 'Nível 3 → 5 — infraestrutura e perímetro', body: 'Depois de garantir água: Cerca Nv.1 para XP/material, caixas para organização, plataformas e início do perímetro. Evite viagens repetidas à cidade por pregos; acumule antes ou integre Ferraria.' },
              { num: '5', title: 'Nível 5 → 7 — água grande + Cerca Nv.2', body: 'Atualize a capacidade de água com Coletores Grandes e use Cerca Nv.2 — 50 XP por 2 tábuas + 2 pregos — para consolidar a base.' },
              { num: '7', title: 'Nível 7 → 10 — fortificação final', body: 'Cerca Nv.3 — 70 XP por 2 tábuas + 2 pregos. Feche perímetro, corredores de segurança e zonas internas. Leia Carpintaria IV e V nas faixas corretas e fabrique pregos por Ferraria quando possível.' },
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
              <strong>Resumo do campeonato:</strong> serrar → piso → poste →{' '}
              <strong>água no 3</strong> → cerca → <strong>água grande no 5</strong> → cerca Nv.2 →
              cerca Nv.3. O nível 10 deve ser consequência da construção de uma base autossuficiente,
              não o contrário.
            </div>
          </section>

          {/* 12 — marcos de base */}
          <section id="base" className="guia-section">
            <div className="guia-eyebrow">12 · Marcos de base</div>
            <h2 className="guia-section-title">Prioridades alteradas pelo corte de água e energia no dia 1</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Nível</th><th>Projeto</th><th>Prioridade no Brasileirão</th><th>Motivo</th></tr></thead>
                <tbody>
                  <tr><td>1</td><td>Pisos / área elevada</td><td>Alta</td><td>Organiza base, cria plataformas e prepara área de água.</td></tr>
                  <tr><td>2</td><td>Estruturas de parede / postes</td><td>Alta</td><td>Progressão rápida ao nível 3 e preparação do perímetro.</td></tr>
                  <tr><td><strong>3</strong></td><td><strong>Coletor Pequeno de Chuva — 400 L</strong></td><td><strong>CRÍTICA</strong></td><td>A água já está cortada desde o primeiro dia.</td></tr>
                  <tr><td>3</td><td>Caixas rústicas</td><td>Alta</td><td>Organização reduz exposição e tempo gasto procurando recursos.</td></tr>
                  <tr><td><strong>5</strong></td><td><strong>Coletor Grande — 600 L</strong></td><td><strong>CRÍTICA</strong></td><td>Expande autonomia hídrica da base.</td></tr>
                  <tr><td>6</td><td>Escadas de Madeira</td><td>Alta</td><td>Permite telhados, zonas elevadas, rotas de fuga e melhor disposição dos coletores.</td></tr>
                  <tr><td>6</td><td>Composteira</td><td>Média/Alta</td><td>Integra produção agrícola e autonomia.</td></tr>
                  <tr><td>7+</td><td>Perímetro final</td><td>Crítica</td><td>Hordas 10x exigem camadas, rotas de fuga e zonas de contenção.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Água de chuva é contaminada.</strong> Coletor resolve armazenamento, não
              potabilidade. Reserve uma etapa separada para purificação e distribuição segura.
            </div>
          </section>

          {/* 13 — defesa */}
          <section id="defesa" className="guia-section">
            <div className="guia-eyebrow">13 · Defesa</div>
            <h2 className="guia-section-title">Em 10x, parede não é fortaleza: é tempo comprado</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Estrutura</th><th>Nível mínimo</th><th>Vida base de referência</th><th>Uso recomendado</th></tr></thead>
                <tbody>
                  <tr><td>Parede de Madeira Nv.1</td><td>2</td><td>450 + bônus de skill</td><td>Divisões internas e fechamento temporário.</td></tr>
                  <tr><td>Parede de Madeira Nv.2</td><td>4</td><td>550 + bônus</td><td>Perímetro intermediário.</td></tr>
                  <tr><td>Parede de Madeira Nv.3</td><td>6</td><td>650 + bônus</td><td>Áreas críticas e perímetro final.</td></tr>
                  <tr><td>Parede de Toras</td><td>0</td><td>500 + bônus alto por Carpintaria</td><td>Barreira emergencial quando madeira é abundante e pregos são escassos.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Camadas</strong>
                <p className="guia-muted">Evite depender de uma única linha de parede. Use zonas sucessivas e áreas sacrificáveis.</p>
              </div>
              <div className="guia-card">
                <strong>Rotas de fuga</strong>
                <p className="guia-muted">Toda fortificação precisa de saída alternativa que não force atravessar a horda.</p>
              </div>
              <div className="guia-card">
                <strong>Visibilidade</strong>
                <p className="guia-muted">Não feche corredores sem observar aproximações. Em 10x, surpresa mata mais que falta de HP da parede.</p>
              </div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Nenhuma parede de madeira é invencível.</strong> Com dano a construções habilitado,
              uma horda 10x pode destruir rapidamente uma defesa estática. O objetivo da Carpintaria é
              atrasar, canalizar e criar opções — nunca substituir planejamento de fuga.
            </div>
          </section>

          {/* 14 — brasileirão */}
          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow">14 · Estratégia Brasileirão</div>
            <h2 className="guia-section-title">10x zumbis + sem água + sem energia: cada incursão precisa valer muito</h2>
            {[
              { num: '1', title: 'Dia 1: saque concentrado, não turismo urbano', body: 'Priorize serra, martelo, pregos, livros, recipientes de água, lona/sacos de lixo e ferramentas essenciais. Uma única boa incursão vale mais que cinco retornos a uma cidade 10x.' },
              { num: '2', title: 'TV é bônus, não objetivo', body: 'Com energia cortada no dia 1, não altere a rota do personagem para procurar uma televisão funcionando. Se estiver disponível onde você já está, aproveite. Caso contrário, avance por madeira.' },
              { num: '3', title: 'Base próxima à floresta', body: 'Madeira deve vir de poucos metros de distância. Transporte pregos e ferramentas; deixe árvores fazerem o trabalho pesado.' },
              { num: '4', title: 'Corrida até o nível 3 = corrida pela água', body: 'Com o encanamento morto desde o início, o primeiro grande marco de Carpintaria é o Coletor Pequeno. Chegue ao 3 com eficiência e construa água antes de começar o grind de perímetro.' },
              { num: '5', title: 'Nível 5 = autonomia hídrica maior', body: 'Troque ou complemente pequenos coletores com grandes. Isso reduz drasticamente a necessidade de entrar em áreas urbanas apenas por bebidas.' },
              { num: '6', title: 'Ferraria elimina o gargalo', body: 'Quando pregos rarearem, use a oficina para fabricar novos lotes. Em 10x, fabricar na base é quase sempre melhor que arriscar outra incursão apenas por consumíveis.' },
              { num: '7', title: 'Nível 7+ = transformar XP em fortificação', body: 'Cerca Nv.3 entrega excelente XP por material. Use-a para concluir corredores, perímetros, separações internas e áreas de contenção.' },
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
              <strong>Regra definitiva:</strong> no campeonato, Carpintaria deve reduzir a quantidade de
              vezes que você precisa sair da base. Água, armazenamento, produção e defesa valem mais
              que qualquer recorde de XP/minuto.
            </div>
          </section>

          {/* 15 — calculadora */}
          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow">15 · Calculadora</div>
            <h2 className="guia-section-title">Quantas construções faltam?</h2>
            <p className="guia-sub">Estimativa teórica. Não inclui serragem ou mídia.</p>
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
                <label className="guia-label">Construção</label>
                <select className="guia-input" value={recipeIdx} onChange={e => setRecipeIdx(+e.target.value)}>
                  {RECIPES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label className="guia-label">Multiplicador de XP (campeonato = 0,8×)</label>
                <input className="guia-input" type="number" value={xpMult} min={0.01} step={0.05}
                  onChange={e => setXpMult(+e.target.value)} />
              </div>
            </div>
            <div className="guia-result">
              {result ? (
                <>
                  <span className="guia-sub">XP restante</span><br />
                  <strong>{result.xpNeed.toLocaleString('pt-BR')} XP</strong>
                  <br /><br />
                  <span className="guia-sub">Construções estimadas</span><br />
                  <strong>{result.count.toLocaleString('pt-BR')}</strong><br />
                  <span className="guia-sub">
                    Materiais: ~{result.totalP.toLocaleString('pt-BR')} tábuas ·{' '}
                    {result.totalN.toLocaleString('pt-BR')} pregos ·{' '}
                    cerca de {result.logs.toLocaleString('pt-BR')} toras se todas as tábuas forem serradas.
                  </span>
                </>
              ) : (
                <strong>Escolha um nível desejado maior que o atual.</strong>
              )}
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Como usar:</strong> o campo já inicia em <strong>0,8×</strong>, valor oficial do
              campeonato. Para projetar uma faixa com livro/bônus, multiplique 0,8 pelo bônus
              correspondente e informe o resultado neste campo.
            </div>
          </section>

          {/* 16 — erros comuns (era 17) */}
          <section id="erros" className="guia-section">
            <div className="guia-eyebrow">16 · Erros comuns</div>
            <h2 className="guia-section-title">O que mais desperdiça tempo e pregos</h2>
            {[
              { title: '1. Desmontar camas esperando Carpintaria', body: 'Nos presets padrão da Build 42, o limite está em 0. Desmonte por materiais.' },
              { title: '2. Assistir VHS depois de Carpintaria 3', body: 'Com o limite padrão de mídia em 3, o XP para.' },
              { title: '3. Fazer paredes completas cedo só por XP', body: 'Paredes usam mais pregos que Poste/Cerca. Termine-as quando fizerem parte da defesa.' },
              { title: '4. Transportar tábuas de longe', body: 'Madeira é renovável. Transporte pregos e ferramentas; produza tábuas perto da base.' },
              { title: '5. Gastar sacos de lixo em coletores só por XP', body: 'Construa quantos a base precisa, depois volte para Cercas/Postes.' },
              { title: '6. Não ler o livro antes de construir', body: 'É o maior desperdício de prego do manual.' },
              { title: '7. Continuar usando Piso quando Cerca Nv.3 já abriu', body: 'Piso continua útil, mas para grind puro a cerca de alto nível é muito mais eficiente.' },
            ].map((e, i) => (
              <details key={i} className="guia-details">
                <summary>{e.title}</summary>
                <div className="guia-details-body"><p>{e.body}</p></div>
              </details>
            ))}
          </section>

          {/* 17 — fontes (era 18) */}
          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow">17 · Fontes e versão</div>
            <h2 className="guia-section-title">Base técnica utilizada</h2>
            <p className="guia-muted">
              Consolidado em 5 de setembro de 2026. Versão estável oficial: <strong>42.20.4</strong>.
              XP das receitas: arquivos vanilla 42.20.2; nomes/literatura atualizados para 42.20.4.
            </p>
            <ol className="guia-sources">
              <li><a href="https://projectzomboid.com/version_announce/" target="_blank" rel="noopener noreferrer">The Indie Stone — versão estável atual</a></li>
              <li><a href="https://pype.org/en/zomboid/skills/carpentry/xp-list/" target="_blank" rel="noopener noreferrer">pype.org — 106 receitas com XP de Carpintaria</a></li>
              <li><a href="https://pype.org/pt-br/zomboid/tools/book-checklist/" target="_blank" rel="noopener noreferrer">pype.org — livros e nomes PT-BR</a></li>
              <li><a href="https://pz-guide.com/en/skill/woodwork/" target="_blank" rel="noopener noreferrer">PZ Guide — Carpintaria, profissões e receitas</a></li>
              <li><a href="https://pzfans.com/how-to-quickly-level-up-carpentry-in-project-zomboid/" target="_blank" rel="noopener noreferrer">PZFans — limites de mídia/desmontagem e rota rápida</a></li>
              <li><a href="https://pzfans.com/life-and-living-tv-schedule/" target="_blank" rel="noopener noreferrer">PZFans — programação Life and Living</a></li>
              <li><a href="https://pzfans.com/ProjectZomboidB42RainCollector/" target="_blank" rel="noopener noreferrer">PZFans — coletores de chuva 42.20.4</a></li>
              <li><a href="https://pzfans.com/how-do-you-get-planks-in-project-zomboid/" target="_blank" rel="noopener noreferrer">PZFans — tora → 3 tábuas + 5 XP</a></li>
              <li><a href="https://pzfans.com/ProjectZomboidB42Nails/" target="_blank" rel="noopener noreferrer">PZFans — pregos e locais de saque</a></li>
              <li><a href="https://pzfans.com/carpentry_in_b42_why_your_old_tricks_don_t_work_anymore/" target="_blank" rel="noopener noreferrer">PZFans — mudanças da B42</a></li>
              <li><a href="https://pzfans.com/noob_to_fortress_building_walls_in_project_zomboid_b41__b42_guide/" target="_blank" rel="noopener noreferrer">PZFans — paredes e durabilidade</a></li>
              <li><a href="https://pzfans.com/pages/craft_table/" target="_blank" rel="noopener noreferrer">PZFans — fabricação de pregos e serra por Ferraria</a></li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo definitivo:</strong> leia livros, use TV antes do nível 3, produza madeira
              localmente, trate pregos como recurso estratégico e use{' '}
              <strong>Poste no nível 2 e Cercas nos níveis 3/5/7</strong> para fechar Carpintaria 10
              enquanto constrói a base real.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
