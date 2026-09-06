import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'xp',         label: '2. Como o XP funciona' },
  { id: 'personagem', label: '3. Personagem ideal' },
  { id: 'livros',     label: '4. Livros de Ferraria' },
  { id: 'revistas',   label: '5. Revistas e receitas' },
  { id: 'loot',       label: '6. Prioridade de saque' },
  { id: 'infra',      label: '7. Oficina do zero' },
  { id: 'carvao',     label: '8. Carvão' },
  { id: 'argila',     label: '9. Argila, cimento e moldes' },
  { id: 'ferramentas',label: '10. Ferramentas' },
  { id: 'ferro',      label: '11. Ferro e aço' },
  { id: 'ouro',       label: '12. Ouro' },
  { id: 'rota0',      label: '13. Rota 0 → 10' },
  { id: 'ferreiro',   label: '14. Rota Ferreiro' },
  { id: 'ouroloop',   label: '15. Ciclo do ouro' },
  { id: 'erros',      label: '16. Erros comuns' },
  { id: 'fontes',     label: '17. Fontes' },
];

export function GuiaFerraria() {
  const [compact, setCompact]   = useState(false);
  const [xpBase, setXpBase]     = useState(50);
  const [boost, setBoost]       = useState(1.66);
  const [book, setBook]         = useState(8);
  const [globalXp, setGlobalXp] = useState(0.8);
  const [skillXp, setSkillXp]   = useState(1);

  const xpResult  = xpBase * boost * book * globalXp * skillXp;

  return (
    <div className={`guia-page${compact ? ' guia-compact' : ''}`}>

      {/* ── Cabeçalho sticky ── */}
      <header className="guia-top">
        <div className="guia-top-inner">
          <div className="guia-brand">
            <Link to="/dicas" className="guia-back">
              <i className="ti ti-arrow-left" /> Guias
            </Link>
            <span className="guia-brand-label">BRASILEIRÃO PZ · FERRARIA</span>
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
            Base principal: Project Zomboid 42.20.4 estável. Valores de XP: arquivos vanilla 42.20.2; materiais de fundição: 42.20.3.
          </div>
        </aside>

        {/* ── Conteúdo principal ── */}
        <main className="guia-main">

          {/* Hero */}
          <div className="guia-hero">
            <div className="guia-eyebrow">Build 42.20.x · Português do Brasil · Brasileirão PZ</div>
            <h1 className="guia-h1">Manual Definitivo de Ferraria 0 → 10</h1>
            <p className="guia-muted">
              Do personagem sem nenhuma infraestrutura até uma oficina autossuficiente e Ferraria nível 10. O foco não é apenas "qual receita dá mais XP", mas <strong>qual sequência entrega o melhor XP por tempo, combustível, metal e risco de deslocamento</strong> nas condições extremas do Brasileirão.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">População elevada</span>
              <span className="guia-pill">Loot 0,04</span>
              <span className="guia-pill">Mínimo deslocamento</span>
              <span className="guia-pill">Máximo reaproveitamento</span>
              <span className="guia-pill">Build estável 42.20.4</span>
            </div>
          </div>

          <div className="guia-alert info">
            <strong>Configuração oficial do Brasileirão usada neste manual:</strong>{' '}
            <strong>população de zumbis 10×</strong>, <strong>água cortada no primeiro dia</strong>, <strong>energia cortada no primeiro dia</strong> e <strong>XP global 0,8×</strong>.
            As rotas, prioridades e estimativas devem ser lidas dentro desse cenário. Valores marcados como <strong>XP base</strong> continuam nas tabelas para comparação técnica, mas o ganho efetivo começa em <strong>XP base × 0,8</strong> antes dos demais bônus aplicáveis.
            Fórmula de referência: <strong>XP efetivo = XP base × 0,8 × bônus inicial × livro × modificadores específicos</strong>.
            Exemplo: 10 XP base → <strong>8 XP</strong> antes de livro/bônus; 70 XP base → <strong>56 XP</strong>.
          </div>

          {/* ── 01. Visão geral ── */}
          <section id="visao" className="guia-section">
            <div className="guia-eyebrow">01 · Visão geral</div>
            <h2 className="guia-h2">A lógica do guia</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">Objetivo</div>
                <div className="guia-big guia-good">10</div>
                <div className="guia-sub">Ferraria no máximo.</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">XP total 0→10</div>
                <div className="guia-big">32.775</div>
                <div className="guia-sub">Antes de multiplicadores.</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Gargalo</div>
                <div className="guia-big guia-gold">Carvão</div>
                <div className="guia-sub">Produza antes do grind.</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Maior risco</div>
                <div className="guia-big guia-red">Loot run</div>
                <div className="guia-sub">Evite viagens repetidas.</div>
              </div>
            </div>
            <div className="guia-alert">
              <strong>Princípio do Brasileirão:</strong> uma receita ligeiramente pior em XP pode ser muito melhor se você consegue repeti-la dentro da base com recurso renovável. A rota certa reduz a necessidade de entrar novamente em zonas densas.
            </div>
            <h3 className="guia-h3">Árvore principal de dependências</h3>
            <div className="guia-route">
              <span className="guia-node">Livros / Revistas</span><span className="guia-arrow">→</span>
              <span className="guia-node">Carvão</span><span className="guia-arrow">→</span>
              <span className="guia-node">Bigorna de Pedra</span><span className="guia-arrow">→</span>
              <span className="guia-node">Forja Primitiva</span><span className="guia-arrow">→</span>
              <span className="guia-node">Ferramentas Metálicas</span><span className="guia-arrow">→</span>
              <span className="guia-node">Estoque de Ferro/Aço</span><span className="guia-arrow">→</span>
              <span className="guia-node">Grind por faixa</span><span className="guia-arrow">→</span>
              <span className="guia-node">Nível 10</span>
            </div>
            <div className="guia-alert warning">
              <strong>Terminologia:</strong> a tradução PT-BR atual usa "Ferraria" para <em>Blacksmithing</em>. Alguns jogadores e guias ainda chamam de Forja/Metalurgia. Neste manual, "Ferraria" é a habilidade e "forja" é a estação/processo.
            </div>
          </section>

          {/* ── 02. XP ── */}
          <section id="xp" className="guia-section">
            <div className="guia-eyebrow">02 · XP</div>
            <h2 className="guia-h2">Entenda o multiplicador antes de gastar um único carvão</h2>
            <p className="guia-muted">Para habilidades regulares, o jogo exige 32.775 XP acumulados para chegar ao nível 10. O ganho de uma ação é aproximadamente: <strong>XP base da receita × bônus inicial da habilidade × livro × multiplicadores de sandbox</strong>.</p>

            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Nível alcançado</th><th>XP para esse nível</th><th>XP acumulado</th></tr></thead>
                <tbody>
                  {[
                    [1, '75', '75'], [2, '150', '225'], [3, '300', '525'],
                    [4, '750', '1.275'], [5, '1.500', '2.775'], [6, '3.000', '5.775'],
                    [7, '4.500', '10.275'], [8, '6.000', '16.275'], [9, '7.500', '23.775'],
                    [10, '9.000', '32.775'],
                  ].map(([n, xp, acc]) => (
                    <tr key={n}><td>{n}</td><td>{xp}</td><td>{acc}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="guia-h3">Bônus inicial permanente da habilidade</h3>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Pontos/nível inicial na habilidade</th><th>Multiplicador</th><th>Velocidade vs. sem investimento</th></tr></thead>
                <tbody>
                  <tr><td>0</td><td><strong>0,25×</strong></td><td>1×</td></tr>
                  <tr><td>1</td><td><strong>1,00×</strong></td><td>4×</td></tr>
                  <tr><td>2</td><td><strong>1,33×</strong></td><td>~5,3×</td></tr>
                  <tr><td>3 ou mais</td><td><strong>1,66×</strong></td><td>~6,6×</td></tr>
                </tbody>
              </table>
            </div>

            <div className="guia-alert danger">
              <strong>Isso muda tudo:</strong> o número "XP base" nos arquivos de receita não é necessariamente o XP que um personagem sem investimento verá. Um personagem com Ferraria 0 de criação usa a faixa 0,25×. Ferreiro começa com +4 e usa 1,66×.
            </div>

            <h3 className="guia-h3">Calculadora rápida de XP por fabricação</h3>
            <div className="guia-calc guia-no-print">
              <div className="guia-field">
                <label>XP base da receita</label>
                <input type="number" value={xpBase} min={0} step={1} onChange={e => setXpBase(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Bônus inicial</label>
                <select value={boost} onChange={e => setBoost(+e.target.value)}>
                  <option value={0.25}>0 pontos — 0,25×</option>
                  <option value={1}>1 ponto — 1,00×</option>
                  <option value={1.33}>2 pontos — 1,33×</option>
                  <option value={1.66}>3+ pontos — 1,66×</option>
                </select>
              </div>
              <div className="guia-field">
                <label>Livro</label>
                <select value={book} onChange={e => setBook(+e.target.value)}>
                  <option value={1}>Sem livro — 1×</option>
                  <option value={3}>Vol. I — 3×</option>
                  <option value={5}>Vol. II — 5×</option>
                  <option value={8}>Vol. III — 8×</option>
                  <option value={12}>Vol. IV — 12×</option>
                  <option value={16}>Vol. V — 16×</option>
                </select>
              </div>
              <div className="guia-field">
                <label>XP global do campeonato</label>
                <input type="number" value={globalXp} min={0.01} step={0.05} onChange={e => setGlobalXp(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>XP específico da skill</label>
                <input type="number" value={skillXp} min={0.01} step={0.05} onChange={e => setSkillXp(+e.target.value)} />
              </div>
            </div>
            <div className="guia-calc-result">
              <span>XP estimado por fabricação:</span>
              <strong>{xpResult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XP</strong>
            </div>
          </section>

          {/* ── 03. Personagem ── */}
          <section id="personagem" className="guia-section">
            <div className="guia-eyebrow">03 · Personagem</div>
            <h2 className="guia-h2">A escolha mais rápida: Ferreiro</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">Ferraria +4</b>
                <div className="guia-metric">1,66×</div>
                <div className="guia-sub">Já começa no nível 4 e no teto do bônus inicial.</div>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Manutenção +1</b>
                <div className="guia-metric">+</div>
                <div className="guia-sub">Ajuda com o uso prolongado de ferramentas e armas.</div>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Conhecimento de Ferreiro</b>
                <div className="guia-metric">⚒</div>
                <div className="guia-sub">Concede um pacote amplo de conhecimento de forja/fornos.</div>
              </div>
            </div>
            <p className="guia-muted">Se a meta do personagem é especificamente fazer Ferraria 10, nenhuma rota partindo do zero compete com o ganho de tempo de começar como Ferreiro. Ele pula os quatro primeiros níveis e recebe muito mais XP por cada ação durante toda a campanha.</p>
            <div className="guia-alert warning">Se o regulamento/estratégia exigir outra profissão, o manual ainda funciona. Apenas espere um grind muito maior porque Ferraria sem ponto inicial fica em 0,25×.</div>
          </section>

          {/* ── 04. Livros ── */}
          <section id="livros" className="guia-section">
            <div className="guia-eyebrow">04 · Livros</div>
            <h2 className="guia-h2">Leia o volume correto antes de cada bloco de grind</h2>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Faixa prática</th><th>Livro</th><th>Páginas</th><th>Multiplicador máximo</th><th>Regra</th></tr></thead>
                <tbody>
                  <tr><td>0 → 2</td><td>Ferraria I — "Elementary Forge Practice"</td><td>220</td><td><strong>3×</strong></td><td>Leia antes de produzir em série.</td></tr>
                  <tr><td>2 → 4</td><td>Ferraria II — "General Purpose Blacksmithing"</td><td>260</td><td><strong>5×</strong></td><td>Não atravesse esta faixa sem ele se puder evitar.</td></tr>
                  <tr><td>4 → 6</td><td>Ferraria III — "Old West Smiths and Their Secrets"</td><td>300</td><td><strong>8×</strong></td><td>Livro inicial do Ferreiro.</td></tr>
                  <tr><td>6 → 8</td><td>Ferraria IV — "Really Hard Steel Co. Workers Handbook"</td><td>340</td><td><strong>12×</strong></td><td>Essencial no trecho caro.</td></tr>
                  <tr><td>8 → 10</td><td>Ferraria V — "The Complete Encyclopedia of Metallurgy"</td><td>380</td><td><strong>16×</strong></td><td>Maior economia de carvão e metal.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert"><strong>Dica de performance:</strong> a progressão do multiplicador acompanha a leitura. Não precisa terminar tudo numa sessão, mas para grind planejado o ideal é concluir o volume antes de começar.</div>
          </section>

          {/* ── 05. Revistas ── */}
          <section id="revistas" className="guia-section">
            <div className="guia-eyebrow">05 · Revistas e receitas</div>
            <h2 className="guia-h2">Livro dá XP. Revista ensina receita. Não confunda.</h2>
            <p className="guia-muted">A maior causa de "a receita não aparece" é não ter aprendido a revista/esquema correspondente. Para uma run de loot 0,04, revistas são loot de prioridade máxima porque eliminam bloqueios tecnológicos.</p>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Revista</th><th>Prioridade</th><th>Desbloqueios importantes</th><th>Por que importa para o 0→10</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Iron Age Blacksmithing</strong></td>
                    <td><span className="guia-risk r1">CRÍTICA</span></td>
                    <td>Pilha/Poço de Carvão, Forja Primitiva, Forno Primitivo.</td>
                    <td>É o ponto de partida da cadeia autossuficiente.</td>
                  </tr>
                  <tr>
                    <td><strong>Everyday Smithing — June 1993</strong></td>
                    <td><span className="guia-risk r1">CRÍTICA</span></td>
                    <td>Tenaz, ferramenta de encabeçamento, fieira, pregos, cabeça de martelo, talhadeiras, punção, alicate, lima, trado.</td>
                    <td>Abre as ferramentas que reduzem dependência de loot.</td>
                  </tr>
                  <tr>
                    <td><strong>American Bladecraft</strong></td>
                    <td><span className="guia-risk r1">ALTA</span></td>
                    <td>Facas, facão, cutelo, machadinha, machados.</td>
                    <td>Libera várias receitas fortes de XP.</td>
                  </tr>
                  <tr>
                    <td><strong>Blunt Forge</strong></td>
                    <td><span className="guia-risk r1">ALTA</span></td>
                    <td>Martelo de unha, pé de cabra, marreta, martelo de bola, picareta.</td>
                    <td>Excelente para níveis altos e ferramentas.</td>
                  </tr>
                  <tr>
                    <td><strong>Everyday Smithing — April 1993</strong></td>
                    <td><span className="guia-risk r2">ALTA</span></td>
                    <td>Chapas, serra, pá, enxada, foices, tesoura de tosquia, lanterna.</td>
                    <td>Abre Lanterna 60 XP, Cabeça de Pá 70 XP e utilidades.</td>
                  </tr>
                  <tr>
                    <td><strong>Small-Scale Smithing</strong></td>
                    <td><span className="guia-risk r2">MÉDIA</span></td>
                    <td>Pinças, tesouras, maçaneta, dobradiça, navalha, anzóis, agulha, fivela.</td>
                    <td>Maçaneta é uma opção de 100 XP no nível 9.</td>
                  </tr>
                  <tr>
                    <td><strong>Everyday Smithing — May 1993</strong></td>
                    <td><span className="guia-risk r2">MÉDIA</span></td>
                    <td>Panelas, assadeiras, balde, chaleira, copos e utensílios.</td>
                    <td>Boas alternativas de XP e utilidade doméstica.</td>
                  </tr>
                  <tr>
                    <td><strong>Modern Blacksmithing at Home</strong></td>
                    <td><span className="guia-risk r2">MÉDIA</span></td>
                    <td>Forja Simples e Forja Avançada.</td>
                    <td>Necessária se sua rota exige bancada avançada.</td>
                  </tr>
                  <tr>
                    <td><strong>Medieval Blacksmithing</strong></td>
                    <td><span className="guia-risk r2">MÉDIA</span></td>
                    <td>Forno de Fundição e Alto-Forno.</td>
                    <td>Expande fundição e cadeia de aço.</td>
                  </tr>
                  <tr>
                    <td><strong>Medieval Armory — June 1993</strong></td>
                    <td><span className="guia-risk r3">SITUACIONAL</span></td>
                    <td>Espadas/espadas curtas simples, lâminas e pontas de lança.</td>
                    <td>Abre receitas de XP alto, porém mais caras.</td>
                  </tr>
                  <tr>
                    <td><strong>Medieval Armory — May 1993</strong></td>
                    <td><span className="guia-risk r3">SITUACIONAL</span></td>
                    <td>Cabeça de maça e armas contundentes medievais.</td>
                    <td>Alternativa de 75 XP no nível 7.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert info"><strong>Onde procurar revistas:</strong> priorize ferreiros, garagens/depósitos, unidades de armazenamento, lojas de ferramentas, livrarias, estantes e porta-revistas. Várias revistas de ferraria têm peso elevado em prateleiras de ferreiro e armazenamento de garagem.</div>
          </section>

          {/* ── 06. Loot ── */}
          <section id="loot" className="guia-section">
            <div className="guia-eyebrow">06 · Prioridade de saque</div>
            <h2 className="guia-h2">O que vale arriscar a vida para trazer</h2>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Prioridade</th><th>Item</th><th>Melhores categorias de local</th><th>Alternativa fabricável?</th></tr></thead>
                <tbody>
                  <tr><td>★★★★★</td><td><strong>Iron Age Blacksmithing</strong></td><td>Ferreiro, garagem/depósito, storage, livraria, loja de ferramentas.</td><td>Não. Ou conhecimento concedido pela profissão.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Ferraria III/IV/V</strong></td><td>Livrarias, bibliotecas, estantes, escolas e depósitos de literatura.</td><td>Não.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Tenaz / Alicate de Pressão</strong></td><td>Lojas de ferramentas, storage, garagem, ferreiro, joalheria.</td><td>Tenaz: sim, Ferraria 1 + receita.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Martelo de Bola</strong></td><td>Oficinas, fábricas, garagens, lojas de ferramentas.</td><td>Cabeça pode ser forjada no nível 4.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Talhadeira / Punção / Lima</strong></td><td>Fábricas, metal shop, tool store, knife factory, storage.</td><td>Sim, depois dos desbloqueios.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Balde</strong></td><td>Cozinhas, bares, padarias, banheiros, áreas de serviço.</td><td>Fabricável mais tarde; pegue cedo.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Pá</strong></td><td>Fazendas, logging, construção, garagem, lojas de jardinagem.</td><td>Sim, mas a ferramenta pronta acelera o início.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Joias de ouro/prata</strong></td><td>Joalheria, penhor, lojas de departamento, corpos e quartos.</td><td>Não precisa achar barra: joias viram fragmentos.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Ferro/aço pronto</strong></td><td>Fábricas, mecânicas, warehouses, garagens, depósitos.</td><td>Sim, via minério/sucata e fundição.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert danger"><strong>Loot 0,04:</strong> não faça "tour de casas" procurando uma ferramenta específica. Monte uma rota com locais de alta densidade de ferramentas/literatura e volte com o kit inteiro. O valor real da viagem é quantos gargalos você resolve de uma vez.</div>
          </section>

          {/* ── 07. Infra ── */}
          <section id="infra" className="guia-section">
            <div className="guia-eyebrow">07 · Oficina do zero</div>
            <h2 className="guia-h2">A sequência mínima para sair do nada</h2>

            <div className="guia-step">
              <div className="guia-step-num">1</div>
              <div className="guia-step-body">
                <h3>Aprenda Iron Age Blacksmithing</h3>
                <p className="guia-muted">Ela ensina as estruturas iniciais: fonte de carvão, Forno Primitivo e Forja Primitiva. Se você começou como Ferreiro, parte importante desse conhecimento já vem pela profissão.</p>
              </div>
            </div>

            <div className="guia-step">
              <div className="guia-step-num">2</div>
              <div className="guia-step-body">
                <h3>Faça ferramentas primitivas</h3>
                <ul>
                  <li><strong>Martelo de Pedra:</strong> Manutenção 1; 1 galho + 1 pedra + 2 amarrações simples; faca afiada mantida.</li>
                  <li><strong>Tenaz Simples de Madeira:</strong> sem nível; madeira + amarração; faca/cutelo mantido. <span className="guia-red">Pode quebrar durante ferraria.</span></li>
                  <li><strong>Bigorna de Pedra:</strong> Alvenaria 2; 1 pedra grande; martelo compatível mantido.</li>
                </ul>
              </div>
            </div>

            <div className="guia-step">
              <div className="guia-step-num">3</div>
              <div className="guia-step-body">
                <h3>Garanta uma fonte de carvão</h3>
                <p className="guia-muted">Construa a Pilha/Poço de Carvão usando uma ferramenta da classe de cavar sepultura (pá/enxada compatível). A estrutura não exige uma lista cara de materiais de construção — a ferramenta é mantida.</p>
              </div>
            </div>

            <div className="guia-step">
              <div className="guia-step-num">4</div>
              <div className="guia-step-body">
                <h3>Faça um balde de cimento de argila ou concreto</h3>
                <p className="guia-muted">Para cimento de argila: 1 balde + 10 unidades de água + 2 argilas + 1 saco de areia; ou substitua a areia por 50 cortes de grama/feno na receita alternativa. O balde-base é transformado no balde cheio.</p>
              </div>
            </div>

            <div className="guia-step">
              <div className="guia-step-num">5</div>
              <div className="guia-step-body">
                <h3>Construa o Forno Primitivo, se for gerar ferro por minério</h3>
                <p><strong>6 Argilas + 4 Pedras + 1 balde de cimento/concreto.</strong></p>
                <p className="guia-sub">O forno é a etapa de extração do minério/bloom. Se você já trouxe bastante metal pronto e só quer forjar, pode adiar esta estrutura.</p>
              </div>
            </div>

            <div className="guia-step">
              <div className="guia-step-num">6</div>
              <div className="guia-step-body">
                <h3>Construa a Forja Primitiva</h3>
                <p><strong>1 balde de cimento/concreto + 10 Pedras + 1 Bigorna de Pedra.</strong></p>
                <p className="guia-sub">A Bigorna de Pedra é consumida na construção. A estação é a bancada; a bigorna não fica como bancada separada.</p>
              </div>
            </div>

            <div className="guia-alert"><strong>Resultado:</strong> nesse ponto você já tem a estrutura necessária para grande parte da progressão inicial de Ferraria e para o ciclo de metais preciosos.</div>

            <details className="guia-details">
              <summary>Estruturas avançadas — quando realmente vale a pena</summary>
              <div className="guia-details-body">
                <div className="guia-tablewrap">
                  <table>
                    <thead><tr><th>Estrutura</th><th>Materiais principais</th><th>Desbloqueio</th><th>Quando fazer</th></tr></thead>
                    <tbody>
                      <tr><td>Forno de Fundição</td><td>40 Blocos de Pedra + 1 cimento/concreto; colher de pedreiro mantida.</td><td>Medieval Blacksmithing</td><td>Quando a cadeia de fundição avançada passa a ser necessária.</td></tr>
                      <tr><td>Forja Simples</td><td>30 Blocos de Pedra + cimento + Bigorna de Ferreiro + Balde de Madeira + Tora; colher mantida.</td><td>Modern Blacksmithing at Home</td><td>Para receitas que exigem estação acima da primitiva.</td></tr>
                      <tr><td>Forja Avançada</td><td>Mesmo da simples + Fole Grande.</td><td>Modern Blacksmithing at Home</td><td>Receitas avançadas, lâminas/armaduras específicas.</td></tr>
                      <tr><td>Alto-Forno</td><td>40 Blocos de Pedra + cimento + Fole Grande; colher mantida.</td><td>Medieval Blacksmithing</td><td>Aço e cadeia de fundição avançada.</td></tr>
                      <tr><td>Forno em Cúpula</td><td>40 Blocos de Pedra + cimento; colher mantida.</td><td>Conhecimento/receita</td><td>Produção de coque e carvão em escala.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </section>

          {/* ── 08. Carvão ── */}
          <section id="carvao" className="guia-section">
            <div className="guia-eyebrow">08 · Carvão</div>
            <h2 className="guia-h2">Transforme madeira renovável em combustível de Ferraria</h2>
            <p className="guia-muted">Carvão de Madeira não depende de loot comum. Ele é fabricado. Isso é crucial para o Brasileirão: uma base perto de árvores pode sustentar sessões longas de ferraria sem novas incursões urbanas.</p>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Receita</th><th>Entrada</th><th>Saída</th><th>Uso recomendado</th></tr></thead>
                <tbody>
                  <tr><td>Queimar madeira em carvão</td><td>2 lotes de madeira compatível (ex: tora / conjunto equivalente de galhos ou tábuas)</td><td><strong>12 Carvões de Madeira</strong></td><td>Melhor fonte recorrente.</td></tr>
                  <tr><td>Madeira grande</td><td>9 itens grandes compatíveis</td><td><strong>12</strong></td><td>Use sobras de cabos, galhos e lanças.</td></tr>
                  <tr><td>Madeira média</td><td>12 itens médios compatíveis</td><td><strong>12</strong></td><td>Bom para lenha/sobras.</td></tr>
                  <tr><td>Madeira pequena</td><td>18 sucatas pequenas compatíveis</td><td><strong>12</strong></td><td>Converte lixo de carpintaria em combustível.</td></tr>
                </tbody>
              </table>
            </div>
            <h3 className="guia-h3">Estratégia de produção</h3>
            <div className="guia-route">
              <span className="guia-node">Cortar árvores</span><span className="guia-arrow">→</span>
              <span className="guia-node">Separar madeira útil</span><span className="guia-arrow">→</span>
              <span className="guia-node">Queimar lotes</span><span className="guia-arrow">→</span>
              <span className="guia-node">Estocar 100+</span><span className="guia-arrow">→</span>
              <span className="guia-node">Só então grindar</span>
            </div>
            <div className="guia-alert warning"><strong>Não comece uma sessão de grind com 10–20 carvões.</strong> Você interromperá a sessão no pior momento. Produza em lotes grandes e mantenha madeira seca/estoque perto da oficina.</div>
            <details className="guia-details">
              <summary>Coque: quando entra na cadeia</summary>
              <div className="guia-details-body">
                <p className="guia-muted">No Forno em Cúpula, <strong>8 carvão → 4 coque</strong>. O coque é importante em cadeias de aço/fundição específicas, mas não é necessário para a rota simples de Ferraria inicial nem para o ciclo de moedas.</p>
              </div>
            </details>
          </section>

          {/* ── 09. Argila ── */}
          <section id="argila" className="guia-section">
            <div className="guia-eyebrow">09 · Argila, cimento, cadinhos e moldes</div>
            <h2 className="guia-h2">Você precisa de moldes? Às vezes. Não para tudo.</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">Forja comum</b>
                <div className="guia-metric guia-good">NÃO</div>
                <div className="guia-sub">Lâminas, cabeças de ferramenta, moedas e várias peças são forjadas diretamente.</div>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Chapa de ouro</b>
                <div className="guia-metric guia-good">NÃO</div>
                <div className="guia-sub">10 fragmentos/moedas + carvão + ferramentas → chapa.</div>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Lingotes/fundição</b>
                <div className="guia-metric guia-gold">SIM</div>
                <div className="guia-sub">A cadeia de casting usa cadinhos e moldes cerâmicos.</div>
              </div>
            </div>
            <h3 className="guia-h3">Cimento de argila para estruturas iniciais</h3>
            <div className="guia-route">
              <span className="guia-node">Balde</span><span className="guia-arrow">+</span>
              <span className="guia-node">Água ×10</span><span className="guia-arrow">+</span>
              <span className="guia-node">Argila ×2</span><span className="guia-arrow">+</span>
              <span className="guia-node">Areia ×1 ou Grama/Feno ×50</span><span className="guia-arrow">→</span>
              <span className="guia-node">Balde de Cimento de Argila</span>
            </div>
            <h3 className="guia-h3">Molde cerâmico de lingote</h3>
            <div className="guia-route">
              <span className="guia-node">Argila</span><span className="guia-arrow">→</span>
              <span className="guia-node">Molde cru</span><span className="guia-arrow">→</span>
              <span className="guia-node">Queimar em forno de cerâmica</span><span className="guia-arrow">→</span>
              <span className="guia-node">Molde Cerâmico de Lingote</span>
            </div>
            <p className="guia-muted">O molde cerâmico final é <strong>mantido</strong> nas receitas de fundir lingotes de ferro/aço. O processo de queima do molde cru usa uma fonte de fogo e uma tora ou carvão.</p>
            <h3 className="guia-h3">Exemplo de fundição de lingote</h3>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Produto</th><th>Material fundido</th><th>Combustível</th><th>Molde</th><th>Ferramenta</th></tr></thead>
                <tbody>
                  <tr><td>Lingote de Ferro</td><td>12 cadinhos cerâmicos com ferro</td><td>12 carvão</td><td>Molde de Lingote compatível (mantido)</td><td>Tenaz (mantida)</td></tr>
                  <tr><td>Lingote de Aço</td><td>12 cadinhos com aço</td><td>12 carvão</td><td>Molde compatível (mantido)</td><td>Tenaz</td></tr>
                  <tr><td>Aço a partir de ferro</td><td>12 cadinhos com ferro</td><td>18 coque + 18 calcário</td><td>Molde cerâmico/aço</td><td>Tenaz</td></tr>
                </tbody>
              </table>
            </div>
            <details className="guia-details">
              <summary>Bigorna de Ferreiro: a cadeia avançada de molde</summary>
              <div className="guia-details-body">
                <ol style={{ paddingLeft: '20px', margin: '0' }}>
                  <li style={{ marginBottom: '8px', color: 'var(--text-2)' }}>Faça o <strong>Molde de Madeira da Bigorna</strong>: Carpintaria 2; 4 tábuas + prego(s); martelo e serra mantidos.</li>
                  <li style={{ marginBottom: '8px', color: 'var(--text-2)' }}>Na prensa manual, use <strong>8 argilas</strong> com o molde de madeira para criar o molde cru.</li>
                  <li style={{ marginBottom: '8px', color: 'var(--text-2)' }}>Queime o molde em forno de cerâmica grande para virar <strong>Molde Cerâmico de Bigorna</strong>.</li>
                  <li style={{ color: 'var(--text-2)' }}>Na fundição, use o molde + tenaz + <strong>10 carvão</strong> + grande volume de ferro em cadinhos para fundir a Bigorna de Ferreiro.</li>
                </ol>
                <p className="guia-sub" style={{ marginTop: '12px' }}>Essa cadeia é avançada. Para simplesmente chegar ao nível 10, não a construa cedo sem uma receita que realmente exija a estação superior.</p>
              </div>
            </details>
          </section>

          {/* ── 10. Ferramentas ── */}
          <section id="ferramentas" className="guia-section">
            <div className="guia-eyebrow">10 · Ferramentas</div>
            <h2 className="guia-h2">Kit completo: onde pegar, como substituir e quando fabricar</h2>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Ferramenta</th><th>Como obter cedo</th><th>Como fabricar</th><th>Receita / nível</th><th>Prioridade</th></tr></thead>
                <tbody>
                  <tr><td><strong>Tenaz de Ferreiro</strong></td><td>Lareiras/fogões a lenha, lojas de ferramentas, laboratório/escola, ferreiro, garagem, storage, joalheria.</td><td>3 carvão + 2 quartos de barra + martelo + tenaz/alicate provisório.</td><td>Ferraria 1; precisa ser aprendida (Everyday Smithing — June) ou autoaprendida mais tarde.</td><td>★★★★★</td></tr>
                  <tr><td><strong>Tenaz Simples de Madeira</strong></td><td>Fabrique na natureza/base.</td><td>Madeira compatível + amarração; faca/cutelo mantido.</td><td>Sem nível/revista.</td><td>★★★★★ bootstrap</td></tr>
                  <tr><td><strong>Martelo de Pedra</strong></td><td>Fabrique.</td><td>Galho + pedra + 2 amarrações.</td><td>Manutenção 1.</td><td>★★★★★ bootstrap</td></tr>
                  <tr><td><strong>Martelo de Bola</strong></td><td>Oficinas, garagens, fábricas, lojas de ferramentas.</td><td>Forje cabeça (4 carvão + chunk perfurado + martelo + tenaz + punção), depois monte com cabo.</td><td>Cabeça: Ferraria 4; Blunt Forge.</td><td>★★★★★</td></tr>
                  <tr><td><strong>Alicate de Pressão</strong></td><td>Autopeças, penhores, reparo de relógios, caixas/armários de ferramentas.</td><td>Não há receita direta para Vise Grips.</td><td>Loot.</td><td>★★★★☆</td></tr>
                  <tr><td><strong>Alicate para Metalurgia</strong></td><td>Fábricas/metal shops/tool stores.</td><td>Receita de Ferraria 4.</td><td>Everyday Smithing — June.</td><td>★★★★☆</td></tr>
                  <tr><td><strong>Talhadeira para Metal</strong></td><td>Metal shop, fábricas, tool store, garagem/storage.</td><td>3 carvão + meia barra + martelo + tenaz + lima/pedra de amolar.</td><td>Ferraria 4; revista de ferramentas.</td><td>★★★★☆</td></tr>
                  <tr><td><strong>Punção para Metalurgia</strong></td><td>Oficinas/fábricas/ferreiro.</td><td>Forjável após desbloqueio.</td><td>Ferraria 1; Everyday Smithing — June.</td><td>★★★★☆</td></tr>
                  <tr><td><strong>Conjunto de Limas Pequenas</strong></td><td>Tool store, fábrica, garagem, knife factory, oficina.</td><td>2 carvão + 2 quartos de barra de aço + martelo + alicate/tenaz + serra/talhadeira + cabo.</td><td>Ferraria 6; precisa ser aprendida.</td><td>★★★☆☆</td></tr>
                  <tr><td><strong>Pá</strong></td><td>Fazendas, logging, construção, garagens, lojas de jardinagem.</td><td>Cabeça de pá pode ser forjada e montada.</td><td>Cabeça forte de XP no nível 6.</td><td>★★★★☆</td></tr>
                  <tr><td><strong>Balde</strong></td><td>Cozinhas comerciais, padarias, bares, banheiros, áreas de serviço.</td><td>Forjável com chapa de aço + carvão + fio.</td><td>Ferraria 3; receita aprendida.</td><td>★★★★☆ cedo</td></tr>
                  <tr><td><strong>Colher de Pedreiro</strong></td><td>Construção, ferramentas, garagem.</td><td>Forjável; também existe opção de madeira em tags de algumas construções.</td><td>Importante para forjas/fornos avançados.</td><td>★★★☆☆</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert"><strong>Bootstrap recomendado:</strong> faca → Tenaz Simples de Madeira + Martelo de Pedra → Forja Primitiva → Tenaz metálica → punção/talhadeira/alicate → ferramentas avançadas. Isso evita depender de encontrar o kit perfeito no loot.</div>
          </section>

          {/* ── 11. Ferro e aço ── */}
          <section id="ferro" className="guia-section">
            <div className="guia-eyebrow">11 · Ferro e aço</div>
            <h2 className="guia-h2">Três formas de abastecer o grind</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">1. Loot pronto</b>
                <p className="guia-muted">Barras, quartos de barra, chunks, ferramentas e peças em fábricas, depósitos, garagens e oficinas. É o caminho mais rápido se a rota já estiver segura.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">2. Reciclar objetos</b>
                <p className="guia-muted">Muitos objetos de ferro/aço podem ser fundidos ou desmontados em chunks. Excelente para transformar loot ruim em matéria-prima útil.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">3. Minério → Bloom → Chunks</b>
                <p className="guia-muted">Rota renovável/selvagem: minério de ferro + carvão no Forno Primitivo, depois extração na Forja Primitiva.</p>
              </div>
            </div>
            <h3 className="guia-h3">Rota de minério</h3>
            <div className="guia-route">
              <span className="guia-node">1 Minério de Ferro</span><span className="guia-arrow">+</span>
              <span className="guia-node">8 carvão</span><span className="guia-arrow">→</span>
              <span className="guia-node">Iron Bloom</span><span className="guia-arrow">+</span>
              <span className="guia-node">4 carvão</span><span className="guia-arrow">→</span>
              <span className="guia-node">12 chunks de ferro</span>
            </div>
            <h3 className="guia-h3">Objetos interessantes para reciclar em ferro</h3>
            <p className="guia-muted">A lista vanilla 42.20.3 inclui muitos itens. Alguns exemplos úteis:</p>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Objeto</th><th>Retorno de referência</th><th>Comentário</th></tr></thead>
                <tbody>
                  <tr><td>Sucata metálica / faca pequena / ralador / ferramentas pequenas</td><td>~1 chunk</td><td>Itens pequenos que podem deixar de ser úteis.</td></tr>
                  <tr><td>Tenaz, talhadeira, lima, cabeça de pá, cabeça de maça</td><td>~2 chunks</td><td>Não recicle suas ferramentas principais; use excedentes/danificadas.</td></tr>
                  <tr><td>Tubo metálico e algumas lâminas maiores</td><td>~3 chunks</td><td>Boa densidade de matéria-prima.</td></tr>
                  <tr><td>Peças/objetos grandes compatíveis</td><td>até ~4 chunks ou mais dependendo da categoria</td><td>Ótimos quando já seriam descartados.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert warning"><strong>Não destrua uma ferramenta rara para ganhar metal comum.</strong> No loot 0,04, uma Talhadeira ou Tenaz reserva pode valer mais do que os chunks recuperados.</div>
          </section>

          {/* ── 12. Ouro ── */}
          <section id="ouro" className="guia-section">
            <div className="guia-eyebrow">12 · Ouro</div>
            <h2 className="guia-h2">Como conseguir ouro sem encontrar uma barra de ouro</h2>
            <p className="guia-muted">A forma mais prática é coletar joias. Anéis, brincos, colares, pulseiras e piercings dourados aparecem como objetos convertíveis em fragmentos de ouro.</p>
            <h3 className="guia-h3">Onde procurar</h3>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">Joalherias</b>
                <div className="guia-metric">S</div>
                <div className="guia-sub">Melhor concentração temática. Balcões e estoque.</div>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Lojas de penhores</b>
                <div className="guia-metric">A</div>
                <div className="guia-sub">Mistura joias com ferramentas úteis.</div>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Corpos / casas / lojas</b>
                <div className="guia-metric">B</div>
                <div className="guia-sub">Pegue quando encontrar, mas não faça rota aleatória só por isso.</div>
              </div>
            </div>
            <h3 className="guia-h3">Desmontando joias</h3>
            <p className="guia-muted">Joias válidas podem ser sucateadas usando ferramentas compatíveis como serra pequena, alicate, alicate de metalurgia, tesoura de chapa ou ferramenta equivalente. Muitas peças pequenas rendem <strong>1 fragmento de ouro</strong>; peças forjadas maiores podem render mais.</p>
            <h3 className="guia-h3">Fazendo a primeira Chapa de Ouro</h3>
            <div className="guia-route">
              <span className="guia-node">10 Fragmentos de Ouro</span><span className="guia-arrow">+</span>
              <span className="guia-node">1 Carvão</span><span className="guia-arrow">+</span>
              <span className="guia-node">Martelo</span><span className="guia-arrow">+</span>
              <span className="guia-node">Tenaz</span><span className="guia-arrow">→</span>
              <span className="guia-node">1 Chapa de Ouro</span>
            </div>
            <ul style={{ paddingLeft: '20px', margin: '10px 0 0' }}>
              <li style={{ color: 'var(--text-2)', marginBottom: '4px' }}><strong>Ferraria necessária:</strong> nível 1.</li>
              <li style={{ color: 'var(--text-2)', marginBottom: '4px' }}><strong>Estação:</strong> Forja Primitiva.</li>
              <li style={{ color: 'var(--text-2)', marginBottom: '4px' }}><strong>Molde:</strong> <span className="guia-good"><strong>não precisa.</strong></span></li>
              <li style={{ color: 'var(--text-2)' }}><strong>Ferramentas:</strong> martelo compatível + tenaz, mantidos (podem sofrer desgaste leve).</li>
            </ul>
            <div className="guia-alert"><strong>Resumo:</strong> 10 joias pequenas de ouro válidas podem ser suficientes para criar a primeira chapa, sem barra de ouro e sem molde.</div>
          </section>

          {/* ── 13. Rota 0→10 ── */}
          <section id="rota0" className="guia-section">
            <div className="guia-eyebrow">13 · Speedrun normal</div>
            <h2 className="guia-h2">Rota de Ferraria 0 → 10 sem depender do ciclo infinito</h2>
            <p className="guia-muted">Os XP abaixo são os valores base das receitas vanilla da Build 42.20.2, antes do bônus inicial, livros e sandbox. A escolha "principal" busca um equilíbrio entre XP alto e materiais razoáveis; a alternativa existe para quando revista/ferramenta específica estiver faltando.</p>
            <div className="guia-tablewrap">
              <table>
                <thead><tr><th>Nível</th><th>Receita principal</th><th>XP base</th><th>Alternativas</th><th>O que verificar antes</th></tr></thead>
                <tbody>
                  <tr><td><strong>0 → 1</strong></td><td>Forjar Lâmina Simples</td><td><strong>25</strong></td><td>2 Colheres (15); preparar quartos/barras (10).</td><td>Carvão + metal + martelo + tenaz provisória.</td></tr>
                  <tr><td><strong>1 → 2</strong></td><td>Forjar Faca Pequena</td><td><strong>35</strong></td><td>Tenaz/Fieira/Punção/Moedas (25).</td><td>Se a Faca Pequena estiver desbloqueada; aproveite para fabricar ferramentas.</td></tr>
                  <tr><td><strong>2 → 3</strong></td><td>Colheres Refinadas / Facas de Manteiga Refinadas</td><td><strong>35</strong></td><td>Versões de metal precioso (35).</td><td>Prefira baixo consumo de metal.</td></tr>
                  <tr><td><strong>3 → 4</strong></td><td>Lâmina Longa Simples / Talhadeira de Pedreiro</td><td><strong>45</strong></td><td>Garfos Refinados (40); Balde (40).</td><td>Revista e ferramentas exigidas.</td></tr>
                  <tr><td><strong>4 → 5</strong></td><td>Cabeça de Machadinha</td><td><strong>50</strong></td><td>Várias ferramentas e lâminas de 45.</td><td>American Bladecraft; avalie consumo de metal.</td></tr>
                  <tr><td><strong>5 → 6</strong></td><td>Lanterna</td><td><strong>60</strong></td><td>Dobradiça/Trado/Faca de Caça/Chave Inglesa/Gadanha (50).</td><td>Lanterna usa chapas; se forem caras, use receita de 50 com estoque abundante.</td></tr>
                  <tr><td><strong>6 → 7</strong></td><td>Cabeça de Pá ou Cabeça de Machado</td><td><strong>70</strong></td><td>Adaga/espada curta simples (60); Limas Pequenas (50).</td><td>Pode exigir bloco/chunk perfurado e punção.</td></tr>
                  <tr><td><strong>7 → 8</strong></td><td>Cabeça de Picareta / Cabeça de Maça / Lâmina de Espada Curta</td><td><strong>75</strong></td><td>Espada de sucata (70).</td><td>Escolha a peça com matéria-prima já disponível.</td></tr>
                  <tr><td><strong>8 → 9</strong></td><td>Armadura Corporal de Placas</td><td><strong>100</strong></td><td>Cabeça de Marreta / Machado para Lenha / Espada Rudimentar (90).</td><td>A armadura pode ter materiais extras; 90 XP pode ter melhor custo real.</td></tr>
                  <tr><td><strong>9 → 10</strong></td><td>Maçaneta / Pé de Cabra / Lâmina de Facão / Lâmina de Espada</td><td><strong>100</strong></td><td>Navalha Reta (50) se faltar material/receita.</td><td>Maçaneta costuma usar peças menores e ferramentas finas; pé de cabra/lâminas podem custar mais metal.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert info"><strong>Importante:</strong> "maior XP por craft" não significa automaticamente "melhor XP por recurso". No nível 8, por exemplo, a armadura de placas entrega 100 XP, mas pode custar muito mais material que uma cabeça de ferramenta de 90 XP. No Brasileirão, compare o estoque antes de escolher.</div>
            <h3 className="guia-h3">Regra prática de troca de receita</h3>
            <div className="guia-route">
              <span className="guia-node">Receita dá +10% XP</span><span className="guia-arrow">mas</span>
              <span className="guia-node">gasta +50% metal</span><span className="guia-arrow">→</span>
              <span className="guia-node">use a receita mais barata</span>
            </div>
          </section>

          {/* ── 14. Rota Ferreiro ── */}
          <section id="ferreiro" className="guia-section">
            <div className="guia-eyebrow">14 · Rota especial</div>
            <h2 className="guia-h2">Se começar como Ferreiro: pule o early game e prepare o nível 4 → 10</h2>
            <p className="guia-muted">Você já começa no nível 4. Sua prioridade muda completamente: não gaste tempo criando XP de níveis baixos; use esse tempo para assegurar <strong>Ferraria III, IV e V</strong>, combustível e receitas de alto rendimento.</p>
            <div className="guia-step">
              <div className="guia-step-num">4</div>
              <div className="guia-step-body">
                <h3>Leia Ferraria III (8×)</h3>
                <p className="guia-muted">Use Cabeça de Machadinha (50) e, no nível 5, Lanterna (60) ou receitas de 50 com melhor custo.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">6</div>
              <div className="guia-step-body">
                <h3>Leia Ferraria IV (12×)</h3>
                <p className="guia-muted">Use Cabeça de Pá/Machado (70), depois Picareta/Maça/Espada Curta (75).</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">8</div>
              <div className="guia-step-body">
                <h3>Leia Ferraria V (16×) quando entrar na faixa final</h3>
                <p className="guia-muted">Use peças de 90–100 XP com melhor relação material/estoque, finalizando com receitas de 100 XP no nível 9.</p>
              </div>
            </div>
            <div className="guia-alert"><strong>Exemplo:</strong> uma receita de 100 XP, com bônus de Ferreiro 1,66× e livro V 16×, pode render aproximadamente <strong>2.656 XP por fabricação</strong> antes de multiplicadores extras do servidor. Isso mostra por que livro + profissão valem mais que perseguir pequenas diferenças entre receitas.</div>
          </section>

          {/* ── 15. Ciclo do ouro ── */}
          <section id="ouroloop" className="guia-section">
            <div className="guia-eyebrow">15 · Ciclo do ouro</div>
            <h2 className="guia-h2">A rota de desempenho máximo — e o problema de regulamento</h2>
            <p className="guia-muted">Na 42.20.x, a Forja Primitiva permite transformar uma Chapa de Ouro em 10 Moedas de Ouro por 25 XP base. As 10 moedas podem ser convertidas novamente em uma Chapa de Ouro usando carvão. O metal precioso retorna ao ciclo, enquanto o combustível é consumido.</p>
            <div className="guia-route">
              <span className="guia-node">1 Chapa de Ouro</span><span className="guia-arrow">+</span>
              <span className="guia-node">1 carvão</span><span className="guia-arrow">→</span>
              <span className="guia-node">10 Moedas + 25 XP</span><span className="guia-arrow">→</span>
              <span className="guia-node">10 moedas + carvão</span><span className="guia-arrow">→</span>
              <span className="guia-node">1 Chapa</span><span className="guia-arrow">↻</span>
            </div>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">Ouro consumido?</b>
                <div className="guia-metric guia-good">Não*</div>
                <div className="guia-sub">Ele circula entre chapa e moedas. *Salvo perdas/alterações de versão.</div>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Combustível</b>
                <div className="guia-metric guia-gold">Sim</div>
                <div className="guia-sub">Carvão é consumido em cada etapa relevante.</div>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">XP</b>
                <div className="guia-metric">25</div>
                <div className="guia-sub">XP base ao forjar as moedas.</div>
              </div>
            </div>
            <div className="guia-alert danger"><strong>Brasileirão:</strong> este ciclo deve ter uma decisão explícita de regulamento. Ele permite repetir XP usando o mesmo metal precioso, e a comunidade já tratou ciclos semelhantes como possíveis falhas/exploits de balanceamento. Para um ranking competitivo, o ideal é escrever "permitido" ou "proibido" sem ambiguidade.</div>
            <h3 className="guia-h3">Se for permitido</h3>
            <p className="guia-muted">A prioridade muda para: <strong>Forja Primitiva → 10 fragmentos/moedas de ouro → estoque enorme de carvão → livro correto → repetição.</strong> Nesse cenário, procurar ferro para grind perde grande parte do valor.</p>
            <h3 className="guia-h3">Layout recomendado da oficina</h3>
            <div className="guia-route">
              <span className="guia-node">Estoque de madeira</span><span className="guia-arrow">→</span>
              <span className="guia-node">Carvão</span><span className="guia-arrow">→</span>
              <span className="guia-node">Forno</span><span className="guia-arrow">→</span>
              <span className="guia-node">Forja</span><span className="guia-arrow">→</span>
              <span className="guia-node">Caixa: ferramentas</span><span className="guia-arrow">→</span>
              <span className="guia-node">Caixa: metal</span><span className="guia-arrow">→</span>
              <span className="guia-node">Caixa: produtos</span>
            </div>
            <div className="guia-alert warning"><strong>Segurança:</strong> mantenha fogo e ruído longe de entradas não protegidas. Tenha rota de fuga e água/extintor próximos. Em população elevada, a oficina não deve ficar colada ao portão principal.</div>
          </section>

          {/* ── 16. Erros comuns ── */}
          <section id="erros" className="guia-section">
            <div className="guia-eyebrow">16 · Erros comuns</div>
            <h2 className="guia-h2">O que mais atrasa uma Ferraria 10</h2>
            <details className="guia-details" open>
              <summary>1. Grindar sem livro</summary>
              <div className="guia-details-body"><p className="guia-muted">É o maior desperdício de recursos. Um livro V completo dá 16× na faixa final. Não existe receita "mágica" que compense ignorar isso.</p></div>
            </details>
            <details className="guia-details">
              <summary>2. Confundir revista com livro</summary>
              <div className="guia-details-body"><p className="guia-muted">Livro aumenta XP; revista/esquema desbloqueia receita. Se a receita não aparece, subir um nível pode não resolver.</p></div>
            </details>
            <details className="guia-details">
              <summary>3. Achar que precisa de molde para toda ferraria</summary>
              <div className="guia-details-body"><p className="guia-muted">Moldes são centrais em fundição/casting de lingotes e peças específicas. Forjar lâminas, moedas, cabeças e chapas não significa automaticamente usar molde.</p></div>
            </details>
            <details className="guia-details">
              <summary>4. Tentar construir a cadeia avançada cedo demais</summary>
              <div className="guia-details-body"><p className="guia-muted">Bigorna de Ferreiro, Forja Avançada, Alto-Forno e moldes avançados são caros. Se sua receita de grind roda na Forja Primitiva, construa o mínimo necessário.</p></div>
            </details>
            <details className="guia-details">
              <summary>5. Depender de carvão de loot</summary>
              <div className="guia-details-body"><p className="guia-muted">Carvão de Madeira é fabricável. No Brasileirão, produzi-lo na base é muito mais seguro do que procurar combustível em loot 0,04.</p></div>
            </details>
            <details className="guia-details">
              <summary>6. Escolher receita só pelo XP bruto</summary>
              <div className="guia-details-body"><p className="guia-muted">90 XP usando recurso abundante pode ser melhor que 100 XP usando materiais raros. Compare XP/carvão, XP/metal e risco para repor.</p></div>
            </details>
            <details className="guia-details">
              <summary>7. Fazer múltiplas loot runs pequenas</summary>
              <div className="guia-details-body"><p className="guia-muted">Combine revista + livro + ferramentas + balde + metal na mesma rota. Cada nova viagem sob população extrema adiciona risco sem gerar XP.</p></div>
            </details>
          </section>

          {/* ── 17. Fontes ── */}
          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow">17 · Fontes e versão</div>
            <h2 className="guia-h2">Base técnica usada neste manual</h2>
            <p className="guia-muted">Data de consolidação: 4 de setembro de 2026. A versão estável oficial consultada é <strong>42.20.4</strong>. A lista completa de XP de Ferraria disponível com extração direta dos arquivos usa 42.20.2; a lista de materiais de fundição usa 42.20.3. Não há evidência nas fontes consultadas de mudança desses valores específica na 42.20.4, mas um hotfix futuro pode alterá-los.</p>
            <ol style={{ paddingLeft: '20px', margin: '12px 0 0' }}>
              {[
                ['https://projectzomboid.com/version_announce/', 'The Indie Stone — versão estável atual.'],
                ['https://pzfans.com/forging_the_apocalypse_build_42s_metalworking_overhaul_in_project_zomboid/', 'PZFans — Blacksmithing Guide, Build 42.20.4: estruturas, revistas, ferramentas primitivas, cadeia de bloom e ocupações.'],
                ['https://pype.org/pt-br/zomboid/skills/blacksmithing/xp-list/', 'pype.org — Lista PT-BR de XP de Ferraria, Build 42.20.2: 123 receitas extraídas dos arquivos vanilla.'],
                ['https://pype.org/es/zomboid/skills/blacksmithing/smelting-material-list/', 'pype.org — Materiais de fundição, Build 42.20.3: objetos convertíveis em ferro/aço/metais preciosos.'],
                ['https://pzfans.com/ProjectZomboidB42LevelMechanics/', 'PZFans — mecânica de XP da Build 42: bônus 0,25×/1×/1,33×/1,66× e empilhamento de livros.'],
                ['https://pzfans.com/skill_books_in_build_42_read_reread_survive/', 'PZFans — livros de habilidade: faixas e multiplicadores 3×/5×/8×/12×/16×.'],
                ['https://pz-guide.com/en/item/Base.CharcoalCrafted/', 'PZ Guide — Wood Charcoal: quatro receitas de conversão de madeira em 12 carvões.'],
                ['https://pz-guide.com/en/item/Base.GoldSheet/', 'PZ Guide — Gold Sheet: 10 fragmentos/moedas + carvão e requisitos da Forja Primitiva.'],
                ['https://pz-guide.com/en/item/Base.Tongs/', 'PZ Guide — Tongs: locais de loot e fabricação da Tenaz.'],
                ['https://pz-guide.com/en/build/Primitive_Furnace/', 'PZ Guide — Primitive Furnace: materiais de construção.'],
                ['https://pz-guide.com/en/item/Base.Bucket/', 'PZ Guide — Bucket: cimento de argila/concreto.'],
                ['https://pz-guide.com/en/item/Base.ClayIngotMold/', 'PZ Guide — Ceramic Ingot Mold: queima do molde e fundição de lingotes.'],
              ].map(([href, text]) => (
                <li key={href} style={{ margin: '8px 0', color: 'var(--text-2)' }}>
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-light)' }}>{text}</a>
                </li>
              ))}
            </ol>
            <div className="guia-alert info"><strong>Uso competitivo:</strong> antes de publicar como regra oficial, decida explicitamente a situação do ciclo Chapa de Ouro ⇄ Moedas. O restante do manual funciona independentemente dessa decisão.</div>
          </section>

          <footer className="guia-footer">
            Brasileirão de Project Zomboid · Manual Definitivo de Ferraria 0–10 · Build 42.20.x · 10× zumbis · Água cortada no dia 1 · Energia cortada no dia 1 · XP global 0,8×.
          </footer>

        </main>
      </div>
    </div>
  );
}
