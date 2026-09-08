import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'criacao',     label: '2. Criação do personagem' },
  { id: 'livros',      label: '3. Livros' },
  { id: 'kit',         label: '4. Kit mínimo' },
  { id: 'agua',        label: '5. Água e irrigação' },
  { id: 'calendario',  label: '6. Calendário de cultivo' },
  { id: 'sementes',    label: '7. Sementes' },
  { id: 'xp',          label: '8. XP' },
  { id: 'marcos',      label: '9. Marcos de nível' },
  { id: 'doencas',     label: '10. Doenças' },
  { id: 'composto',    label: '11. Composto' },
  { id: 'rota',        label: '12. Rota 0→10' },
  { id: 'brasileirao', label: '13. Estratégia Brasileirão' },
  { id: 'calculadora', label: '14. Calculadora' },
  { id: 'erros',       label: '15. Erros comuns' },
  { id: 'fontes',      label: '16. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

const MONTHS: { name: string; crops: string[] }[] = [
  { name: 'Jan', crops: ['Rabanete (3L)', 'Cenoura (4L)', 'Nabo (4L)'] },
  { name: 'Fev', crops: ['Rabanete (3L)', 'Cenoura (4L)', 'Nabo (4L)', 'Alface (2L)'] },
  { name: 'Mar', crops: ['Rabanete (3L)', 'Cenoura (4L)', 'Nabo (4L)', 'Alface (2L)', 'Repolho (4L)'] },
  { name: 'Abr', crops: ['Rabanete (3L)', 'Alface (2L)', 'Repolho (4L)', 'Batata (3L)', 'Morango (4L)'] },
  { name: 'Mai', crops: ['Alface (2L)', 'Repolho (4L)', 'Batata (3L)', 'Tomate (4L)', 'Pimentão (3L)', 'Milho (3L)'] },
  { name: 'Jun', crops: ['Batata (3L)', 'Tomate (4L)', 'Pimentão (3L)', 'Milho (3L)', 'Abobrinha (3L)'] },
  { name: 'Jul', crops: ['Tomate (4L)', 'Pimentão (3L)', 'Milho (3L)', 'Abobrinha (3L)', 'Melão (5L)'] },
  { name: 'Ago', crops: ['Tomate (4L)', 'Pimentão (3L)', 'Abobrinha (3L)', 'Melão (5L)'] },
  { name: 'Set', crops: ['Nabo (4L)', 'Repolho (4L)', 'Batata (3L)', 'Abóbora (4L)'] },
  { name: 'Out', crops: ['Nabo (4L)', 'Cenoura (4L)', 'Repolho (4L)', 'Batata (3L)', 'Abóbora (4L)'] },
  { name: 'Nov', crops: ['Rabanete (3L)', 'Cenoura (4L)', 'Nabo (4L)'] },
  { name: 'Dez', crops: ['Rabanete (3L)', 'Cenoura (4L)', 'Nabo (4L)'] },
];

export function GuiaAgricultura() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [harvestXp, setHarvestXp] = useState(200);
  const [plots, setPlots] = useState(10);
  const [monthIdx, setMonthIdx] = useState(4);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const cycles = Math.ceil(need / (harvestXp || 1));
    const xpPerPlot = (harvestXp / (plots || 1));
    return { need, cycles, xpPerPlot };
  }

  const result = calcResult();
  const currentMonth = MONTHS[monthIdx];

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
            <h1 className="guia-title">Manual Definitivo de Agricultura 0 → 10</h1>
            <p className="guia-subtitle">
              Agricultura é a base renovável de tudo: <strong>comida, iscas, insumos para Culinária e
              matéria-prima para criação de animais</strong>. Em loot 0,04, quem não tem roça ativa
              depende de incursões urbanas para sobreviver.
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
            A roça deve funcionar como sistema passivo — colheita que alimenta a base enquanto você trabalha outras habilidades.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Agricultura é a fundação da economia renovável</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">XP total</div><div className="guia-big guia-good">32.775</div><p className="guia-sub">0→10.</p></div>
              <div className="guia-card"><div className="guia-kpi">Marco nível 6</div><div className="guia-big guia-gold">Diagnóstico</div><p className="guia-sub">Identifica doenças sem item.</p></div>
              <div className="guia-card"><div className="guia-kpi">Marco nível 8</div><div className="guia-big">Tempo</div><p className="guia-sub">Informa fase e previsão.</p></div>
              <div className="guia-card"><div className="guia-kpi">Água (L) por colheita</div><div className="guia-big">Varia</div><p className="guia-sub">2–5L por planta.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Sementes</span><span className="guia-arrow">→</span>
              <span className="guia-node">Canteiro</span><span className="guia-arrow">→</span>
              <span className="guia-node">Água</span><span className="guia-arrow">→</span>
              <span className="guia-node">Colheita</span><span className="guia-arrow">→</span>
              <span className="guia-node">XP + sementes</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Agricultor é o maior bônus direto</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação / Traço</th><th>Bônus</th><th>Leitura</th></tr></thead>
              <tbody>
                <tr><td><strong>Agricultor (Farmer)</strong></td><td>Agricultura +4, Cuidados com Animais +1</td><td>Pacote rural completo; começa no nível 4.</td></tr>
                <tr><td><strong>Jardineiro (Gardener)</strong></td><td>Agricultura +1</td><td>Traço barato; bom complemento.</td></tr>
                <tr><td>Fazendeiro de Gado (Rancher)</td><td>Cuidados com Animais +4, Abate +3</td><td>Não dá Agricultura — mas viabiliza a cadeia animal.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Volumes I–V</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Agricultura I — Guia de Jardim para Iniciantes</td><td>Beginner's Guide to Gardening</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Agricultura II — Cultivando com Dean</td><td>Farming with Dean</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Agricultura III — Sua Horta e Você</td><td>Your Garden and You</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Agricultura IV — A Fazenda Auto-Suficiente</td><td>The Self-Sufficient Farm</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Agricultura V — Guia de Horticultura de Kentucky</td><td>Kentucky Horticulture Guide</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="kit" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Kit mínimo</div>
            <h2>Ferramentas e insumos iniciais</h2>
            <table className="guia-table">
              <thead><tr><th>Item</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><strong>Pá / Enxada</strong></td><td>Preparar canteiros.</td></tr>
                <tr><td><strong>Regador / Balde</strong></td><td>Irrigação manual.</td></tr>
                <tr><td><strong>Sementes iniciais</strong></td><td>Rabanete e cenoura são as mais fáceis e rápidas.</td></tr>
                <tr><td><strong>Fertilizante / Composto</strong></td><td>Acelera crescimento; composto vem da cozinha/animais.</td></tr>
                <tr><td>Inseto / Minhoca (Coleta)</td><td>Evitar pragas e atrair polinizadores.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="agua" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Água e irrigação</div>
            <h2>Sem água a planta morre — e o XP some</h2>
            <p className="guia-muted">
              Cada espécie tem necessidade de água diferente (L por planta). Com energia cortada no dia 1,
              a irrigação manual com baldes é obrigatória no início. A prioridade é montar coletor de chuva
              o mais rápido possível — reduz deslocamento e risco.
            </p>
            <div className="guia-alert guia-alert-warning">
              <strong>Regra da irrigação:</strong> regue quando o ícone indicar necessidade, mas não em excesso —
              encharcamento também prejudica a planta. Em chuva forte, suspenda a irrigação manual.
            </div>
          </section>

          <section id="calendario" className="guia-section">
            <div className="guia-eyebrow-sm">06 · Calendário de cultivo</div>
            <h2>Plante conforme o mês — safras erradas não crescem</h2>
            <div className="guia-field" style={{ maxWidth: 280, marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '.4rem', color: 'var(--guia-sub)' }}>Mês atual no jogo</label>
              <select
                value={monthIdx}
                onChange={e => setMonthIdx(+e.target.value)}
                style={{ width: '100%', padding: '.5rem', background: '#0d0d0d', color: 'inherit', border: '1px solid #333', borderRadius: 7 }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
              </select>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Cultivos disponíveis em {currentMonth.name}:</strong>
              <ul style={{ margin: '.5rem 0 0', paddingLeft: '1.2rem' }}>
                {currentMonth.crops.map(c => <li key={c}>{c} <span style={{ color: 'var(--guia-sub)', fontSize: '.82rem' }}>(litros de água/dia)</span></li>)}
              </ul>
            </div>
          </section>

          <section id="sementes" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Sementes</div>
            <h2>Reserve sementes a cada colheita</h2>
            <table className="guia-table">
              <thead><tr><th>Semente</th><th>Ciclo (dias)</th><th>Água/dia</th><th>Prioridade</th></tr></thead>
              <tbody>
                <tr><td><strong>Rabanete</strong></td><td>~7</td><td>3L</td><td>★★★★★ — mais rápido, XP rápido.</td></tr>
                <tr><td><strong>Cenoura</strong></td><td>~14</td><td>4L</td><td>★★★★☆ — isca de Armadilhas.</td></tr>
                <tr><td><strong>Tomate</strong></td><td>~20</td><td>4L</td><td>★★★★☆ — culinária e Armadilhas.</td></tr>
                <tr><td><strong>Batata</strong></td><td>~18</td><td>3L</td><td>★★★★☆ — carboidrato e culinária.</td></tr>
                <tr><td>Milho</td><td>~25</td><td>3L</td><td>★★★☆☆ — culinária; isca de animais.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert">
              <strong>Nunca use todas as sementes.</strong> Reserve pelo menos 30–50% da colheita como semente para o próximo ciclo. Se a semente acabar, a roça para.
            </div>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">08 · XP</div>
            <h2>XP vem da colheita — meça no servidor</h2>
            <p className="guia-muted">
              O XP de Agricultura é gerado na colheita. O valor observado já inclui o XP global 0,8×,
              os bônus iniciais e eventuais modificadores de fertilizante. <strong>Não aplique 0,8× novamente</strong>
              sobre o XP medido — use o valor real como base da calculadora.
            </p>
            <div className="guia-alert guia-alert-info">
              <strong>Dica de medição:</strong> faça uma colheita de teste com o número atual de canteiros,
              anote o XP ganho e use esse valor na calculadora. Repita após cada nível de Agricultura subir.
            </div>
          </section>

          <section id="marcos" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Marcos de nível</div>
            <h2>Níveis importantes para a roça</h2>
            <table className="guia-table">
              <thead><tr><th>Nível</th><th>Desbloqueio</th></tr></thead>
              <tbody>
                <tr><td><strong>1</strong></td><td>Acesso a todas as sementes básicas; canteiros maiores.</td></tr>
                <tr><td><strong>3</strong></td><td>Identificação básica de doenças com item.</td></tr>
                <tr><td><strong>6</strong></td><td><strong>Diagnóstico sem item</strong> — identifica doença ao inspecionar a planta.</td></tr>
                <tr><td><strong>7</strong></td><td>Fertilizantes mais eficientes; rendimento melhorado.</td></tr>
                <tr><td><strong>8</strong></td><td><strong>Informação de tempo/fase</strong> — mostra dias restantes e previsão de colheita.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="doencas" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Doenças</div>
            <h2>Doença não tratada destrói a plantação</h2>
            <table className="guia-table">
              <thead><tr><th>Sinal</th><th>Causa comum</th><th>Ação</th></tr></thead>
              <tbody>
                <tr><td>Folhas amarelas</td><td>Falta de água ou excesso</td><td>Ajuste irrigação.</td></tr>
                <tr><td>Manchas escuras</td><td>Fungo ou bactéria</td><td>Remova a planta afetada imediatamente.</td></tr>
                <tr><td>Pragas visíveis</td><td>Insetos nocivos</td><td>Inseticida artesanal ou remoção manual.</td></tr>
                <tr><td>Crescimento parado</td><td>Solo esgotado ou temperatura</td><td>Composto + aguarde melhora climática.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-danger">
              <strong>Isolamento é a regra:</strong> ao detectar doença, remova e destrua a planta afetada antes que se espalhe. Uma fileira infectada pode comprometer toda a roça.
            </div>
          </section>

          <section id="composto" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Composto</div>
            <h2>Fertilizante renovável dentro da base</h2>
            <p className="guia-muted">
              Restos de cozinha (cascas, talos, sobras de preparo) e esterco animal alimentam o compostor.
              O composto resultante reduz o tempo de crescimento e melhora a colheita.
              Monte o compostor perto da roça e da cozinha para minimizar deslocamento.
            </p>
            <div className="guia-alert guia-alert-info">
              <strong>Integração:</strong> Culinária produz sobras → Compostor converte → Roça fica mais produtiva → mais ingredientes para Culinária. Ciclo fechado.
            </div>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Rota definitiva 0→10</div>
            <h2>De canteiros básicos à produção industrial</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→1 — Primeiros canteiros</h3><p>Livro I. Rabanete e cenoura primeiro — ciclo curto e sementes fáceis. Aprenda irrigação e colheita antes de escalar.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>1→3 — Expandir variedade</h3><p>Adicione tomate e batata. Conecte sobras à Culinária e cenoura às Armadilhas.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>3→5 — Roça em escala</h3><p>Livro II. Canteiros suficientes para alimentar a base + iscas + culinária sem precisar racionar.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>5→7 — Composto e fertilizante</h3><p>Livro III. Compostor integrado; colheitas mais rápidas. Nível 6 = diagnóstico de doenças sem item.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">7</div><div><h3>7→9 — Produção especializada</h3><p>Livro IV. Nível 8 = informação de tempo/fase. Plante por demanda e use o calendário para não perder safras.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">9</div><div><h3>9→10 — Livro V + colheita final</h3><p>Roça no ápice de produção. Com 16×, cada colheita limpa uma fração significativa do XP restante.</p></div></div>
            </div>
          </section>

          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Estratégia Brasileirão</div>
            <h2>Roça fechada e protegida, não campo aberto</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Cerque a roça antes de plantar</h3><p>Em 16x, hordas destroem canteiros abertos. A roça precisa de perímetro antes de escalar.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Coletor de chuva primeiro</h3><p>Irrigação manual desperdiça tempo e expõe risco. Coletor = roça passiva.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Sementes são o ativo mais valioso</h3><p>Nunca use tudo. Reserva de sementes = continuidade da produção.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Culinária + Animais + Agricultura = triângulo</h3><p>As três skills se alimentam mutuamente. Desenvolva em paralelo para maximizar o XP passivo de cada.</p></div></div>
            </div>
          </section>

          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Calculadora</div>
            <h2>Ciclos de colheita necessários</h2>
            <p className="guia-sub">O XP digitado já inclui 0,8× e todos os bônus ativos — use o valor real medido no servidor.</p>
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
                <label>XP real por colheita</label>
                <input type="number" value={harvestXp} min={1} onChange={e => setHarvestXp(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Canteiros na colheita</label>
                <input type="number" value={plots} min={1} onChange={e => setPlots(+e.target.value)} />
              </div>
            </div>
            {result ? (
              <div className="guia-result">
                <span className="guia-sub">XP necessário</span><br />
                <strong>{result.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">Ciclos estimados</span><br />
                <strong>~{result.cycles.toLocaleString('pt-BR')} colheitas</strong><br />
                <span className="guia-sub">~{result.xpPerPlot.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} XP por canteiro por ciclo. Não aplique 0,8× novamente ao XP medido.</span>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">15 · Erros comuns</div>
            <h2>O que destrói a roça</h2>
            <details className="guia-details"><summary>Plantar sem perímetro</summary><p>Hordas de 16x destroem canteiros abertos. Cerque antes de plantar.</p></details>
            <details className="guia-details"><summary>Usar todas as sementes sem reservar</summary><p>Sem semente de reserva, a produção para completamente.</p></details>
            <details className="guia-details"><summary>Ignorar o calendário de cultivo</summary><p>Plantar fora da estação = planta que não cresce e sementes perdidas.</p></details>
            <details className="guia-details"><summary>Não tratar doenças imediatamente</summary><p>Espalhamento rápido pode eliminar uma fileira inteira em dias.</p></details>
            <details className="guia-details"><summary>Irrigação manual sem coletor</summary><p>Toda viagem ao rio/torneira é exposição desnecessária em 16x.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">16 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — Agricultura: ocupações, traços e mecânica de cultivo.</li>
              <li>pype.org — livros Agricultura I–V e nomes 42.20.4.</li>
              <li>GamesRef — progressão 32.775 XP e marcos de nível.</li>
              <li>Project Zomboid Wiki — guia de Agricultura, calendário e doenças B42.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> perímetro antes de plantar + coletor de chuva + sementes reservadas + composto integrado + livro antes do ciclo de grind = Agricultura 10 renovável e segura.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
