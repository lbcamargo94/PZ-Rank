import { useState, useRef } from 'react';
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
    title:    'Construção de Personagem',
    icon:     'ti-user-cog',
    subtitle: 'Ocupação · Traços · Build inicial',
    tips: [
      { text: 'Ocupação recomendada pela comunidade: LADRÃO. Começa com Furtividade e Leveza de Pés nível 2, e permite hotwire em veículos desde o Dia 1 — essencial com quase todos os carros trancados.', type: 'critical' },
      { text: 'Traço Inconspícuo: reduz diretamente a chance de detecção pelos zumbis. Com visão de águia e audição alta, é o traço mais valioso para sobreviver.', type: 'warning' },
      { text: 'Traço Gracioso: reduz o raio de som dos seus passos. Combina com Furtividade e Leveza de Pés — os três juntos tornam sua movimentação quase silenciosa.', type: 'warning' },
      { text: 'Traço Olhos de Gato: +20% de visão noturna. Com noites escuras, evita precisar da lanterna — que transmite sua posição para zumbis antes de te verem.', type: 'warning' },
      { text: 'Traço Aprendiz Rápido: +30% de XP em todas as habilidades. Sobre o multiplicador de 0.8× do desafio, você fica efetivamente em ~1.04× — quase cancela a penalidade.', type: 'info' },
      { text: 'Traço Habilidoso: transferência de itens para o inventário mais rápida. Com loot mínimo, cada container conta e você não pode perder tempo dentro de edificações com zumbis por perto.', type: 'info' },
      { text: 'Traço negativo Sedento (+6 pts): barris de chuva eliminam o problema completamente. Carregue um recipiente extra e nunca será uma ameaça real.', type: 'info' },
      { text: 'Traço negativo Fumante (+4 pts): cigarros existem em máquinas de venda e postos mesmo com loot baixo. Custo de manutenção baixíssimo.', type: 'info' },
      { text: 'Traço negativo Curador Lento (+6 pts): com fraturas ativas você evita combate de qualquer forma — cura lenta é aceitável quando você não leva hits.', type: 'info' },
      { text: 'EVITE Pacifista: -75% de XP em melee e mira sobre o 0.8× do desafio = desenvolvimento de combate paralisado por semanas.', type: 'critical' },
      { text: 'EVITE Míope: com visão de águia dos zumbis, você precisa detectá-los primeiro. Míope inverte essa vantagem de forma permanente.', type: 'warning' },
      { text: 'Não espalhe pontos — com 0.8× de XP, escolha 2 ou 3 habilidades e maximize antes de tocar nas outras.', type: 'warning' },
    ],
  },
  {
    title:    'Primeiros Minutos: Crise Imediata',
    icon:     'ti-alarm',
    subtitle: 'Pop. 8× desde o Dia 1 · Sem água · Sem luz',
    tips: [
      { text: 'Água e eletricidade cortam INSTANTANEAMENTE. Não existe torneira funcionando em nenhum momento do jogo.', type: 'critical' },
      { text: 'A população começa e já está no pico de 8× no próprio Dia 1 (multiplicador 4× com fator de pico 2×). A cidade está completamente tomada desde o início.', type: 'critical' },
      { text: 'NÃO tente limpar áreas urbanas nas primeiras horas. Loote rápido, pegue o essencial e recue para área rural.', type: 'warning' },
      { text: 'Prioridade de loot no Dia 1: mochila grande, comida para 3 dias, kit de primeiros socorros, sacos de lixo (para barris de chuva), faca ou machado.', type: 'warning' },
      { text: 'Boa notícia: zumbis não reaparecem (RespawnHours = 0). Uma área completamente limpa fica segura para sempre.', type: 'info' },
      { text: 'Planeje uma rota de fuga antes de entrar em qualquer edificação. Nunca entre sem saber exatamente como sair.', type: 'warning' },
      { text: 'Sacos de lixo são itens críticos do Dia 1 para construção de barris de chuva (Carpintaria 4). Priorize encontrar pelo menos 4.', type: 'warning' },
    ],
  },
  {
    title:    'Os Zumbis São Diferentes Aqui',
    icon:     'ti-brain',
    subtitle: 'Força super-humana · Visão de águia · Abrem portas · Fake Dead Total',
    tips: [
      { text: 'Força SUPER-HUMANA: um único golpe pode quebrar ossos. Fraturas estão ativadas. Nunca leve um tapa — zero tolerância.', type: 'critical' },
      { text: 'Fake Dead ATIVADO no nível Total: zumbis no chão podem estar fingindo. Sempre confirme com um golpe antes de passar perto.', type: 'critical' },
      { text: 'Visão de Águia: enxergam a grande distância. Ande sempre agachado em espaços abertos e use vegetação, carros e paredes como cobertura.', type: 'critical' },
      { text: 'Audição Alta + Raio 250u: qualquer ruído nesse raio é detectado. Armas de fogo em área urbana = atrair uma horda de bairro inteiro.', type: 'critical' },
      { text: 'Cognição Avançada: zumbis abrem portas FECHADAS (mas não trancadas). Tranque TUDO e barricade além.', type: 'warning' },
      { text: 'Memória Longa: uma vez detectado, eles procuram por muito tempo. Some do radar completamente antes de tentar retornar.', type: 'warning' },
      { text: 'Rastejadores Derrubam: rastejadores no chão podem te derrubar ao passar perto. Elimine-os com estocada antes de avançar.', type: 'warning' },
      { text: 'Sem Multi-Acerto: impossível atingir vários zumbis de uma vez. Apenas combates 1v1 são seguros. Grupos = fuga.', type: 'warning' },
      { text: 'Sem Escalada Fácil: subir janelas e cercas é mais lento. Nunca tente com zumbi a menos de 5 metros de distância.', type: 'warning' },
      { text: 'Migração de Hordas: grupos de zumbis se redistribuem a cada 48h. Áreas limpas podem receber reforços de zonas adjacentes.', type: 'info' },
    ],
  },
  {
    title:    'Combate: Técnicas de Sobrevivência',
    icon:     'ti-swords',
    subtitle: 'Sem multi-acerto · Stamina crítica · 1v1 apenas',
    tips: [
      { text: 'Regra da comunidade: uma luta que você está vencendo ainda é uma luta que deveria ter evitado. Só engaje quando não há saída.', type: 'critical' },
      { text: 'Combo Empurrar + Atacar: empurre (E) para criar distância, então golpeie imediatamente. É a base de todo combate seguro.', type: 'warning' },
      { text: 'Para separar uma horda: arremesse pedra ou garrafa para atrair 2-3 zumbis para longe do grupo principal. Recue antes de engajar.', type: 'warning' },
      { text: 'Hordas têm um "líder de atenção" — alarmar o centro da horda propaga o estado de alerta para todos. Aborde sempre pela borda exterior.', type: 'warning' },
      { text: 'Circle-kite: mova-se lateralmente em círculo enquanto o zumbi avança. Sua velocidade supera o ataque dele — golpeie quando ele errar.', type: 'info' },
      { text: 'Funile em doorways: abra a porta, recue, mate um a um enquanto entram em fila. É a única forma segura de combate em grupo.', type: 'info' },
      { text: 'Monitore a stamina sempre. Sem stamina = sem empurrão = sem defesa. Pare de lutar ANTES de esgotar, não depois.', type: 'critical' },
      { text: 'Habilidade Agilidade em nível 4: sua velocidade em postura de combate supera a velocidade de ataque do zumbi. Você se torna quase intocável em 1v1.', type: 'info' },
      { text: 'Rastejadores no chão: mantenha distância lateral e elimine com estocada de longe. Nunca passe por cima de um rastejador.', type: 'warning' },
      { text: 'Panic debuff reduz precisão de mira. Treine Força e Resistência diariamente para reduzir o tempo de pânico em combate.', type: 'info' },
    ],
  },
  {
    title:    'Armas: Escolha e Manutenção',
    icon:     'ti-tool',
    subtitle: 'Loot 0.04 · Manutenção é prioridade · Arma de fogo = risco',
    tips: [
      { text: 'Manutenção é a habilidade mais importante para armas. Cada nível aumenta significativamente a durabilidade de TODAS as armas de corpo a corpo.', type: 'critical' },
      { text: 'Repare armas ANTES de quebrarem. Quando a condição chegar a Muito Baixa, repare imediatamente — esperar é perder o item.', type: 'warning' },
      { text: 'Use a mesma CATEGORIA de arma consistentemente (cortante, contundente, perfurante) para subir Manutenção mais rápido.', type: 'info' },
      { text: 'Lança artesanal (cabo de vassoura + faca): crafteável, bom alcance, renovável. Ideal quando loot está em zero.', type: 'info' },
      { text: 'Machado: melhor dano por golpe. Reserve para situações onde one-shot é necessário. Prefira armas mais silenciosas no dia a dia.', type: 'info' },
      { text: 'Faca: silenciosa, rápida e leve. Use para stealth kills em zumbis isolados. Nunca em grupo.', type: 'info' },
      { text: 'Armas de fogo: NUNCA em áreas urbanas. Com audição Alta e raio 250u, um tiro pode atrair toda uma vizinhança.', type: 'critical' },
      { text: 'Se precisar de arma de fogo, use fora da cidade, com carro e combustível prontos para fuga imediata.', type: 'warning' },
      { text: 'Armas com ataque de empurrão (crowbar, lança, armas de duas mãos): prefira-as pelo push que cria distância sem custar muita stamina.', type: 'info' },
      { text: 'Sempre carregue uma arma secundária. Com loot mínimo, a primária vai quebrar no pior momento possível.', type: 'warning' },
    ],
  },
  {
    title:    'Furtividade e Mobilidade',
    icon:     'ti-eye-off',
    subtitle: 'Visão de águia · Audição alta · Raio de detecção 250u',
    tips: [
      { text: 'Sempre se mova agachado perto de zumbis. O som dos passos em pé é detectável muito além do raio visual.', type: 'critical' },
      { text: 'Luz à noite = sinal de posição. Usar lanterna em área aberta é como acender uma sinalizador. Reserve para espaços fechados e escuros.', type: 'critical' },
      { text: 'Vegetação (arbustos, mato alto) quebra a linha de visão mesmo de Visão de Águia. Zumbis não conseguem te ver através de vegetação densa.', type: 'warning' },
      { text: 'Raio 250u: correr, bater portas ou quebrar vidros dentro desse raio já é detectado. Mova-se como se o mundo fosse de vidro.', type: 'warning' },
      { text: 'De noite, a visão de águia é reduzida. Aproveite para se reposicionar ou explorar áreas perigosas durante o dia.', type: 'info' },
      { text: 'Chuva abafa o ruído dos passos. Dias de chuva são oportunidades para loot silencioso em zonas de risco.', type: 'info' },
      { text: 'Habilidade Agilidade reduz ruído ao mover agachado. Desenvolva junto com Furtividade — as duas se complementam.', type: 'info' },
      { text: 'Nunca abra portas correndo. Abra agachado, devagar, e espere ver o que tem do outro lado antes de entrar.', type: 'warning' },
      { text: 'Distração ativa: jogue pedra ou garrafa para atrair zumbis em uma direção enquanto passa pelo outro lado.', type: 'info' },
      { text: 'Contorne clusters de zumbis em vez de empurrar. 3 minutos a mais de caminhada vale mais do que qualquer confronto.', type: 'info' },
    ],
  },
  {
    title:    'Recursos: Tudo é Escasso',
    icon:     'ti-package-off',
    subtitle: 'Loot 0.04 em todas as categorias · Priorize por tipo',
    tips: [
      { text: 'O loot está no nível mais baixo (0.04) em TODAS as 22 categorias. Espere encontrar quase nada — a exceção é a regra.', type: 'critical' },
      { text: 'Porta-luvas e porta-malas de carros são pools de loot SEPARADOS das edificações. Nunca ignore veículos — ferramentas e manuais aparecem lá.', type: 'warning' },
      { text: 'Prioridade absoluta em qualquer nível de loot: livros de habilidade → mochilas → chave de fenda → comida enlatada → sacos de lixo.', type: 'warning' },
      { text: 'Priorize TIPO de container, não localização: armários de banheiro (médico), caixotes de armazém (ferramentas), banheiros (higiene), carros (manuais).', type: 'info' },
      { text: 'Nunca entre em um prédio sem objetivo específico. Com loot mínimo, exploração aleatória é só exposição a zumbis com retorno zero.', type: 'warning' },
      { text: 'Faça um circuito perimetral: limpe e loote os prédios da borda de um bairro antes de ir para o centro.', type: 'info' },
      { text: 'Forrageamento como recurso principal: com loot 0.04, forrageamento se torna sua fonte mais consistente de materiais de sobrevivência.', type: 'info' },
      { text: 'Desmonte tudo que não usar: parafusos, arames e madeira de móveis viram materiais de crafting vitais.', type: 'info' },
      { text: 'Geradores são Extremamente Raros. Se encontrar um, é um tesouro — planeje onde usá-lo antes de carregar.', type: 'info' },
      { text: 'Roupas pretas não existem neste desafio (NoBlackClothes). Adapte a estratégia de stealth para o que está disponível.', type: 'info' },
    ],
  },
  {
    title:    'Como Upar Cada Habilidade',
    icon:     'ti-trending-up',
    subtitle: 'XP 0.8× · Leia livros ANTES de praticar',
    tips: [
      { text: 'REGRA DE OURO: leia o livro de habilidade ANTES de começar a praticar. Livros multiplicam XP em até 16× — com 0.8× global, isso é a diferença entre dias e semanas para subir uma skill.', type: 'critical' },
      { text: 'Furtividade e Agilidade sobem PASSIVAMENTE: fique agachado perto de qualquer zumbi (sem precisar engajá-lo). XP gratuito em toda exploração.', type: 'info' },
      { text: 'Carpintaria (1–4): desmonte móveis em casas (camas, armários, mesas). (5–8): construa paredes, pisos e escadas.', type: 'info' },
      { text: 'Mecânica: inspecione TODOS os veículos encontrados. Remova e reinstale peças para XP extra além da inspeção básica.', type: 'info' },
      { text: 'Elétrica: desmonte eletrônicos (rádios, TVs, relógios, alarmes) com uma chave de fenda. Mesmo com loot baixo, esses itens aparecem com mais frequência.', type: 'info' },
      { text: 'Primeiros Socorros: trate toda ferida, mesmo mínimas. Aplique sutura em cortes, imobilize fraturas. Cada procedimento dá XP independente da gravidade.', type: 'info' },
      { text: 'Culinária: cozinhe qualquer combinação. Adicionar mais ingredientes a uma receita aumenta o XP por preparo.', type: 'info' },
      { text: 'Agricultura: plante em volume. Cada ação de rega, adubo e colheita gera XP. Quanto mais canteiros, mais XP constante.', type: 'info' },
      { text: 'Força e Resistência: faça exercícios diários antes de sair (flexões, abdominais). Carregar objetos pesados treina Força passivamente ao caminhar.', type: 'info' },
      { text: 'Mira: comece pelos livros. Treine com pistola em zumbis ISOLADOS fora da cidade. Mire na cabeça para bônus de XP por headshot.', type: 'info' },
      { text: 'Manutenção: sobe usando armas do mesmo tipo repetidamente. Use até Muito Baixo, repare, repita.', type: 'info' },
      { text: 'Pesca: comece imediatamente. Você precisa de nível 4 para pescar com consistência no inverno, 6–7 para ser uma fonte alimentar real. Pesque cedo e sempre.', type: 'warning' },
    ],
  },
  {
    title:    'Sem Energia, Sem Água',
    icon:     'ti-bolt-off',
    subtitle: 'Desligamento instantâneo no Dia 1 · Barris de chuva são essenciais',
    tips: [
      { text: 'Energia e água cortam no instante zero. Geladeiras, fogões elétricos e torneiras: completamente inoperantes desde o início.', type: 'critical' },
      { text: 'Barris de chuva são sua ÚNICA fonte renovável de água. Craft: Carpintaria 4 + 4 tábuas + 4 pregos + 4 sacos de lixo + martelo. Construa o mais cedo possível.', type: 'critical' },
      { text: 'Sacos de lixo são raros com loot 0.04. Procure-os no Dia 1 antes de estabelecer base — sem eles, sem barril.', type: 'warning' },
      { text: 'Água de barril = água contaminada. SEMPRE ferva antes de beber. Pode usar diretamente para regar plantas e limpar feridas.', type: 'warning' },
      { text: 'Com chave inglesa, conecte um barril acima de uma pia (botão direito) para restaurar a funcionalidade da torneira na base.', type: 'info' },
      { text: 'Cozinhe em fogueiras, churrasqueiras ou fogões a lenha. Alimentos crus causam doenças e apodrecem muito rápido sem refrigeração.', type: 'warning' },
      { text: 'Geladeiras e freezers de postos de gasolina funcionam como caixas frias naturais no inverno, mesmo sem eletricidade.', type: 'info' },
      { text: 'Se encontrar um gerador, use-o com prioridade em: geladeira pequena, luz de trabalho e carregamento de rádio.', type: 'info' },
    ],
  },
  {
    title:    'Saúde e Ferimentos',
    icon:     'ti-first-aid-kit',
    subtitle: 'Fraturas ativas · Sem kit inicial · Fake Dead · Loot médico mínimo',
    tips: [
      { text: 'Fraturas ativadas: uma queda de dois andares ou colisão de carro pode quebrar ossos permanentemente. Use ESCADAS, nunca pule de altura.', type: 'critical' },
      { text: 'Você começa sem kit inicial. Encontrar desinfetante e ataduras é prioridade absoluta de loot — sem isso, um arranhão pode matar.', type: 'critical' },
      { text: 'Desinfete TODO ferimento imediatamente. Com loot médico escassíssimo, uma infecção não tratada é sentença de morte lenta.', type: 'critical' },
      { text: 'Imobilize fraturas com tala (splint) o mais rápido possível. Uma fratura não tratada causa dor constante e penalidade de movimento que acumula.', type: 'warning' },
      { text: 'Fator de tensão muscular 0.8×: exercícios pesados e lutas intensas causam fadiga muscular mais rápido que o normal.', type: 'info' },
      { text: 'Habilidade Primeiros Socorros é crítica. Com fraturas ativas e loot médico raro, saber tratar bem reduz material gasto e aumenta eficácia.', type: 'warning' },
      { text: 'Fake Dead (Total) em ferimentos: zumbis "mortos" perto de você podem se levantar enquanto trata um ferimento. Sempre limpe a área antes de parar para se curar.', type: 'warning' },
      { text: 'Humor afeta XP: personagem estressado, com dor ou com fome aprende mais devagar. Manter moral alta é parte da estratégia de progressão.', type: 'info' },
    ],
  },
  {
    title:    'Noites, Frio e Ambiente',
    icon:     'ti-moon',
    subtitle: 'Noites escuras · Temperatura fria · Chuva seca · Luz = posição revelada',
    tips: [
      { text: 'Lanterna em área aberta à noite = sinalizador. Zumbis detectam a luz antes de te ver. Reserve para espaços fechados e interiores.', type: 'critical' },
      { text: 'Durma à noite quando possível: seu personagem descansa, o moral melhora (bônus de XP) e você evita o período de maior risco com zumbis ainda ativos.', type: 'warning' },
      { text: 'Noites escuras: de noite, a visão de águia dos zumbis é parcialmente reduzida. Use isso a favor para se reposicionar discretamente.', type: 'info' },
      { text: 'Temperatura FRIA: roupas molhadas + frio = hipotermia rapidamente. Sempre troque roupas encharcadas pela chuva antes de entrar em abrigo.', type: 'warning' },
      { text: 'Chuva é seca mas ocorre. Tenha sempre ao menos um barril posicionado ao ar livre para coleta.', type: 'info' },
      { text: 'Helicóptero acontece UMA VEZ. Quando ouvir, abandone tudo e encontre cobertura interior imediatamente — ele atrai hordas em direção à sua posição.', type: 'warning' },
      { text: 'Eventos aleatórios ocorrem Algumas Vezes. Mantenha sempre uma rota de evacuação da base ativa para responder rapidamente.', type: 'info' },
      { text: 'Traço Olhos de Gato dá visão suficiente em noites com lua para navegar sem fonte de luz — o melhor investimento para sobreviver às noites escuras.', type: 'info' },
    ],
  },
  {
    title:    'Veículos: Use com Sabedoria',
    icon:     'ti-car',
    subtitle: 'Quase todos trancados · Condição muito baixa · Gasolina escassa',
    tips: [
      { text: 'Quase TODOS os carros estão trancados (configuração Muito Frequente). Ocupação Ladrão com hotwire resolve isso desde o Dia 1.', type: 'critical' },
      { text: 'Sem a ocupação Ladrão: você precisa de Elétrica 1 + Mecânica 2 para hotwire — priorizando essas skills nas primeiras semanas.', type: 'warning' },
      { text: 'Condição geral MUITO BAIXA. Inspecione motor, pneus e freios antes de depender de qualquer veículo para fuga.', type: 'warning' },
      { text: 'Gasolina é Muito Baixa em todos os tanques. Nunca saia sem verificar e nunca sem um galão reserva no porta-malas.', type: 'critical' },
      { text: 'Alarmes de carro existem com frequência alta. Tenha sempre uma rota de fuga planejada antes de tentar entrar em um carro desconhecido.', type: 'warning' },
      { text: 'Acidentes causam dano ao JOGADOR (fraturas!) e ao carro. Com condição já precária, um baque pode inutilizar seu único transporte.', type: 'critical' },
      { text: 'Use veículos como barricadas: estacione carros atravessados em rotas de acesso à base. Zumbis não conseguem mover veículos facilmente.', type: 'info' },
      { text: 'Motor ligado = ruído constante. Desligue o motor quando parado na base ou esperando — mesmo longe, o som acumula atenção de zumbis.', type: 'info' },
    ],
  },
  {
    title:    'Defesa e Construção de Base',
    icon:     'ti-shield-lock',
    subtitle: 'Zumbis abrem portas · Cercas danificadas · Estratégia de múltiplas camadas',
    tips: [
      { text: 'Localize sua base FORA de cidades. Com população 8×, centros urbanos são funcionalmente inacessíveis como base permanente.', type: 'critical' },
      { text: 'Não construa próximo a estradas movimentadas. Veículos abandonados na rua atraem atenção de hordas que migram.', type: 'warning' },
      { text: 'Acesso a água é inegociável: escolha base com lago, rio ou distância ≤200 tiles de fonte hídrica. Barris de chuva são insuficientes sozinhos.', type: 'warning' },
      { text: 'Duplo perímetro: cerca externa (arame farpado, metal) + parede de madeira interna. Zumbis atravessando a cerca tomam dano antes de chegar à parede.', type: 'info' },
      { text: 'Arame farpado nas cercas externas causa dano passivo constante. Combine com cerca metálica para máxima resistência.', type: 'info' },
      { text: 'Estratégia do andar superior: construa escada interna, estabeleça base no 2º andar e REMOVA a escada. Zumbis não chegam. A entrada é por corda de lençol.', type: 'info' },
      { text: 'Corda de lençol por janela do 2º andar: a única entrada é inacessível para zumbis. Puxe a corda e você está completamente seguro verticalmente.', type: 'info' },
      { text: 'Barricade janelas do térreo com máximo de tábuas. Cada tábua = mais tempo antes de invasão.', type: 'warning' },
      { text: 'Crie corredores de morte: passagens estreitas entre barricadas onde zumbis só passam em fila — elimine-os um a um sem risco de ser cercado.', type: 'info' },
      { text: 'NUNCA se tranche sem rota de fuga alternativa. Mantenha ao menos duas saídas de emergência ativas em toda base.', type: 'critical' },
      { text: 'Revise cercas e barricadas regularmente. Com fator de dano de cerca em 1.3×, seções específicas se degradam mais rápido do que o esperado.', type: 'warning' },
    ],
  },
  {
    title:    'Alimentação Sustentável',
    icon:     'ti-wheat',
    subtitle: 'Sem refrigeração · Agricultura é a base · Armadilhas e pesca como complemento',
    tips: [
      { text: 'AGRICULTURA é a única fonte alimentar sustentável. Plante na primeira semana — não na segunda, não "em breve".', type: 'critical' },
      { text: 'Repolho: escolha da comunidade para primeira plantação. Alto rendimento, cresce em múltiplas estações, fácil de semear.', type: 'info' },
      { text: 'Alimentos apodrecem rápido sem refrigeração. Preserve com sal ou vinagre, ou consuma logo após coletar.', type: 'warning' },
      { text: 'Armadilhas (coelhos, esquilos): posicione à noite (animais ativos 19h–5h) e afaste-se pelo menos 75 tiles. Armadilha não dispara se você estiver perto.', type: 'info' },
      { text: 'Freezers de posto de gasolina funcionam como caixas frias nos meses frios mesmo sem eletricidade. Aproveite o inverno para preservar alimento.', type: 'info' },
      { text: 'Pesca: nível mínimo de abundância, mas o XP é constante. Nível 4 para pescar com consistência, 6–7 para ser fonte primária de proteína.', type: 'warning' },
      { text: 'Culinária melhora o valor nutricional de cada alimento. Mesmo com ingredientes simples, cozinhar sempre supera comer cru.', type: 'info' },
      { text: 'Animais de fazenda são Extremamente Raros neste desafio. Não planeje criação de gado como estratégia de alimentação inicial.', type: 'info' },
    ],
  },
  {
    title:    'Estratégia de Longo Prazo',
    icon:     'ti-calendar',
    subtitle: 'Sem respawn · Atrite territorial · Mini-mapa disponível',
    tips: [
      { text: 'Zumbis NÃO reaparecem (RespawnHours=0). Limpe uma área completamente — ela fica segura para sempre. Essa é a base de toda estratégia de longo prazo.', type: 'info' },
      { text: 'Estratégia de anel: limpe de fora para dentro, em círculos a partir da sua base rural. Não tente a cidade antes de controlar a periferia.', type: 'info' },
      { text: 'Queime corpos em campo aberto: previne Fake Dead de "reanimação" e elimina risco de doenças. Nunca queime perto de estruturas ou loot importante.', type: 'warning' },
      { text: 'Migração de hordas a cada 48h. Zumbis de zonas adjacentes podem se redistribuir para onde você está. Sempre mantenha a base defensivamente ativa.', type: 'warning' },
      { text: 'O Mini-mapa está disponível. Marque recursos, pontos seguros, hordas encontradas e rotas de fuga enquanto explora.', type: 'info' },
      { text: 'Construa rotas seguras a pé entre base e pontos de loot. Com veículos frágeis e combustível escasso, trajetos a pé protegidos são vitais.', type: 'info' },
      { text: 'Porões têm frequência MUITO ALTA neste desafio. Explore com atenção — podem conter loot bom mas também zumbis em espaço fechado sem saída.', type: 'warning' },
      { text: 'Após semanas limpando, estabeleça um segundo ponto de suprimentos. Nunca dependa de um único local para nenhum recurso crítico.', type: 'info' },
      { text: 'Fogo é a ferramenta mais eficiente para limpeza em massa a longo prazo. Calcule o vento e garanta zona de controle antes de iniciar.', type: 'info' },
    ],
  },
];

