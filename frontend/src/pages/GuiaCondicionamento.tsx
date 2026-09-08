import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',        label: '1. Visão geral' },
  { id: 'efeitos',      label: '2. Efeitos por nível' },
  { id: 'criacao',      label: '3. Criação do personagem' },
  { id: 'tracos',       label: '4. Traços dinâmicos' },
  { id: 'xp',           label: '5. Como funciona o XP' },
  { id: 'fontesxp',     label: '6. Fontes de XP' },
  { id: 'exercicios',   label: '7. Exercícios' },
  { id: 'eficiencia',   label: '8. Eficiência' },
  { id: 'regularidade', label: '9. Regularidade e descanso' },
  { id: 'rigidez',      label: '10. Rigidez muscular' },
  { id: 'peso',         label: '11. Peso corporal' },
  { id: 'alimentacao',  label: '12. Alimentação' },
  { id: 'rotas',        label: '13. Rotas' },
  { id: 'brasileirao',  label: '14. Estratégia 10x–16x' },
  { id: 'calculadora',  label: '15. Calculadora' },
  { id: 'mitos',        label: '16. Mitos' },
  { id: 'fontes',       label: '17. Fontes e versão' },
];

const CUMULATIVE = [0, 1500, 4500, 10500, 19500, 37500, 67500, 127500, 217500, 337500, 487500];

const EXERCISES = [
  { label: 'Abdominais — 92,3 XP/min', value: 92.3 },
  { label: 'Agachamentos — 80 XP/min', value: 80 },
  { label: 'Burpees — 75 XP/min (Condicionamento)', value: 75 },
];

