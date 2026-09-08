import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',           label: '1. Visão geral' },
  { id: 'criacao',         label: '2. Criação do personagem' },
  { id: 'livros',          label: '3. Livros' },
  { id: 'revistas',        label: '4. Manuais Laine' },
  { id: 'carzone',         label: '5. VHS Carzone' },
  { id: 'kit',             label: '6. Kit mínimo' },
  { id: 'xp',              label: '7. Como o XP funciona' },
  { id: 'pecas',           label: '8. Peças por nível' },
  { id: 'rota',            label: '9. Rota 0→10' },
  { id: 'oficina',         label: '10. Oficina segura' },
  { id: 'combustivel',     label: '11. Combustível' },
  { id: 'hotwire',         label: '12. Ligação Direta' },
  { id: 'veiculoprincipal',label: '13. Veículo principal' },
  { id: 'brasileirao',     label: '14. Estratégia Brasileirão' },
  { id: 'calculadora',     label: '15. Calculadora' },
  { id: 'erros',           label: '16. Erros comuns' },
  { id: 'fontes',          label: '17. Fontes e versão' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

export function GuiaMecanica() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [roundXp, setRoundXp] = useState(150);
  const [cars, setCars] = useState(5);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const xpNeed = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const per = roundXp || 1;
    const rounds = Math.ceil(xpNeed / per);
    const xpPerCar = per / (cars || 1);
    return { xpNeed, rounds, per, cars: cars || 1, xpPerCar };
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
            <h1 className="guia-title">Manual Definitivo de Mecânica 0 → 10</h1>
            <p className="guia-subtitle">
              A rota competitiva para dominar veículos sem transformar um estacionamento em sentença de
              morte. O foco é <strong>levar o trabalho mecânico para uma área controlada</strong>, usar
              cada veículo doador ao máximo e reduzir incursões urbanas em um mundo 10x.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">10x zumbis</span>
              <span className="guia-pill">32.775 XP total</span>
              <span className="guia-pill">Sem energia dia 1</span>
              <span className="guia-pill">3 manuais Laine</span>
              <span className="guia-pill">Ligação Direta: Mecânica 2 + Elétrica 1</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Configuração oficial do campeonato:</strong> população <strong>10x</strong>, energia
            e água cortadas no primeiro dia. Mecânica não depende diretamente desses serviços, mas o
            corte de energia torna <strong>combustível, geradores e logística de veículos</strong> ainda
            mais estratégicos.
          </div>

          <div className="guia-alert guia-alert-info">
            <strong>Configuração oficial usada neste manual:</strong>{' '}
            <strong>população de zumbis 10x</strong>, <strong>água cortada no primeiro dia</strong>,{' '}
            <strong>energia cortada no primeiro dia</strong> e <strong>XP global 0,8×</strong>.
            {' '}Fórmula: <strong>XP efetivo = XP base × 0,8 × bônus inicial × livro × modificadores</strong>.
            Exemplo: 10 XP base → <strong>8 XP</strong>; 70 XP base → <strong>56 XP</strong>.
          </div>

          {/* 1 — visão geral */}
          <section id="visao" className="guia-section">
            <div className="guia-eyebrow">01 · Visão geral</div>
            <h2 className="guia-section-title">O recurso de Mecânica não é metal. São veículos doadores seguros.</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">XP 0→10</div>
                <div className="guia-metric">32.775</div>
                <p className="guia-sub">Curva regular.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Início sem revista</div>
                <div className="guia-metric guia-green">4 tipos</div>
                <p className="guia-sub">Bateria, rádio, faróis e depois pneus.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Gargalo</div>
                <div className="guia-metric guia-gold">Carros</div>
                <p className="guia-sub">Mais veículos = mais ações válidas por rodada.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Maior risco</div>
                <div className="guia-metric guia-red">Exposição</div>
                <p className="guia-sub">Trabalhar parado em área urbana 10x.</p>
              </div>
            </div>
            <div className="guia-alert">
              <strong>Princípio do manual:</strong> limpe ou crie uma área de oficina, leve veículos
              doadores até ela quando possível e faça uma <strong>rodada completa por veículo</strong>.
              Mecânica deve ser treinada perto da base, não no meio de uma avenida infestada.
            </div>
            <div className="guia-route">
              <span className="guia-node">Livro</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Bateria/Rádio/Faróis</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Pneus</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Laine</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Peças maiores</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Frota doadora</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">10</span>
            </div>
          </section>

          {/* 2 — criação */}
          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow">02 · Criação do personagem</div>
            <h2 className="guia-section-title">Mecânico é a rota curta; não necessariamente a melhor build geral</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Escolha</th><th>Bônus</th><th>Conhecimento</th><th>Uso no Brasileirão</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Mecânico</strong> (Mechanic)</td>
                    <td><strong>Mecânica +4</strong> e Soldagem +1</td>
                    <td>Básica + Intermediária + Avançada</td>
                    <td>Pula grande parte do início e elimina a busca pelos três manuais Laine.</td>
                  </tr>
                  <tr>
                    <td><strong>Conhecimento de Veículos</strong></td>
                    <td>Mecânica +1</td>
                    <td>Básica + Intermediária</td>
                    <td>Alternativa de traço se a profissão principal for outra.</td>
                  </tr>
                  <tr>
                    <td>Sem bônus</td>
                    <td>0</td>
                    <td>Nenhum</td>
                    <td>Funciona, mas exige livros, revistas e mais veículos no começo.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Mesma regra dos demais Manuais Definitivos:</strong> não escolha profissão apenas
              para maximizar uma habilidade isolada. No campeonato, a build precisa funcionar como
              conjunto.
            </div>
          </section>

          {/* 3 — livros */}
          <section id="livros" className="guia-section">
            <div className="guia-eyebrow">03 · Livros</div>
            <h2 className="guia-section-title">Leia antes de encostar no carro</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Faixa</th><th>Nome em português</th><th>Nome original</th><th>Páginas</th><th>Mult.</th></tr></thead>
                <tbody>
                  <tr><td>1–2</td><td>Mecânica I — Guia de Reparos da Carzone</td><td>Carzone's Repair Guide</td><td>220</td><td><strong>3×</strong></td></tr>
                  <tr><td>3–4</td><td>Mecânica II — Como Funcionam os Motores de Veículos</td><td>How Vehicle Engines Work</td><td>260</td><td><strong>5×</strong></td></tr>
                  <tr><td>5–6</td><td>Mecânica III — Manual de Reparos Laine '93</td><td>Laine's Repair Manual '93</td><td>300</td><td><strong>8×</strong></td></tr>
                  <tr><td>7–8</td><td>Mecânica IV — Manutenção Veicular de Longo Prazo</td><td>Long Term Vehicle Maintenance</td><td>340</td><td><strong>12×</strong></td></tr>
                  <tr><td>9–10</td><td>Mecânica V — Dominando Técnicas de Diagnóstico Automotivo</td><td>Mastering Automotive Fault Diagnosis Techniques</td><td>380</td><td><strong>16×</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Mecânica tem limite diário de XP por combinação de veículo/peça/ação.</strong>{' '}
              Desperdiçar uma rodada sem o livro correto custa mais que alguns minutos de leitura: custa
              uma janela inteira daquele veículo.
            </div>
          </section>

          {/* 4 — manuais laine */}
          <section id="revistas" className="guia-section">
            <div className="guia-eyebrow">04 · Manuais Laine</div>
            <h2 className="guia-section-title">Livros multiplicam XP; Laine libera conhecimento</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Manual</th><th>Conhecimento</th><th>Veículos / peças</th><th>Prioridade</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Manual Laine de Automóveis Padrão</strong><br /><span className="guia-sub">(Laines Standard Auto Manual)</span></td>
                    <td>Mecânica Básica</td>
                    <td>Carros familiares e peças básicas.</td>
                    <td>★★★★★</td>
                  </tr>
                  <tr>
                    <td><strong>Manual Laine de Veículos Comerciais</strong><br /><span className="guia-sub">(Laines Commercial Auto Manual)</span></td>
                    <td>Mecânica Intermediária</td>
                    <td>Vans, utilitários e veículos comerciais.</td>
                    <td>★★★★☆</td>
                  </tr>
                  <tr>
                    <td><strong>Manual Laine de Veículos de Desempenho</strong><br /><span className="guia-sub">(Laines Performance Auto Manual)</span></td>
                    <td>Mecânica Avançada</td>
                    <td>Modelos esportivos/de desempenho.</td>
                    <td>★★★☆☆</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="guia-muted">
              Bateria, rádio e faróis não exigem Laine. Pneus também não exigem nos templates
              compartilhados atuais.
            </p>
            <div className="guia-alert">
              <strong>Profissão Mecânico conhece os três grupos.</strong> O traço Conhecimento de
              Veículos cobre Básica e Intermediária.
            </div>
          </section>

          {/* 5 — VHS Carzone */}
          <section id="carzone" className="guia-section">
            <div className="guia-eyebrow">05 · VHS Carzone</div>
            <h2 className="guia-section-title">Boa aceleração inicial, mas não vale uma incursão exclusiva em 10x</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Fita</th><th>Eventos de XP</th><th>Valor por evento</th><th>Observação</th></tr></thead>
                <tbody>
                  <tr><td>Carzone Episódio 1</td><td>6</td><td>50 × quantidade definida</td><td>Uma exibição útil antes do limite de mídia.</td></tr>
                  <tr><td>Carzone Episódio 2</td><td>6</td><td>50 × quantidade definida</td><td>Mesmo funcionamento.</td></tr>
                  <tr><td>Carzone Episódio 3</td><td>6</td><td>50 × quantidade definida</td><td>Mesmo funcionamento.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Energia cortada no dia 1:</strong> VHS exige uma solução elétrica posterior para
              TV/aparelho. Se você já possui gerador e fita, use com o livro correspondente. Não invada
              uma locadora cercada só por isso.
            </div>
          </section>

          {/* 6 — kit */}
          <section id="kit" className="guia-section">
            <div className="guia-eyebrow">06 · Kit mínimo</div>
            <h2 className="guia-section-title">O kit que deve morar na oficina</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Prioridade</th><th>Ferramenta</th><th>Função</th></tr></thead>
                <tbody>
                  <tr><td>★★★★★</td><td><strong>Chave de Fenda</strong></td><td>Bateria, rádio, faróis, bancos e outras peças. Alternativas: Multiferramenta e equivalentes.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Chave de Boca / Catraca</strong></td><td>Capô, tampa do porta-malas, freios, suspensão, escapamento e tanque.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Macaco</strong></td><td>Necessário para pneus, freios e suspensão.</td></tr>
                  <tr><td>★★★★★</td><td><strong>Chave de Roda</strong></td><td>Retirada/instalação de pneus.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Bomba de Pneu</strong></td><td>Corrigir pressão; não necessária para tirar o pneu.</td></tr>
                  <tr><td>★★★★☆</td><td><strong>Galão de Combustível</strong></td><td>Logística e recuperação de veículos.</td></tr>
                  <tr><td>★★★☆☆</td><td><strong>Peças sobressalentes</strong></td><td>Componentes bons retirados de doadores para a frota principal.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Nunca deixe o Macaco ou a Chave de Roda no porta-malas de um carro que pode ficar
              preso fora da base.</strong> Em 10x, perder o kit mecânico pode forçar uma segunda
              incursão apenas para recuperar ferramentas.
            </div>
          </section>

          {/* 7 — XP */}
          <section id="xp" className="guia-section">
            <div className="guia-eyebrow">07 · Como o XP funciona</div>
            <h2 className="guia-section-title">O segredo é variedade, não spam</h2>
            <p className="guia-muted">
              Mecânica usa controle por combinação de <strong>veículo + peça + ação</strong>. Remover e
              instalar são ações distintas. Depois de usar aquela combinação, repetir imediatamente não
              cria uma fonte infinita de XP.
            </p>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Sucesso</strong>
                <div className="guia-metric guia-blue">Dinâmico</div>
                <p className="guia-muted">O sistema não expõe uma tabela universal de XP fixo para todas as peças e modelos.</p>
              </div>
              <div className="guia-card">
                <strong>Falha</strong>
                <div className="guia-metric">1 XP</div>
                <p className="guia-muted">Falha de instalar/remover concede 1 XP base na 42.20.4.</p>
              </div>
              <div className="guia-card">
                <strong>Repetição</strong>
                <div className="guia-metric guia-gold">Diária</div>
                <p className="guia-muted">A mesma combinação entra no limite diário. Trabalhe vários carros.</p>
              </div>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Não provoque falhas de propósito.</strong> Você ganha 1 XP, mas pode degradar
              peças e perder tempo.
            </div>
            <h3 className="guia-h3">Modelo de rodada</h3>
            <div className="guia-route">
              <span className="guia-node">Carro A: remover</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Carro A: instalar</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Carro B</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Carro C</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">encerrar</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">próxima rodada</span>
            </div>
          </section>

          {/* 8 — peças por nível */}
          <section id="pecas" className="guia-section">
            <div className="guia-eyebrow">08 · Peças por nível</div>
            <h2 className="guia-section-title">Comece pelo que não exige revista</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Peça</th><th>Nível</th><th>Ferramentas</th><th>Conhecimento</th><th>Uso</th></tr></thead>
                <tbody>
                  <tr><td><strong>Bateria</strong></td><td>0</td><td>Chave de Fenda/equivalente</td><td>Nenhum</td><td><span className="guia-rank">INÍCIO</span></td></tr>
                  <tr><td><strong>Rádio</strong></td><td>0</td><td>Chave de Fenda/equivalente</td><td>Nenhum</td><td><span className="guia-rank">INÍCIO</span></td></tr>
                  <tr><td><strong>Faróis</strong></td><td>0</td><td>Chave de Fenda/equivalente</td><td>Nenhum</td><td><span className="guia-rank">INÍCIO</span></td></tr>
                  <tr><td><strong>Pneus</strong></td><td>1</td><td>Macaco + Chave de Roda</td><td>Nenhum</td><td>4 posições por carro.</td></tr>
                  <tr><td>Bancos</td><td>1</td><td>Chave de Fenda</td><td>Básica*</td><td>Expande a rodada.</td></tr>
                  <tr><td>Freios</td><td>3</td><td>Macaco + Chave</td><td>Básica*</td><td>Peças adicionais por roda.</td></tr>
                  <tr><td>Suspensão</td><td>3</td><td>Macaco + Chave</td><td>Básica*</td><td>Expande muito a rodada.</td></tr>
                  <tr><td>Capô / Tampa do Porta-malas</td><td>3</td><td>Chave</td><td>Básica*</td><td>Boas peças para praticar em doadores.</td></tr>
                  <tr><td>Tanque de Combustível</td><td>5</td><td>Chave de Fenda + Chave</td><td>Básica*</td><td>Faça apenas em área segura.</td></tr>
                  <tr><td>Escapamento</td><td>5</td><td>Chave</td><td>Básica*</td><td>Boa ampliação de rodada.</td></tr>
                </tbody>
              </table>
            </div>
            <p className="guia-sub">*O grupo de conhecimento pode subir para Intermediário/Avançado dependendo da classe/modelo do veículo.</p>
          </section>

          {/* 9 — rota */}
          <section id="rota" className="guia-section">
            <div className="guia-eyebrow">09 · Rota definitiva 0 → 10</div>
            <h2 className="guia-section-title">A progressão oficial para um mundo 10x</h2>
            {[
              { num: '0', title: 'Nível 0 → 1 — Chave de Fenda', body: 'Leia Mecânica I. Em veículos doadores seguros, remova e reinstale Bateria, Rádio e Faróis. Passe para o próximo carro; não fique repetindo a mesma peça.' },
              { num: '1', title: 'Nível 1 → 2 — adicione os quatro pneus', body: 'Com Macaco + Chave de Roda, cada veículo ganha quatro novas posições para trabalhar. Se já tiver Manual Laine Padrão, inclua bancos quando o modelo permitir.' },
              { num: '2', title: 'Nível 2 — marco estratégico: Ligação Direta', body: 'Em paralelo, alcance Elétrica 1. Mecânica 2 + Elétrica 1 libera Ligação Direta para personagens sem a vantagem de Ladrão, ampliando a capacidade de recuperar carros úteis.' },
              { num: '3', title: 'Nível 3 → 5 — a rodada fica grande', body: 'Leia Mecânica II e tenha o conhecimento Laine apropriado. Acrescente Freios, Suspensão, Capô e Tampa do Porta-malas aos doadores. Priorize carros já ruins para não destruir sua frota.' },
              { num: '5', title: 'Nível 5 → 7 — tanque e escapamento', body: 'Com Mecânica III, a rotina abre Tanque de Combustível e Escapamento. Uma única rodada em vários carros pode envolver muitas ações distintas.' },
              { num: '7', title: 'Nível 7 → 9 — oficina diária', body: 'Leia Mecânica IV. Não procure "uma peça melhor": trabalhe todas as peças seguras disponíveis em uma frota de doadores. Faça a rodada e volte às outras tarefas da temporada.' },
              { num: '9', title: 'Nível 9 → 10 — Mecânica V + frota consolidada', body: 'O multiplicador 16× do livro final torna cada ação válida muito valiosa. Faça somente rodadas completas e evite perder veículos/peças por excesso de tentativa.' },
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
              <strong>Resumo definitivo:</strong> Chave de Fenda → Pneus → Ligação Direta → peças nível
              3 → peças nível 5 → frota de doadores → rodadas diárias até 10.
            </div>
          </section>

          {/* 10 — oficina */}
          <section id="oficina" className="guia-section">
            <div className="guia-eyebrow">10 · Oficina segura</div>
            <h2 className="guia-section-title">Em 10x, leve o carro até o grind — não o grind até o carro</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Pátio limpo</strong>
                <p className="guia-muted">Área plana, com visão ampla e saída rápida. Evite becos, postos de gasolina e estacionamentos centrais.</p>
              </div>
              <div className="guia-card">
                <strong>Veículos doadores</strong>
                <p className="guia-muted">Separe carros ruins para treinamento e carros bons para uso. Não misture as duas categorias.</p>
              </div>
              <div className="guia-card">
                <strong>Ferramentas fixas</strong>
                <p className="guia-muted">Caixa próxima aos carros com Macaco, chaves e peças. Menos caminhada = menos tempo vulnerável.</p>
              </div>
            </div>
            <p className="guia-muted">
              Não existe um número universal de doadores: depende dos bônus de XP e das peças liberadas.
              Na prática, <strong>mais veículos na oficina reduzem a quantidade de dias necessários</strong>.
            </p>
            <div className="guia-alert guia-alert-warning">
              <strong>Reboque pode ser útil</strong> para trazer projetos até a base, mas reduz
              mobilidade e aumenta risco durante o transporte. Em 10x, só rebocar depois de limpar e
              reconhecer a rota.
            </div>
          </section>

          {/* 11 — combustível */}
          <section id="combustivel" className="guia-section">
            <div className="guia-eyebrow">11 · Combustível</div>
            <h2 className="guia-section-title">Energia cortada no dia 1 transforma gasolina em infraestrutura</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Treino</strong>
                <div className="guia-metric guia-green">0 L</div>
                <p className="guia-muted">Remover/instalar peças não exige deixar o motor ligado.</p>
              </div>
              <div className="guia-card">
                <strong>Posto</strong>
                <div className="guia-metric guia-red">Sem energia</div>
                <p className="guia-muted">Com a rede fora, bombas exigem solução elétrica para voltar a operar.</p>
              </div>
              <div className="guia-card">
                <strong>Prioridade</strong>
                <div className="guia-metric guia-gold">Sifonar</div>
                <p className="guia-muted">No início, combustível já presente em veículos é recurso crítico.</p>
              </div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Não deixe carro ligado enquanto trabalha.</strong> Além de gastar combustível,
              ruído de motor pode atrair população 10x para a oficina.
            </div>
          </section>

          {/* 12 — ligação direta */}
          <section id="hotwire" className="guia-section">
            <div className="guia-eyebrow">12 · Ligação Direta</div>
            <h2 className="guia-section-title">Mecânica 2 + Elétrica 1 é um dos maiores marcos logísticos do campeonato</h2>
            <div className="guia-route">
              <span className="guia-node">Mecânica 2</span>
              <span className="guia-arrow">+</span>
              <span className="guia-node">Elétrica 1</span>
              <span className="guia-arrow">→</span>
              <span className="guia-node">Ligação Direta</span>
            </div>
            <p className="guia-muted">
              Na lógica atual da 42.20.4, esta é a exigência usada pelo menu para personagens comuns. A
              vantagem/profissão ligada a Ladrão também permite Ligação Direta sem esses níveis.
            </p>
            <div className="guia-alert guia-alert-warning">
              <strong>Falhas podem gerar ruído.</strong> Primeiro limpe a área, depois tente. Não entre
              em um carro cercado só porque agora você sabe fazer ligação direta.
            </div>
            <h3 className="guia-h3">Por que esse marco muda Mecânica</h3>
            <ul>
              <li>permite recuperar veículos bons sem depender de encontrar a chave;</li>
              <li>facilita trazer carros doadores para a oficina;</li>
              <li>reduz viagens futuras por peças;</li>
              <li>cria sinergia direta com o Manual Definitivo de Elétrica.</li>
            </ul>
          </section>

          {/* 13 — veículo principal */}
          <section id="veiculoprincipal" className="guia-section">
            <div className="guia-eyebrow">13 · Veículo principal</div>
            <h2 className="guia-section-title">Não treine destruindo o carro que mantém sua run viva</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Categoria</th><th>Uso</th><th>Política</th></tr></thead>
                <tbody>
                  <tr><td><strong>Veículo principal</strong></td><td>Saque, fuga, transporte</td><td>Só faça manutenção necessária e ações de alta chance.</td></tr>
                  <tr><td><strong>Reserva</strong></td><td>Plano B</td><td>Conserve peças críticas; done componentes apenas em emergência.</td></tr>
                  <tr><td><strong>Doador de XP</strong></td><td>Treino diário</td><td>Pode receber tentativas, trocas e desgaste.</td></tr>
                  <tr><td><strong>Sucata final</strong></td><td>Fonte de peças/metal</td><td>Retire tudo útil; depois pode alimentar outras habilidades.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert">
              <strong>Regra simples:</strong> todo carro encontrado deve receber uma função. Isso evita
              usar por engano uma bateria 90%, pneu bom ou escapamento raro em um veículo destinado ao
              grind.
            </div>
          </section>

          {/* 14 — brasileirão */}
          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow">14 · Estratégia Brasileirão</div>
            <h2 className="guia-section-title">Treinar Mecânica sem entregar sua posição à horda</h2>
            {[
              { num: '1', title: 'Primeira incursão: kit completo de ferramentas', body: 'Macaco + Chave de Roda + Chave de Boca + Chave de Fenda valem mais que coletar peças aleatórias. Sem ferramentas, os carros não geram progressão suficiente.' },
              { num: '2', title: 'Livros e Laine em uma única rota', body: 'Se for entrar em autopeças, oficina ou livraria, tente sair com livro + manual + ferramenta + peça. Em 10x, cada incursão deve resolver várias dependências.' },
              { num: '3', title: 'Não faça grind em estacionamento comercial', body: 'Retirar pneus e suspensão deixa você parado por muito tempo. Limpe a área ou leve os veículos para uma zona controlada.' },
              { num: '4', title: 'Carros ruins são patrimônio de XP', body: 'Em vez de abandonar todo veículo quebrado, marque os que estão perto de uma zona segura. Eles podem virar oficina-escola.' },
              { num: '5', title: 'Motor desligado, ferramentas prontas', body: 'Treine em silêncio. A população é 10x; ruído de veículo transforma manutenção em evento de combate.' },
              { num: '6', title: 'Mecânica 2 + Elétrica 1 cedo', body: 'Essa combinação abre Ligação Direta e muda toda a logística. O próximo manual de Elétrica deve ser desenvolvido pensando nessa sinergia.' },
              { num: '7', title: 'Rodada diária, não maratona', body: 'Depois que as ações válidas dos seus doadores acabarem, pare. Faça Carpintaria, Ferraria, agricultura, combate ou saque. Volte na rodada seguinte.' },
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
              <strong>Maior erro competitivo:</strong> ficar meia hora real tentando arrancar peças de
              um carro no centro da cidade porque "falta pouco para o nível". A skill volta amanhã; o
              personagem morto não.
            </div>
          </section>

          {/* 15 — calculadora */}
          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow">15 · Calculadora</div>
            <h2 className="guia-section-title">Planejador por rodada real do seu servidor</h2>
            <p className="guia-muted">
              Como o XP de sucesso não possui um único valor universal confiável para todos os
              veículos/peças, esta calculadora usa o método correto:{' '}
              <strong>faça uma rodada no servidor do campeonato, anote o XP real já reduzido pelo
              0,8× e use esse valor para projetar quantas rodadas faltam.</strong>
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
                <label className="guia-label">XP real obtido em 1 rodada (servidor 0,8×)</label>
                <input className="guia-input" type="number" value={roundXp} min={1} step={1}
                  onChange={e => setRoundXp(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label className="guia-label">Veículos usados na rodada</label>
                <input className="guia-input" type="number" value={cars} min={1} step={1}
                  onChange={e => setCars(+e.target.value)} />
              </div>
            </div>
            <div className="guia-result">
              {result ? (
                <>
                  <span className="guia-sub">XP restante</span><br />
                  <strong>{result.xpNeed.toLocaleString('pt-BR')} XP</strong>
                  <br /><br />
                  <span className="guia-sub">Rodadas estimadas</span><br />
                  <strong>{result.rounds.toLocaleString('pt-BR')} rodadas</strong><br />
                  <span className="guia-sub">
                    Sua medição equivale a {result.per.toLocaleString('pt-BR')} XP por rodada com{' '}
                    {result.cars} veículos (~{result.xpPerCar.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} XP por veículo).
                    Se fizer 1 rodada válida por dia, são ~{result.rounds.toLocaleString('pt-BR')} dias de Mecânica.
                  </span>
                </>
              ) : (
                <strong>Escolha um nível desejado maior que o atual.</strong>
              )}
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Como a calculadora usa XP medido:</strong> não aplique 0,8× novamente ao valor
              anotado. Se o jogo mostrou +120 XP na rodada, digite 120; esse valor já representa a
              configuração real do campeonato.
            </div>
          </section>

          {/* 16 — erros (era 17) */}
          <section id="erros" className="guia-section">
            <div className="guia-eyebrow">16 · Erros comuns</div>
            <h2 className="guia-section-title">O que atrasa ou mata o grind</h2>
            {[
              { title: '1. Tirar e colocar a mesma bateria sem parar', body: 'O sistema limita a repetição da mesma combinação veículo/peça/ação. Depois da ação válida, passe para outra peça ou outro veículo.' },
              { title: '2. Achar que bateria, rádio e farol exigem revista', body: 'Na 42.20.4 eles são justamente a rota de entrada sem revista. Pneus entram no nível 1.' },
              { title: '3. Provocar falha de propósito', body: 'Falha dá 1 XP base, mas pode danificar peça e consumir tempo. Não é a estratégia principal.' },
              { title: '4. Usar o carro principal como boneco de treino', body: 'Uma falha pode reduzir uma peça crítica. Use doadores ruins para progressão e preserve o veículo da temporada.' },
              { title: '5. Grindar em estacionamento com horda por perto', body: 'A animação prende o personagem em sequência de ações. Em 10x, oficina aberta em área urbana é risco desnecessário.' },
              { title: '6. Deixar o motor ligado', body: 'Gasta combustível e cria ruído. Mecânica não precisa do motor funcionando para remover/instalar peças.' },
              { title: '7. Buscar VHS como se fosse obrigatório', body: 'Com energia desligada no primeiro dia, Carzone é bônus posterior. A rota de peças leva ao 10 sem VHS.' },
              { title: '8. Usar o bug de recarregar servidor para resetar limite diário', body: 'Não faz parte da rota oficial do manual. Além de ser comportamento reportado como bug, pode ser corrigido a qualquer momento.' },
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
            <h2 className="guia-section-title">Base técnica do manual</h2>
            <p className="guia-muted">
              Consolidado para a versão estável <strong>42.20.4</strong> em setembro de 2026. Dados de
              requisitos e profissões foram cruzados com extrações dos arquivos B42; comportamento do
              limite diário foi conferido com documentação atual e relatório técnico da 42.20.
            </p>
            <ol className="guia-sources">
              <li><a href="https://projectzomboid.com/blog/status-and-build-history/" target="_blank" rel="noopener noreferrer">The Indie Stone — versão estável 42.20.4</a></li>
              <li><a href="https://pzfans.com/mechanics_hacks_level_up_fast_in_project_zomboid/" target="_blank" rel="noopener noreferrer">PZFans — Mecânica 42.20.4, peças, ferramentas, XP, VHS e Ligação Direta</a></li>
              <li><a href="https://pz-guide.com/en/profession/mechanics/" target="_blank" rel="noopener noreferrer">PZ Guide — profissão Mecânico</a></li>
              <li><a href="https://pz-guide.com/en/trait/mechanics/" target="_blank" rel="noopener noreferrer">PZ Guide — Conhecimento de Veículos</a></li>
              <li><a href="https://pype.org/pt-br/zomboid/tools/book-checklist/" target="_blank" rel="noopener noreferrer">pype.org — livros de Mecânica e nomes atuais</a></li>
              <li><a href="https://pz-guide.com/en/item/Base.MechanicMag1/" target="_blank" rel="noopener noreferrer">PZ Guide — Manual Laine Padrão e locais de saque</a></li>
              <li><a href="https://theindiestone.com/forums/profile/41389-tchernobill/" target="_blank" rel="noopener noreferrer">Fórum The Indie Stone — relatório técnico do limite diário em B42.20</a></li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo definitivo:</strong> em 10x, leia os livros, encontre o kit completo, use{' '}
              <strong>bateria/rádio/faróis</strong> no nível 0, adicione <strong>pneus</strong> no 1,
              faça <strong>Mecânica 2 + Elétrica 1</strong> cedo, expanda a rodada com peças de nível
              3/5 e mantenha uma <strong>frota de doadores dentro de uma oficina segura</strong> até o
              nível 10.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