type FilterType = 'all' | TipType;

const TYPE_ICON: Record<TipType, string> = {
  critical: 'ti-alert-triangle',
  warning:  'ti-alert-circle',
  info:     'ti-info-circle',
};

const FILTER_LABEL: Record<FilterType, string> = {
  all:      'Todos',
  critical: 'Crítico',
  warning:  'Atenção',
  info:     'Dica',
};

const totalTips = TIP_GROUPS.reduce((s, g) => s + g.tips.length, 0);

export function TipsPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<FilterType>('all');
  const mainRef = useRef<HTMLDivElement>(null);

  const isSearching = search.trim().length > 0;

  const applyFilters = (tips: Tip[]) =>
    tips.filter(t => {
      const type = t.type ?? 'info';
      if (filter !== 'all' && type !== filter) return false;
      if (isSearching && !t.text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  const displayGroups = isSearching
    ? TIP_GROUPS.map(g => ({ ...g, tips: applyFilters(g.tips) })).filter(g => g.tips.length > 0)
    : [{ ...TIP_GROUPS[activeIdx], tips: applyFilters(TIP_GROUPS[activeIdx].tips) }];

  const activeGroup = TIP_GROUPS[activeIdx];
  const typeCounts = activeGroup.tips.reduce(
    (acc, t) => { acc[t.type ?? 'info']++; return acc; },
    { critical: 0, warning: 0, info: 0 } as Record<TipType, number>,
  );

  const handleNav = (idx: number) => {
    setActiveIdx(idx);
    setSearch('');
    setFilter('all');
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="tips-page">
      {/* ── Header ── */}
      <header className="tips-header">
        <div className="tips-header-inner">
          <Link to="/" className="tips-back-link">
            <i className="ti ti-arrow-left" />
            <span>Início</span>
          </Link>
          <div className="tips-header-title-block">
            <p className="tips-eyebrow">DESAFIO BRASILEIRÃO PZ</p>
            <h1 className="tips-title">GUIA DE SOBREVIVÊNCIA</h1>
            <p className="tips-meta">
              <span>{TIP_GROUPS.length} CATEGORIAS</span>
              <span className="tips-meta-sep">·</span>
              <span>{totalTips} DICAS</span>
            </p>
          </div>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="tips-layout">

        {/* Sidebar */}
        <nav className="tips-sidebar" aria-label="Categorias">
          <div className="tips-sidebar-search-wrap">
            <i className="ti ti-search tips-search-ico" />
            <input
              className="tips-sidebar-search"
              placeholder="Buscar dica..."
              value={search}
              onChange={e => { setSearch(e.target.value); }}
              aria-label="Buscar dica"
            />
            {search && (
              <button className="tips-search-clear" onClick={() => setSearch('')} aria-label="Limpar busca">
                <i className="ti ti-x" />
              </button>
            )}
          </div>

          <ul className="tips-nav-list">
            {TIP_GROUPS.map((g, i) => (
              <li key={i}>
                <button
                  className={`tips-nav-item${activeIdx === i && !isSearching ? ' is-active' : ''}`}
                  onClick={() => handleNav(i)}
                >
                  <i className={`ti ${g.icon} tips-nav-icon`} />
                  <span className="tips-nav-label">{g.title}</span>
                  <span className="tips-nav-count">{g.tips.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main */}
        <main className="tips-main" ref={mainRef}>

          {/* Category header (only when not searching) */}
          {!isSearching && (
            <div className="tips-cat-header">
              <div className="tips-cat-icon-wrap">
                <i className={`ti ${activeGroup.icon}`} />
              </div>
              <div className="tips-cat-text">
                <h2 className="tips-cat-title">{activeGroup.title}</h2>
                <p className="tips-cat-sub">{activeGroup.subtitle}</p>
              </div>
            </div>
          )}

          {/* Search result header */}
          {isSearching && (
            <div className="tips-search-result-header">
              <i className="ti ti-search" />
              <span>
                Resultados para <strong>"{search}"</strong>
                {' '}— {displayGroups.reduce((s, g) => s + g.tips.length, 0)} dicas
              </span>
            </div>
          )}

          {/* Filter bar */}
          {!isSearching && (
            <div className="tips-filter-bar">
              <button
                className={`tips-filter-btn${filter === 'all' ? ' is-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {FILTER_LABEL.all}
                <span className="tips-filter-count">{activeGroup.tips.length}</span>
              </button>
              {(['critical', 'warning', 'info'] as TipType[]).map(t =>
                typeCounts[t] > 0 ? (
                  <button
                    key={t}
                    className={`tips-filter-btn tips-filter-${t}${filter === t ? ' is-active' : ''}`}
                    onClick={() => setFilter(t)}
                  >
                    <i className={`ti ${TYPE_ICON[t]}`} />
                    {FILTER_LABEL[t]}
                    <span className="tips-filter-count">{typeCounts[t]}</span>
                  </button>
                ) : null,
              )}
            </div>
          )}

          {/* Tip groups */}
          {displayGroups.length === 0 && (
            <div className="tips-empty">
              <i className="ti ti-mood-empty" />
              <p>Nenhuma dica encontrada.</p>
            </div>
          )}

          {displayGroups.map((group, gi) => (
            <div key={gi} className="tips-group-block">
              {isSearching && (
                <div className="tips-group-search-label">
                  <i className={`ti ${group.icon}`} />
                  <span>{group.title}</span>
                  <span className="tips-group-search-count">{group.tips.length}</span>
                </div>
              )}
              <ul className="tips-list">
                {group.tips.map((tip, ti) => {
                  const type = tip.type ?? 'info';
                  return (
                    <li key={ti} className={`tip-row tip-row--${type}`}>
                      <i className={`ti ${TYPE_ICON[type]} tip-row-icon`} />
                      <span className="tip-row-text">{tip.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Navigation footer */}
          {!isSearching && (
            <div className="tips-nav-footer">
              {activeIdx > 0 && (
                <button className="tips-nav-footer-btn" onClick={() => handleNav(activeIdx - 1)}>
                  <i className="ti ti-arrow-left" />
                  <span>{TIP_GROUPS[activeIdx - 1].title}</span>
                </button>
              )}
              <div className="tips-nav-footer-spacer" />
              {activeIdx < TIP_GROUPS.length - 1 && (
                <button className="tips-nav-footer-btn tips-nav-footer-btn--next" onClick={() => handleNav(activeIdx + 1)}>
                  <span>{TIP_GROUPS[activeIdx + 1].title}</span>
                  <i className="ti ti-arrow-right" />
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
