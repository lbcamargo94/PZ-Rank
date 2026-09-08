import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'estado',      label: '2. Estado atual' },
  { id: 'criacao',     label: '3. Criação do personagem' },
  { id: 'livros',      label: '4. Livros' },
  { id: 'mecanica',    label: '5. Como rastrear' },
  { id: 'pistas',      label: '6. Pistas' },
  { id: 'cercado',     label: '7. Cercado de treino' },
  { id: 'captura',     label: '8. Captura de coelhos' },
  { id: 'xp',          label: '9. Fontes de XP' },
  { id: 'animais',     label: '10. Fauna-alvo' },
  { id: 'mapa',        label: '11. Mapa e rotas' },
  { id: 'caca',        label: '12. Caça' },
  { id: 'rota',        label: '13. Rota 0→10' },
  { id: 'integracao',  label: '14. Integrações' },
  { id: 'br',          label: '15. Estratégia Brasileirão' },
  { id: 'calculadora', label: '16. Calculadora' },
  { id: 'erros',       label: '17. Erros comuns' },
  { id: 'fontes',      label: '18. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

export function GuiaRastreamento() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [sessionXp, setSessionXp] = useState(100);
  const [minutes, setMinutes] = useState(60);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const n = Math.ceil(need / (sessionXp || 1));
    const tot = n * (minutes || 1);
    const rate = sessionXp / (minutes || 1);
    return { need, n, tot, rate };
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
            <h1 className="guia-title">Manual Definitivo de Rastreamento 0 → 10</h1>
            <p className="guia-subtitle">
              Rastreamento serve para <strong>identificar e interpretar pistas de animais selvagens no Modo de Busca</strong>.
              Quanto maior a habilidade, mais informação fica disponível e pistas menores passam a ser detectáveis.
              No campeonato, ela deve funcionar como ponte para caça — não como desculpa para vagar em áreas desconhecidas.
            </p>
            <div className="guia-pills">
              <span className="guia-pill">10x–16x zumbis</span>
              <span className="guia-pill">Loot 0,04</span>
              <span className="guia-pill">XP global 0,8×</span>
              <span className="guia-pill">5 livros</span>
              <span className="guia-pill">0 VHS de XP</span>
            </div>
          </div>

          <div className="guia-alert guia-alert-danger">
            <strong>Configuração oficial:</strong> 10x–16x zumbis, loot 0,04, água e energia cortadas no dia 1 e XP global 0,8×.
            Não persiga fauna para dentro de uma zona desconhecida se Pesca ou Armadilhas resolvem o mesmo objetivo alimentar.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Rastreamento melhora a leitura do ambiente</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">Função</div><div className="guia-big guia-good">Pistas</div><p className="guia-sub">Mais informação e pistas menores com o nível.</p></div>
              <div className="guia-card"><div className="guia-kpi">Fonte</div><div className="guia-big">Busca</div><p className="guia-sub">Animal Tracks no Modo de Busca.</p></div>
              <div className="guia-card"><div className="guia-kpi">Bônus inicial</div><div className="guia-big guia-gold">Caçador +1</div><p className="guia-sub">Único bônus direto atual.</p></div>
              <div className="guia-card"><div className="guia-kpi">Mídia</div><div className="guia-big guia-red">0</div><p className="guia-sub">Sem VHS de XP de Rastreamento.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Fauna conhecida</span><span className="guia-arrow">→</span>
              <span className="guia-node">Modo de Busca</span><span className="guia-arrow">→</span>
              <span className="guia-node">Animal Tracks</span><span className="guia-arrow">→</span>
              <span className="guia-node">Pista</span><span className="guia-arrow">→</span>
              <span className="guia-node">Direção</span><span className="guia-arrow">→</span>
              <span className="guia-node">Caça/retorno</span>
            </div>
          </section>

          <section id="estado" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Estado atual</div>
            <h2>Funciona, mas ainda é inconsistente na 42.20.4</h2>
            <p className="guia-muted">
              Os arquivos atuais confirmam a skill: ela aumenta a informação disponível sobre pistas de
              fauna selvagem e permite encontrar pistas menores. Na prática, relatos recentes do stable
              42.20.x continuam mostrando que nível 0 pode passar longos períodos sem rastros úteis,
              inclusive em áreas onde animais foram vistos.
            </p>
            <div className="guia-alert guia-alert-warning">
              <strong>Consequência:</strong> este manual não promete "X rastros por hora". A calculadora usa <strong>XP real medido no servidor</strong> e a rota recomenda sair do nível 0 perto de fauna visível, sem exploits.
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Criação do personagem</div>
            <h2>Caçador é o único bônus direto atual</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação</th><th>Bônus</th><th>Leitura competitiva</th></tr></thead>
              <tbody>
                <tr><td><strong>Caçador (Hunter)</strong></td><td><strong>Rastreamento +1</strong>, Pontaria +1, Furtividade +1, Lâmina Curta +1, Abate +1</td><td>Excelente pacote de caça — mas custa 8 pontos.</td></tr>
                <tr><td>Guarda-Parque</td><td><strong>0 Rastreamento</strong></td><td>Apesar da temática, hoje não inclui Rastreamento.</td></tr>
                <tr><td>Sem bônus</td><td>0</td><td>Viável; começa na faixa mais inconsistente, mas os livros e fauna conhecida compensam.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-info">
              <strong>Não force Hunter:</strong> ele faz mais sentido quando Pontaria, Furtividade, Lâmina Curta e Abate também entram na build.
            </div>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Livros</div>
            <h2>Cinco volumes — sem mídia de XP</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Rastreamento I — Pegadas de Animais</td><td>Animal Pawprints</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Rastreamento II — Caçando com Hemingway</td><td>Hunting with Hemingway</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Rastreamento III — Rastreamento a Longa Distância</td><td>Long Range Animal Tracking</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Rastreamento IV — O Cheiro do Marfim</td><td>The Smell of Ivory: An African Adventure</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Rastreamento V — Comportamento Animal por Rastros</td><td>Understanding Animal Behavior Through Spoor Placement</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="mecanica" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Como rastrear</div>
            <h2>Fluxo correto</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Encontre fauna real primeiro</h3><p>Priorize campos, bordas de floresta e áreas rurais onde você já viu coelhos ou cervos. Não comece andando aleatoriamente.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Ative o Modo de Busca</h3><p>Selecione <strong>Animal Tracks / Rastros de Animais</strong>.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Caminhe devagar em zigue-zague</h3><p>Cubra uma faixa larga ao redor do corredor conhecido de fauna.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Inspecione sinais</h3><p>Pegadas, fezes, galhos quebrados e áreas de alimentação/repouso podem fornecer informação e XP.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>Siga somente enquanto for seguro</h3><p>Se a trilha entrar em mata desconhecida ou zona de horda, marque e interrompa.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Não corra atrás do animal.</strong> Fadiga, ruído e perda de leitura do terreno são péssimos negócios em 16x.
            </div>
          </section>

          <section id="pistas" className="guia-section">
            <div className="guia-eyebrow-sm">06 · Pistas</div>
            <h2>O que procurar</h2>
            <table className="guia-table">
              <thead><tr><th>Pista</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><strong>Pegadas</strong></td><td>Passagem recente e possível direção.</td></tr>
                <tr><td><strong>Fezes</strong></td><td>Confirma atividade de fauna no corredor.</td></tr>
                <tr><td><strong>Galhos/vegetação alterada</strong></td><td>Sinais menores, mais úteis conforme a skill sobe.</td></tr>
                <tr><td><strong>Alimentação/repouso</strong></td><td>Ajuda interpretar atividade e direção contextual.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert">
              <strong>Rastreamento não "gera" animais.</strong> Ele melhora sua capacidade de ler sinais existentes.
            </div>
          </section>

          <section id="cercado" className="guia-section">
            <div className="guia-eyebrow-sm">07 · Cercado de treino</div>
            <h2>Estratégia segura: coelhos vivos dentro da base</h2>
            <p className="guia-muted">
              A maneira mais previsível de transformar proximidade de fauna em treino de Rastreamento
              é manter vários coelhos vivos em um cercado pequeno e seguro. Relatos atuais da 42.20
              indicam ganho de Rastreamento ao caminhar agachado perto de coelhos/cervos.
            </p>
            <div className="guia-alert guia-alert-info">
              <strong>Configuração recomendada:</strong> cercado de <strong>5×5 a 7×7 tiles internos</strong>, 4–8 coelhos,
              piso de grama/terra, água, alimento e uma <strong>Zona de Animais ativa</strong> cobrindo apenas o interior.
            </div>
            <table className="guia-table">
              <thead><tr><th>Elemento</th><th>Como fazer</th><th>Motivo</th></tr></thead>
              <tbody>
                <tr><td><strong>Local</strong></td><td>Segunda camada da base, longe do portão externo</td><td>Evita zumbis, tiros e fuga durante emergência.</td></tr>
                <tr><td><strong>Entrada</strong></td><td>Antecâmara com dois portões/portas</td><td>Nunca deixa abertura direta para o exterior.</td></tr>
                <tr><td><strong>Zona de Animais</strong></td><td>Somente dentro do cercado</td><td>Mantém os coelhos vinculados ao local.</td></tr>
                <tr><td><strong>Quantidade</strong></td><td>4–8 coelhos</td><td>Boa proximidade sem superlotação.</td></tr>
                <tr><td><strong>Treino</strong></td><td>Agachado, andando em círculo ou "8"</td><td>Mantém proximidade sem perseguir.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-warning">
              <strong>Não crie dezenas de coelhos.</strong> A B42 teve problemas históricos de população excessiva e queda de desempenho; 4–8 é suficiente para validar o método.
            </div>
          </section>

          <section id="captura" className="guia-section">
            <div className="guia-eyebrow-sm">08 · Captura de coelhos</div>
            <h2>Duas maneiras seguras de montar o plantel</h2>
            <div className="guia-alert guia-alert-info">
              <strong>Método A — Armadilhas → coelho vivo → cercado:</strong> é a rota mais limpa. Armadilhas capturam coelhos vivos; em vez de abater todos, reserve alguns para o cercado.
            </div>
            <div className="guia-route">
              <span className="guia-node">Armadilhas</span><span className="guia-arrow">→</span>
              <span className="guia-node">Coelho vivo</span><span className="guia-arrow">→</span>
              <span className="guia-node">Antecâmara</span><span className="guia-arrow">→</span>
              <span className="guia-node">Zona de Animais</span><span className="guia-arrow">→</span>
              <span className="guia-node">Treino</span>
            </div>
            <div className="guia-alert" style={{ marginTop: '1rem' }}>
              <strong>Método B — Zona de Animais sobre coelhos selvagens:</strong> coelhos dentro de uma Zona de Animais ficam mais dóceis e fáceis de capturar. Chegue agachado com Animal Tracks selecionado.
            </div>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Fontes de XP</div>
            <h2>Progressão atual</h2>
            <table className="guia-table">
              <thead><tr><th>Ação</th><th>Status</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><strong>Inspecionar pistas no Modo de Busca</strong></td><td>Documentado</td><td>Fonte intencional principal.</td></tr>
                <tr><td><strong>Agachar perto de coelhos/cervos visíveis</strong></td><td>Relatos B42.20</td><td>Especialmente útil no início quando pistas falham.</td></tr>
                <tr><td><strong>Examinar alimentação/repouso</strong></td><td>Documentado</td><td>XP + informação contextual.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-warning">
              <strong>Sem XP inventado:</strong> não há tabela vanilla confiável com um único valor por pegada. Use XP real por sessão.
            </div>
          </section>

          <section id="animais" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Fauna-alvo</div>
            <h2>Coelho primeiro, cervo depois</h2>
            <div className="guia-grid3">
              <div className="guia-card"><strong>Coelhos</strong><div className="guia-big guia-good">Entrada</div><p className="guia-sub">Melhor alvo prático para nível baixo.</p></div>
              <div className="guia-card"><strong>Cervos</strong><div className="guia-big guia-gold">Caça maior</div><p className="guia-sub">Mais carne/couro; maior valor logístico.</p></div>
              <div className="guia-card"><strong>Outros</strong><div className="guia-big">Contexto</div><p className="guia-sub">Use alvos mais consistentes como base.</p></div>
            </div>
          </section>

          <section id="mapa" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Mapa e rotas</div>
            <h2>Marque corredores de fauna conhecidos</h2>
            <table className="guia-table">
              <thead><tr><th>Marca</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td>🐇 Coelhos</td><td>Zona de treino inicial.</td></tr>
                <tr><td>🦌 Cervos</td><td>Caça grande / Abate.</td></tr>
                <tr><td>🐾 Pistas</td><td>Corredor já confirmado.</td></tr>
                <tr><td>⚠️ Horda</td><td>Interromper perseguição.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-info">
              <strong>Eficiência:</strong> um corredor mediano a 5 minutos da base vence um excelente a 30 minutos dentro de zona infestada.
            </div>
          </section>

          <section id="caca" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Caça</div>
            <h2>Encontrar é diferente de matar</h2>
            <table className="guia-table">
              <thead><tr><th>Método</th><th>Leitura 10x–16x</th></tr></thead>
              <tbody>
                <tr><td>Arma de fogo</td><td>Rápida, mas o ruído exige rota de retirada.</td></tr>
                <tr><td>Perseguição longa a pé</td><td><strong>Evitar:</strong> fadiga + desorientação + horda.</td></tr>
                <tr><td>Armadilhas</td><td>Frequentemente melhor para rotina previsível.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Rota definitiva 0→10</div>
            <h2>Progressão adaptada ao estado atual</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→1 — Fauna primeiro</h3><p>Marque coelhos/cervos vistos em rotas normais. Volte agachado com Animal Tracks. Inspecione pistas e use proximidade discreta da fauna.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>1→3 — Primeiro corredor</h3><p>Livro I. Repita o mesmo setor conhecido, em zigue-zague, e registre XP por sessão.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>3→5 — Pista em produção</h3><p>Livro II. Integre cada saída com Abate, Coleta e Armadilhas.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>5→7 — Rotas conhecidas</h3><p>Livro III. Use pistas menores e informações melhores sem ampliar o risco.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">7</div><div><h3>7→9 — Caça madura</h3><p>Livro IV. Faça sessões quando houver objetivo real de proteína, couro ou XP de Abate.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">9</div><div><h3>9→10 — Livro V + melhor corredor</h3><p>Use a rota de maior XP/min real já medida, durante o dia e em terreno conhecido.</p></div></div>
            </div>
          </section>

          <section id="integracao" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Integrações</div>
            <h2>A skill vale pela cadeia</h2>
            <div className="guia-grid4">
              <div className="guia-card"><strong>Abate</strong><p className="guia-muted">Carcaças viram carne/couro.</p></div>
              <div className="guia-card"><strong>Armadilhas</strong><p className="guia-muted">Alternativa passiva quando pistas somem.</p></div>
              <div className="guia-card"><strong>Culinária</strong><p className="guia-muted">Transforma caça em alimento.</p></div>
              <div className="guia-card"><strong>Coleta</strong><p className="guia-muted">Mesmo Modo de Busca e mesma caminhada rural.</p></div>
            </div>
          </section>

          <section id="br" className="guia-section">
            <div className="guia-eyebrow-sm">15 · Estratégia Brasileirão</div>
            <h2>Rastreamento precisa economizar risco</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Fauna conhecida antes do grind</h3><p>Marque animais vistos durante deslocamentos normais.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Coelhos primeiro</h3><p>É a entrada prática mais consistente para nível baixo.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Nunca siga pista através de horda</h3><p>Marque e volte depois.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Cercado controlado em vez de perseguição</h3><p>Se permitido pelas regras, use 4–8 coelhos em recinto interno. É mais previsível e muito mais seguro.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Regra definitiva:</strong> o melhor rastreador é o que sabe quando a pista deixou de valer o risco.
            </div>
          </section>

          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow-sm">16 · Calculadora</div>
            <h2>Planejador por sessão real</h2>
            <p className="guia-sub">O XP digitado já inclui 0,8×, livro e bônus ativos. Não aplique 0,8× novamente.</p>
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
                <label>XP real por sessão</label>
                <input type="number" value={sessionXp} min={1} onChange={e => setSessionXp(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Minutos por sessão</label>
                <input type="number" value={minutes} min={1} onChange={e => setMinutes(+e.target.value)} />
              </div>
            </div>
            {result ? (
              <div className="guia-result">
                <span className="guia-sub">XP necessário</span><br />
                <strong>{result.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">Sessões estimadas</span><br />
                <strong>~{result.n.toLocaleString('pt-BR')}</strong><br />
                <span className="guia-sub">~{result.tot.toLocaleString('pt-BR')} min de jogo · {result.rate.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} XP/min.</span>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">17 · Erros comuns</div>
            <h2>O que mais atrapalha</h2>
            <details className="guia-details"><summary>Procurar em floresta aleatória no nível 0</summary><p>Encontre fauna primeiro e volte à zona marcada.</p></details>
            <details className="guia-details"><summary>Achar que Guarda-Parque dá Rastreamento</summary><p>Na definição atual (42.20.4), não dá. Caçador é o único bônus direto +1.</p></details>
            <details className="guia-details"><summary>Começar por cervos</summary><p>Coelhos são uma entrada prática melhor para nível baixo.</p></details>
            <details className="guia-details"><summary>Ignorar Animal Tracks no Modo de Busca</summary><p>Use o foco correto — sem ele, o XP de Rastreamento não será gerado.</p></details>
            <details className="guia-details"><summary>Perseguir até perder a fuga</summary><p>Em 16x, nenhuma carcaça compensa isso.</p></details>
            <details className="guia-details"><summary>Grindar à noite/chuva</summary><p>Visibilidade piora para pistas e ameaças.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">18 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — definição mecânica de Tracking: Hunter +1, Park Ranger sem bônus.</li>
              <li>pype.org — Rastreamento I–V, nomes da tradução 42.20.4.</li>
              <li>Bamboo Gaming — Rastreamento: 5 livros, 0 mídia de XP, snapshot 42.20.4.</li>
              <li>Project Zomboid Wiki — caça, rastreamento e Modo de Busca, atualizado 2026.</li>
              <li>Steam Community — coelhos vivos por armadilhas e Zona de Animais para captura.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> encontre fauna primeiro + marque corredores + Animal Tracks + cercado controlado (4–8 coelhos) + cinco volumes + integre Armadilhas/Abate + meça XP real por sessão.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
