import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

const TOC = [
  { id: 'visao',       label: '1. Visão geral' },
  { id: 'criacao',     label: '2. Criação do personagem' },
  { id: 'livros',      label: '3. Livros' },
  { id: 'busca',       label: '4. Modo de Busca' },
  { id: 'biomas',      label: '5. Biomas' },
  { id: 'foco',        label: '6. Foco de busca' },
  { id: 'xp',          label: '7. XP' },
  { id: 'recursos',    label: '8. Recursos prioritários' },
  { id: 'ervas',       label: '9. Ervas e venenos' },
  { id: 'clima',       label: '10. Clima e horário' },
  { id: 'rota',        label: '11. Rota 0→10' },
  { id: 'integracao',  label: '12. Integrações' },
  { id: 'br',          label: '13. Estratégia Brasileirão' },
  { id: 'calculadora', label: '14. Calculadora' },
  { id: 'erros',       label: '15. Erros comuns' },
  { id: 'fontes',      label: '16. Fontes' },
];

const CUMULATIVE = [0, 75, 225, 525, 1275, 2775, 5775, 10275, 16275, 23775, 32775];

export function GuiaColeta() {
  const [compact, setCompact] = useState(false);
  const [startLv, setStartLv] = useState(3);
  const [targetLv, setTargetLv] = useState(10);
  const [xpRoute, setXpRoute] = useState(300);
  const [mins, setMins] = useState(60);

  function calcResult() {
    if (targetLv <= startLv) return null;
    const need = CUMULATIVE[targetLv] - CUMULATIVE[startLv];
    const r = Math.ceil(need / (xpRoute || 1));
    const tm = r * (mins || 1);
    const rate = (xpRoute / (mins || 1));
    return { need, r, tm, rate };
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
            <h1 className="guia-title">Manual Definitivo de Coleta 0 → 10</h1>
            <p className="guia-subtitle">
              Coleta transforma o terreno em inventário. Quanto maior a habilidade, maior a qualidade
              dos achados, mais categorias ficam disponíveis e maior fica o raio do <strong>Modo de Busca</strong>.
              Em loot 0,04, isso significa comida, ervas, pedras, galhos e materiais sem entrar em prédios.
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
            O objetivo é substituir incursões urbanas por circuitos rurais seguros.
          </div>

          <section id="visao" className="guia-section">
            <div className="guia-eyebrow-sm">01 · Visão geral</div>
            <h2>Coleta é informação + reposição renovável</h2>
            <div className="guia-grid4">
              <div className="guia-card"><div className="guia-kpi">XP total</div><div className="guia-big guia-good">32.775</div><p className="guia-sub">0→10.</p></div>
              <div className="guia-card"><div className="guia-kpi">XP de</div><div className="guia-big">Encontrar</div><p className="guia-sub">+ interação adicional.</p></div>
              <div className="guia-card"><div className="guia-kpi">Ganho por nível</div><div className="guia-big guia-gold">Raio</div><p className="guia-sub">Qualidade e categorias também sobem.</p></div>
              <div className="guia-card"><div className="guia-kpi">Melhor zona</div><div className="guia-big">Floresta</div><p className="guia-sub">Densidade + segurança.</p></div>
            </div>
            <div className="guia-route">
              <span className="guia-node">Livro</span><span className="guia-arrow">→</span>
              <span className="guia-node">Modo de Busca</span><span className="guia-arrow">→</span>
              <span className="guia-node">Bioma</span><span className="guia-arrow">→</span>
              <span className="guia-node">Descobrir</span><span className="guia-arrow">→</span>
              <span className="guia-node">Pegar/Descartar</span>
            </div>
          </section>

          <section id="criacao" className="guia-section">
            <div className="guia-eyebrow-sm">02 · Criação do personagem</div>
            <h2>Múltiplas ocupações dão +1 em Coleta</h2>
            <table className="guia-table">
              <thead><tr><th>Ocupação / Traço</th><th>Bônus</th><th>Leitura</th></tr></thead>
              <tbody>
                <tr><td><strong>Guarda-Parque (Park Ranger)</strong></td><td>Coleta +1, Armadilhas +1, Primeiros Socorros +1, Lascamento +1, Entalhamento +1, Herbalista</td><td>Pacote rural completo.</td></tr>
                <tr><td><strong>Guia de Pesca</strong></td><td>Coleta +1, Pesca +3, Abate +1</td><td>Excelente cadeia de proteína.</td></tr>
                <tr><td><strong>Trilheiro (Hiker)</strong></td><td>Coleta +1, Armadilhas +1</td><td>Boa combinação de sobrevivência.</td></tr>
                <tr><td><strong>Bushcrafter</strong></td><td>Coleta +1, Lascamento +1, Manutenção +1, Entalhamento +1</td><td>Forte e caro.</td></tr>
                <tr><td>Herbalista</td><td>Coleta +1</td><td>Conhecimento medicinal.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="livros" className="guia-section">
            <div className="guia-eyebrow-sm">03 · Livros</div>
            <h2>Volumes I–V</h2>
            <table className="guia-table">
              <thead><tr><th>Faixa</th><th>Título PT-BR</th><th>Original</th><th>Mult.</th></tr></thead>
              <tbody>
                <tr><td>1–2</td><td>Coleta I — Um Banquete na Floresta</td><td>A Feast in the Forest</td><td><strong>3×</strong></td></tr>
                <tr><td>3–4</td><td>Coleta II — Guia de Dean para Galhos e Pedras</td><td>Dean's Guide to Sticks &amp; Stones</td><td><strong>5×</strong></td></tr>
                <tr><td>5–6</td><td>Coleta III — Encontrando o Tesouro no Lixo</td><td>Finding The Treasure in the Trash</td><td><strong>8×</strong></td></tr>
                <tr><td>7–8</td><td>Coleta IV — Coleta de Sobrevivência</td><td>Survival Foraging: How Nature Can Save Your Life</td><td><strong>12×</strong></td></tr>
                <tr><td>9–10</td><td>Coleta V — Censo Completo da Natureza</td><td>US Park Service Complete Nature Census - Kentucky</td><td><strong>16×</strong></td></tr>
              </tbody>
            </table>
          </section>

          <section id="busca" className="guia-section">
            <div className="guia-eyebrow-sm">04 · Modo de Busca</div>
            <h2>Encontrar já dá XP; interagir dá mais</h2>
            <p className="guia-muted">
              Ative o Modo de Busca e caminhe. O jogo considera bioma, nível, foco e ambiente.
              Quando o marcador de um achado aparece, há XP; pegar ou descartar concede XP adicional.
            </p>
            <div className="guia-grid3">
              <div className="guia-card"><strong>Encontrar</strong><div className="guia-big guia-good">XP</div></div>
              <div className="guia-card"><strong>Pegar</strong><div className="guia-big">+ XP</div></div>
              <div className="guia-card"><strong>Descartar</strong><div className="guia-big guia-gold">+ XP</div><p className="guia-sub">Mesmo bônus de interação.</p></div>
            </div>
            <div className="guia-alert">
              <strong>Não carregue lixo.</strong> Se não serve para a base, descarte depois de interagir — o XP é o mesmo que pegar.
            </div>
          </section>

          <section id="biomas" className="guia-section">
            <div className="guia-eyebrow-sm">05 · Biomas</div>
            <h2>O terreno define o loot</h2>
            <table className="guia-table">
              <thead><tr><th>Zona</th><th>Achados</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><strong>Floresta profunda</strong></td><td>Galhos, pedras, cogumelos, frutos, plantas</td><td>★★★★★ XP/segurança.</td></tr>
                <tr><td><strong>Borda de floresta</strong></td><td>Mistura de plantas e materiais</td><td>Circuito perto da base.</td></tr>
                <tr><td><strong>Campo/rural</strong></td><td>Plantas, pedras, recursos naturais</td><td>Agricultura + animais.</td></tr>
                <tr><td><strong>Margem de água</strong></td><td>Materiais naturais</td><td>Combine com Pesca.</td></tr>
                <tr><td>Gramado/parque urbano</td><td>Plantas + lixo</td><td>Só em área controlada.</td></tr>
                <tr><td>Estrada</td><td>Pedras, lixo, itens urbanos</td><td>Apenas em deslocamento necessário.</td></tr>
              </tbody>
            </table>
            <div className="guia-alert guia-alert-danger">
              <strong>Não faça busca lenta em avenida.</strong> Em 16x, segurança do bioma pesa tanto quanto a densidade.
            </div>
          </section>

          <section id="foco" className="guia-section">
            <div className="guia-eyebrow-sm">06 · Foco de busca</div>
            <h2>Filtre pelo gargalo da base</h2>
            <table className="guia-table">
              <thead><tr><th>Necessidade</th><th>Foco</th><th>Integração</th></tr></thead>
              <tbody>
                <tr><td>Ferramentas primitivas</td><td><strong>Pedras/materiais</strong></td><td>Lascamento.</td></tr>
                <tr><td>Comida</td><td><strong>Alimentos/plantas</strong></td><td>Culinária.</td></tr>
                <tr><td>Pesca</td><td><strong>Insetos/materiais</strong></td><td>Iscas.</td></tr>
                <tr><td>Medicina</td><td><strong>Plantas medicinais</strong></td><td>Primeiros Socorros.</td></tr>
                <tr><td>Construção/crafting</td><td><strong>Galhos/lenha/pedras</strong></td><td>Entalhamento e fogo.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="xp" className="guia-section">
            <div className="guia-eyebrow-sm">07 · XP</div>
            <h2>Não existe valor universal por item</h2>
            <p className="guia-muted">
              O XP varia por achado e raridade; itens raros tendem a render mais.
              Zonas esgotadas ainda podem gerar achados/XP, mas perdem eficiência.
              32.775 XP são necessários independente de qualquer modificador externo —
              o 0,8× reduz o ganho por ação, não o threshold dos níveis.
            </p>
          </section>

          <section id="recursos" className="guia-section">
            <div className="guia-eyebrow-sm">08 · Recursos prioritários</div>
            <h2>O que vale peso na mochila</h2>
            <table className="guia-table">
              <thead><tr><th>Achado</th><th>Prioridade</th><th>Destino</th></tr></thead>
              <tbody>
                <tr><td>Pedras/sílex</td><td>★★★★★</td><td>Lascamento e ferramentas.</td></tr>
                <tr><td>Galhos/ramos</td><td>★★★★★</td><td>Entalhamento, fogo, armadilhas.</td></tr>
                <tr><td>Ervas medicinais (identificadas)</td><td>★★★★★</td><td>Medicina.</td></tr>
                <tr><td>Insetos/minhocas</td><td>★★★★☆</td><td>Pesca/Armadilhas.</td></tr>
                <tr><td>Frutos/plantas</td><td>★★★★☆</td><td>Culinária.</td></tr>
                <tr><td>Cogumelos</td><td>★★★☆☆</td><td>Só identificados.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="ervas" className="guia-section">
            <div className="guia-eyebrow-sm">09 · Ervas e venenos</div>
            <h2>Identifique antes de consumir</h2>
            <p className="guia-muted">
              <strong>Herbalista</strong> (incluso no Guarda-Parque) permite encontrar ervas medicinais e
              fabricar preparações com plantas como tanchagem, confrei e alho-silvestre.
            </p>
            <div className="guia-alert guia-alert-danger">
              <strong>Nunca coma fruto ou cogumelo não identificado.</strong> Achados venenosos existem; dúvida significa "não consumir".
            </div>
          </section>

          <section id="clima" className="guia-section">
            <div className="guia-eyebrow-sm">10 · Clima e horário</div>
            <h2>Procure quando visão e fuga estão melhores</h2>
            <table className="guia-table">
              <thead><tr><th>Condição</th><th>Política</th></tr></thead>
              <tbody>
                <tr><td><strong>Dia claro</strong></td><td>Ideal.</td></tr>
                <tr><td>Chuva/neblina</td><td>Rota curta ou tarefas internas.</td></tr>
                <tr><td>Noite</td><td>Evite grind.</td></tr>
                <tr><td>Exaustão/carga alta</td><td>Volte para a base.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="rota" className="guia-section">
            <div className="guia-eyebrow-sm">11 · Rota definitiva 0→10</div>
            <h2>Circuitos seguros + livros + integração</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">0</div><div><h3>0→1 — Perímetro da base</h3><p>Livro I, Modo de Busca, borda de floresta. Pegue pedra/galho útil e descarte o resto.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>1→3 — Floresta densa</h3><p>Crie circuito circular que começa e termina na base; use foco conforme a necessidade.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>3→5 — Alimentar outras skills</h3><p>Livro II. Insetos para Pesca, galhos para Entalhamento, pedras para Lascamento e ervas para medicina.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>5→7 — Logística rural</h3><p>Livro III. Ative busca durante idas à roça, animais, armadilhas e água.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">7</div><div><h3>7→9 — Especialização</h3><p>Livro IV. Use raio maior e focos para repor materiais específicos.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">9</div><div><h3>9→10 — Livro V + circuito premium</h3><p>Sessões diurnas num bioma produtivo conhecido. Nenhuma incursão urbana criada só para XP.</p></div></div>
            </div>
          </section>

          <section id="integracao" className="guia-section">
            <div className="guia-eyebrow-sm">12 · Integrações</div>
            <h2>Uma caminhada alimenta várias skills</h2>
            <div className="guia-grid4">
              <div className="guia-card"><strong>Lascamento</strong><p className="guia-muted">Pedras/sílex.</p></div>
              <div className="guia-card"><strong>Entalhamento</strong><p className="guia-muted">Galhos/madeira.</p></div>
              <div className="guia-card"><strong>Pesca/Armadilhas</strong><p className="guia-muted">Iscas/materiais.</p></div>
              <div className="guia-card"><strong>Culinária/Medicina</strong><p className="guia-muted">Plantas e ervas.</p></div>
            </div>
          </section>

          <section id="br" className="guia-section">
            <div className="guia-eyebrow-sm">13 · Estratégia Brasileirão</div>
            <h2>Reduza exposição, não crie passeio</h2>
            <div className="guia-steps">
              <div className="guia-step"><div className="guia-step-num">1</div><div><h3>Circuito, não expedição</h3><p>Saia e volte sem cruzar via principal.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">2</div><div><h3>Busque durante tarefas externas</h3><p>Lago, roça, armadilhas e perímetro já exigem deslocamento — ative o Modo de Busca nessas saídas.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">3</div><div><h3>Livro antes da sessão</h3><p>Centenas de achados sem livro são tempo perdido.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">4</div><div><h3>Não pegue tudo</h3><p>Descartar preserva mobilidade e ainda dá XP de interação.</p></div></div>
              <div className="guia-step"><div className="guia-step-num">5</div><div><h3>Mova quando a densidade cair</h3><p>Área esgotada ainda funciona, mas outro setor tende a render mais.</p></div></div>
            </div>
            <div className="guia-alert guia-alert-danger">
              <strong>Regra definitiva:</strong> se o Modo de Busca está ativo numa área que exige combate constante, a rota está errada.
            </div>
          </section>

          <section id="calculadora" className="guia-section">
            <div className="guia-eyebrow-sm">14 · Calculadora</div>
            <h2>Planejador por circuito real</h2>
            <p className="guia-sub">Meça XP de um circuito completo no servidor. O valor observado já inclui 0,8×, livro e bônus atuais.</p>
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
                <label>XP real/circuito</label>
                <input type="number" value={xpRoute} min={1} onChange={e => setXpRoute(+e.target.value)} />
              </div>
              <div className="guia-field">
                <label>Minutos/circuito</label>
                <input type="number" value={mins} min={1} onChange={e => setMins(+e.target.value)} />
              </div>
            </div>
            {result ? (
              <div className="guia-result">
                <span className="guia-sub">XP restante</span><br />
                <strong>{result.need.toLocaleString('pt-BR')} XP</strong><br /><br />
                <span className="guia-sub">Circuitos estimados</span><br />
                <strong>~{result.r.toLocaleString('pt-BR')}</strong><br />
                <span className="guia-sub">~{result.tm.toLocaleString('pt-BR')} min de jogo · {result.rate.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} XP/min. Não aplique 0,8× novamente ao XP medido.</span>
              </div>
            ) : (
              <div className="guia-result"><strong>Escolha um nível alvo maior.</strong></div>
            )}
          </section>

          <section id="erros" className="guia-section">
            <div className="guia-eyebrow-sm">15 · Erros comuns</div>
            <h2>Evite</h2>
            <details className="guia-details"><summary>Treinar em avenida</summary><p>Use floresta/borda segura.</p></details>
            <details className="guia-details"><summary>Pegar todo item</summary><p>Descartar dá o mesmo XP de interação.</p></details>
            <details className="guia-details"><summary>Ignorar livros</summary><p>O volume de descobertas torna os multiplicadores valiosos.</p></details>
            <details className="guia-details"><summary>Foco fixo sempre</summary><p>Use o recurso que a base precisa.</p></details>
            <details className="guia-details"><summary>Comer cogumelo/fruto desconhecido</summary><p>Há risco de toxicidade.</p></details>
            <details className="guia-details"><summary>Forragear à noite</summary><p>Piora busca e percepção de ameaça.</p></details>
          </section>

          <section id="fontes" className="guia-section">
            <div className="guia-eyebrow-sm">16 · Fontes</div>
            <h2>Base técnica</h2>
            <ol className="guia-sources">
              <li>The Indie Stone — Build 42.20 stable / 42.20.4.</li>
              <li>PZ Guide — Coleta: ocupações, traços e descrição mecânica.</li>
              <li>pype.org — livros Coleta I–V e nomes da tradução 42.20.4.</li>
              <li>Project Zomboid Wiki — Search Mode, biomas e XP de Coleta.</li>
              <li>PZ Guide — TV: 600 XP base de Coleta disponível via canal Life and Living.</li>
            </ol>
            <div className="guia-alert guia-alert-info">
              <strong>Resumo:</strong> circuito diurno seguro + livro + bioma denso + foco conforme necessidade + pegar só o útil = Coleta 10 sem depender de loot urbano.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
