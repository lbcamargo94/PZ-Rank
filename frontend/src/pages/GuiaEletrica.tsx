import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',      label: '1. Visão geral' },
  { id: 'criacao',    label: '2. Criação do personagem' },
  { id: 'livros',     label: '3. Livros' },
  { id: 'revistas',   label: '4. Revistas e receitas' },
  { id: 'kit',        label: '5. Kit mínimo' },
  { id: 'xp',         label: '6. Fontes de XP' },
  { id: 'cadaveres',  label: '7. Rota dos cadáveres' },
  { id: 'receitas',   label: '8. Fabricações' },
  { id: 'geradores',  label: '9. Geradores' },
  { id: 'energia',    label: '10. Energia da base' },
  { id: 'hotwire',    label: '11. Ligação Direta' },
  { id: 'rota',       label: '12. Rota 0→10' },
  { id: 'brasileirao',label: '13. Estratégia Brasileirão' },
  { id: 'calculadora',label: '14. Calculadora' },
  { id: 'erros',      label: '15. Erros comuns' },
  { id: 'fontes',     label: '16. Fontes e versão' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const SOURCES = [
  { label: 'Pequeno eletrônico — 2 XP', value: 2 },
  { label: 'TV / Rádio / Walkie — 10 XP', value: 10 },
  { label: 'Reparo de Gerador — 5 XP', value: 5 },
  { label: 'Objeto elétrico grande — 15 XP', value: 15 },
  { label: 'Walkie Improvisado — 20 XP', value: 20 },
  { label: 'Rádio Amador Improvisado — 30 XP', value: 30 },
];

export function GuiaEletrica() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [sourceIdx, setSourceIdx] = useState(1);
  const [xpMult, setXpMult] = useState(0.8);
  const [stock, setStock] = useState(0);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const xpNeed = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const base = SOURCES[sourceIdx].value;
    const each = base * xpMult;
    const need = Math.ceil(xpNeed / each);
    const remaining = Math.max(0, need - stock);
    const stockXp = Math.min(xpNeed, stock * each);
    return { xpNeed, need, remaining, stockXp };
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
          <p className="guia-side-note">Construção 42.20.4 · 10x zumbis · água e energia cortadas no dia 1.</p>
        </aside>

        <main className="guia-main">
          <div className="guia-hero">
            <div className="guia-eyebrow">Construção 42.20.4 · Português do Brasil</div>
            <h1 className="guia-title">Manual Definitivo de Elétrica 0 → 10</h1>
            <p className="guia-subtitle">
              Em um campeonato onde a rede elétrica morre no primeiro dia, Elétrica passa de uma
              habilidade secundária para uma peça central da autonomia:{' '}
              <strong>geradores, iluminação, recuperação de veículos, combustível e manutenção da
              infraestrutura energética</strong>.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">10x zumbis</span>
              <span className="guia-pill">Energia cortada dia 1</span>
              <span className="guia-pill">32.775 XP total</span>
              <span className="guia-pill">Gerador sem revista no nível 3</span>
              <span className="guia-pill">Ligação Direta: Elétrica 1 + Mecânica 2</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Configuração oficial do campeonato:</strong> população 10x, água e energia cortadas
            no primeiro dia. A rota deste manual evita incursões feitas apenas por XP e transforma{' '}
            <strong>eletrônicos trazidos naturalmente pela gameplay e pelos cadáveres</strong> em
            progressão.
          </div>

          <div className="guia-alert guia-alert-info">
            <strong>Configuração oficial usada neste manual:</strong>{' '}
            <strong>população de zumbis 10x</strong>, <strong>água cortada no primeiro dia</strong>,{' '}
            <strong>energia cortada no primeiro dia</strong> e <strong>XP global 0,8×</strong>.
            {' '}Fórmula: <strong>XP efetivo = XP base × 0,8 × bônus inicial × livro × modificadores</strong>.
          </div>

          {/* 1 — visão geral */}
          <section id="visao" className="guia-section">
            <div className="guia-eyebrow">01 · Visão geral</div>
            <h2 className="guia-section-title">Elétrica transforma lixo eletrônico em autonomia</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">Pequenos eletrônicos</div>
                <div className="guia-metric">2 XP</div>
                <p className="guia-sub">Relógios, câmeras, lanternas e gadgets.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">TV / rádio / walkie</div>
                <div className="guia-metric guia-green">10 XP</div>
                <p className="guia-sub">Melhor desmontagem portátil.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Reparo de gerador</div>
                <div className="guia-metric guia-gold">5 XP</div>
                <p className="guia-sub">Por Sucata Eletrônica utilizada.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Marco estratégico</div>
                <div className="guia-metric guia-green">Nv.3</div>
                <p className="guia-sub">Conecta gerador mesmo sem revista.</p>
              </div>
            </div>
            <div className="guia-alert">
              <strong>Regra central:</strong> não saia procurando "coisas para desmontar". Recolha os
              eletrônicos durante objetivos que você já faria, leve tudo para a base e desmonte em lote
              com o livro correto.
            </div>
            <div className="guia-route">
              <span className="guia-node">Cadáveres / saque útil</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Eletrônicos</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">XP + Sucata</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Gerador / Fabricação</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Mais XP + autonomia</span>
            </div>
          </section>

          {/* 2 — criação */}
          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow">02 · Criação do personagem</div>
            <h2 className="guia-section-title">Eletricista é brutal para a skill; a build global continua mandando</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Escolha</th><th>Bônus</th><th>Conhecimento inicial</th><th>Leitura para o Brasileirão</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Eletricista</strong> (Electrician)</td>
                    <td><strong>Elétrica +5</strong></td>
                    <td>Gerador e amplo conjunto de receitas elétricas</td>
                    <td>Começa já no nível 5, com acesso imediato aos grandes marcos da skill.</td>
                  </tr>
                  <tr>
                    <td><strong>Engenheiro</strong> (Engineer)</td>
                    <td>Elétrica +1, Carpintaria +1 e Alvenaria +1</td>
                    <td>Gerador, iluminação improvisada e receitas de engenharia</td>
                    <td>Mais equilibrado para progressão multidisciplinar.</td>
                  </tr>
                  <tr>
                    <td>Outra profissão</td>
                    <td>0</td>
                    <td>Depende de revistas</td>
                    <td>Perfeitamente viável; Elétrica 1 é relativamente fácil com desmontagem.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Não escolha Eletricista automaticamente.</strong> Elétrica pode ser treinada com
              eletrônicos que surgem naturalmente, enquanto outras vantagens de criação podem ser mais
              difíceis de recuperar durante a run.
            </div>
          </section>

          {/* 3 — livros */}
          <section id="livros" className="guia-section">
            <div className="guia-eyebrow">03 · Livros</div>
            <h2 className="guia-section-title">Cada aparelho vale muito mais depois da leitura</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Faixa</th><th>Nome em português</th><th>Nome original</th><th>Páginas</th><th>Mult.</th></tr></thead>
                <tbody>
                  <tr><td>1–2</td><td>Elétrica I — Eletrônica Básica</td><td>Basic Electronics</td><td>220</td><td><strong>3×</strong></td></tr>
                  <tr><td>3–4</td><td>Elétrica II — Guia Audiovisual de Kentucky '93</td><td>Kentucky AV Guide '93</td><td>260</td><td><strong>5×</strong></td></tr>
                  <tr><td>5–6</td><td>Elétrica III — Guia Prático de Fiação</td><td>Practical Wiring Guide</td><td>300</td><td><strong>8×</strong></td></tr>
                  <tr><td>7–8</td><td>Elétrica IV — Telecomunicações no Século XX</td><td>Telecommunications in the 20th Century</td><td>340</td><td><strong>12×</strong></td></tr>
                  <tr><td>9–10</td><td>Elétrica V — Entendendo Controles Integrados de Sistemas Eletrônicos</td><td>Understanding Integrated Controls for Electronic Systems</td><td>380</td><td><strong>16×</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Não destrua TVs e rádios antes de ler.</strong> Esses objetos são finitos e
              entregam 10 XP base cada; no loot baixo, cada unidade deve receber o maior multiplicador
              possível.
            </div>
          </section>

          {/* 4 — revistas */}
          <section id="revistas" className="guia-section">
            <div className="guia-eyebrow">04 · Revistas e receitas</div>
            <h2 className="guia-section-title">Uma revista é crítica; as outras são ferramentas de progressão</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Revista em português</th><th>Nome original</th><th>Desbloqueio</th><th>Prioridade</th></tr></thead>
                <tbody>
                  <tr><td><strong>Como Usar Geradores</strong></td><td>How to Use Generators</td><td>Conhecimento de gerador</td><td><span className="guia-rank">S até Nv.3</span></td></tr>
                  <tr><td>Guia de Iluminação do Sparky</td><td>Sparky's Lighting Guide</td><td>Lanterna e Lampião Elétrico Improvisados</td><td>★★★★☆</td></tr>
                  <tr><td>Rádio de Guerrilha — Junho de 1993</td><td>Guerilla Radio - June 1993</td><td>Rádio Improvisado</td><td>★★★★☆</td></tr>
                  <tr><td>Guia de Rádio do Sparky</td><td>Sparky's Radio Guide</td><td>Walkie-Talkie Improvisado</td><td>★★★★☆</td></tr>
                  <tr><td>Rádio de Guerrilha — Maio de 1993</td><td>Guerilla Radio - May 1993</td><td>Rádio Amador Improvisado</td><td>★★★★☆</td></tr>
                  <tr><td>Choque! (Zapper!)</td><td>Zapper!</td><td>Controles remotos e gatilhos</td><td>★★☆☆☆</td></tr>
                  <tr><td>Como um Relógio</td><td>Like Clockwork</td><td>Temporizador</td><td>★★☆☆☆</td></tr>
                  <tr><td>Segurança Residencial Mensal</td><td>Home Security Monthly</td><td>Sensores de movimento</td><td>★★☆☆☆</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert">
              <strong>Atalho legítimo:</strong> na B42 atual, <strong>Elétrica 3 é suficiente para
              conectar/usar um gerador mesmo sem a revista</strong>. Portanto, se a revista não apareceu,
              a própria skill resolve o bloqueio.
            </div>
          </section>

          {/* 5 — kit */}
          <section id="kit" className="guia-section">
            <div className="guia-eyebrow">05 · Kit mínimo</div>
            <h2 className="guia-section-title">O kit de Elétrica é pequeno</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Prioridade</th><th>Item</th><th>Função</th></tr></thead>
                <tbody>
                  <tr><td>★★★★★</td><td><strong>Chave de Fenda</strong></td><td>Ferramenta principal de desmontagem; não é consumida.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Alicate / Multiferramenta</strong></td><td>Necessário para várias fabricações elétricas.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Sucata Eletrônica</strong></td><td>Gerador, iluminação e equipamentos improvisados.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Fio Elétrico</strong></td><td>Receitas de iluminação, rádio e outros equipamentos.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Lâmpadas</strong></td><td>Receitas e iluminação da base.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Baterias</strong></td><td>Luzes portáteis e soluções após o corte de energia.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Receptores / Transmissores / Amplificadores</strong></td><td>Guarde para rádios improvisados; não descarte como "lixo".</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6 — fontes de XP */}
          <section id="xp" className="guia-section">
            <div className="guia-eyebrow">06 · Fontes de XP</div>
            <h2 className="guia-section-title">A tabela que decide o que carregar</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Ação</th><th>XP base</th><th>Recurso</th><th>Recomendação</th></tr></thead>
                <tbody>
                  <tr><td>Desmontar Barra de Energia / extensão</td><td>1</td><td>Fio Elétrico</td><td>Faça pelo material, não pelo XP.</td></tr>
                  <tr><td>Desmontar eletrônico pequeno</td><td><strong>2</strong></td><td>Sucata Eletrônica</td><td><span className="guia-rank">COLETA NATURAL</span></td></tr>
                  <tr><td>Desmontar CD Player / alarme / controle / alto-falante</td><td><strong>2</strong></td><td>Sucata + componentes</td><td>Ótimo porque também entrega peças de fabricação.</td></tr>
                  <tr><td>Desmontar TV / rádio / walkie / rádio amador</td><td><strong>10</strong></td><td>Sucata</td><td><span className="guia-rank">ALTO VALOR</span></td></tr>
                  <tr><td>Desmontar objeto elétrico pequeno do mapa</td><td>5</td><td>Varia</td><td>Somente em área já segura.</td></tr>
                  <tr><td>Desmontar objeto elétrico médio do mapa</td><td>10</td><td>Varia</td><td>Boa fonte durante limpeza de base.</td></tr>
                  <tr><td>Desmontar objeto elétrico grande do mapa</td><td><strong>15</strong></td><td>Varia</td><td>Melhor desmontagem fixa.</td></tr>
                  <tr><td>Reparar Gerador</td><td><strong>5 por sucata</strong></td><td>Consome Sucata Eletrônica</td><td><span className="guia-rank">ROTINA DE BASE</span></td></tr>
                  <tr><td>Lanterna/Lampião Improvisado</td><td>10</td><td>Componentes</td><td>Bom quando o produto for útil.</td></tr>
                  <tr><td>Rádio Improvisado</td><td>10</td><td>Componentes</td><td>Receita de progressão.</td></tr>
                  <tr><td>Walkie-Talkie Improvisado</td><td><strong>20</strong></td><td>Componentes</td><td>Abre no nível 2.</td></tr>
                  <tr><td>Rádio Amador Improvisado</td><td><strong>30</strong></td><td>Componentes</td><td>Maior XP desta família; nível 3.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>XP alto não significa melhor rota.</strong> Rádio Amador dá 30 XP, mas exige
              muitos componentes. Não destrua uma cadeia de peças raras só porque o número é maior.
            </div>
          </section>

          {/* 7 — cadáveres */}
          <section id="cadaveres" className="guia-section">
            <div className="guia-eyebrow">07 · Rota dos cadáveres</div>
            <h2 className="guia-section-title">10x zumbis cria uma fonte de XP que não exige outra incursão</h2>
            <p className="guia-muted">
              Relógios digitais aparecem entre os pequenos eletrônicos desmontáveis. Em uma temporada
              com grande volume de combate, verificar cadáveres já seguros pode gerar um estoque
              constante de aparelhos de <strong>2 XP base</strong>.
            </p>
            <div className="guia-route">
              <span className="guia-node">Combate necessário</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Cadáveres seguros</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Relógios digitais</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">2 XP + Sucata</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Reparo de gerador: +5 XP</span>
            </div>
            <div className="guia-alert">
              <strong>Essa é a rota mais compatível com o campeonato:</strong> você não cria risco novo
              para obter o eletrônico. O item vem como consequência de um combate que já aconteceu.
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Não vasculhe cadáveres durante uma luta ativa.</strong> Junte os
              corpos/eletrônicos apenas depois que o setor estiver realmente controlado.
            </div>
          </section>

          {/* 8 — fabricações */}
          <section id="receitas" className="guia-section">
            <div className="guia-eyebrow">08 · Fabricações</div>
            <h2 className="guia-section-title">Use componentes para produtos úteis e XP adicional</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Nível</th><th>Receita</th><th>XP base</th><th>Observação</th></tr></thead>
                <tbody>
                  <tr><td>1</td><td>Lanterna Improvisada</td><td>10</td><td>Excelente com energia cortada; exige receita/conhecimento.</td></tr>
                  <tr><td>1</td><td>Lampião Elétrico Improvisado</td><td>10</td><td>Iluminação de base sem depender de rede.</td></tr>
                  <tr><td>1</td><td>Rádio Improvisado</td><td>10</td><td>Use componentes recuperados.</td></tr>
                  <tr><td>1</td><td>Temporizador</td><td>4</td><td>Baixa prioridade para grind.</td></tr>
                  <tr><td>2</td><td>Walkie-Talkie Improvisado</td><td><strong>20</strong></td><td>Boa relação XP se você já tem componentes.</td></tr>
                  <tr><td>2</td><td>Controle Remoto Curto Alcance</td><td>6</td><td>Uso especializado.</td></tr>
                  <tr><td>3</td><td>Rádio Amador Improvisado</td><td><strong>30</strong></td><td>Alto XP, porém caro em componentes.</td></tr>
                  <tr><td>3</td><td>Gerador</td><td>—</td><td>O marco é poder conectar, não fabricar.</td></tr>
                  <tr><td>4</td><td>Controle Remoto Médio Alcance</td><td>10</td><td>Uso especializado.</td></tr>
                  <tr><td>5</td><td>Modificar algumas luminárias para bateria</td><td>—</td><td><strong>Marco de autonomia energética.</strong></td></tr>
                  <tr><td>6</td><td>Controle Remoto Longo Alcance</td><td>14</td><td>Último grande gate de receita padrão.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Não existe uma "receita milagrosa" nos níveis 7–10.</strong> O final da skill
              depende de multiplicadores altos dos livros, desmontagem acumulada, reparos reais de
              gerador e fabricação útil.
            </div>
          </section>

          {/* 9 — geradores */}
          <section id="geradores" className="guia-section">
            <div className="guia-eyebrow">09 · Geradores</div>
            <h2 className="guia-section-title">No campeonato, Elétrica 3 é um objetivo estratégico</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">Conectar gerador</div>
                <div className="guia-metric guia-green">Nv.3</div>
                <p className="guia-sub">Ou revista / profissão adequada.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Alcance padrão</div>
                <div className="guia-metric">20</div>
                <p className="guia-sub">tiles horizontalmente.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Vertical</div>
                <div className="guia-metric">±3</div>
                <p className="guia-sub">andares na configuração padrão.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Reparo</div>
                <div className="guia-metric guia-gold">5 XP</div>
                <p className="guia-sub">por Sucata Eletrônica.</p>
              </div>
            </div>
            <h3 className="guia-h3">Reparo</h3>
            <p className="guia-muted">
              Com o gerador desligado e abaixo de 100% de condição, use Sucata Eletrônica. Cada unidade
              concede <strong>5 XP de Elétrica</strong> e restaura aproximadamente{' '}
              <strong>4 + metade do nível de Elétrica</strong> em condição.
            </p>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Elétrica</th><th>Condição aproximada restaurada por sucata</th></tr></thead>
                <tbody>
                  <tr><td>0</td><td>4</td></tr>
                  <tr><td>2</td><td>5</td></tr>
                  <tr><td>4</td><td>6</td></tr>
                  <tr><td>6</td><td>7</td></tr>
                  <tr><td>8</td><td>8</td></tr>
                  <tr><td>10</td><td>9</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Gerador sempre do lado de fora.</strong> Uso interno produz gases letais. Em 10x,
              ainda há outro problema: ruído. Coloque o gerador em posição protegida, mas externa.
            </div>
          </section>

          {/* 10 — energia da base */}
          <section id="energia" className="guia-section">
            <div className="guia-eyebrow">10 · Energia da base</div>
            <h2 className="guia-section-title">Com a rede morta no dia 1, energia precisa ter prioridades</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Prioridade</th><th>Carga</th><th>Por quê</th></tr></thead>
                <tbody>
                  <tr><td><strong>S</strong></td><td>Geladeiras / freezers úteis</td><td>Preservação de comida e produção animal/agricultura futura.</td></tr>
                  <tr><td><strong>S</strong></td><td>Bomba de combustível durante operação no posto</td><td>Permite recuperar combustível após o apagão.</td></tr>
                  <tr><td>A</td><td>Carregador de bateria automotiva</td><td>Mantém frota e geradores logísticos.</td></tr>
                  <tr><td>A</td><td>Equipamentos essenciais de oficina/base</td><td>Use apenas quando necessários.</td></tr>
                  <tr><td>B</td><td>TV/VHS</td><td>Ligue somente para consumir mídia útil.</td></tr>
                  <tr><td>C</td><td>Iluminação decorativa</td><td>Prefira baterias ou poucas lâmpadas.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Postos não voltam a ter combustível infinito só porque receberam energia.</strong>{' '}
              Na B42 atual, bombas podem ter combustível finito. Leve recipientes e execute a operação
              de coleta de forma concentrada.
            </div>
          </section>

          {/* 11 — ligação direta */}
          <section id="hotwire" className="guia-section">
            <div className="guia-eyebrow">11 · Ligação Direta</div>
            <h2 className="guia-section-title">Elétrica 1 + Mecânica 2 conecta os dois manuais</h2>
            <div className="guia-route">
              <span className="guia-node">Elétrica 1</span>
              <span className="guia-arrow">+</span>
              <span className="guia-node">Mecânica 2</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Ligação Direta</span>
            </div>
            <p className="guia-muted">
              Para personagens comuns, essa combinação libera a ação de ligação direta. A vantagem
              ligada à profissão de Ladrão também contorna o requisito.
            </p>
            <div className="guia-alert">
              <strong>Prioridade alta no Brasileirão:</strong> chegar rapidamente a Elétrica 1 depois do
              Manual de Mecânica permite recuperar veículos sem chave e trazer veículos doadores para a
              oficina segura.
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Ligação Direta não é método de XP de Elétrica.</strong> É um desbloqueio
              logístico. Treine desmontando/fabricando; use hotwire apenas quando o veículo vale o
              risco.
            </div>
          </section>

          {/* 12 — rota */}
          <section id="rota" className="guia-section">
            <div className="guia-eyebrow">12 · Rota definitiva 0 → 10</div>
            <h2 className="guia-section-title">A rota oficial para 10x e apagão no primeiro dia</h2>
            {[
              { num: '0', title: 'Nível 0 → 1 — eletrônicos trazidos para a base', body: 'Leia Elétrica I. Desmonte TVs/rádios/walkies que você já possui e pequenos eletrônicos coletados durante loot normal. Guarde pelo menos uma TV/aparelho funcional para VHS futuro.' },
              { num: '1', title: 'Nível 1 → 2 — marco da Ligação Direta', body: 'Com Mecânica 2 já trabalhada no manual anterior, Elétrica 1 libera hotwire. Continue pequenos eletrônicos e use Lanterna/Lampião/Rádio Improvisado — 10 XP — quando os componentes forem sobras.' },
              { num: '2', title: 'Nível 2 → 3 — corrida pelo gerador', body: 'Walkie-Talkie Improvisado — 20 XP — é boa opção quando houver componentes. Continue desmontando TVs/rádios e eletrônicos de cadáveres. O objetivo é Elétrica 3 para eliminar dependência da revista de gerador.' },
              { num: '3', title: 'Nível 3 → 5 — gerador + rádio amador', body: 'Leia Elétrica II. Conecte o gerador da base, faça reparos somente quando a condição exigir e fabrique Rádio Amador Improvisado (30 XP) quando os componentes estiverem disponíveis.' },
              { num: '5', title: 'Nível 5 → 7 — autonomia por bateria', body: 'Leia Elétrica III. Use a capacidade de modificar luminárias compatíveis para bateria, reduzindo tempo de gerador. Continue loteando eletrônicos.' },
              { num: '7', title: 'Nível 7 → 9 — progressão passiva da infraestrutura', body: 'Leia Elétrica IV. Não faça incursões por XP. Toda sucata eletrônica da temporada entra em lotes; geradores usados naturalmente fornecem reparos.' },
              { num: '9', title: 'Nível 9 → 10 — multiplicador 16×', body: 'Leia Elétrica V antes de destruir seu estoque final. Nessa faixa, cada TV de 10 XP base, cada aparelho elétrico grande e cada reparo real recebem enorme valor do livro.' },
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
              <strong>Resumo:</strong> eletrônicos naturais → Elétrica 1 / Ligação Direta → Elétrica 3 /
              Gerador → Elétrica 5 / luzes a bateria → livros altos + sucata da temporada → 10.
            </div>
          </section>

          {/* 13 — brasileirão */}
          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow">13 · Estratégia Brasileirão</div>
            <h2 className="guia-section-title">O apagão muda completamente a prioridade da skill</h2>
            {[
              { num: '1', title: 'Chave de Fenda no primeiro kit', body: 'É leve, reutilizável e converte pequenos eletrônicos em XP e sucata. Deve entrar cedo na mochila, mas você não precisa desmontar tudo em campo.' },
              { num: '2', title: 'Eletrônicos via cadáveres', body: 'Com população 10x, aproveite relógios digitais e itens eletrônicos de corpos já seguros. Isso reduz incursões dedicadas e alimenta o estoque de sucata.' },
              { num: '3', title: 'Guarde uma TV', body: 'Energia caiu no dia 1, mas VHS ainda pode ser útil mais tarde com gerador. Desmonte TVs excedentes por 10 XP; não destrua a única instalação de mídia da base.' },
              { num: '4', title: 'Elétrica 3 cedo se não achou revista', body: 'Esse nível remove a dependência de Como Usar Geradores. Em um campeonato sem rede elétrica desde o primeiro dia, isso é um enorme ganho de autonomia.' },
              { num: '5', title: 'Gerador não é aparelho de grind', body: 'Não deixe rodando só para danificá-lo e ganhar XP reparando. Combustível é estratégico. Repare quando houver necessidade real.' },
              { num: '6', title: 'Postos em operações concentradas', body: 'Leve gerador, combustível inicial, recipientes e segurança suficiente para ligar a bomba, coletar o máximo planejado e sair.' },
              { num: '7', title: 'Nível 5: reduza dependência do gerador para luz', body: 'Use luminárias a bateria onde forem compatíveis. Reserve gasolina para refrigeração, combustível, oficina e necessidades críticas.' },
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
              <strong>Regra definitiva:</strong> Elétrica deve diminuir o número de vezes em que o
              personagem precisa entrar na cidade. Se o grind exige uma incursão extra, provavelmente
              existe uma rota mais segura usando cadáveres, eletrônicos já coletados e manutenção da
              própria base.
            </div>
          </section>

          {/* 14 — calculadora */}
          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow">14 · Calculadora</div>
            <h2 className="guia-section-title">Quantos aparelhos faltam?</h2>
            <p className="guia-sub">
              Calcula XP restante usando uma fonte principal. O multiplicador já inicia em{' '}
              <strong>0,8×</strong>, conforme o campeonato.
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
                <label className="guia-label">Fonte principal</label>
                <select className="guia-input" value={sourceIdx} onChange={e => setSourceIdx(+e.target.value)}>
                  {SOURCES.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label className="guia-label">Multiplicador de XP (campeonato = 0,8×)</label>
                <input className="guia-input" type="number" value={xpMult} min={0.01} step={0.05}
                  onChange={e => setXpMult(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label className="guia-label">Itens já armazenados</label>
                <input className="guia-input" type="number" value={stock} min={0} step={1}
                  onChange={e => setStock(+e.target.value)} />
              </div>
            </div>
            <div className="guia-result">
              {result ? (
                <>
                  <span className="guia-sub">XP restante na faixa</span><br />
                  <strong>{result.xpNeed.toLocaleString('pt-BR')} XP</strong>
                  <br /><br />
                  <span className="guia-sub">Itens/ações equivalentes necessários</span><br />
                  <strong>{result.need.toLocaleString('pt-BR')}</strong><br />
                  <span className="guia-sub">
                    Seu estoque cobre aproximadamente {result.stockXp.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} XP.
                    Ainda faltariam ~{result.remaining.toLocaleString('pt-BR')} itens/ações dessa fonte, ignorando outras fontes de XP.
                  </span>
                </>
              ) : (
                <strong>Escolha um nível desejado maior que o atual.</strong>
              )}
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Uso correto:</strong> esta é uma projeção. Na prática, misture fontes: eletrônicos
              pequenos, TVs, aparelhos fixos, fabricação e reparos reais de gerador.
            </div>
          </section>

          {/* 15 — erros (era 16) */}
          <section id="erros" className="guia-section">
            <div className="guia-eyebrow">15 · Erros comuns</div>
            <h2 className="guia-section-title">O que desperdiça componentes, gasolina ou segurança</h2>
            {[
              { title: '1. Desmontar todos os componentes recebidos', body: 'Amplificador, receptor, transmissor, fio e lâmpadas são insumos. Nem tudo que parece eletrônico é um novo alvo de desmontagem.' },
              { title: '2. Destruir a única TV da base', body: 'TV vale 10 XP, mas você pode precisar dela para VHS quando houver gerador. Guarde uma instalação funcional.' },
              { title: '3. Procurar a revista de gerador indefinidamente', body: 'Elétrica 3 resolve o requisito de conexão/uso. Em 10x, não transforme uma revista em motivo para atravessar uma cidade.' },
              { title: '4. Deixar gerador rodando apenas para reparar depois', body: 'Isso troca combustível por XP. Com energia cortada no primeiro dia, combustível é infraestrutura; não recurso de grind.' },
              { title: '5. Achar que Ligação Direta dá XP de Elétrica', body: 'Ela é desbloqueada por Elétrica 1 + Mecânica 2, mas não é o loop de progressão da skill.' },
              { title: '6. Levar o personagem para desmontar TVs no meio da cidade', body: 'TV pesa. Se a área não é segura, marque o local ou carregue apenas quando isso fizer parte da rota. A prioridade é sobreviver.' },
              { title: '7. Usar gerador dentro da base', body: 'Geradores produzem gases perigosos em ambiente interno. Coloque-o fora do prédio e dentro do alcance necessário.' },
              { title: '8. Fabricar Rádio Amador só porque dá 30 XP', body: 'Componentes de rádio são úteis e não necessariamente abundantes. Faça quando houver material excedente ou utilidade real.' },
            ].map((e, i) => (
              <details key={i} className="guia-details">
                <summary>{e.title}</summary>
                <div className="guia-details-body"><p>{e.body}</p></div>
              </details>
            ))}
          </section>

          {/* 16 — fontes (era 17) */}
          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow">16 · Fontes e versão</div>
            <h2 className="guia-section-title">Base técnica do manual</h2>
            <p className="guia-muted">
              Consolidado para a versão estável <strong>42.20.4</strong>. Dados de receitas e
              desmontagem foram cruzados com extrações mecânicas dos arquivos B42 e documentação atual
              de geradores.
            </p>
            <ol className="guia-sources">
              <li><a href="https://projectzomboid.com/version_announce/" target="_blank" rel="noopener noreferrer">The Indie Stone — versão estável 42.20.4</a></li>
              <li><a href="https://pz-guide.com/en/skill/electricity/" target="_blank" rel="noopener noreferrer">PZ Guide — níveis, profissões e requisitos de receitas de Elétrica</a></li>
              <li><a href="https://pzfans.com/how-to-level-up-the-electrical-skill-in-project-zomboid/" target="_blank" rel="noopener noreferrer">PZFans — XP de desmontagem, receitas, profissões, geradores e Ligação Direta</a></li>
              <li><a href="https://pz-guide.com/en/item/Base.ElectronicsScrap/" target="_blank" rel="noopener noreferrer">PZ Guide — Sucata Eletrônica, receitas e XP atuais</a></li>
              <li><a href="https://pzfans.com/pages/project_zomboid_b42_generator_power_lab/" target="_blank" rel="noopener noreferrer">PZFans — geradores, Elétrica 3, alcance e luminárias a bateria</a></li>
              <li><a href="https://pzfans.com/how-to-find-use-and-repair-generator-in-project-zomboid/" target="_blank" rel="noopener noreferrer">PZFans — reparo de gerador e condição por nível</a></li>
              <li><a href="https://pzfans.com/item-books/" target="_blank" rel="noopener noreferrer">PZFans — livros I–V e revistas elétricas</a></li>
              <li><a href="https://pz-guide.com/en/item/Base.TvBlack/" target="_blank" rel="noopener noreferrer">PZ Guide — TV e desmontagem por 10 XP</a></li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo definitivo:</strong> em 10x com energia cortada no dia 1, use{' '}
              <strong>relógios e eletrônicos obtidos naturalmente</strong>, leia antes de desmontar,
              alcance <strong>Elétrica 1 para Ligação Direta</strong>,{' '}
              <strong>Elétrica 3 para autonomia de gerador</strong>,{' '}
              <strong>Elétrica 5 para iluminação a bateria</strong> e use a manutenção energética real
              da base para completar o nível 10.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
