import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',      label: '1. Visão geral' },
  { id: 'xp',        label: '2. XP' },
  { id: 'profissao', label: '3. Profissão Alfaiate' },
  { id: 'livros',    label: '4. Livros' },
  { id: 'revistas',  label: '5. Revistas' },
  { id: 'kit',       label: '6. Kit mínimo' },
  { id: 'linha',     label: '7. Linha e barbante' },
  { id: 'agulhas',   label: '8. Agulhas e tesouras' },
  { id: 'tecidos',   label: '9. Trapo, jeans e couro' },
  { id: 'nivel0',    label: '10. Nível 0 → 1' },
  { id: 'rotas',     label: '11. Rotas de XP' },
  { id: 'rota010',   label: '12. Rota 0 → 10' },
  { id: 'protecao',  label: '13. Proteção das roupas' },
  { id: 'nivel8',    label: '14. Costura 8+' },
  { id: 'brasileirao', label: '15. Brasileirão' },
  { id: 'erros',     label: '16. Erros comuns' },
  { id: 'fontes',    label: '17. Fontes' },
];

export function GuiaCostura() {
  const [compact, setCompact]   = useState(false);
  const [xpBase, setXpBase]     = useState(8);
  const [boost, setBoost]       = useState(1.66);
  const [book, setBook]         = useState(8);
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
            <span className="guia-brand-label">BRASILEIRÃO PZ · COSTURA</span>
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
            Build estável atual: 42.20.4. Nomes originais em inglês aparecem entre parênteses para facilitar identificação.
          </div>
        </aside>

        {/* ── Conteúdo principal ── */}
        <main className="guia-main">

          {/* ── Hero ── */}
          <div className="guia-hero">
            <div className="guia-eyebrow">Build 42.20.4 · Português do Brasil</div>
            <h1 className="guia-h1">Manual Definitivo de<br />Costura 0 → 10</h1>
            <p className="guia-muted">Do primeiro trapo ao equipamento reforçado de nível máximo. Este manual foi pensado para o Brasileirão: <strong>mínima dependência de saque, máximo aproveitamento das roupas de zumbis e menor exposição possível</strong>.</p>
            <div className="guia-pills">
              {['Roupas viram recurso', 'Linha sustentável no nível 1', 'Couro para proteção final', 'Alfaiate começa +4', 'Costura 8 restaura furos'].map(p => (
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
            <h2 className="guia-h2">O verdadeiro gargalo não é tecido. É linha.</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">Objetivo</div>
                <div className="guia-metric guia-good">Nível 10</div>
                <div className="guia-sub">Proteção máxima e reparos completos.</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Matéria-prima barata</div>
                <div className="guia-metric">Trapos</div>
                <div className="guia-sub">Roupas comuns e cadáveres.</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Gargalo inicial</div>
                <div className="guia-metric guia-gold">Linha</div>
                <div className="guia-sub">Antes do nível 1, precisa ser encontrada ou substituída.</div>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Ferramenta crítica</div>
                <div className="guia-metric">Agulha</div>
                <div className="guia-sub">Tenha reservas; também há versões de osso/forjadas.</div>
              </div>
            </div>
            <div className="guia-alert"><strong>Regra principal da Build 42:</strong> rasgar roupas não entrega linha automaticamente. Rasgar gera tecido; no nível 1 você desbloqueia <strong>Retirar Linha</strong>, convertendo Trapo ou Tira de Jeans em uma unidade de linha.</div>
            <div className="guia-route">
              <span className="guia-node">Roupas descartáveis</span><span className="guia-arrow">→</span>
              <span className="guia-node">Trapos</span><span className="guia-arrow">→</span>
              <span className="guia-node">Bandanas</span><span className="guia-arrow">→</span>
              <span className="guia-node">Costura 1</span><span className="guia-arrow">→</span>
              <span className="guia-node">Retirar Linha</span><span className="guia-arrow">→</span>
              <span className="guia-node">Grind sustentável</span>
            </div>
          </section>

          {/* ── 2. XP ── */}
          <section id="xp" className="guia-section">
            <div className="guia-eyebrow">2 · XP</div>
            <h2 className="guia-h2">Livro + bônus inicial continuam sendo os maiores aceleradores</h2>
            <p className="guia-muted">A habilidade segue a progressão padrão de XP. O ganho real de cada fabricação depende do XP base da receita, bônus inicial, livro e multiplicadores do servidor.</p>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Pontos iniciais na habilidade</th><th>Multiplicador aproximado</th><th>Impacto</th></tr>
                </thead>
                <tbody>
                  <tr><td>0</td><td><strong>0,25×</strong></td><td>Muito lento; evite para uma run focada em Costura.</td></tr>
                  <tr><td>1</td><td><strong>1,00×</strong></td><td>Quatro vezes o ganho do nível inicial sem bônus.</td></tr>
                  <tr><td>2</td><td><strong>~1,33×</strong></td><td>Ótimo.</td></tr>
                  <tr><td>3+</td><td><strong>~1,66×</strong></td><td>Teto do bônus inicial; Alfaiate começa aqui.</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="guia-h3">Calculadora de XP</h3>
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
                  <option value={3}>Vol. I — 3×</option>
                  <option value={5}>Vol. II — 5×</option>
                  <option value={8}>Vol. III — 8×</option>
                  <option value={12}>Vol. IV — 12×</option>
                  <option value={16}>Vol. V — 16×</option>
                </select>
              </div>
              <div className="guia-field">
                <label>XP global do campeonato</label>
                <input type="number" step={0.05} value={globalXp} onChange={e => setGlobalXp(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>XP específico</label>
                <input type="number" step={0.05} value={skillXp} onChange={e => setSkillXp(+e.target.value)} />
              </div>
            </div>
            <p className="guia-sub">O XP global já inicia em <strong>0,8×</strong> conforme o campeonato.</p>
            <div className="guia-calc-result">
              <span>XP estimado por ação</span>
              <strong>{xpResult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XP</strong>
            </div>
          </section>

          {/* ── 3. Profissão Alfaiate ── */}
          <section id="profissao" className="guia-section">
            <div className="guia-eyebrow">3 · Criação do personagem</div>
            <h2 className="guia-h2">Alfaiate é a escolha absoluta para fechar Costura rápido</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">Costura +4</b>
                <div className="guia-metric">1,66×</div>
                <p className="guia-muted">Começa diretamente no nível 4 e com o maior bônus inicial da habilidade.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Custo da profissão</b>
                <div className="guia-metric guia-good">−2</div>
                <p className="guia-muted">Além de forte para a skill, a profissão concede pontos de criação na tabela atual.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Conhecimento</b>
                <div className="guia-metric">MUITO</div>
                <p className="guia-muted">Desbloqueia dezenas de receitas: roupas, couro, mochilas, equipamentos e tricô.</p>
              </div>
            </div>
            <div className="guia-alert"><strong>Para um objetivo puro de Costura 10, comece como Alfaiate.</strong> Você ignora o bloqueio 0→1, pula até o nível 4 e não precisa encontrar várias revistas para acessar receitas que a profissão já conhece.</div>
          </section>

          {/* ── 4. Livros ── */}
          <section id="livros" className="guia-section">
            <div className="guia-eyebrow">4 · Livros</div>
            <h2 className="guia-h2">Os cinco volumes</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Faixa</th><th>Nome em português</th><th>Nome original</th><th>Páginas</th><th>Multi</th></tr>
                </thead>
                <tbody>
                  <tr><td>1–2</td><td>Costura I — Reparo Básico de Roupas</td><td>Basic Clothing Repair</td><td>220</td><td><strong>3×</strong></td></tr>
                  <tr><td>3–4</td><td>Costura II — Dos Trapos à Realeza: Guia de Costura</td><td>From Rags to Royalty: A Sewing Guide</td><td>260</td><td><strong>5×</strong></td></tr>
                  <tr><td>5–6</td><td>Costura III — Métodos de Alfaiataria de Alta-Costura</td><td>Haute Couture Tailoring Methods</td><td>300</td><td><strong>8×</strong></td></tr>
                  <tr><td>7–8</td><td>Costura IV — Moldes Modernos das Passarelas de Paris</td><td>Modern Patterns from the Catwalks of Paris</td><td>340</td><td><strong>12×</strong></td></tr>
                  <tr><td>9–10</td><td>Costura V — Técnicas de Produção e Fabricação Têxtil</td><td>Textile Production and Manufacturing Techniques</td><td>380</td><td><strong>16×</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert warning">Se começou como <strong>Alfaiate nível 4</strong>, procure imediatamente Costura III, IV e V. Não gaste material em grind pesado antes de ler o volume da faixa.</div>
          </section>

          {/* ── 5. Revistas ── */}
          <section id="revistas" className="guia-section">
            <div className="guia-eyebrow">5 · Revistas e moldes de costura</div>
            <h2 className="guia-h2">O que realmente vale procurar</h2>
            <p className="guia-muted">Na Build 42, várias roupas normais exigem receita aprendida. Além das revistas, existe o item <strong>Molde de Costura</strong>, capaz de ensinar receitas individuais.</p>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Revista</th><th>Prioridade</th><th>Principais desbloqueios</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>Feito em Casa (Homespun)</strong></td><td>★★★★★</td><td>Vestidos, camisas, calças, saias e ceroulas simples. Excelente para fabricar usando rolos de tecido.</td></tr>
                  <tr><td><strong>Diversão na Floresta! (Fun in the Woods!)</strong></td><td>★★★★★</td><td>Bolsa de tecido, mochila de couro simples e mochilas com armação.</td></tr>
                  <tr><td><strong>Exploradores Alpinos (Alpine Explorers)</strong></td><td>★★★★☆</td><td>Armações avançadas, mochilas avançadas e calças de pele de ovelha.</td></tr>
                  <tr><td><strong>Costura Antiga (Ancient Tailoring)</strong></td><td>★★★★☆</td><td>Agulha de osso, sovela de osso e roupas de couro/pele.</td></tr>
                  <tr><td><strong>Roupas Camponesas Medievais (Medieval Peasant Clothing)</strong></td><td>★★★☆☆</td><td>Botas, casaco, chapéu e jaqueta de pele.</td></tr>
                  <tr><td><strong>Artesanato em Couro (Leather Crafts)</strong></td><td>★★★☆☆</td><td>Cinto, luvas, sandálias, rolo de ferramentas e carteira.</td></tr>
                  <tr><td><strong>Vida de Cowboy (Cowboy Living)</strong></td><td>★★★☆☆</td><td>Coldres, botas, roupas de couro e pele.</td></tr>
                  <tr><td><strong>Equipamento de Aventura Feito Direito (Outdoor Gear, Done Right)</strong></td><td>★★★☆☆</td><td>Perneiras, bolsa de água, saco de dormir, bandoleira e pochete.</td></tr>
                  <tr><td><strong>Gladiadores de Verdade (Real Gladiators)</strong></td><td>★★★☆☆</td><td>Braçadeira, joelheiras, cotoveleiras e protetores de couro.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 6. Kit mínimo ── */}
          <section id="kit" className="guia-section">
            <div className="guia-eyebrow">6 · Kit mínimo</div>
            <h2 className="guia-h2">O que você realmente precisa carregar</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Prioridade</th><th>Item</th><th>Função</th></tr>
                </thead>
                <tbody>
                  <tr><td>★★★★★</td><td><strong>Agulha de Costura</strong></td><td>Reparos, acolchoamento e a maioria das receitas.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Linha / Barbante</strong></td><td>Consumível principal.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Tesoura</strong></td><td>Cortar jeans e couro; muitas receitas exigem tesoura não cega.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Sovela</strong></td><td>Substituto/apoio em receitas de couro e para Retirar Linha.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Trapos limpos</strong></td><td>Grind barato, reparo de algodão e matéria para gerar linha.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Tiras de Jeans</strong></td><td>Proteção média e também podem virar linha.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Tiras de Couro</strong></td><td>Proteção máxima; guarde para o equipamento final.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Agulhas de Tricô</strong></td><td>Rota alternativa extremamente boa se houver fio de lã.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 7. Linha e barbante ── */}
          <section id="linha" className="guia-section">
            <div className="guia-eyebrow">7 · Linha e barbante</div>
            <h2 className="guia-h2">Quatro maneiras de garantir o recurso mais importante</h2>
            <div className="guia-grid2">
              <div className="guia-card">
                <b className="guia-card-title">1. Saque</b>
                <p className="guia-muted">Kits de costura são uma das melhores fontes. Oficinas de alfaiataria, couro, estofamento, sapateiros, quartos, armários e depósitos também podem conter carretéis.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">2. Retirar Linha — nível 1</b>
                <p className="guia-muted">1 Trapo ou 1 Tira de Jeans + agulha/pinça/sovela → 1 unidade de Linha. A ferramenta é mantida.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">3. Roda de Fiar — lã</b>
                <p className="guia-muted">1 Lã Crua → 1 Linha. Excelente quando a base possui ovelhas ou acesso regular a fazendas.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">4. Roda de Fiar — linho</b>
                <p className="guia-muted">Linho processado → Linha. Caminho agrícola para autonomia total.</p>
              </div>
            </div>
            <div className="guia-alert danger"><strong>Não confunda:</strong> simplesmente rasgar uma camiseta não gera Linha na Build 42. Ela gera Trapo. A conversão em Linha é uma etapa separada.</div>
            <h3 className="guia-h3">Rota sem depender de linha encontrada</h3>
            <div className="guia-route">
              <span className="guia-node">Forragear cânhamo-dogbane / processar fibras</span><span className="guia-arrow">→</span>
              <span className="guia-node">Fabricar Barbante</span><span className="guia-arrow">→</span>
              <span className="guia-node">Bandana de Trapo</span><span className="guia-arrow">→</span>
              <span className="guia-node">Costura 1</span><span className="guia-arrow">→</span>
              <span className="guia-node">Retirar Linha</span>
            </div>
            <p className="guia-sub">O Barbante é aceito em várias receitas iniciais como substituto de linha. O cânhamo-dogbane pode ser transformado em barbante usando uma haste/galho e lâmina compatível.</p>
            <div className="guia-alert warning"><strong>Rolo de tecido de algodão:</strong> a receita atual pede <strong>400 unidades de Linha</strong>. Por isso, o antigo ciclo "trapos → linha → rolo → roupas → trapos" deixou de ser tão eficiente depois dos rebalanceamentos da 42.20. Use rolos encontrados em lojas/oficinas quando possível.</div>
          </section>

          {/* ── 8. Agulhas e tesouras ── */}
          <section id="agulhas" className="guia-section">
            <div className="guia-eyebrow">8 · Agulhas, sovelas e tesouras</div>
            <h2 className="guia-h2">Não fique dependente de uma única agulha</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Ferramenta</th><th>Como conseguir</th><th>Observação</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>Agulha comum</strong></td><td>Kits de costura, casas, lojas/oficinas de costura.</td><td>É mantida nas receitas, mas pode sofrer desgaste.</td></tr>
                  <tr><td><strong>Agulha de Osso</strong></td><td>Fabricável após conhecimento adequado.</td><td>Excelente solução para run autossuficiente.</td></tr>
                  <tr><td><strong>Agulha Forjada</strong></td><td>Ferraria 6 + 1 carvão + fio metálico + Martelo de Bola + alicate.</td><td>Integra perfeitamente com o manual de Ferraria.</td></tr>
                  <tr><td><strong>Sovela de Osso/Pedra</strong></td><td>Fabricável por receitas primitivas.</td><td>Pode substituir ferramentas em Retirar Linha e couro.</td></tr>
                  <tr><td><strong>Tesoura</strong></td><td>Casas, lojas, oficinas e estabelecimentos relacionados.</td><td>Tenha 2–3; várias receitas exigem condição não cega.</td></tr>
                  <tr><td><strong>Tesoura Rústica</strong></td><td>Ferraria 4; 4 carvão + ¼ barra + ferramentas de ferreiro.</td><td>Outra rota de autossuficiência.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert">Os manuais se conectam: <strong>Ferraria alta consegue fabricar agulha e tesoura</strong>; Entalhamento/tecnologias primitivas oferecem agulha e sovela de osso. Isso reduz muito a dependência de saque.</div>
          </section>

          {/* ── 9. Tecidos ── */}
          <section id="tecidos" className="guia-section">
            <div className="guia-eyebrow">9 · Tecidos</div>
            <h2 className="guia-h2">Trapo, Jeans e Couro têm funções diferentes</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Material</th><th>Como obter</th><th>Uso ideal</th><th>Proteção máxima no nível 10</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>Trapo / Algodão</strong></td><td>Rasgar roupas de algodão.</td><td>Grind, linha e reparos baratos.</td><td>+5 Arranhão / +0 Mordida</td></tr>
                  <tr><td><strong>Tira de Jeans</strong></td><td>Cortar roupas jeans com tesoura/lâmina adequada.</td><td>Proteção intermediária e fonte de linha.</td><td>+10 Arranhão / +5 Mordida</td></tr>
                  <tr><td><strong>Tira de Couro</strong></td><td>Cortar cintos, coldres, bandoleiras e roupas de couro.</td><td>Proteção final; não use em grind barato.</td><td><strong>+20 Arranhão / +10 Mordida</strong></td></tr>
                </tbody>
              </table>
            </div>
            <h3 className="guia-h3">Fontes de couro</h3>
            <ul style={{ paddingLeft: '20px', margin: '8px 0', color: 'var(--text-2)' }}>
              <li><strong>Cinto / coldre / bandoleira vazios:</strong> o corte entrega de forma previsível uma Tira de Couro e uma fivela.</li>
              <li><strong>Jaquetas e outras roupas de couro:</strong> podem render mais tiras conforme tamanho/estado.</li>
              <li><strong>Peles curtidas de animais:</strong> couro grande pode ser cortado em grande quantidade; couro grande curtido pode render até dezenas de tiras.</li>
            </ul>
            <div className="guia-alert warning"><strong>Guarde couro limpo.</strong> Para acolchoar roupas, utilize tiras limpas. Não desperdice couro no grind 0→7; a proteção é muito mais valiosa depois que Costura está alta.</div>
          </section>

          {/* ── 10. Nível 0 → 1 ── */}
          <section id="nivel0" className="guia-section">
            <div className="guia-eyebrow">10 · O gargalo 0 → 1</div>
            <h2 className="guia-h2">Bandana de Trapo é a resposta</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <div className="guia-kpi">XP base</div>
                <div className="guia-metric">8 XP</div>
                <p className="guia-muted">Sem requisito de nível.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Tempo</div>
                <div className="guia-metric">100</div>
                <p className="guia-muted">Ação curta.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Materiais</div>
                <div className="guia-metric">2+1</div>
                <p className="guia-muted">2 Trapos + 1 uso de Linha ou Barbante.</p>
              </div>
            </div>
            <h3 className="guia-h3">Receita</h3>
            <div className="guia-route">
              <span className="guia-node">Agulha ou Sovela</span><span className="guia-arrow">+</span>
              <span className="guia-node">2 Trapos</span><span className="guia-arrow">+</span>
              <span className="guia-node">1 Linha/Barbante</span><span className="guia-arrow">→</span>
              <span className="guia-node">Bandana de Trapo + 8 XP base</span>
            </div>
            <div className="guia-alert"><strong>Por que é tão boa:</strong> custa pouco, não exige revista e funciona antes de Costura 1. Assim que chegar ao nível 1, Retirar Linha abre a autonomia.</div>
            <h3 className="guia-h3">Alternativas nível 0</h3>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Receita</th><th>XP base</th><th>Custo</th><th>Uso</th></tr>
                </thead>
                <tbody>
                  <tr><td>Bandana de Trapo</td><td><strong>8</strong></td><td>2 Trapos + 1 linha/barbante</td><td><span className="guia-rank">MELHOR</span></td></tr>
                  <tr><td>Faixas para os Pés</td><td>8</td><td>6 tiras + 1 linha/barbante</td><td>Mais cara em tecido.</td></tr>
                  <tr><td>Faixas para as Mãos</td><td>8</td><td>6 tiras + 2 linha/barbante</td><td>Pior eficiência.</td></tr>
                  <tr><td>Roupas improvisadas de saco/lona</td><td>~6–8</td><td>Materiais específicos</td><td>Use apenas se forem sobras.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 11. Rotas de XP ── */}
          <section id="rotas" className="guia-section">
            <div className="guia-eyebrow">11 · Rotas de XP</div>
            <h2 className="guia-h2">Três maneiras de chegar ao nível 10</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <b className="guia-card-title">Rota A — Bandanas</b>
                <div className="guia-metric guia-good">S</div>
                <p className="guia-muted">Melhor simplicidade. Roupas de zumbis → trapos → linha → bandanas. Pouquíssima infraestrutura.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Rota B — Tricô</b>
                <div className="guia-metric" style={{ color: 'var(--blue-light, #8BB6D3)' }}>A</div>
                <p className="guia-muted">Se houver lã/fio, receitas de 9, 13, 20 e 30 XP com uma unidade de fio e agulhas de tricô.</p>
              </div>
              <div className="guia-card">
                <b className="guia-card-title">Rota C — Equipamento</b>
                <div className="guia-metric guia-gold">A</div>
                <p className="guia-muted">Mochilas com armação e couro rendem 55–90 XP, mas exigem materiais e revistas. Faça quando o produto for útil.</p>
              </div>
            </div>

            <h3 className="guia-h3">Tricô — excelente quando existe lã</h3>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Nível</th><th>Receita</th><th>XP base</th><th>Entrada principal</th></tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>Gorro / Cachecol / Toalhinha de Crochê</td><td><strong>9</strong></td><td>Fio de lã + agulhas de tricô.</td></tr>
                  <tr><td>2</td><td>Gorro de Lã / Polainas / Meias</td><td><strong>13</strong></td><td>Fio de lã.</td></tr>
                  <tr><td>3</td><td>Balaclava Aberta / Colete de Suéter</td><td><strong>20</strong></td><td>Fio de lã.</td></tr>
                  <tr><td>4</td><td>Balaclava Fechada</td><td><strong>30</strong></td><td>Fio de lã.</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="guia-h3">Receitas de alto XP</h3>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Nível</th><th>Receita de referência</th><th>XP base</th><th>Comentário</th></tr>
                </thead>
                <tbody>
                  <tr><td>2</td><td>Bolsa de Tecido / Colchão</td><td>13</td><td>Materiais menos eficientes que Bandana, mas produto útil.</td></tr>
                  <tr><td>2</td><td>Mochila Rústica de Lona</td><td>16</td><td>Lona + fita adesiva; não gaste lona rara só por XP.</td></tr>
                  <tr><td>3</td><td>Calça / roupas de couro simples</td><td>20</td><td>Bom se tiver rolo de tecido ou pele sobrando.</td></tr>
                  <tr><td>4</td><td>Casaco/jaqueta de pele, tricô avançado</td><td>30</td><td>Forte para Alfaiate que já começa no 4.</td></tr>
                  <tr><td>5</td><td>Mochila com Armação Simples</td><td><strong>55</strong></td><td>Ótima recompensa, material especializado.</td></tr>
                  <tr><td>6</td><td>Mochila com Armação</td><td><strong>75</strong></td><td>Produto valioso; não é craft descartável.</td></tr>
                  <tr><td>7</td><td>Mochila Grande com Armação</td><td><strong>90</strong></td><td>Alto XP e equipamento de alto valor.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 12. Rota 0 → 10 ── */}
          <section id="rota010" className="guia-section">
            <div className="guia-eyebrow">12 · Rota definitiva 0 → 10</div>
            <h2 className="guia-h2">O caminho recomendado para o Brasileirão</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Faixa</th><th>Rota principal</th><th>Alternativa</th><th>Meta</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>0 → 1</strong></td><td>Bandanas de Trapo (8 XP base)</td><td>Faixas improvisadas com Barbante</td><td>Desbloquear Retirar Linha.</td></tr>
                  <tr><td><strong>1 → 2</strong></td><td>Bandanas + Linha retirada dos trapos</td><td>Tricô 9 XP se tiver fio de lã</td><td>Baixo consumo de recursos raros.</td></tr>
                  <tr><td><strong>2 → 3</strong></td><td>Bandanas em lote</td><td>Tricô 13 XP / Bolsa 13 XP</td><td>Chegar ao Livro II com estoque.</td></tr>
                  <tr><td><strong>3 → 4</strong></td><td>Bandanas ou roupas 20 XP se tiver rolos</td><td>Peles/couro 20 XP</td><td>Não consumir couro bom por grind.</td></tr>
                  <tr><td><strong>4 → 5</strong></td><td>Tricô 30 XP ou roupas 30 XP com material sobrando</td><td>Bandanas continuam funcionando</td><td>Alfaiate começa aqui.</td></tr>
                  <tr><td><strong>5 → 6</strong></td><td>Bandanas / tricô + Mochila Simples quando útil</td><td>Roupas de pele 45 XP</td><td>Livro III 8× faz mais diferença que a receita.</td></tr>
                  <tr><td><strong>6 → 7</strong></td><td>Bandanas + peças úteis</td><td>Mochila com Armação 75 XP</td><td>Preparar Livro IV.</td></tr>
                  <tr><td><strong>7 → 8</strong></td><td>Mochila Grande 90 XP se tiver materiais; senão Bandanas</td><td>Casaco de pele 68 XP</td><td>Chegar ao reparo completo.</td></tr>
                  <tr><td><strong>8 → 9</strong></td><td>Fabricação de peças úteis + Bandanas</td><td>Acolchoar roupa final já ajuda XP</td><td>Não desperdiçar couro antes do 10.</td></tr>
                  <tr><td><strong>9 → 10</strong></td><td>Livro V + método mais abundante da base</td><td>Bandana continua barata e segura</td><td>Fechar 10 e reforçar equipamento definitivo.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert"><strong>Conclusão:</strong> a receita "mais avançada" não é necessariamente o melhor grind. No Brasileirão, a Bandana continua excelente porque cadáveres fornecem roupa e o nível 1 transforma Trapo em Linha. Receitas de 55–90 XP devem ser aproveitadas quando você realmente precisa do produto.</div>
          </section>

          {/* ── 13. Proteção das roupas ── */}
          <section id="protecao" className="guia-section">
            <div className="guia-eyebrow">13 · Costura como armadura</div>
            <h2 className="guia-h2">Não é só uma skill de pontuação: ela reduz o risco da run</h2>
            <p className="guia-muted">Clique com o botão direito na roupa → <strong>Inspecionar</strong>. Em partes intactas, use Adicionar Acolchoamento; em partes furadas, Remendar Furo.</p>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead>
                  <tr><th>Nível</th><th>Trapo</th><th>Jeans</th><th>Couro</th></tr>
                </thead>
                <tbody>
                  <tr><td>0–1</td><td>+1 Arranhão / 0 Mordida</td><td>+1 / +1</td><td>+2 / +1</td></tr>
                  <tr><td>5</td><td>+2 / 0</td><td>+5 / +2</td><td>+10 / +5</td></tr>
                  <tr><td><strong>10</strong></td><td><strong>+5 / 0</strong></td><td><strong>+10 / +5</strong></td><td><strong>+20 / +10</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert danger"><strong>A proteção fica gravada quando o remendo é aplicado.</strong> Um remendo de couro colocado no nível 3 não melhora sozinho quando você chega ao 10. Remova e costure novamente o equipamento definitivo no nível máximo.</div>
            <h3 className="guia-h3">Chance de recuperar o material ao remover remendo</h3>
            <p className="guia-muted">A chance segue aproximadamente <strong>10% + 5% × nível de Costura</strong>: 10% no nível 0, 35% no 5 e 60% no 10.</p>
            <div className="guia-alert warning">Mesmo no nível 10 você ainda pode perder 40% dos remendos removidos. Por isso, use <strong>Trapo</strong> para grind; não couro.</div>
          </section>

          {/* ── 14. Costura 8+ ── */}
          <section id="nivel8" className="guia-section">
            <div className="guia-eyebrow">14 · Costura 8+</div>
            <h2 className="guia-h2">A habilidade muda de função no nível 8</h2>
            <p className="guia-muted">Com Costura acima de 7, um furo pode ser <strong>restaurado completamente</strong> se o tecido usado corresponder ao material da roupa:</p>
            <div className="guia-route">
              <span className="guia-node">Algodão + Trapo</span><span className="guia-arrow">·</span>
              <span className="guia-node">Jeans + Tira de Jeans</span><span className="guia-arrow">·</span>
              <span className="guia-node">Couro + Tira de Couro</span>
            </div>
            <p className="guia-muted">Isso restaura o furo/condição daquele ponto em vez de deixar apenas um remendo visível. Para proteção adicional em uma parte intacta, continue usando Adicionar Acolchoamento.</p>
            <div className="guia-alert"><strong>Nível 10:</strong> depois de concluir a skill, retire acolchoamentos antigos das peças que pretende manter e aplique couro novamente para obter os valores máximos.</div>
          </section>

          {/* ── 15. Brasileirão ── */}
          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow">15 · Estratégia Brasileirão</div>
            <h2 className="guia-h2">Transforme os próprios zumbis em matéria-prima</h2>
            <div className="guia-step">
              <div className="guia-step-num">1</div>
              <div className="guia-step-body">
                <h3>Loot inicial de precisão</h3>
                <p className="guia-muted">Procure Kit de Costura, agulha, tesoura e pelo menos um pouco de Linha. Livros são prioridade absoluta.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">2</div>
              <div className="guia-step-body">
                <h3>Não carregue toda roupa de cadáver</h3>
                <p className="guia-muted">Escolha roupas grandes/intactas e processe em local seguro. Algodão comum vira Trapo; jeans e couro exigem corte.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">3</div>
              <div className="guia-step-body">
                <h3>0→1 com Bandanas</h3>
                <p className="guia-muted">Use linha encontrada ou Barbante. O objetivo é apenas liberar Retirar Linha.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">4</div>
              <div className="guia-step-body">
                <h3>Crie caixas separadas</h3>
                <p className="guia-muted">Trapos para grind; Jeans para proteção intermediária; Couro limpo reservado para o final.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">5</div>
              <div className="guia-step-body">
                <h3>Produza em lotes</h3>
                <p className="guia-muted">Retire Linha de dezenas de trapos, depois fabrique Bandanas em sequência. Evite alternar entre ações constantemente.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">6</div>
              <div className="guia-step-body">
                <h3>Se tiver ovelhas, mude de marcha</h3>
                <p className="guia-muted">Lã → Linha/Fio → tricô. Isso elimina boa parte da coleta de roupas para consumível.</p>
              </div>
            </div>
            <div className="guia-step">
              <div className="guia-step-num">7</div>
              <div className="guia-step-body">
                <h3>Costura 8–10: equipamento final</h3>
                <p className="guia-muted">Repare peças raras, aplique couro no conjunto definitivo e só então gaste o estoque premium.</p>
              </div>
            </div>
            <div className="guia-alert danger"><strong>Não faça incursão extra só para "uma receita melhor".</strong> Se você possui Bandanas + livros + trapos, já tem uma rota segura até o 10. O objetivo do Brasileirão é performance sem aumentar desnecessariamente a chance de morte.</div>
          </section>

          {/* ── 16. Erros comuns ── */}
          <section id="erros" className="guia-section">
            <div className="guia-eyebrow">16 · Erros comuns</div>
            <h2 className="guia-h2">O que NÃO fazer</h2>
            <details className="guia-details" open>
              <summary>1. Encurtar saias, jeans e meias esperando XP</summary>
              <div className="guia-details-body"><p className="guia-muted">Guias antigos estão desatualizados. As ações de encurtar deixaram de ser a rota de XP; hoje servem principalmente para utilidade/material.</p></div>
            </details>
            <details className="guia-details">
              <summary>2. Rasgar roupa esperando que caia Linha</summary>
              <div className="guia-details-body"><p className="guia-muted">Na Build 42, rasgar produz tecido. Linha vem de saque, Retirar Linha, lã ou linho processado.</p></div>
            </details>
            <details className="guia-details">
              <summary>3. Gastar couro para upar</summary>
              <div className="guia-details-body"><p className="guia-muted">Couro é o melhor material de proteção. Use Trapos para XP e reserve couro para o conjunto final.</p></div>
            </details>
            <details className="guia-details">
              <summary>4. Fazer rolo de algodão com 400 linhas só para grind</summary>
              <div className="guia-details-body"><p className="guia-muted">Depois do rebalanceamento atual, essa cadeia ficou muito cara. Use rolos encontrados ou trate a fabricação de tecido como projeto de produção, não grind básico.</p></div>
            </details>
            <details className="guia-details">
              <summary>5. Aplicar couro no nível baixo e nunca refazer</summary>
              <div className="guia-details-body"><p className="guia-muted">A defesa do remendo fica definida na hora da costura. Reaplique no nível 10 para obter +20/+10.</p></div>
            </details>
            <details className="guia-details">
              <summary>6. Achar que reparar e acolchoar são iguais</summary>
              <div className="guia-details-body"><p className="guia-muted">Remendar fecha um furo. Acolchoar reforça uma área intacta. Costura 8+ com tecido correspondente consegue restauração completa do furo.</p></div>
            </details>
            <details className="guia-details">
              <summary>7. Procurar receitas raras quando Bandanas já funcionam</summary>
              <div className="guia-details-body"><p className="guia-muted">Receitas avançadas são ótimas quando o produto é útil. Para XP seguro, Bandanas continuam simples e previsíveis.</p></div>
            </details>
          </section>

          {/* ── 17. Fontes ── */}
          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow">17 · Fontes e versão</div>
            <h2 className="guia-h2">Base técnica utilizada</h2>
            <p className="guia-muted">Consolidado em 5 de setembro de 2026. A versão estável oficial consultada é <strong>42.20.4</strong>. Os bancos de receitas B42 foram extraídos mecanicamente dos arquivos do jogo; guias 42.19 foram usados para explicar sistemas que permanecem na linha 42.20, com confirmação cruzada de receitas atuais e relatos recentes da comunidade.</p>
            <ol style={{ paddingLeft: '20px', margin: '12px 0 0' }}>
              {[
                ['https://projectzomboid.com/version_announce/', 'The Indie Stone — versão estável 42.20.4.'],
                ['https://projectzomboid.com/blog/news/2026/07/project-zomboid-build-42-20-released/', 'The Indie Stone — lançamento da Build 42.20.'],
                ['https://pz-guide.com/en/profession/tailor/', 'PZ Guide — profissão Alfaiate e receitas conhecidas.'],
                ['https://pzfans.com/item-books/', 'PZFans — livros e revistas da Build 42.'],
                ['https://pz-guide.com/en/item/Base.Hat_RagBandana/', 'PZ Guide — Bandana de Trapo, 8 XP.'],
                ['https://pz-guide.com/en/item/Base.Thread/', 'PZ Guide — Linha, Retirar Linha, lã, linho e rolo de tecido.'],
                ['https://pzfans.com/how-to-get-thread-in-project-zomboid/', 'PZFans — fontes de Linha.'],
                ['https://pzfans.com/project-zomboid-tailoring-guide-and-level-up-tips/', 'PZFans — guia de Costura, ferramentas, XP e progressão.'],
                ['https://pzfans.com/tailoring_tricks_turn_rags_into_zombie_armor_in_pz/', 'PZFans — proteção de remendos e restauração nível 8+.'],
                ['https://pz-guide.com/en/item/Base.Gorget_LeatherWrap/', 'PZ Guide — Protetor de Pescoço e requisitos.'],
                ['https://pz-guide.com/en/item/Base.KnittingNeedles_Bone/', 'PZ Guide — receitas de tricô e XP.'],
                ['https://pz-guide.com/en/item/Base.Leather_Crude_Large_Tan/', 'PZ Guide — mochilas com armação e couro.'],
                ['https://pz-guide.com/en/item/Base.Dogbane/', 'PZ Guide — fabricação de Barbante.'],
              ].map(([href, text]) => (
                <li key={href} style={{ margin: '8px 0', color: 'var(--text-2)' }}>
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-light)' }}>{text}</a>
                </li>
              ))}
            </ol>
            <div className="guia-alert info"><strong>Resumo definitivo:</strong> para o Brasileirão, o caminho mais robusto é <strong>Bandana → Costura 1 → Retirar Linha → produção em lote → livros → Costura 8 → equipamento final com couro no nível 10</strong>.</div>
          </section>

          <footer className="guia-footer">
            Brasileirão de Project Zomboid · Manual Definitivo de Costura 0–10 · Build 42.20.x · 10× zumbis · Água cortada no dia 1 · Energia cortada no dia 1 · XP global 0,8×.
          </footer>

        </main>
      </div>
    </div>
  );
}
