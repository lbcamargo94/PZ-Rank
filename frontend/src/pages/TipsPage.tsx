import { useState } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

type TipType = 'critical' | 'warning' | 'info';

interface Tip {
  text: string;
  type?: TipType;
}

interface TipGroup {
  title:    string;
  icon:     string;
  subtitle: string;
  tips:     Tip[];
}

const TIP_GROUPS: TipGroup[] = [
  {
    title:    'Primeiros Minutos: Crise Imediata',
    icon:     'ti-alarm',
    subtitle: 'Pop. zumbis 8× desde o Dia 1 (4× base × pico 2×)',
    tips: [
      { text: 'Água e eletricidade cortam INSTANTANEAMENTE. Não há torneira funcionando em nenhum momento do jogo.', type: 'critical' },
      { text: 'A população começa E já está no pico máximo de 8× no próprio Dia 1 (multiplicador 4× com fator de pico 2×). A cidade está completamente tomada desde o início.', type: 'critical' },
      { text: 'NÃO tente limpar áreas urbanas nas primeiras horas. Loote rápido, pegue o essencial e recue.', type: 'warning' },
      { text: 'Prioridade de loot inicial: mochila grande, comida para 3 dias, kit de primeiros socorros, faca ou machado.', type: 'info' },
      { text: 'Boa notícia: zumbis não reaparecem (RespawnHours = 0). Uma área limpa permanece limpa.', type: 'info' },
      { text: 'Planeje uma rota de fuga antes de entrar em qualquer edificação. Nunca entre sem saber como sair.', type: 'warning' },
    ],
  },
  {
    title:    'Os Zumbis São Diferentes Aqui',
    icon:     'ti-brain',
    subtitle: 'Força super-humana · Visão de águia · Abrem portas',
    tips: [
      { text: 'Força SUPER-HUMANA: um único golpe pode quebrar ossos (fraturas ativadas). Nunca leve um tapa.', type: 'critical' },
      { text: 'Visão de Águia: eles te enxergam a grande distância. Ande agachado em espaços abertos e use vegetação como cobertura.', type: 'critical' },
      { text: 'Audição Alta: qualquer ruído atrai hordas. Armas de fogo em área urbana = suicídio. Prefira armas silenciosas.', type: 'critical' },
      { text: 'Cognição Avançada: zumbis abrem portas FECHADAS (mas não trancadas). Tranque TUDO sempre.', type: 'warning' },
      { text: 'Memória Longa: uma vez detectado, eles procuram por você por muito tempo. Some do radar antes de voltar.', type: 'warning' },
      { text: 'Fake Dead ATIVADO no nível Total: zumbis no chão podem estar fingindo! Sempre certifique-se de que estão realmente mortos antes de passar perto.', type: 'critical' },
      { text: 'Rastejadores Derrubam: rastejadores no chão podem te derrubar ao passar perto. Elimine-os antes de avançar.', type: 'warning' },
      { text: 'Sem Multi-Acerto: impossível atingir vários zumbis de uma vez. Trate-os um a um ou fuja.', type: 'info' },
      { text: 'Sem Escalada Fácil: subir janelas e cercas é mais lento e arriscado. Calcule o tempo de fuga.', type: 'warning' },
    ],
  },
  {
    title:    'Recursos: Tudo é Escasso',
    icon:     'ti-package-off',
    subtitle: 'Loot 0.04 (nível mínimo) em todas as categorias',
    tips: [
      { text: 'O loot está no nível mais baixo possível (0.04) em TODAS as categorias. Espere encontrar quase nada em cada local.', type: 'critical' },
      { text: 'Priorize locais de alto volume: armazéns, centros de distribuição, lojas de departamento e depósitos industriais.', type: 'info' },
      { text: 'Livros de habilidade são raríssimos, mas valem ouro com XP em 0.8×. Leia tudo que encontrar imediatamente.', type: 'warning' },
      { text: 'Pesca: MUITO RUIM. Caça e forrageamento: MUITO BAIXO. Não confie nessas fontes como base da alimentação.', type: 'warning' },
      { text: 'Desmonte tudo que não usar. Parafusos, arames e madeira viram crafting vital quando loot é zero.', type: 'info' },
      { text: 'Geradores são Extremamente Raros. Se encontrar um, ele é um tesouro — guarde combustível para o essencial.', type: 'info' },
      { text: 'Roupas pretas não existem neste desafio (NoBlackClothes=true). Adapte sua estratégia de stealth.', type: 'info' },
    ],
  },
  {
    title:    'Sem Energia, Sem Água',
    icon:     'ti-bolt-off',
    subtitle: 'Desligamento instantâneo desde o Dia 1',
    tips: [
      { text: 'Energia elétrica e água cortam no instante zero. Geladeiras, fogões elétricos e torneiras: tudo inoperante.', type: 'critical' },
      { text: 'Coleta de chuva é a principal fonte de água. Construa coletores assim que possível — o clima é seco, mas chove.', type: 'warning' },
      { text: 'Potes, panelas e qualquer recipiente cheio de água antes do colapso não existem aqui. Comece do zero.', type: 'info' },
      { text: 'Cozinhe em fogueiras, churrasqueiras ou fogões a lenha. Alimentos crus causam doenças e apodrecem rápido sem refrigeração.', type: 'warning' },
      { text: 'Geradores são Extremamente Raros. Priorize: geladeira pequena para evitar desperdício de alimento.', type: 'info' },
      { text: 'Velas e lanternas são essenciais. Estoques de pilhas serão sempre uma prioridade de loot.', type: 'info' },
    ],
  },
  {
    title:    'Saúde e Ferimentos',
    icon:     'ti-first-aid-kit',
    subtitle: 'Fraturas ativas · Sem kit inicial · Loot médico mínimo',
    tips: [
      { text: 'Fraturas ativadas: uma queda de dois andares ou colisão de carro pode quebrar ossos. Use ESCADAS, não pule.', type: 'critical' },
      { text: 'Você começa sem kit inicial (StarterKit=false). Encontrar desinfetante e ataduras é prioridade absoluta de loot.', type: 'critical' },
      { text: 'Desinfete TODO ferimento imediatamente. Com loot médico escassíssimo, uma infecção não tratada é sentença de morte.', type: 'critical' },
      { text: 'Ferimentos por arranhão/mordida têm transmissão ativa. Evite contato físico com qualquer zumbi.', type: 'warning' },
      { text: 'Fator de tensão muscular em 0.8: exercícios pesados e lutas causam fadiga muscular mais rapidamente.', type: 'info' },
      { text: 'Habilidade Primeiros Socorros é crítica aqui. Com fraturas e loot médico raro, saber tratar bem faz diferença.', type: 'warning' },
    ],
  },
  {
    title:    'Noites, Frio e Ambiente',
    icon:     'ti-moon',
    subtitle: 'Noites escuras · Temperatura fria · Chuva seca',
    tips: [
      { text: 'Noites são ESCURAS (não completamente negras). Lanterna ou vela é obrigatória para qualquer movimentação noturna.', type: 'warning' },
      { text: 'O mapa precisa de luz para ser lido. Planeje rotas e marque recursos antes de anoitecer.', type: 'info' },
      { text: 'Temperatura é FRIA. Roupas molhadas + frio = hipotermia rapidamente. Sempre troque roupas encharcadas.', type: 'warning' },
      { text: 'Chuva é seca, mas ocorre. Tenha sempre um recipiente de coleta de água posicionado ao ar livre.', type: 'info' },
      { text: 'Noite é aliada para fuga: a visão de águia dos zumbis é reduzida no escuro. Use isso para se reposicionar.', type: 'info' },
      { text: 'Eventos aleatórios ocorrem Algumas Vezes. Helicóptero acontece uma única vez — quando ouvir, ESCONDA-SE.', type: 'warning' },
    ],
  },
  {
    title:    'Veículos: Use com Sabedoria',
    icon:     'ti-car',
    subtitle: 'Quase todos trancados · Condição muito baixa · Gasolina escassa',
    tips: [
      { text: 'Quase TODOS os veículos estão trancados (Muito Frequentemente). Habilidade de Mecânica e hotwiring são essenciais.', type: 'critical' },
      { text: 'Condição geral dos veículos é MUITO BAIXA. Inspecione antes de depender: motor, pneus, freios.', type: 'warning' },
      { text: 'Gasolina é escassa (Baixo) e veículos começam com nível muito baixo. Nunca saia sem verificar e nunca sem um galão reserva.', type: 'critical' },
      { text: 'Alarme de carro se desativa imediatamente (SirenShutoffHours=0), mas o barulho do motor já atrai hordas. Dirija devagar perto de áreas densas.', type: 'warning' },
      { text: 'Acidentes causam dano ao jogador E ao carro (já precário). Um baque pode inutilizar seu único meio de transporte.', type: 'warning' },
      { text: 'Sirenes atraem zumbis. Evite disparar alarmes a qualquer custo — a audição deles é Alta.', type: 'info' },
      { text: 'Carros com alarme são Muito Frequentes. Tenha cuidado ao tentar entrar em veículos aleatórios.', type: 'info' },
    ],
  },
  {
    title:    'Construção e Base Segura',
    icon:     'ti-home',
    subtitle: 'Zumbis abrem portas · Danificam cercas · Sem eletricidade',
    tips: [
      { text: 'Zumbis com Cognição Avançada abrem QUALQUER porta fechada. Tranche tudo com chave ou barricade.', type: 'critical' },
      { text: 'Escolha uma base com poucas entradas, próxima a fonte de água e terreno para plantio.', type: 'info' },
      { text: 'Barricade janelas desde o primeiro dia. Madeira pregada em janelas é sua primeira linha de defesa real.', type: 'warning' },
      { text: 'Cercas são danificadas por zumbis. Reforce com estacas e construa múltiplas camadas de proteção.', type: 'warning' },
      { text: 'Planeje a base para funcionar sem eletricidade: poço artesiano, fogão a lenha, velas como iluminação.', type: 'info' },
      { text: 'Não construa sobre solo elevado sem segurança: sem escalada fácil, uma queda pode terminar sua run.', type: 'info' },
    ],
  },
  {
    title:    'Alimentação Sustentável',
    icon:     'ti-wheat',
    subtitle: 'Sem refrigeração · Forrageamento mínimo · Agricultura essencial',
    tips: [
      { text: 'AGRICULTURA é a única fonte de alimento sustentável. Comece a plantar na primeira semana, não na segunda.', type: 'critical' },
      { text: 'Estações de crescimento ativas e colheitas matam dentro de casa. Plante ao ar livre em área segura.', type: 'warning' },
      { text: 'Alimentos apodrecem rápido sem geladeira. Preserve com sal ou vinagre, ou consuma logo após coletar.', type: 'warning' },
      { text: 'Forrageamento e pesca são nível mínimo. Podem complementar em emergências, mas não sustentam sozinhos.', type: 'info' },
      { text: 'Culinária aumenta a eficiência nutricional de cada alimento. Vale desenvolver mesmo com loot de panelas escasso.', type: 'info' },
      { text: 'Animais da fazenda são Extremamente Raros. Não planeje criação de gado como estratégia de sobrevivência inicial.', type: 'info' },
    ],
  },
  {
    title:    'Habilidades Prioritárias',
    icon:     'ti-chart-bar',
    subtitle: 'XP em 0.8× · Sem pontos extras · Sem kit inicial',
    tips: [
      { text: 'XP global em 0.8×: você evolui 20% mais lento que o normal. Cada livro de skill encontrado deve ser lido imediatamente.', type: 'warning' },
      { text: '0 pontos extras de traços (CharacterFreePoints=0). Escolha traços positivos com retorno imediato de sobrevivência.', type: 'info' },
      { text: 'Penalidade de traços negativos desativada (None). Traços negativos são exatamente o que dizem — sem penalidades extras.', type: 'info' },
      { text: '🥇 Carpintaria: barricadas, construção de base, cercas — essencial desde o primeiro dia.', type: 'info' },
      { text: '🥇 Primeiros Socorros: fraturas ativas + loot médico raro = habilidade que pode salvar sua run.', type: 'info' },
      { text: '🥇 Mecânica: hotwiring para veículos trancados, reparo de condição muito baixa.', type: 'info' },
      { text: '🥇 Agricultura: única fonte sustentável de alimento a longo prazo.', type: 'info' },
      { text: '🥇 Furtividade + Agilidade: com zumbis de visão de águia e audição alta, se mover sem ser visto vale mais que lutar.', type: 'info' },
    ],
  },
  {
    title:    'Combate: Técnicas de Sobrevivência',
    icon:     'ti-swords',
    subtitle: 'Sem multi-acerto · Força super-humana · Sem escalada fácil',
    tips: [
      { text: 'Sem multi-acerto: esqueça grupos. Só existe um combate seguro — um zumbi de cada vez.', type: 'critical' },
      { text: 'Combo Empurrar + Atacar: empurre (E) para criar distância, então golpeie imediatamente. É a base de todo combate seguro no desafio.', type: 'warning' },
      { text: 'Nunca lute encostado a paredes ou cercas. Um tropeço pode te prender no lugar enquanto zumbis se acumulam.', type: 'warning' },
      { text: 'Use portas e corredores como funil: abra a porta, recue, mate um a um enquanto eles entram em fila.', type: 'info' },
      { text: 'Monitore a stamina sempre. Sem stamina = sem empurrão = sem defesa. Pare de lutar antes de esgotar.', type: 'critical' },
      { text: 'Em grupos, a prioridade é romper o cerco e criar distância, não lutar. Corra em linha reta para o espaço aberto.', type: 'warning' },
      { text: 'Panic debuff reduz precisão de mira. Treine Força e Resistência para diminuir o pânico em combate.', type: 'info' },
      { text: 'Sem escalada fácil: calcule o tempo necessário para subir janelas e cercas. Nunca faça isso com zumbi perto.', type: 'warning' },
      { text: 'Rastejadores no chão: mantenha distância lateral. Eles podem te derrubar mesmo "mortos". Termine-os com estocada.', type: 'warning' },
      { text: 'Fake Dead ativado (Total): verifique cada zumbi no chão com um golpe antes de virar as costas.', type: 'critical' },
    ],
  },
  {
    title:    'Armas: Escolha e Manutenção',
    icon:     'ti-tool',
    subtitle: 'Loot 0.04 · Manutenção essencial · Armas de fogo = risco',
    tips: [
      { text: 'Manutenção é a habilidade mais importante para armas. Cada nível aumenta a durabilidade de TODAS as armas corpo a corpo.', type: 'critical' },
      { text: 'Repare armas ANTES de quebrarem, não depois. Quando a condição chega a Muito Baixa, repare imediatamente.', type: 'warning' },
      { text: 'Lança artesanal (Spear): crafteável com cabo de vassoura + faca, boa alcance, renovável. Ideal quando loot é mínimo.', type: 'info' },
      { text: 'Machado: melhor dano por golpe em corpo a corpo. Sirva de destaque para zumbis super-resistentes e situações de emergência.', type: 'info' },
      { text: 'Faca: silenciosa, rápida e leve. Guarde para stealth kills em zumbis isolados. Não a use em grupos.', type: 'info' },
      { text: 'Taco de beisebol / barra de ferro: confiáveis no início. Danificam lentamente e são mais fáceis de encontrar.', type: 'info' },
      { text: 'Armas de fogo: nunca use em áreas urbanas. A audição dos zumbis é Alta (raio 250u). Um tiro pode atrair uma horda de bairro inteiro.', type: 'critical' },
      { text: 'Se usar arma de fogo, use fora da cidade, com rota de fuga planejada e carro com combustível pronto.', type: 'warning' },
      { text: 'Use a mesma CATEGORIA de arma consistentemente (cortante, contundente, perfurante) para subir Manutenção mais rápido.', type: 'info' },
      { text: 'Sempre carregue uma arma secundária. Com loot mínimo, a primária pode quebrar no pior momento.', type: 'warning' },
    ],
  },
  {
    title:    'Como Upar Cada Habilidade',
    icon:     'ti-trending-up',
    subtitle: 'XP 0.8× · Sem pontos extras · Livros críticos',
    tips: [
      { text: '📚 Leia TODOS os livros de habilidade antes de praticar. Eles multiplicam o XP ganho — com 0.8× global, isso é essencial.', type: 'critical' },
      { text: '🔨 Carpintaria (1–4): desmonte móveis (camas, armários, mesas) dentro de casas. (5–8): construa paredes, pisos e escadas.', type: 'info' },
      { text: '🔧 Mecânica: inspecione TODOS os veículos encontrados. Remova e reinstale peças para XP extra além da inspeção.', type: 'info' },
      { text: '🩹 Primeiros Socorros: trate toda ferida, mesmo mínimas. Aplique sutura em cortes. Cada procedimento dá XP independente da gravidade.', type: 'info' },
      { text: '🍳 Culinária: cozinhe qualquer combinação de ingredientes. Adicionar mais itens a uma receita aumenta o XP por preparo.', type: 'info' },
      { text: '🌱 Agricultura: plante em quantidade. Cada colheita, rega e adubo dá XP. Volume de plantas = XP constante.', type: 'info' },
      { text: '💪 Força/Resistência: faça exercícios diários antes de sair (flexões, abdominais). Carregar objetos pesados também treina Força passivamente.', type: 'info' },
      { text: '🥷 Furtividade/Agilidade: mova-se SEMPRE agachado em áreas com zumbis. XP passivo gratuito em cada exploração.', type: 'info' },
      { text: '🎯 Mira: comece nos livros. Treine com pistola em zumbis ISOLADOS fora da cidade. Mire na cabeça para bônus de XP.', type: 'info' },
      { text: '🔩 Manutenção: sobe usando armas do mesmo tipo consistentemente. Use até Muito Baixo, repare, repita.', type: 'info' },
      { text: '🌿 Forrageamento: pratique em toda área vegetal (quintais, bordas de floresta). Com loot baixo, cada item encontrado é bônus.', type: 'info' },
      { text: '🎣 Pesca: mesmo com abundância mínima, pescar sempre dá XP. Combine com período de construção para não perder tempo.', type: 'info' },
    ],
  },
  {
    title:    'Furtividade e Mobilidade',
    icon:     'ti-eye-off',
    subtitle: 'Visão de águia · Audição alta · Raio 250u',
    tips: [
      { text: 'Sempre se mova agachado perto de zumbis. O som de passos em pé é detectável a distâncias muito maiores.', type: 'critical' },
      { text: 'Visão de Águia detecta movimento em campo aberto. Use carros, paredes, vegetação e construções como cobertura ao se mover.', type: 'critical' },
      { text: 'Raio de audição = 250 unidades. Correr, bater portas ou quebrar vidros a essa distância já é detectado.', type: 'warning' },
      { text: 'De noite, a visão dos zumbis é reduzida. Aproveite para se reposicionar ou lotar áreas que seriam perigosas de dia.', type: 'info' },
      { text: 'Vegetação (arbustos, mato alto) quebra a linha de visão. Um zumbi de Visão de Águia não consegue te ver através de mato.', type: 'info' },
      { text: 'Habilidade Agilidade reduz o ruído ao se mover agachado. É complementar à Furtividade — desenvolva as duas juntas.', type: 'info' },
      { text: 'Chuva abafa o ruído dos passos. Dias de chuva são oportunidades para loot silencioso em áreas de risco.', type: 'info' },
      { text: 'Contorne clusters de zumbis em vez de empurrar. Uma rota de 3 minutos a mais vale mais do que um combate arriscado.', type: 'warning' },
      { text: 'Nunca abra portas correndo. Abra agachado, devagar, e espere ver o que tem do outro lado antes de entrar.', type: 'warning' },
      { text: 'Distração: jogue uma pedra ou bata no chão para atrair zumbis para longe enquanto passa pelo outro lado.', type: 'info' },
    ],
  },
  {
    title:    'Defesa Avançada de Base',
    icon:     'ti-shield-lock',
    subtitle: 'Zumbis abrem portas · Cercas danificadas · Sem luz elétrica',
    tips: [
      { text: 'Duplo perímetro: cerca externa (arame farpado) + parede de madeira interna. Zumbis que atravessam a cerca tomam dano antes de chegar à parede.', type: 'warning' },
      { text: 'Arame farpado nas cercas causa dano passivo a cada zumbi que passa. Combine com cerca de metal para máxima resistência.', type: 'info' },
      { text: 'Estratégia do andar superior: construa uma escada interna, suba a base para o 2º andar e REMOVA a escada. Zumbis não chegam lá.', type: 'info' },
      { text: 'Corda de lençol por janela do 2º andar: única entrada segura para a base elevada. Puxa a corda e nada acessa de baixo.', type: 'info' },
      { text: 'Barricade janelas do térreo com o máximo de tábuas (6). Cada tábua é uma mordida a mais que você ganha de tempo.', type: 'warning' },
      { text: 'Porta de metal + barra de metal + barricada de tábuas = entrada quase impenetrável. Priorize a entrada principal.', type: 'info' },
      { text: 'Crie corredores de morte: passagens estreitas entre barricadas onde zumbis só passam em fila — fáceis de eliminar um a um.', type: 'info' },
      { text: 'Mantenha SEMPRE pelo menos duas saídas de emergência. Nunca se tranche dentro sem rota de fuga alternativa.', type: 'critical' },
      { text: 'Evite construir próximo a ruas movimentadas. Veículos abandonados na rua atraem atenção de zumbis que migram.', type: 'warning' },
      { text: 'Se tiver gerador, coloque uma luz fora da base. Iluminação externa permite ver zumbis se aproximando antes que cheguem às paredes.', type: 'info' },
      { text: 'Revise cercas e barricadas regularmente. Com dano de zumbi em fator 1.3×, certas seções se degradam mais rápido do que o esperado.', type: 'warning' },
    ],
  },
  {
    title:    'Estratégia de Longo Prazo',
    icon:     'ti-calendar',
    subtitle: 'Sem respawn · Limpe e avance · Mini-mapa disponível',
    tips: [
      { text: 'Zumbis NÃO reaparecem (RespawnHours=0). Limpe um bairro completamente — ele fica seguro para sempre.', type: 'info' },
      { text: 'Estratégia recomendada: Limpe de fora para dentro. Comece pela periferia e avance gradualmente para o centro.', type: 'info' },
      { text: 'O Mini-mapa está disponível. Marque recursos, pontos seguros, hordas e rotas de fuga enquanto explora.', type: 'info' },
      { text: 'Migração de zumbis ocorre a cada 48h. Hordas de áreas adjacentes podem se redistribuir para onde você está.', type: 'warning' },
      { text: 'Porões têm frequência MUITO ALTA neste desafio. Explore com cuidado — podem conter bom loot mas também surpresas.', type: 'warning' },
      { text: 'Construa rotas entre sua base e pontos de loot. Com veículos frágeis e combustível escasso, ter caminhos seguros a pé é vital.', type: 'info' },
      { text: 'Após semanas limpando uma área, estabeleça um segundo ponto de suprimentos. Nunca dependa de um único local.', type: 'info' },
    ],
  },
];