export function GuiaCondicionamento() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(5);
  const [targetLv, setTargetLv] = useState(10);
  const [exerciseIdx, setExerciseIdx] = useState(1);
  const [passiveMult, setPassiveMult] = useState(0.8);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const rate = EXERCISES[exerciseIdx].value * passiveMult;
    const mins = need / rate;
    const hrs = mins / 60;
    const days6 = hrs / 6;
    return { need, rate, mins, hrs, days6 };
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
            <h1 className="guia-title">Manual Definitivo de Condicionamento Físico 0 → 10</h1>
            <p className="guia-subtitle">
              Condicionamento Físico é a habilidade passiva que define sua resistência e capacidade de
              luta. Ela não tem livros, Aprendizado Rápido não a afeta e apenas exercícios físicos
              reais geram XP — o que a torna uma das mais exigentes do jogo.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">10x–16x zumbis</span>
              <span className="guia-pill">Loot 0,04</span>
              <span className="guia-pill">XP global 0,8×</span>
              <span className="guia-pill">487.500 XP total</span>
              <span className="guia-pill">Sem livros</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Condicionamento Físico é uma habilidade passiva especial:</strong> sem livros,
            sem Aprendizado Rápido e com total de XP ~15× maior que habilidades comuns. Para o nível
            10, o equivalente seria 487.500 XP — contra 32.775 de Manutenção. A progressão é
            medida em <strong>semanas</strong>, não dias.
          </div>

          {/* 1 — visão geral */}
          <section id="visao" className="guia-section">
            <div className="guia-eyebrow">01 · Visão geral</div>
            <h2 className="guia-section-title">A habilidade que define quanto tempo você aguenta em campo</h2>
            <div className="guia-grid4">
              <div className="guia-card">
                <div className="guia-kpi">Função</div>
                <div className="guia-metric guia-green">Resistência</div>
                <p className="guia-sub">Maior stamina, menos cansaço em combate, corrida e trabalho físico.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Fonte de XP</div>
                <div className="guia-metric">Exercícios</div>
                <p className="guia-sub">Menu Saúde → Exercícios. Sem alternativa.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">Livros</div>
                <div className="guia-metric guia-red">Não existem</div>
                <p className="guia-sub">Nenhum multiplicador disponível para Condicionamento.</p>
              </div>
              <div className="guia-card">
                <div className="guia-kpi">XP total 0→10</div>
                <div className="guia-metric guia-gold">487.500</div>
                <p className="guia-sub">~15× mais que habilidades comuns como Manutenção.</p>
              </div>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Nível base é 5, não 0.</strong> Todo personagem começa no nível 5 de
              Condicionamento Físico. Isso reflete que mesmo um sobrevivente comum tem algum
              preparo físico. Portanto a escala prática é <strong>5 → 10</strong>, não 0 → 10.
            </div>
          </section>

          {/* 2 — efeitos */}
          <section id="efeitos" className="guia-section">
            <div className="guia-eyebrow">02 · Efeitos por nível</div>
            <h2 className="guia-section-title">Cada nível expande o que seu personagem aguenta fazer</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Nível</th><th>Traço dinâmico</th><th>Efeito principal</th></tr></thead>
                <tbody>
                  <tr><td>0–1</td><td><strong>Fora de Forma (Unfit)</strong></td><td>Stamina reduzida, cansaço rápido, penalidades em combate.</td></tr>
                  <tr><td>2–4</td><td><strong>Sem Forma (Out of Shape)</strong></td><td>Stamina abaixo do neutro.</td></tr>
                  <tr><td>5</td><td>Neutro</td><td>Ponto de partida padrão; sem bônus nem penalidades.</td></tr>
                  <tr><td>6–8</td><td><strong>Em Forma (Fit)</strong></td><td>Stamina melhorada, recuperação mais rápida.</td></tr>
                  <tr><td>9–10</td><td><strong>Atlético (Athletic)</strong></td><td>Stamina máxima, menor custo por ação física.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert">
              <strong>No Brasileirão 10x–16x, o salto de neutro para Atlético (níveis 6–10) é
              especialmente valioso:</strong> mais tempo em combate, mais fuga possível e mais
              trabalho na base antes do descanso.
            </div>
          </section>

          {/* 3 — criação */}
          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow">03 · Criação do personagem</div>
            <h2 className="guia-section-title">Não comece em nível 10 — isso não existe para Condicionamento</h2>
            <div className="guia-alert guia-alert-danger">
              <strong>Nível 10 na criação é impossível para Condicionamento.</strong> Os traços de
              criação disponíveis (Atlético, Sedentário etc.) afetam atributos e outras habilidades.
              O Condicionamento começa sempre no nível 5 e só sobe por exercício real em jogo.
            </div>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Traço</th><th>Custo</th><th>Efeito em Condicionamento</th></tr></thead>
                <tbody>
                  <tr><td><strong>Atlético</strong></td><td>−6 pts</td><td>Sem bônus direto para Condicionamento; melhora Força e atributos.</td></tr>
                  <tr><td><strong>Sedentário</strong></td><td>+4 pts</td><td>Penalidade em Força e resistência; Condicionamento ainda começa em 5.</td></tr>
                  <tr><td><strong>Aprendizado Rápido</strong></td><td>−6 pts</td><td><span className="guia-rank">NÃO AJUDA</span> — Condicionamento é passiva, não é afetada.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Aprendizado Rápido não ajuda Condicionamento.</strong> Se a ideia era comprar
              esse traço para acelerar o grind de exercícios, o investimento não tem retorno nessa
              habilidade.
            </div>
          </section>

          {/* 4 — traços dinâmicos */}
          <section id="tracos" className="guia-section">
            <div className="guia-eyebrow">04 · Traços dinâmicos</div>
            <h2 className="guia-section-title">Condicionamento muda de traço conforme o nível</h2>
            <p className="guia-muted">
              Ao contrário da maioria das habilidades, Condicionamento Físico atribui traços de
              descrição dinamicamente ao personagem conforme o nível sobe ou desce:
            </p>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Faixa de nível</th><th>Traço ativo</th><th>Visível no personagem?</th></tr></thead>
                <tbody>
                  <tr><td>0–1</td><td>Fora de Forma (Unfit)</td><td>Sim</td></tr>
                  <tr><td>2–4</td><td>Sem Forma (Out of Shape)</td><td>Sim</td></tr>
                  <tr><td>5</td><td>— neutro —</td><td>Não</td></tr>
                  <tr><td>6–8</td><td>Em Forma (Fit)</td><td>Sim</td></tr>
                  <tr><td>9–10</td><td>Atlético (Athletic)</td><td>Sim</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Importante para builds compradas:</strong> se você comprou o traço "Atlético"
              na tela de criação, ele reflete Força e estamina inicial — mas o Condicionamento ainda
              começa em 5 e os traços dinâmicos acima só aparecem depois de subir por exercício.
            </div>
          </section>

          {/* 5 — XP */}
          <section id="xp" className="guia-section">
            <div className="guia-eyebrow">05 · Como funciona o XP</div>
            <h2 className="guia-section-title">XP só vem de exercícios — e o multiplicador global reduz tudo</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>XP global 0,8×</strong>
                <p className="guia-muted">O campeonato usa 0,8× de XP. Condicionamento não é exceção — cada exercício ganha 20% menos que o base.</p>
              </div>
              <div className="guia-card">
                <strong>Sem livros, sem modificadores</strong>
                <p className="guia-muted">Não há livros nem traços que multipliquem XP de Condicionamento especificamente.</p>
              </div>
              <div className="guia-card">
                <strong>Rigidez limita frequência</strong>
                <p className="guia-muted">Após treino intenso, rigidez muscular bloqueia re-treino do mesmo grupo por ~24h. Ignorar causa lesões.</p>
              </div>
            </div>
            <div className="guia-alert">
              <strong>Tabela de XP necessário:</strong>
            </div>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Nível</th><th>XP para o próximo</th><th>XP acumulado</th></tr></thead>
                <tbody>
                  {[
                    [5, 6, 'Lv 5 → 6', 18000, 0],
                    [6, 7, 'Lv 6 → 7', 30000, 18000],
                    [7, 8, 'Lv 7 → 8', 60000, 48000],
                    [8, 9, 'Lv 8 → 9', 90000, 108000],
                    [9, 10, 'Lv 9 → 10', 120000, 198000],
                  ].map(row => (
                    <tr key={String(row[0])}>
                      <td>{row[2]}</td>
                      <td><strong>{Number(row[3]).toLocaleString('pt-BR')}</strong></td>
                      <td>{Number(row[4]).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6 — fontes de XP */}
          <section id="fontesxp" className="guia-section">
            <div className="guia-eyebrow">06 · Fontes de XP</div>
            <h2 className="guia-section-title">Apenas exercícios do menu Saúde geram XP</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Ação</th><th>XP Condicionamento?</th><th>Observação</th></tr></thead>
                <tbody>
                  <tr><td>Exercícios no menu Saúde → Exercícios</td><td><strong>Sim</strong></td><td>Única fonte.</td></tr>
                  <tr><td>Correr / fugir de zumbis</td><td><strong>Não</strong></td><td>Gasta stamina mas não gera XP de Condicionamento.</td></tr>
                  <tr><td>Combate corpo a corpo</td><td>Não</td><td>Treina habilidades de arma, não Condicionamento.</td></tr>
                  <tr><td>Trabalho físico (construir, carregar)</td><td>Não</td><td>Cansa mas não treina Condicionamento.</td></tr>
                  <tr><td>Proteína / comida especial</td><td>Não</td><td>Proteína ajuda Força, <strong>não</strong> Condicionamento.</td></tr>
                  <tr><td>Burpees (combo)</td><td>Sim</td><td>Treina Condicionamento E Força, mas distribui rigidez nas duas.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Proteína é para Força, não Condicionamento.</strong> Consumir proteína esperando
              acelerar o grind de Condicionamento é um erro comum — ela não tem nenhum efeito nessa
              habilidade passiva.
            </div>
          </section>

          {/* 7 — exercícios */}
          <section id="exercicios" className="guia-section">
            <div className="guia-eyebrow">07 · Exercícios</div>
            <h2 className="guia-section-title">Três exercícios principais para Condicionamento</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Exercício</th><th>XP base/min</th><th>XP a 0,8×</th><th>Stamina/min</th><th>Treina também</th><th>Nota</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Abdominais</strong></td>
                    <td>~115 /min</td>
                    <td><strong>~92,3 /min</strong></td>
                    <td>Baixo</td>
                    <td>Só Condicionamento</td>
                    <td><span className="guia-rank">MELHOR TAXA ATIVA</span></td>
                  </tr>
                  <tr>
                    <td><strong>Agachamentos</strong></td>
                    <td>~100 /min</td>
                    <td><strong>~80 /min</strong></td>
                    <td>Médio (~0,3/min)</td>
                    <td>Só Condicionamento</td>
                    <td><span className="guia-rank">MELHOR SUSTENTABILIDADE</span> — menos stamina que Abdominais.</td>
                  </tr>
                  <tr>
                    <td><strong>Burpees</strong></td>
                    <td>~94 /min</td>
                    <td><strong>~75 /min (Cond.)</strong></td>
                    <td>Alto</td>
                    <td>Condicionamento + Força</td>
                    <td>XP dividido; útil quando quer treinar as duas ao mesmo tempo.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert">
              <strong>Recomendação padrão:</strong> Agachamentos como exercício principal. Taxa
              quase tão alta quanto Abdominais mas com consumo de stamina bem menor (~0,30/min),
              permitindo sessões mais longas antes de parar por cansaço.
            </div>
            <div className="guia-alert guia-alert-info">
              Abdominais têm a melhor taxa de XP por minuto ativo. Use quando tiver mais stamina
              disponível ou quiser maximizar uma sessão curta.
            </div>
          </section>

          {/* 8 — eficiência */}
          <section id="eficiencia" className="guia-section">
            <div className="guia-eyebrow">08 · Eficiência</div>
            <h2 className="guia-section-title">Hora por dia que você pode dedicar ao treino</h2>
            <p className="guia-muted">
              No menu de exercícios, é possível definir a intensidade e a duração. O limite prático é
              a stamina disponível e a rigidez muscular que se acumula após o treino.
            </p>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Sessão típica</strong>
                <div className="guia-metric">30–60 min</div>
                <p className="guia-muted">Antes que stamina caia demais ou rigidez se acumule.</p>
              </div>
              <div className="guia-card">
                <strong>Janela diária</strong>
                <div className="guia-metric">~6 horas</div>
                <p className="guia-muted">Estimativa usada na calculadora para projetar dias necessários.</p>
              </div>
              <div className="guia-card">
                <strong>Foco</strong>
                <div className="guia-metric">Consistência</div>
                <p className="guia-muted">Um exercício todo dia supera uma sessão enorme seguida de dias parados.</p>
              </div>
            </div>
          </section>

          {/* 9 — regularidade */}
          <section id="regularidade" className="guia-section">
            <div className="guia-eyebrow">09 · Regularidade e descanso</div>
            <h2 className="guia-section-title">O treino diário supera o grind ocasional</h2>
            {[
              { num: '1', title: 'Exercite todo dia — até pouco', body: 'O sistema de Condicionamento recompensa frequência. 20 minutos de Agachamentos todos os dias produz mais XP que 2 horas de Abdominais uma vez por semana.' },
              { num: '2', title: 'Descanse o suficiente para evitar rigidez', body: 'Rigidez muscular aparece ~12h depois do exercício. Se você treinar com rigidez ativa, pode causar lesão. Espere o personagem recuperar antes de repetir o mesmo grupo.' },
              { num: '3', title: 'Alterne grupos quando possível', body: 'Abdominais e Agachamentos trabalham grupos musculares diferentes. Alternar os dois permite treinar em dias consecutivos sem esperar rigidez total desaparecer.' },
              { num: '4', title: 'Não ignore o sono', body: 'Dormir bem é parte do ciclo de recuperação. Personagem com pouco sono tem penalidade em stamina e taxa de exercício.' },
            ].map(s => (
              <div key={s.num} className="guia-step">
                <div className="guia-step-num">{s.num}</div>
                <div>
                  <h3 className="guia-h3">{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </section>

          {/* 10 — rigidez */}
          <section id="rigidez" className="guia-section">
            <div className="guia-eyebrow">10 · Rigidez muscular</div>
            <h2 className="guia-section-title">O maior obstáculo para quem quer fazer grind intenso</h2>
            <div className="guia-alert guia-alert-danger">
              <strong>Rigidez muscular começa ~12h depois de um treino intenso.</strong> Exercitar
              o mesmo grupo com rigidez ativa pode causar lesão muscular, que afasta o personagem
              do treino por vários dias e impõe penalidades de stamina.
            </div>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Estado</th><th>O que fazer</th></tr></thead>
                <tbody>
                  <tr><td>Sem rigidez</td><td>Treino normal — aproveite.</td></tr>
                  <tr><td>Rigidez leve</td><td>Pode treinar com cautela. Reduza intensidade.</td></tr>
                  <tr><td>Rigidez forte</td><td>Descanse. Treinar arrisca lesão.</td></tr>
                  <tr><td>Lesão muscular</td><td>Pare imediatamente. Trate com analgésicos e descanso.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert guia-alert-info">
              <strong>Estratégia de alternância:</strong> Abdominais → Agachamentos → descanso → repete.
              Como trabalham grupos distintos, é possível treinar em dias alternados sem esperar a
              rigidez total desaparecer.
            </div>
          </section>

          {/* 11 — peso */}
          <section id="peso" className="guia-section">
            <div className="guia-eyebrow">11 · Peso corporal</div>
            <h2 className="guia-section-title">Manter o peso ideal acelera a progressão</h2>
            <div className="guia-table-wrap">
              <table className="guia-table">
                <thead><tr><th>Faixa de peso (kg)</th><th>Efeito</th></tr></thead>
                <tbody>
                  <tr><td>&lt; 75</td><td>Abaixo do peso — penalidade em Força e stamina.</td></tr>
                  <tr><td><strong>76–84</strong></td><td><strong>Faixa ideal</strong> — sem penalidades.</td></tr>
                  <tr><td>85–99</td><td>Acima do peso — pequena penalidade em stamina.</td></tr>
                  <tr><td>≥ 100</td><td>Obeso — penalidade severa em stamina e velocidade.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="guia-alert">
              <strong>Recomendação:</strong> mantenha o personagem entre <strong>76–84 kg</strong>.
              Além de evitar penalidades, essa faixa facilita a recuperação entre sessões de treino.
            </div>
          </section>

          {/* 12 — alimentação */}
          <section id="alimentacao" className="guia-section">
            <div className="guia-eyebrow">12 · Alimentação</div>
            <h2 className="guia-section-title">Calorias para manter o peso — proteína para Força, não Condicionamento</h2>
            <div className="guia-grid3">
              <div className="guia-card">
                <strong>Calorias</strong>
                <p className="guia-muted">Mantenha ingestão suficiente para não perder peso abaixo de 76 kg durante o grind intenso.</p>
              </div>
              <div className="guia-card">
                <strong>Proteína</strong>
                <p className="guia-muted">Aumenta taxa de ganho de <strong>Força</strong>. <em>Não</em> ajuda Condicionamento.</p>
              </div>
              <div className="guia-card">
                <strong>Hidratação</strong>
                <p className="guia-muted">Essencial para stamina e recuperação. No campeonato com água cortada, priorize cisternas e purificação.</p>
              </div>
            </div>
            <div className="guia-alert guia-alert-warning">
              <strong>Erro frequente:</strong> acumular proteína pensando que ajuda Condicionamento.
              Se quiser subir Condicionamento, o que importa é <strong>fazer exercícios todos os
              dias</strong>, não o macronutriente ingerido.
            </div>
          </section>

          {/* 13 — rotas */}
          <section id="rotas" className="guia-section">
            <div className="guia-eyebrow">13 · Rotas</div>
            <h2 className="guia-section-title">Rota de 5 → 10 exige meses de treino consistente</h2>
            {[
              { num: '5', title: 'Nível 5 → 6 — estabelecer a rotina (18.000 XP efetivos)', body: 'A primeira barreira. Comece com Agachamentos (sustentáveis) ou Abdominais (mais rápidos). O objetivo é criar o hábito diário de treinar. Em 0,8×, espere ~3,75 horas de Agachamentos para chegar ao nível 6.' },
              { num: '6', title: 'Nível 6 → 7 — traço "Em Forma" ativado (30.000 XP efetivos)', body: 'Você está acima do neutro pela primeira vez. A melhora em stamina começa a ser sentida em campo. Continue a rotina diária — isso vai levar ~6,25 horas de exercício efetivo.' },
              { num: '7', title: 'Nível 7 → 8 — grind longo (60.000 XP efetivos)', body: 'Este é o trecho mais longo da progressão 5→10. ~12,5 horas de Agachamentos em condições ideais. Alternar com Abdominais pode ajudar a manter motivação e usar diferentes grupos musculares.' },
              { num: '8', title: 'Nível 8 → 9 — consistência ou morte do projeto (90.000 XP efetivos)', body: 'Sem livros, este trecho exige ~18,75 horas de exercício puro. Qualquer interrupção longa (dias sem treino) prolonga muito a chegada ao nível 9.' },
              { num: '9', title: 'Nível 9 → 10 — sprint final rumo a Atlético (120.000 XP efetivos)', body: 'O trecho mais caro da habilidade. Exige ~25 horas de Agachamentos em condições ideais (0,8×). Mas ao chegar ao nível 10 o personagem é uma máquina de sobrevivência.' },
            ].map(s => (
              <div key={s.num} className="guia-step">
                <div className="guia-step-num">{s.num}</div>
                <div>
                  <h3 className="guia-h3">{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </section>

          {/* 14 — brasileirão */}
          <section id="brasileirao" className="guia-section">
            <div className="guia-eyebrow">14 · Estratégia 10x–16x</div>
            <h2 className="guia-section-title">No campeonato, Condicionamento é uma maratona dentro da maratona</h2>
            {[
              { num: '1', title: 'Aceite que o nível 10 pode não chegar nesta temporada', body: 'Com 487.500 XP em um campeonato de semanas, o nível 10 exige planejamento de longo prazo. Concentrate em chegar a "Em Forma" (6–8) como meta realista para a maioria dos jogadores.' },
              { num: '2', title: 'Exercite todo dia, mesmo que pouco', body: '20 minutos de Agachamentos (~1.600 XP a 0,8×) todos os dias somam ~11.200 XP por semana. Em 5 semanas, isso é ~56.000 XP — mais de 3 níveis na faixa 5→8.' },
              { num: '3', title: 'Priorize antes da horda', body: 'Em dias tranquilos (preparação, construção de base), use parte do tempo acordado para exercícios. Dias de horda intensa esgotam stamina e podem inviabilizar o treino.' },
              { num: '4', title: 'Cuide do peso durante combate intenso', body: 'Em 10x–16x, semanas de luta pesada podem emagrecer o personagem (calorias gastas). Monitore o peso e mantenha a ingestão calórica adequada para o treino não ser prejudicado.' },
              { num: '5', title: 'Burpees quando quiser subir Força junto', body: 'Se a build inclui Força como meta paralela, Burpees permitem treinar as duas habilidades ao mesmo tempo, ao custo de distribuir a rigidez nos dois grupos.' },
              { num: '6', title: 'Não abra mão do sono por treino extra', body: 'Personagem cansado tem stamina reduzida e pode ter penalidade em taxa de ganho de XP. Um dia bem dormido pode valer mais que uma sessão de treino exausta.' },
            ].map(s => (
              <div key={s.num} className="guia-step">
                <div className="guia-step-num">{s.num}</div>
                <div>
                  <h3 className="guia-h3">{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
            <div className="guia-alert guia-alert-danger">
              <strong>Meta realista no Brasileirão:</strong> nível 8 (Em Forma) em vez de 10 (Atlético).
              O nível 8 já entrega stamina claramente superior e exige "apenas" ~108.000 XP após o
              nível base 5 — contra 318.000 XP para sair do 8 ao 10.
            </div>
          </section>

          {/* 15 — calculadora */}
          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow">15 · Calculadora</div>
            <h2 className="guia-section-title">Estimativa de tempo de exercício</h2>
            <p className="guia-sub">
              Assume sessões contínuas sem rigidez. O campo "taxa de XP efetivo" já aplica o
              multiplicador global de 0,8× automaticamente.
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
                <label className="guia-label">Exercício</label>
                <select className="guia-input" value={exerciseIdx} onChange={e => setExerciseIdx(+e.target.value)}>
                  {EXERCISES.map((ex, i) => <option key={i} value={i}>{ex.label}</option>)}
                </select>
              </div>
              <div className="guia-field">
                <label className="guia-label">XP global</label>
                <select className="guia-input" value={passiveMult} onChange={e => setPassiveMult(+e.target.value)}>
                  <option value={0.8}>0,8× — Brasileirão</option>
                  <option value={1}>1,0× — padrão</option>
                  <option value={1.5}>1,5×</option>
                  <option value={2}>2,0×</option>
                </select>
              </div>
            </div>
            <div className="guia-result">
              {result ? (
                <>
                  <span className="guia-sub">XP restante</span><br />
                  <strong>{result.need.toLocaleString('pt-BR')} XP</strong>
                  <br /><br />
                  <span className="guia-sub">Taxa efetiva</span><br />
                  <strong>{result.rate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} XP/min</strong>
                  <br /><br />
                  <span className="guia-sub">Tempo total de exercício</span><br />
                  <strong>{result.mins.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} minutos</strong>
                  {' '}({result.hrs.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h)<br />
                  <span className="guia-sub">
                    Em dias de ~6h de exercício efetivo:{' '}
                    <strong>~{result.days6.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias</strong>
                    {' '}(teórico, sem rigidez).
                  </span>
                </>
              ) : (
                <strong>Escolha um nível desejado maior que o atual.</strong>
              )}
            </div>
          </section>

          {/* 16 — mitos */}
          <section id="mitos" className="guia-section">
            <div className="guia-eyebrow">16 · Mitos</div>
            <h2 className="guia-section-title">O que não é verdade sobre Condicionamento Físico</h2>
            {[
              { title: 'Mito 1 — "Correr treina Condicionamento"', body: 'Correr gasta stamina, mas não concede XP de Condicionamento. Apenas o menu Saúde → Exercícios gera XP nessa habilidade.' },
              { title: 'Mito 2 — "Aprendizado Rápido ajuda"', body: 'Aprendizado Rápido não afeta habilidades passivas como Condicionamento Físico e Força. O traço só vale para habilidades ativas.' },
              { title: 'Mito 3 — "Proteína sobe Condicionamento"', body: 'Proteína aumenta a taxa de ganho de Força. Condicionamento é uma habilidade separada e não é afetada por nenhum alimento.' },
              { title: 'Mito 4 — "Dá para comprar nível 10 na criação"', body: 'Impossível. O Condicionamento começa em 5 independentemente dos traços de criação. O único caminho para o 10 é exercício real em jogo.' },
              { title: 'Mito 5 — "Burpees são a escolha óbvia"', body: 'Burpees são versáteis (treinam Condicionamento e Força) mas a taxa de XP de Condicionamento é menor que Abdominais e Agachamentos — além de gastar mais stamina. Use-os quando quiser progredir nas duas habilidades ao mesmo tempo, não quando quiser maximizar Condicionamento.' },
              { title: 'Mito 6 — "Uma sessão enorme por semana é igual a treinos diários"', body: 'A rigidez muscular limita sessões longas. Uma sessão de 4h seguida de 6 dias parado pode render menos XP útil que 30min diários, além de arriscar lesão no segundo dia consecutivo.' },
              { title: 'Mito 7 — "O nível 10 é meta realista de um campeonato padrão"', body: 'Com 487.500 XP e sem livros, a escalada de 5 → 10 exige centenas de horas de exercício efetivo acumulado. É uma meta de longo prazo; nível 8 (Em Forma) é mais realista na maioria dos campeonatos.' },
            ].map((e, i) => (
              <details key={i} className="guia-details">
                <summary>{e.title}</summary>
                <div className="guia-details-body"><p>{e.body}</p></div>
              </details>
            ))}
          </section>

          {/* 17 — fontes */}
          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow">17 · Fontes e versão</div>
            <h2 className="guia-section-title">Base técnica do manual</h2>
            <p className="guia-muted">
              Consolidado em setembro de 2026 para a versão estável <strong>42.20.4</strong>. Taxas
              de XP e comportamento de rigidez foram verificados na Build 42. Valores de XP
              acumulado foram cruzados com o sistema de traits dinâmicos documentado na wiki.
            </p>
            <ol className="guia-sources">
              <li><a href="https://projectzomboid.com/blog/status-and-build-history/" target="_blank" rel="noopener noreferrer">The Indie Stone — versão estável 42.20.4</a></li>
              <li><a href="https://pz-wiki.info/wiki/Fitness" target="_blank" rel="noopener noreferrer">PZ Wiki — Fitness: XP, fontes, efeitos por nível</a></li>
              <li><a href="https://pz-wiki.info/wiki/Exercise" target="_blank" rel="noopener noreferrer">PZ Wiki — Exercise: menu, exercícios, rigidez muscular</a></li>
              <li><a href="https://pzfans.com/how-to-level-up-fitness-in-project-zomboid/" target="_blank" rel="noopener noreferrer">PZFans — guia de Condicionamento Build 42</a></li>
              <li><a href="https://pype.org/pt-br/zomboid/skills/fitness/" target="_blank" rel="noopener noreferrer">pype.org — Fitness: taxas, traços dinâmicos, builds</a></li>
              <li><a href="https://pz-guide.com/en/skill/fitness/" target="_blank" rel="noopener noreferrer">PZ Guide — Fitness overview B42</a></li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo definitivo:</strong> treine todo dia com Agachamentos ou Abdominais;
              respeite a rigidez; mantenha peso entre 76–84 kg; esqueça proteína e Aprendizado
              Rápido para essa habilidade; aceite que o nível 10 é uma maratona — e cada nível
              a mais já muda o desempenho em campo.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
