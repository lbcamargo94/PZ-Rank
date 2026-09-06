import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'xp',         label: '2. XP' },
  { id: 'personagem', label: '3. Personagem ideal' },
  { id: 'livros',     label: '4. Livros' },
  { id: 'revistas',   label: '5. Revistas' },
  { id: 'kit',        label: '6. Kit mínimo' },
  { id: 'faca',       label: '7. Facas' },
  { id: 'madeira',    label: '8. Madeira' },
  { id: 'ossos',      label: '9. Ossos' },
  { id: 'cadeia',     label: '10. Cadeia campeã' },
  { id: 'rota',       label: '11. Rota 0 → 10' },
  { id: 'late',       label: '12. Fim da progressão' },
  { id: 'brasileirao',label: '13. Brasileirão' },
  { id: 'erros',      label: '14. Erros comuns' },
  { id: 'fontes',     label: '15. Fontes' },
];

export function GuiaEntalhamento() {
  const [compact, setCompact]   = useState(false);
  const [xpBase, setXpBase]     = useState(20);
  const [boost, setBoost]       = useState(1.66);
  const [book, setBook]         = useState(16);
  const [globalXp, setGlobalXp] = useState(0.8);
  const [skillXp, setSkillXp]   = useState(1);

  const xpResult = xpBase * boost * book * globalXp * skillXp;

  return (
    <div className={`guia-page${compact ? ' guia-compact' : ''}`}>

      {/* ── Cabeçalho sticky ── */}
      <header className="guia-top">
        <div className="guia-top-inner">
          <div className="guia-brand">
            <Link to="/dicas" className="guia-back">
              <i className="ti ti-arrow-left" /> Guias
            </Link>
            <span className="guia-brand-label">BRASILEIRÃO PZ · ENTALHAMENTO</span>
          </div>
          <div className="guia-actions">
            <button className="guia-btn" onClick={() => window.print()}>
              Imprimir / PDF
            </button>
            <button className="guia-btn" onClick={() => setCompact(c => !c)}>
              {compact ? 'Modo normal' : 'Modo compacto'}
            </button>
          </div>
        </div>
      </header>

      <div className="guia-layout">

        {/* ── Sidebar TOC ── */}
        <aside className="guia-side">
          <h3 className="guia-side-heading">Manual definitivo</h3>
          {TOC.map(item => (
            <a key={item.id} href={`#${item.id}`} className="guia-toc-link">{item.label}</a>
          ))}
          <div className="guia-side-note">
            Project Zomboid Build 42.20.4 estável.
          </div>
        </aside>

        {/* ── Conteúdo principal ── */}
        <main className="guia-main">

          {/* ── Hero ── */}
          <div className="guia-hero">
            <div className="guia-eyebrow">Build 42.20.4 · Português do Brasil</div>
            <h1 className="guia-h1">Manual Definitivo de<br />Entalhamento 0 → 10</h1>
            <p className="guia-muted">Rota otimizada para chegar ao nível 10 com o menor risco possível no Brasileirão: poucos itens de saque, matéria-prima renovável e máxima reutilização de cada pedaço de madeira.</p>
            <div className="guia-pills">
              {['Sem forja', 'Sem molde', 'Sem combustível', 'Madeira renovável', 'Uma faca faz quase tudo'].map(p => (
                <span key={p} className="guia-pill">{p}</span>
              ))}
            </div>
          </div>

          {/* ── Alerta de configuração do campeonato ── */}
          <div className="guia-alert info">
            <strong>Configuração oficial do Brasileirão usada neste manual:</strong>{' '}
            <strong>população de zumbis 10×</strong>, <strong>água cortada no primeiro dia</strong>, <strong>energia cortada no primeiro dia</strong> e <strong>XP global 0,8×</strong>.
            <br />
            Fórmula de referência: <strong>XP efetivo = XP base × 0,8 × bônus inicial × livro × modificadores específicos</strong>.
            <br />
            Exemplo: 10 XP base → <strong>8 XP</strong> antes de livro/bônus; 70 XP base → <strong>56 XP</strong>.
          </div>

          {/* ── 1. Visão geral ── */}
          <section id="visao" className="guia-section">
            <div className="guia-eyebrow">1 · Visão geral</div>
            <h2 className="guia-h2">Por que Entalhamento é excelente para o Brasileirão</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">XP total</div>
                <div className="guia-metric">32.775</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Recurso</div>
                <div className="guia-metric guia-gold">Madeira</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Ferramenta</div>
                <div className="guia-metric guia-good">Faca</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Infraestrutura</div>
                <div className="guia-metric guia-good">Quase zero</div>
              </div>
            </div>
            <div className="guia-alert"><strong>Principal vantagem:</strong> depois de conseguir livros, revista e algumas facas, você pode levar praticamente todo o grind para uma base afastada das cidades.</div>
            <div className="guia-route">
              <span className="guia-node">Faca</span><span className="guia-arrow">→</span>
              <span className="guia-node">Galho</span><span className="guia-arrow">→</span>
              <span className="guia-node">Haste</span><span className="guia-arrow">→</span>
              <span className="guia-node">Cabos</span><span className="guia-arrow">→</span>
              <span className="guia-node">Colheres</span><span className="guia-arrow">→</span>
              <span className="guia-node">Garfos</span><span className="guia-arrow">→</span>
              <span className="guia-node">Nível 10</span>
            </div>
          </section>

          {/* ── 2. XP ── */}
          <section id="xp" className="guia-section">
            <div className="guia-eyebrow">2 · XP</div>
            <h2 className="guia-h2">Não comece no zero se a meta for performance</h2>
            <p className="guia-muted">Uma habilidade sem ponto inicial trabalha em aproximadamente 0,25× do XP base; 1 ponto dá 1×, 2 pontos ~1,33× e 3 ou mais ~1,66×.</p>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Pontos iniciais</th><th>Multiplicador</th><th>Opção para Entalhamento</th></tr>
                </thead>
                <tbody>
                  <tr><td>0</td><td>0,25×</td><td>Sem profissão/traço relacionado.</td></tr>
                  <tr><td>1</td><td>1×</td><td>Carpinteiro, Especialista em Faça-Você-Mesmo (DIY Expert), Guarda Florestal, Habilidade Manual (Handy) ou Sobrevivencialista (Bushcrafter).</td></tr>
                  <tr><td>2</td><td>~1,33×</td><td>Entalhador (Whittler) sozinho.</td></tr>
                  <tr><td>3+</td><td>~1,66×</td><td>Entalhador (Whittler) + profissão com +1.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert danger"><strong>Entalhador (Whittler) custa apenas 2 pontos e dá +2 Entalhamento.</strong> Para uma run focada em Entalhamento 10, é um investimento excepcional.</div>

            <h3 className="guia-h3">Calculadora de XP por fabricação</h3>
            <div className="guia-calc guia-no-print">
              <div className="guia-field">
                <label>XP base</label>
                <input type="number" value={xpBase} onChange={e => setXpBase(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Bônus inicial</label>
                <select value={boost} onChange={e => setBoost(+e.target.value)}>
                  <option value={0.25}>0 pts — 0,25×</option>
                  <option value={1}>1 pt — 1×</option>
                  <option value={1.33}>2 pts — 1,33×</option>
                  <option value={1.66}>3+ pts — 1,66×</option>
                </select>
              </div>
              <div className="guia-field">
                <label>Livro</label>
                <select value={book} onChange={e => setBook(+e.target.value)}>
                  <option value={1}>Sem livro</option>
                  <option value={3}>I — 3×</option>
                  <option value={5}>II — 5×</option>
                  <option value={8}>III — 8×</option>
                  <option value={12}>IV — 12×</option>
                  <option value={16}>V — 16×</option>
                </select>
              </div>
              <div className="guia-field">
                <label>XP global do campeonato</label>
                <input type="number" step={0.05} value={globalXp} onChange={e => setGlobalXp(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>XP da skill</label>
                <input type="number" step={0.05} value={skillXp} onChange={e => setSkillXp(+e.target.value)} />
              </div>
            </div>
            <p className="guia-sub">O multiplicador global está fixado inicialmente em <strong>0,8×</strong>, conforme o Brasileirão.</p>
            <div className="guia-calc-result">
              <span>XP estimado</span>
              <strong>{xpResult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XP</strong>
            </div>
          </section>

          {/* ── 3. Personagem ideal ── */}
          <section id="personagem" className="guia-section">
            <div className="guia-eyebrow">3 · Personagem ideal</div>
            <h2 className="guia-h2">Entalhador (Whittler) + uma profissão com +1</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">Entalhador (Whittler)</b>
                <div className="guia-metric">+2</div>
                <p className="guia-muted">Custa 2 pontos e também fornece conhecimento de várias receitas.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Carpinteiro / DIY / Guarda Florestal</b>
                <div className="guia-metric">+1</div>
                <p className="guia-muted">Leva o personagem a 3 pontos iniciais e ~1,66× XP-base.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Habilidoso (Fabricação)</b>
                <div className="guia-metric">+</div>
                <p className="guia-muted">Opcional para XP de fabricação. Conflita com Aprendizado Rápido (Fast Learner).</p>
              </div>
            </div>
            <div className="guia-alert">Se você já escolheu outra profissão por causa do campeonato, <strong>Entalhador (Whittler) sozinho</strong> ainda é excelente: começa com +2 e ~1,33× XP-base.</div>
          </section>

          {/* ── 4. Livros ── */}
          <section id="livros" className="guia-section">
            <div className="guia-eyebrow">4 · Livros</div>
            <h2 className="guia-h2">Leia antes de começar cada faixa</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Faixa</th><th>Livro</th><th>Páginas</th><th>Multiplicador</th></tr>
                </thead>
                <tbody>
                  <tr><td>1–2</td><td>Entalhamento I — Entalhamento para Iniciantes (Beginners Carving)</td><td>220</td><td>3×</td></tr>
                  <tr><td>3–4</td><td>Entalhamento II — Projetos Legais de Modelagem em Madeira! (Cool Woodshaping Projects!)</td><td>260</td><td>5×</td></tr>
                  <tr><td>5–6</td><td>Entalhamento III — Grinling Gibbons: Sua Vida e Obras (Grinling Gibbons: His Life and Works)</td><td>300</td><td>8×</td></tr>
                  <tr><td>7–8</td><td>Entalhamento IV — Técnicas Medievais de Entalhamento em Madeira e Osso (Medieval Wood and Bone Carving Techniques)</td><td>340</td><td>12×</td></tr>
                  <tr><td>9–10</td><td>Entalhamento V — A Arte e o Processo de Entalhar Materiais Naturais (The Art and Process of Natural Material Carving)</td><td>380</td><td>16×</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert warning"><strong>Saque 0,04:</strong> priorize livrarias, escolas, bibliotecas e estantes que já estejam na rota. Não cruze Louisville apenas por um volume se isso colocar a run em risco.</div>
          </section>

          {/* ── 5. Revistas ── */}
          <section id="revistas" className="guia-section">
            <div className="guia-eyebrow">5 · Revistas</div>
            <h2 className="guia-h2">As três mais importantes para a rota</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Revista</th><th>Prioridade</th><th>O que muda</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Entalhadores Pioneiros (Pioneering Carvers)</strong></td>
                    <td>★★★★★</td>
                    <td>Ensina Garfo de Madeira e outros objetos; completa o ciclo colher → garfo.</td>
                  </tr>
                  <tr>
                    <td><strong>Arsenal Medieval — Maio de 1993 (Medieval Armory — May 1993)</strong></td>
                    <td>★★★★★</td>
                    <td>Ensina Taco Curto, excelente no nível 7.</td>
                  </tr>
                  <tr>
                    <td><strong>O Brigão de Louisville (The Louisville Bruiser)</strong></td>
                    <td>★★★★☆</td>
                    <td>Ensina Taco de Beisebol entalhado no nível 9.</td>
                  </tr>
                  <tr>
                    <td>Uso de Ferramentas pelo Homem Primitivo (Tool Use of Early Man)</td>
                    <td>★★★☆☆</td>
                    <td>Ferramentas primitivas de madeira/osso.</td>
                  </tr>
                  <tr>
                    <td>Culturas da Pré-História (Cultures of Prehistory) / As Primeiras Armas (The First Weapons)</td>
                    <td>★★★☆☆</td>
                    <td>Expande opções de osso e armas primitivas.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert info">Algumas receitas também podem ser aprendidas por <strong>pesquisa de itens</strong>, traços ou níveis altos. Revista continua sendo o caminho mais direto.</div>
          </section>

          {/* ── 6. Kit mínimo ── */}
          <section id="kit" className="guia-section">
            <div className="guia-eyebrow">6 · Kit mínimo</div>
            <h2 className="guia-h2">O que levar para a base</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Prioridade</th><th>Item</th><th>Função</th></tr>
                </thead>
                <tbody>
                  <tr><td>★★★★★</td><td>3–6 facas afiadas</td><td>Grind contínuo sem interrupção.</td></tr>
                  <tr><td>★★★★★</td><td>Livros da faixa</td><td>Maior economia de tempo/material.</td></tr>
                  <tr><td>★★★★★</td><td>Entalhadores Pioneiros (Pioneering Carvers)</td><td>Permite a cadeia completa de talheres.</td></tr>
                  <tr><td>★★★★☆</td><td>Machado</td><td>Madeira em escala.</td></tr>
                  <tr><td>★★★★☆</td><td>Serra</td><td>1 tora → 3 tábuas.</td></tr>
                  <tr><td>★★★☆☆</td><td>Lima / pedra de amolar</td><td>Rota de osso.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert"><strong>Não precisa de:</strong> molde, forja, carvão, bancada, energia elétrica ou gerador.</div>
          </section>

          {/* ── 7. Facas ── */}
          <section id="faca" className="guia-section">
            <div className="guia-eyebrow">7 · Facas</div>
            <h2 className="guia-h2">Qualquer faca com a categoria de ferramenta de lâmina afiada pode servir</h2>
            <p className="guia-muted">Faca de pedra, faca simples de metal, faca de caça, faca de combate, faca de cozinha, navalha, machete, lasca de sílex afiada e outras lâminas compatíveis entram em muitas receitas.</p>
            <div className="guia-route">
              <span className="guia-node">Lâmina de Pedra</span><span className="guia-arrow">+</span>
              <span className="guia-node">Cabo Pequeno</span><span className="guia-arrow">+</span>
              <span className="guia-node">Amarração</span><span className="guia-arrow">→</span>
              <span className="guia-node">Faca de Pedra</span>
            </div>
            <p className="guia-muted">A Faca de Pedra pode ser montada com Manutenção 1. Isso cria uma opção renovável quando facas de saque começam a acabar.</p>
            <div className="guia-alert warning"><strong>Não use sua melhor faca de combate para centenas de fabricações.</strong> Separe ferramentas de grind.</div>
          </section>

          {/* ── 8. Madeira ── */}
          <section id="madeira" className="guia-section">
            <div className="guia-eyebrow">8 · Madeira</div>
            <h2 className="guia-h2">Matéria-prima renovável</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">Galho de Árvore</b>
                <div className="guia-metric guia-good">S</div>
                <p className="guia-muted">Melhor para a cadeia econômica.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Tábua</b>
                <div className="guia-metric">A</div>
                <p className="guia-muted">Uma tábua pode virar 12 Cabos Pequenos.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Galho Grande</b>
                <div className="guia-metric">A</div>
                <p className="guia-muted">Serve para tábua e receitas tardias.</p>
              </div>
            </div>
            <div className="guia-route">
              <span className="guia-node">1 Tora</span><span className="guia-arrow">+</span>
              <span className="guia-node">Serra</span><span className="guia-arrow">→</span>
              <span className="guia-node">3 Tábuas</span>
            </div>
            <div className="guia-route">
              <span className="guia-node">1 Tábua</span><span className="guia-arrow">+</span>
              <span className="guia-node">Faca</span><span className="guia-arrow">→</span>
              <span className="guia-node">12 Cabos Pequenos</span>
            </div>
            <div className="guia-alert">No Brasileirão, prefira base próxima de floresta: depois da fase de livros/ferramentas, Entalhamento deixa de depender de saque.</div>
          </section>

          {/* ── 9. Ossos ── */}
          <section id="ossos" className="guia-section">
            <div className="guia-eyebrow">9 · Ossos</div>
            <h2 className="guia-h2">Rota paralela para quem caça ou cria animais</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Nível</th><th>Receita</th><th>XP base verificado</th><th>Extras</th></tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>Afiar Osso</td><td>10</td><td>Faca/serra + lima/pedra.</td></tr>
                  <tr><td>2</td><td>Afiar Osso Longo / Mandíbula</td><td>20</td><td>Faca/serra + lima/pedra.</td></tr>
                  <tr><td>2</td><td>Colher de Osso</td><td>20</td><td>Faca + lima/pedra.</td></tr>
                  <tr><td>3</td><td>Garfo de Osso</td><td>30</td><td>Receita aprendida.</td></tr>
                  <tr><td>3</td><td>Agulhas de Tricô</td><td>30</td><td>Pode usar osso ou madeira.</td></tr>
                  <tr><td>3</td><td>Cabeça de Machado de Guerra de Osso</td><td>30</td><td>Mais ferramentas e receita.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert warning">Madeira normalmente é melhor para rota rápida porque osso exige cadeia de animais. Use ossos quando já forem subproduto da base.</div>
          </section>

          {/* ── 10. Cadeia campeã ── */}
          <section id="cadeia" className="guia-section">
            <div className="guia-eyebrow">10 · Cadeia campeã</div>
            <h2 className="guia-h2">Um galho pode render cerca de 140 XP base</h2>
            <div className="guia-step">
              <div className="guia-step-num">1</div>
              <div className="guia-step-body">
                <h3>Galho → Haste de Madeira</h3>
                <p className="guia-muted">Primeira ação de XP.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">2</div>
              <div className="guia-step-body">
                <h3>Haste → 4 Cabos Pequenos</h3>
                <p className="guia-muted">Multiplica o número de peças.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">3</div>
              <div className="guia-step-body">
                <h3>4 Cabos → 4 Colheres</h3>
                <p className="guia-muted">No nível 1, a cadeia chega a aproximadamente 60 XP base por galho.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">4</div>
              <div className="guia-step-body">
                <h3>4 Colheres → 4 Garfos</h3>
                <p className="guia-muted">No nível 2, adiciona aproximadamente 80 XP base, totalizando ~140.</p>
              </div>
            </div>
            <div className="guia-alert"><strong>Eficiência máxima de material:</strong> a Build 42 permite usar a colher como entrada para o garfo, exatamente para aproveitar mais o mesmo material.</div>
            <h3 className="guia-h3">Rota de velocidade: Dados</h3>
            <p className="guia-muted">Entalhar Dados desbloqueia no nível 2, leva 100 ticks e usa Cabo Pequeno ou osso. Relatos atuais apontam ótimo XP por segundo. Use quando a prioridade for tempo real, não eficiência de madeira.</p>
          </section>

          {/* ── 11. Rota 0 → 10 ── */}
          <section id="rota" className="guia-section">
            <div className="guia-eyebrow">11 · Rota 0 → 10</div>
            <h2 className="guia-h2">Progressão recomendada</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Faixa</th><th>Melhor rota</th><th>Motivo</th></tr>
                </thead>
                <tbody>
                  <tr><td>0→1</td><td>Lanços/itens nível 0</td><td>5 XP base por várias receitas; Livro I é obrigatório para não sofrer com 0,25×.</td></tr>
                  <tr><td>1→2</td><td>Galho → Haste → Cabos → Colheres</td><td>~60 XP base/galho.</td></tr>
                  <tr><td>2→3</td><td>Colheres → Garfos</td><td>~140 XP base/galho no ciclo completo.</td></tr>
                  <tr><td>3→5</td><td>Continue Garfos em lote</td><td>Madeira é renovável e o método é simples.</td></tr>
                  <tr><td>5→7</td><td>Continue cadeia + livros III/IV</td><td>Multiplicador de livro importa mais que receita nova.</td></tr>
                  <tr><td>7→9</td><td><strong>Taco Curto</strong></td><td>70 XP base em 300 ticks; ótimo XP por tempo.</td></tr>
                  <tr><td>9→10</td><td>Taco Curto / Taco de Beisebol</td><td>Livro V 16×; escolha pelo estoque e receitas conhecidas.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert info"><strong>Não existe obrigação de "subir receita".</strong> Se a cadeia de talheres é segura e abundante, ela continua válida até 10. O Taco Curto apenas melhora bastante o XP por tempo.</div>
          </section>

          {/* ── 12. Fim da progressão ── */}
          <section id="late" className="guia-section">
            <div className="guia-eyebrow">12 · Fim da progressão</div>
            <h2 className="guia-h2">Taco Curto e Taco de Beisebol</h2>
            <div className="guia-grid2">
              <div className="guia-card">
                <b className="guia-card-title">Taco Curto</b>
                <div className="guia-metric">70 XP</div>
                <ul style={{ paddingLeft: '18px', margin: '8px 0', color: 'var(--text-2)' }}>
                  <li>Entalhamento 7</li>
                  <li>300 ticks</li>
                  <li>Tábua, galho, galho grande ou tacos compatíveis</li>
                  <li>Faca/cutelo</li>
                  <li>Receita: Arsenal Medieval — Maio de 1993 (Medieval Armory — May 1993)</li>
                </ul>
                <span className="guia-rank">S para XP por tempo</span>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Taco de Beisebol Entalhado</b>
                <div className="guia-metric">Nível 9</div>
                <ul style={{ paddingLeft: '18px', margin: '8px 0', color: 'var(--text-2)' }}>
                  <li>600 ticks</li>
                  <li>Galho Grande</li>
                  <li>Faca/cutelo</li>
                  <li>Receita: O Brigão de Louisville (The Louisville Bruiser)</li>
                </ul>
                <span className="guia-rank">Produto útil</span>
              </div>
            </div>
            <div className="guia-alert warning">O Taco Curto é menos eficiente por madeira que o ciclo completo dos talheres, porém reduz muito a quantidade de ações. Se você tem floresta segura, normalmente vale migrar.</div>
          </section>

          {/* ── 13. Brasileirão ── */}
          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow">13 · Brasileirão</div>
            <h2 className="guia-h2">Rota operacional</h2>
            <div className="guia-step">
              <div className="guia-step-num">1</div>
              <div className="guia-step-body">
                <h3>Uma grande incursão de saque</h3>
                <p className="guia-muted">Livros, Entalhadores Pioneiros (Pioneering Carvers), facas, serra e machado.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">2</div>
              <div className="guia-step-body">
                <h3>Base na floresta/periferia</h3>
                <p className="guia-muted">Leve o grind para longe da densidade urbana.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">3</div>
              <div className="guia-step-body">
                <h3>Estoque primeiro</h3>
                <p className="guia-muted">Corte dezenas de galhos/tábuas antes de começar.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">4</div>
              <div className="guia-step-body">
                <h3>Livro completo</h3>
                <p className="guia-muted">Leia o volume antes da sessão.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">5</div>
              <div className="guia-step-body">
                <h3>Fabricação em lotes</h3>
                <p className="guia-muted">Todos os rods → todos os cabos → todas as colheres → todos os garfos.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">6</div>
              <div className="guia-step-body">
                <h3>Nível 7</h3>
                <p className="guia-muted">Decida: economia de madeira = talheres; máxima velocidade = Taco Curto.</p>
              </div>
            </div>
            <div className="guia-alert danger">Não faça uma incursão perigosa por uma revista tardia se a cadeia renovável já está funcionando. No campeonato, sobreviver é mais importante que poupar alguns minutos de fabricação.</div>
          </section>

          {/* ── 14. Erros comuns ── */}
          <section id="erros" className="guia-section">
            <div className="guia-eyebrow">14 · Erros comuns</div>
            <h2 className="guia-h2">O que evitar</h2>
            <details className="guia-details" open>
              <summary>Grindar com 0 pontos e sem livro</summary>
              <div className="guia-details-body"><p className="guia-muted">Você fica preso em 0,25× do XP-base. Entalhador (Whittler) e livros transformam completamente a skill.</p></div>
            </details>
            <details className="guia-details">
              <summary>Jogar fora a colher no nível 2+</summary>
              <div className="guia-details-body"><p className="guia-muted">Transforme-a em garfo para uma segunda rodada de XP.</p></div>
            </details>
            <details className="guia-details">
              <summary>Usar uma faca rara até quebrar</summary>
              <div className="guia-details-body"><p className="guia-muted">Separe facas de trabalho e mantenha reservas.</p></div>
            </details>
            <details className="guia-details">
              <summary>Fazer viagens constantes por madeira</summary>
              <div className="guia-details-body"><p className="guia-muted">Madeira deve ser produzida localmente em lotes.</p></div>
            </details>
            <details className="guia-details">
              <summary>Trocar de receita só porque subiu de nível</summary>
              <div className="guia-details-body"><p className="guia-muted">Talheres continuam excelentes; receita mais avançada só vale se melhorar seu objetivo de tempo/material.</p></div>
            </details>
          </section>

          {/* ── 15. Fontes ── */}
          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow">15 · Fontes e versão</div>
            <h2 className="guia-h2">Base técnica usada neste manual</h2>
            <p className="guia-muted">Consolidado em 4 de setembro de 2026. Versão estável oficial: <strong>42.20.4</strong>.</p>
            <ol style={{ paddingLeft: '20px', margin: '12px 0 0' }}>
              {[
                ['https://projectzomboid.com/version_announce/', 'The Indie Stone — versão atual.'],
                ['https://projectzomboid.com/blog/features-overview-build-42-20/', 'The Indie Stone — Build 42.20.'],
                ['https://pzfans.com/en/wiki/skills/Carving/', 'PZFans — Carving.'],
                ['https://pzfans.com/item-books/', 'PZFans — livros.'],
                ['https://pzfans.com/traits/', 'PZFans — traços.'],
                ['https://pz-guide.com/en/skill/carving/', 'PZ Guide — skill/receitas.'],
                ['https://pz-guide.com/en/item/Base.FlintKnife/', 'PZ Guide — Faca de Pedra.'],
                ['https://pzfans.com/en/wiki/recipes/Base/CarveShortBat/craftRecipe/', 'PZFans — Taco Curto.'],
                ['https://pzfans.com/en/wiki/recipes/Base/CarveBat/craftRecipe/', 'PZFans — Taco de Beisebol.'],
                ['https://pzfans.com/en/wiki/items/Base/PrimitiveToolMag3/', 'PZFans — Entalhadores Pioneiros (Pioneering Carvers).'],
                ['https://steamcommunity.com/sharedfiles/filedetails/?id=3712882796', 'Steam Community — guia Build 42.20.'],
              ].map(([href, text]) => (
                <li key={href} style={{ margin: '8px 0', color: 'var(--text-2)' }}>
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-light)' }}>{text}</a>
                </li>
              ))}
            </ol>
            <div className="guia-alert info"><strong>Resumo definitivo:</strong> livros + Whittler + faca + floresta transformam Entalhamento em uma das skills mais simples de fechar no Brasileirão.</div>
          </section>

          <footer className="guia-footer">
            Brasileirão de Project Zomboid · Manual Definitivo de Entalhamento 0–10 · Build 42.20.x · 10× zumbis · Água cortada no dia 1 · Energia cortada no dia 1 · XP global 0,8×.
          </footer>

        </main>
      </div>
    </div>
  );
}