const TYPE_ICON: Record<TipType, string> = {
  critical: 'ti-alert-triangle',
  warning:  'ti-alert-circle',
  info:     'ti-info-circle',
};

export function TipsPage() {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? TIP_GROUPS.map(g => ({
        ...g,
        tips: g.tips.filter(t => t.text.toLowerCase().includes(search.toLowerCase())),
      })).filter(g => g.tips.length > 0 || g.title.toLowerCase().includes(search.toLowerCase()))
    : TIP_GROUPS;

  const totalTips = TIP_GROUPS.reduce((sum, g) => sum + g.tips.length, 0);
  const shownTips = filtered.reduce((sum, g) => sum + g.tips.length, 0);

  return (
    <div className="tips-page">
      <div className="tips-header">
        <div className="tips-header-inner container">
          <Link to="/" className="wiki-back">
            <i className="ti ti-arrow-left" /> Voltar
          </Link>
          <div>
            <h1 className="tips-title"><i className="ti ti-bulb" /> Guia de Sobrevivência</h1>
            <p className="tips-subtitle">
              Dicas específicas para o Desafio BRASILEIRÃO PZ — geradas a partir das configurações oficiais do sandbox
            </p>
          </div>
        </div>
      </div>

      <div className="tips-filters-bar container">
        <div className="wiki-search-wrap">
          <i className="ti ti-search wiki-search-icon" />
          <input
            className="wiki-search"
            type="text"
            placeholder="Buscar dica..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="wiki-search-clear" onClick={() => setSearch('')} aria-label="Limpar">
              <i className="ti ti-x" />
            </button>
          )}
        </div>
        <span className="wiki-count">
          {search
            ? `${shownTips} de ${totalTips} dicas`
            : `${totalTips} dicas · ${TIP_GROUPS.length} categorias`}
        </span>
      </div>

      <div className="container tips-body">
        <div className="tips-legend">
          <span className="tip-badge tip-critical"><i className="ti ti-alert-triangle" /> Crítico</span>
          <span className="tip-badge tip-warning"><i className="ti ti-alert-circle" /> Atenção</span>
          <span className="tip-badge tip-info"><i className="ti ti-info-circle" /> Dica</span>
        </div>

        {filtered.length === 0 && (
          <div className="tips-empty">
            <i className="ti ti-mood-empty" />
            <p>Nenhuma dica encontrada para "{search}".</p>
          </div>
        )}

        <div className="tips-groups">
          {filtered.map(group => (
            <section key={group.title} className="tips-group">
              <div className="tips-group-header">
                <div className="tips-group-title-wrap">
                  <i className={`ti ${group.icon} tips-group-icon`} />
                  <div>
                    <h2 className="tips-group-title">{group.title}</h2>
                    <p className="tips-group-subtitle">{group.subtitle}</p>
                  </div>
                </div>
                <span className="tips-group-count">{group.tips.length}</span>
              </div>
              <ul className="tips-list">
                {group.tips.map((tip, i) => {
                  const type = tip.type ?? 'info';
                  return (
                    <li key={i} className={`tip-item tip-${type}`}>
                      <i className={`ti ${TYPE_ICON[type]} tip-icon`} />
                      <span>{tip.text}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
