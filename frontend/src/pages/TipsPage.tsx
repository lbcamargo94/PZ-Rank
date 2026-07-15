import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './tips.css';

type TipType = 'critical' | 'warning' | 'info';

interface Tip {
  title:    string;
  text:     string;
  example?: string;
  type?:    TipType;
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
    subtitle: 'Ocupação · Traços positivos · O que nunca escolher',
    tips: [
      {
        title:   'Ladrão: a ocupação certa para o desafio',
        text:    'Ladrão começa com Furtividade, Leveza de Pés e Agilidade todos no nível 2 — os três pilares da sobrevivência silenciosa. O traço exclusivo "Ladrão" permite hotwire em veículos desde o Dia 1, sem precisar de Elétrica 1 + Mecânica 2.',
        example: 'No Dia 1, o carro mais próximo está trancado. Com Ladrão, você tenta o hotwire imediatamente. Um personagem sem ela precisaria de semanas de treino antes de ligar o primeiro carro.',
        type: 'critical',
      },
      {
        title:   'Inconspícuo: reduz detecção diretamente',
        text:    'Reduz a chance base de um zumbi detectar sua presença. Com visão de Águia e Audição Alta, cada ponto a menos de chance de detecção tem impacto real. Custa 4 pontos.',
        example: 'Cruzando uma rua com 3 zumbis de costas para você: sem Inconspícuo, qualquer um pode virar aleatoriamente e te ver. Com ele, a janela de segurança aumenta significativamente.',
        type: 'warning',
      },
      {
        title:   'Gracioso + Furtividade 2: a combinação de silêncio',
        text:    'Gracioso reduz o raio sonoro dos seus passos. Combinado com Furtividade nível 2 do Ladrão e movimento agachado, você se torna praticamente indetectável por audição em espaços abertos.',
        example: 'Com os dois traços e agachado, você passa a ~10 tiles de um zumbi com Audição Alta sem ser detectado. Sem nenhum deles, esse limite cai para ~4 tiles.',
        type: 'warning',
      },
      {
        title:   'Olhos de Gato: navegação noturna sem lanterna',
        text:    '+20% de visão noturna, permitindo navegar em noites com pouca luz sem usar lanterna. Atenção: em B42.19, ambientes completamente escuros (porões sem janela, cômodos fechados) são pitch-black — o traço não funciona nesses casos. Use lanterna só em interiores fechados.',
        example: 'Com lua crescente, você se move pela periferia rural sem nenhuma fonte de luz e enxerga ~8 tiles à frente. O mesmo personagem sem o traço enxerga apenas 3–4 tiles.',
        type: 'info',
      },
      {
        title:   'Aprendiz Rápido quase cancela o 0,8× de XP',
        text:    '+30% de XP em todas as habilidades. Em B42.19, livros de habilidade concedem até 6× de multiplicador. Combinando: 6× × 1,3 × 0,8 ≈ 6,2× — você praticamente neutraliza a penalidade do desafio.',
        example: 'Sem o traço, ler um livro Master dá 6× × 0,8 = 4,8× de XP. Com ele, 6× × 1,3 × 0,8 ≈ 6,2× — quase o dobro do sem-traço e acima do vanilla.',
        type: 'info',
      },
      {
        title:   'Habilidoso: cada segundo dentro de um prédio conta',
        text:    'Transfere itens ao inventário em metade do tempo. Com loot mínimo, você abre muitos containers para encontrar poucos itens — menos tempo parado = menos chance de ser cercado.',
        example: 'Um armário com 8 itens: sem o traço, ~8 s parado. Com Habilidoso, ~4 s. Em um prédio com 5 cômodos e zumbis entrando pela janela, essa diferença é a linha entre escapar e morrer.',
        type: 'info',
      },
      {
        title:   'Traços negativos que não custam nada na prática',
        text:    'Sedento (+6 pts): barris de chuva eliminam o problema. Fumante (+4 pts): cigarros existem em máquinas de venda mesmo com loot baixo. Curador Lento (+6 pts): evitando combate (que é a estratégia certa), raramente você precisa de cura rápida.',
        example: 'Esses três traços geram 16 pontos extras. Você compra Aprendiz Rápido (3), Gracioso (4), Olhos de Gato (2), Inconspícuo (4) e Habilidoso (2) com 1 ponto sobrando.',
        type: 'info',
      },
      {
        title:   'Pacifista e Míope eliminam sua viabilidade',
        text:    'Pacifista: -75% de XP em melee e mira sobre o 0,8× do desafio — qualquer habilidade de combate demora meses de jogo. Míope: com visão de Águia dos zumbis, você precisa detectá-los primeiro; Míope inverte essa vantagem de forma permanente.',
        example: 'Com Pacifista + 0,8×, chegar ao nível 3 de Machado leva 3× mais tempo. No início você ainda luta lento — e um único hit com força super-humana pode quebrar um osso.',
        type: 'critical',
      },
    ],
  },

  {
    title:    'Os Primeiros Minutos',
    icon:     'ti-alarm',
    subtitle: 'Pop. 8× no Dia 1 · Sem água · Sem luz · Sem kit inicial',
    tips: [
      {
        title:   'Água e luz cortam no instante zero',
        text:    'Água e eletricidade desligam instantaneamente. Não existe torneira funcionando em nenhum momento do jogo. Panelinhas de sobrevivência e estratégias de "abastecer antes do corte" não existem aqui.',
        example: 'Você acorda e a primeira ação deve ser procurar recipientes para água — não torneiras. Cada pote, garrafa e panela vazia que você encontrar nas primeiras casas é recurso crítico.',
        type: 'critical',
      },
      {
        title:   'A cidade está tomada desde o Dia 1',
        text:    'A população começa e já está no pico de 8× no próprio Dia 1 (multiplicador 4× com fator de pico 2×). Não há período de "graça" — o mapa já está saturado quando você acorda.',
        example: 'Uma rua de West Point que no vanilla teria ~5 zumbis tem aqui ~40. Qualquer ruído — uma porta batendo, um carro arrancando — atrai uma horda de tamanho completamente diferente.',
        type: 'critical',
      },
      {
        title:   'Loot mínimo: defina um objetivo antes de entrar',
        text:    'Nunca entre em um prédio sem um objetivo específico. Com 0,04 de loot, exploração aleatória significa exposição a zumbis com retorno perto de zero. Defina o que você precisa (kit médico, mochila, comida) e vá direto.',
        example: 'Prédio 1: um armário de banheiro para desinfetante. Prédio 2: cozinha para comida enlatada. Você entra, pega, sai — sem explorar cada cômodo vazio.',
        type: 'warning',
      },
      {
        title:   'Itens prioritários do Dia 1',
        text:    'Mochila grande (aumenta capacidade de carregamento drasticamente), comida para 3 dias, kit básico de primeiros socorros, sacos de lixo (para barris de chuva mais tarde), faca ou machado.',
        example: 'Ignore jóias, electrónicos e livros decorativos no Dia 1. O único livro que vale o risco é um livro de habilidade — e mesmo assim avalie o custo de permanecer no prédio para pegá-lo.',
        type: 'warning',
      },
      {
        title:   'Áreas limpas ficam limpas para sempre',
        text:    'Zumbis não reaparecem (RespawnHours = 0). Cada zumbi eliminado é permanente — uma área limpa fica segura para sempre. Isso muda completamente a lógica de longo prazo.',
        example: 'Limpar um bairro residencial pequeno leva horas e é arriscado. Mas esse mesmo bairro, uma vez limpo, vira sua zona de loot segura por todo o resto do jogo.',
        type: 'info',
      },
      {
        title:   'Planeje a rota de fuga antes de entrar',
        text:    'Antes de qualquer edificação: identifique no mínimo duas saídas. Zumbis com Cognição Avançada abrem portas — sua entrada pode virar uma armadilha se a única saída for pela porta pela qual você entrou.',
        example: 'Casa com porta da frente e janela dos fundos: entre pela frente, mas deixe a janela dos fundos destrancada e desobstruída. Se zumbis entrarem pela porta, você sai pela janela.',
        type: 'warning',
      },
    ],
  },

  {
    title:    'Os Zumbis São Diferentes Aqui',
    icon:     'ti-brain',
    subtitle: 'Força super-humana · Visão de águia · Abrem portas · Fake Dead Total',
    tips: [
      {
        title:   'Força super-humana: um hit pode quebrar osso',
        text:    'Fraturas estão ativadas. Um único golpe de zumbi pode quebrar um braço, perna ou costela. Não existe "leve arranhão" — cada hit físico é potencialmente incapacitante.',
        example: 'Você está limpando um corredor e calcula errado o empurrão. O zumbi acerta uma vez. Você ouve o som do osso quebrando. Com fratura no braço, sua capacidade de carregar peso cai 50%. Cada hit conta.',
        type: 'critical',
      },
      {
        title:   'Fake Dead Total: todo zumbi no chão é suspeito',
        text:    'Fake Dead está no nível máximo. Zumbis no chão podem estar fingindo — não há diferença visual entre morto de verdade e fingindo. Sempre confirme com um golpe antes de passar perto.',
        example: 'Você limpa um cômodo, vê 3 corpos no chão e vira as costas para lotar o armário. Um "morto" se levanta silenciosamente pelas costas. Com Fake Dead Total, isso não é exceção — é rotina.',
        type: 'critical',
      },
      {
        title:   'Visão de Águia: nunca cruze espaços abertos na vertical',
        text:    'Zumbis enxergam a distâncias muito maiores que o normal. Cruzar ruas, estacionamentos ou campos abertos durante o dia é enorme risco. Use carros, paredes, árvores e arbustos como cobertura constante.',
        example: 'Uma rua de 15 tiles: no vanilla você cruza agachado sem problema. Aqui, um zumbi de Visão de Águia na outra ponta já te detectou antes de você chegar na metade.',
        type: 'critical',
      },
      {
        title:   'Audição Alta + Raio 250u: qualquer som é um erro',
        text:    'O raio de audição é de 250 unidades — muito mais que o padrão. Correr, bater portas, quebrar vidros ou disparar armas de fogo dentro desse raio atrai tudo ao redor.',
        example: 'Você dispara uma pistola para se livrar de 4 zumbis em um beco. Em 90 segundos, mais 30 chegam de toda a vizinhança. Um tiro em área urbana equivale a gritar sua posição no megafone.',
        type: 'critical',
      },
      {
        title:   'Cognição Avançada: tranque, não só feche',
        text:    'Zumbis abrem portas fechadas (não trancadas). Fechar uma porta cria apenas um obstáculo temporário. Trancar com chave e barricar são os únicos bloqueios reais.',
        example: 'Você entra em uma casa, fecha a porta de entrada mas não tranca porque está com pressa. 2 minutos depois, enquanto você loota o andar de cima, ouve a porta da frente abrir. Sempre tranque.',
        type: 'warning',
      },
      {
        title:   'Memória Longa: desapareça completamente antes de retornar',
        text:    'Uma vez detectado, zumbis procuram por muito tempo. Tentar "se esconder" perto da área de detecção não funciona — eles vasculham. Some completamente do radar (>200 tiles) antes de planejar retorno.',
        example: 'Você faz barulho na rua A e corre para o beco da rua B, dois quarteirões adiante. Os zumbis ainda vão vasculhar a rua A e adjacências por minutos. Não volte até ouvir silêncio completo.',
        type: 'warning',
      },
      {
        title:   'Rastejadores Derrubam: nunca passe por cima',
        text:    'Rastejadores podem te derrubar ao passar muito perto. Ser derrubado com outros zumbis por perto é frequentemente fatal. Elimine rastejadores com estocada de longe antes de avançar.',
        example: 'Você vê um rastejador no chão de um corredor e decide pular por cima para sair pela outra porta. O rastejador agarra seus pés, você cai, e há 2 zumbis em pé atrás de você.',
        type: 'warning',
      },
      {
        title:   'Sem multi-acerto: cada zumbi é um encontro separado',
        text:    'Impossível acertar múltiplos zumbis com um golpe. Cada swing atinge um único zumbi — não existe vantagem em grupos. Qualquer situação com 2+ zumbis simultâneos é significativamente mais perigosa.',
        example: 'No vanilla, você vence 3 zumbis agrupados com alguns golpes em arco. Aqui, esses 3 zumbis são 3 encontros separados que acontecem ao mesmo tempo. Separe sempre antes de engajar.',
        type: 'info',
      },
      {
        title:   'Migração de zumbis a cada 48h',
        text:    'Hordas se redistribuem entre zonas a cada 48 horas. Áreas que você limpou podem receber reforços de zonas adjacentes. Mantenha sempre percepção ativa de onde estão as densidades maiores.',
        example: 'Você limpa um bairro no Dia 10. No Dia 12, após a redistribuição, alguns zumbis do bairro vizinho migraram para o seu. Não assuma que uma área limpa é segura sem verificar novamente após 48h.',
        type: 'info',
      },
    ],
  },

  {
    title:    'Combate: Técnicas de Sobrevivência',
    icon:     'ti-swords',
    subtitle: 'Sem multi-acerto · Stamina crítica · Isolar antes de engajar',
    tips: [
      {
        title:   'A melhor luta é a que você não precisa travar',
        text:    'Com força super-humana, sem multi-acerto e fraturas ativas, qualquer combate carrega risco de morte ou incapacitação. Só engaje quando não há alternativa. Uma rota de 5 minutos a mais sempre vale mais que um confronto.',
        example: 'Um zumbi bloqueia a entrada de uma casa. Em vez de lutar, você dá a volta pelo jardim, entra pela janela da lateral. O zumbi ainda está na frente. Você lota e sai pela janela de trás.',
        type: 'critical',
      },
      {
        title:   'Empurre com Espaço, ataque quando o zumbi tropeçar',
        text:    'O empurrão (tecla Espaço) cria distância e desequilibra o zumbi por frações de segundo. Golpeie imediatamente após o empurrão, antes que ele se recupere. É o combo fundamental de todo combate seguro no desafio.',
        example: 'Zumbi avança: Espaço → zumbi recua → golpe imediato → repita. Cada ciclo custa menos stamina do que tentar acertar o zumbi em movimento e mantém distância segura do reach dele.',
        type: 'warning',
      },
      {
        title:   'Separe a horda antes de engajar qualquer membro',
        text:    'Arremesse pedra ou garrafa para atrair 2–3 zumbis para longe do grupo principal. Recue até perder o raio de visão da horda maior antes de engajar os separados. Nunca ataque de dentro ou perto do centro da horda.',
        example: 'Horda de 15 zumbis na rua: você joga uma pedra para o becos lateral. 3 vêm investigar. Você recua mais um quarteirão, elimina os 3, volta, repete. A horda de 15 vira sequência de confrontos de 1.',
        type: 'warning',
      },
      {
        title:   'Funil de portas: o único combate em grupo seguro',
        text:    'Abra uma porta, recue imediatamente, deixe um zumbi entrar por vez, elimine. Portas e corredores estreitos forçam zumbis em fila — você enfrenta um de cada vez mesmo com dezenas do outro lado.',
        example: 'Prédio com 8 zumbis dentro: abra a porta da frente, recue 5 tiles, elimine o primeiro que sair. O segundo vai sair logo após. Em 2 minutos, todos os 8 foram eliminados sem receber um hit.',
        type: 'info',
      },
      {
        title:   'Gerencie stamina: pare antes de esgotar',
        text:    'Sem stamina = sem empurrão = sem defesa. O empurrão é sua única saída quando um zumbi está no seu range. Pare de lutar quando a stamina chegar a ~30% e crie distância para recuperar.',
        example: 'Você está eliminando um zumbi, stamina em 15%, e um segundo aparece pelo corredor. Você tenta empurrar — mas sem stamina, o empurrão falha. O segundo zumbi te acerta. Pare cedo.',
        type: 'critical',
      },
      {
        title:   'Agilidade nível 4: velocidade de combate superiora',
        text:    'Em nível 4, sua velocidade de movimentação em postura de combate supera a velocidade de ataque do zumbi. Você se torna quase intocável em 1v1 sem precisar correr. Priorize essa habilidade.',
        example: 'Em nível 2, você precisa correr para criar distância de um zumbi persistente. Em nível 4, você simplesmente anda lateralmente e o zumbi nunca consegue alcançar você enquanto ataca.',
        type: 'info',
      },
      {
        title:   'Círculo de kite: mova-se lateralmente, nunca recue reto',
        text:    'Recuar reto é mais lento que zumbis em alguns ângulos. Mover-se em arco lateral enquanto o zumbi avança faz ele errar os swings e cria espaço para contra-ataque.',
        example: 'Zumbi avança: em vez de recuar para trás em linha reta, mova para a direita em diagonal. O swing do zumbi vai para onde você estava. Você está agora no flanco dele — golpe livre.',
        type: 'info',
      },
      {
        title:   'Pânico reduz precisão: treine Força e Resistência',
        text:    'O debuff de pânico reduz sua precisão de mira e aumenta o tremor de mãos. Personagens com alta Força e Resistência entram em pânico com menos frequência e saem dele mais rápido.',
        example: 'Primeiro encontro com 5 zumbis: pânico total, sua mira tremendo, golpes errando. Mesma situação com Força 5: pânico leve, mira estável, golpes conectando normalmente.',
        type: 'info',
      },
      {
        title:   'Nunca lute encostado em paredes ou cercas',
        text:    'Um tropeço ou empurrão errado pode te prender entre o zumbi e a parede. Em espaço fechado, você não consegue criar a distância necessária para o combo Espaço→golpe.',
        example: 'Você está eliminando um zumbi em um corredor estreito e recua mais um passo do que o planejado. Suas costas batem na parede. O zumbi está a 1 tile. Sem espaço para empurrar efetivamente.',
        type: 'warning',
      },
    ],
  },

  {
    title:    'Armas: Escolha e Manutenção',
    icon:     'ti-tool',
    subtitle: 'Manutenção é prioridade · Lança artesanal · Arma de fogo = emergência',
    tips: [
      {
        title:   'Manutenção é a habilidade mais importante para armas',
        text:    'Cada nível de Manutenção aumenta a durabilidade efetiva de todas as armas corpo a corpo. Com loot em 0,04, encontrar uma substituição para uma arma quebrada pode levar dias. Manutenção compra tempo.',
        example: 'Uma faca com Manutenção 0 quebra após ~50 usos. Com Manutenção 5, a mesma faca dura ~150 usos antes de atingir condição crítica. Sobre loot mínimo, isso é a diferença entre 1 e 3 semanas de segurança.',
        type: 'critical',
      },
      {
        title:   'Repare sempre antes de quebrar, nunca depois',
        text:    'Uma arma em condição Muito Baixa quebra no próximo uso. Reparar na condição Baixa evita perda total e usa menos materiais do que tentar recondicionar do zero. Monitore a condição constantemente.',
        example: 'Sua faca está em Baixo. Você pensa "deixa para depois" e usa mais uma vez. Quebrou. Você estava no meio de limpar uma área. Agora está com uma arma a menos e 4 zumbis à frente.',
        type: 'warning',
      },
      {
        title:   'Use sempre a mesma categoria de arma',
        text:    'Manutenção sobe por uso de armas do mesmo tipo (cortante, contundente, perfurante). Trocar de categoria reinicia o progresso da habilidade. Escolha uma família no início e domine-a.',
        example: 'Você usa faca (cortante) por 2 dias e seu Manutenção-cortante está em 2. Você troca para taco de beisebol (contundente). Seu Manutenção-contundente ainda está em 0. Os 2 dias foram inúteis para a nova arma.',
        type: 'info',
      },
      {
        title:   'Lança artesanal: renovável e eficaz',
        text:    'Cabo de vassoura + faca = lança artesanal. Crafteável, bom alcance, renovável mesmo com loot mínimo (vassouras existem em quase toda casa). É a arma mais sustentável quando os containers estão vazios.',
        example: 'Sua última arma de melee quebrou. Loot está em zero. Mas há vassouras em 3 das últimas 5 casas que você passou. Você crafta uma lança em 30 segundos e continua.',
        type: 'info',
      },
      {
        title:   'Machado: máximo dano por hit, use com critério',
        text:    'Melhor dano por golpe entre armas acessíveis. Ideal para eliminar zumbis resistentes com menos hits — importante quando cada swing custa stamina. Mas é pesado e consome mais stamina por uso.',
        example: 'Zumbi em condição Normal: faca leva ~5 hits para cabeça, machado leva 2–3 hits. Quando sua stamina está baixa e você precisa encerrar rápido, o machado economiza recursos.',
        type: 'info',
      },
      {
        title:   'Faca: silenciosa e rápida para stealth kills',
        text:    'Ataques de faca são silenciosos e rápidos. Use para eliminar zumbis isolados sem fazer barulho. Nunca use contra grupos — a durabilidade cai rápido e a animação de ataque é curta demais para criar distância.',
        example: 'Você vê um zumbi sozinho com as costas para você a 4 tiles de distância. Agachado, você se aproxima e ataca pela costas com a faca. Eliminado silenciosamente, sem atrair os 10 do próximo quarteirão.',
        type: 'info',
      },
      {
        title:   'Armas de fogo: nunca em área urbana',
        text:    'Com Audição Alta e raio de 250u, um único disparo em área urbana atrai tudo num raio de vários quarteirões. Reserve armas de fogo para emergências absolutas em área aberta, com carro e fuga planejada.',
        example: 'Você está cercado por 3 zumbis no centro de Muldraugh. Saca a pistola, elimina os 3. Em 60 segundos, 25 chegam de direções diferentes. O tiro "salvou" você dos 3 para matar você com os 25.',
        type: 'critical',
      },
      {
        title:   'Armas de empurrão: priorize para criar distância',
        text:    'Crowbar, lança e armas de duas mãos têm ataques de empurrão mais eficazes do que armas curtas. Com o combo Espaço→golpe como base do combate, armas que amplifam esse push são mais valiosas.',
        example: 'Faca vs. crowbar em 1v1: a faca é mais rápida mas o crowbar empurra o zumbi mais longe, criando espaço extra para o contra-ataque. No ambiente sem multi-hit, o espaço extra importa.',
        type: 'info',
      },
      {
        title:   'Carregue sempre uma arma secundária',
        text:    'Com loot mínimo, sua arma principal pode quebrar no pior momento. Uma faca como backup ou qualquer arma extra no inventário garante que você nunca fique desarmado no meio de uma limpeza.',
        example: 'Você está eliminando o último zumbi de um cômodo e sua arma principal quebra no golpe final. Sem backup, você está desarmado num prédio que pode ter mais zumbis nos quartos seguintes.',
        type: 'warning',
      },
    ],
  },

  {
    title:    'Furtividade e Mobilidade',
    icon:     'ti-eye-off',
    subtitle: 'Visão de águia · Audição alta · Raio de detecção 250 unidades',
    tips: [
      {
        title:   'Sempre agachado perto de zumbis — sem exceções',
        text:    'Em pé, seus passos são audíveis a distâncias muito maiores. Agachado, o volume cai drasticamente. Em área urbana, nunca ande em pé com zumbis no raio de visão ou audição.',
        example: 'Você avista um zumbi a 20 tiles. Se você estiver em pé, ele pode ouvir seus passos. Agachado, você pode passar a 8 tiles sem ser detectado por som — o dobro de margem de segurança.',
        type: 'critical',
      },
      {
        title:   'Lanterna à noite em área aberta = revelar posição',
        text:    'Em B42.19 com noites escuras, uma fonte de luz em espaço aberto é visível a grande distância — zumbis detectam a luz antes de te enxergar diretamente. Use lanterna somente em interiores fechados.',
        example: 'Você tenta lotar um carro à noite com sua lanterna acesa. Um zumbi a 60 tiles se orienta para a luz. Em 5 segundos, todos os zumbis naquele bloco se voltam para sua direção.',
        type: 'critical',
      },
      {
        title:   'Vegetação quebra linha de visão de Águia',
        text:    'Arbustos, mato alto e árvores densas bloqueiam a visão de zumbis mesmo com Visão de Águia. Mova-se pela vegetação em vez de ao longo de paredes quando disponível.',
        example: 'Você precisa cruzar 30 tiles de campo aberto. Há uma faixa de mato ao centro. Agachado pelo mato: invisível. Pelo campo aberto com o mesmo agachamento: visível para zumbis nos extremos.',
        type: 'warning',
      },
      {
        title:   'Chuva mascara o ruído dos seus passos',
        text:    'Dias de chuva reduzem o alcance de detecção sonora dos zumbis. São as melhores oportunidades para looting em áreas de alto risco ou para reposicionamento de base.',
        example: 'Uma rua que você evitaria em tempo seco — com 8 zumbis em linha de audição — pode ser cruzada com segurança durante chuva moderada, mesmo em pé.',
        type: 'info',
      },
      {
        title:   'De noite, zumbis enxergam menos — use a seu favor',
        text:    'A Visão de Águia dos zumbis é parcialmente reduzida no escuro. Movimentos noturnos para reposicionamento estratégico são significativamente mais seguros do que durante o dia.',
        example: 'Uma rua larga que você só cruzaria agachado e lento durante o dia pode ser cruzada agachado e moderadamente rápido à noite — os zumbis a 25 tiles de distância simplesmente não te enxergam.',
        type: 'info',
      },
      {
        title:   'Agilidade: sobe em postura de combate em qualquer lugar',
        text:    'Em B42.19, Agilidade (Nimble) sobe ao caminhar em postura de combate — pressione L-Ctrl para ativar a postura. Você não precisa de zumbis por perto. Treine durante caminhadas longas na base.',
        example: 'Você está voltando da expedição de loot, 5 minutos de caminhada de volta. Ative a postura de combate (L-Ctrl) e caminhe normalmente. Você chega em casa com XP de Agilidade grátis.',
        type: 'info',
      },
      {
        title:   'Distração ativa: pedra ou garrafa como ferramenta',
        text:    'Arremessar uma pedra ou garrafa cria um ponto de atração sonora. Use para deslocar zumbis de uma posição enquanto você passa pelo lado oposto.',
        example: 'Zumbi bloqueia a única entrada de um prédio. Você joga uma garrafa 15 tiles atrás dele. Ele se vira e caminha para o som. Você entra pelo espaço livre que ele abriu.',
        type: 'info',
      },
      {
        title:   'Nunca abra porta correndo — abra e espere',
        text:    'Abrir uma porta em velocidade máxima faz barulho e não dá tempo de ver o que está do outro lado. Abra agachado, devagar — a animação de abertura lenta é silenciosa e te dá tempo de reação.',
        example: 'Você abre um quarto correndo e há um zumbi de Fake Dead no chão que se levanta imediatamente. Você está a 1 tile de distância quando ele ataca. Abrindo devagar, você teria visto o movimento.',
        type: 'warning',
      },
      {
        title:   'Contorne grupos em vez de empurrar',
        text:    'Há sempre um caminho alternativo. 3 minutos a mais de caminhada têm custo zero. Um combate desnecessário com 4 zumbis tem custo potencial de osso quebrado, stamina gasta e barulho para a vizinhança.',
        example: 'Grupo de 6 zumbis bloqueando a rua principal. Você dá a volta pelo beco paralelo — 4 minutos a mais. Alternativa: tenta passar pelo grupo, gera barulho, atrai mais 12 do quarteirão.',
        type: 'info',
      },
    ],
  },

  {
    title:    'Recursos: Tudo é Escasso',
    icon:     'ti-package-off',
    subtitle: 'Loot 0,04 em todas as categorias · Priorize por tipo de container',
    tips: [
      {
        title:   'Cada container é uma decepção esperada',
        text:    'Com loot em 0,04 (mínimo absoluto), a maioria dos containers estará vazia. Planeje psicologicamente para isso — abre armário vazio, segue em frente. O jogo aqui é encontrar o 1 em 25.',
        example: 'Em um supermercado de tamanho médio (vanilla teria ~200 itens de comida), você vai encontrar entre 5 e 15 itens. Não é um bug, é o desafio.',
        type: 'critical',
      },
      {
        title:   'Porta-luvas e porta-malas: pools separados dos prédios',
        text:    'Os porta-luvas e porta-malas de carros têm loot independente das edificações. Ferramentas, manuais de mecânica e itens de primeira necessidade aparecem lá mesmo quando prédios estão completamente vazios.',
        example: 'Você limpou 3 casas e encontrou quase nada. Há 5 carros na rua. Verifique cada porta-luvas: um manual de mecânica aqui, uma chave de fenda ali. Essas pools menores são frequentemente ignoradas.',
        type: 'warning',
      },
      {
        title:   'Priorize tipo de container, não localização',
        text:    'Armários de banheiro → médico. Caixotes de armazém → ferramentas. Quartos → roupas e sacos. Cozinhas → comida e utensílios. Ir direto ao tipo certo economiza tempo de exposição.',
        example: 'Em uma casa de 5 cômodos, você precisa de desinfetante. Não abra cada gaveta da cozinha e sala — vá direto ao banheiro. Armário de banheiro → saia. Outros 4 cômodos ficam para o objetivo seguinte.',
        type: 'warning',
      },
      {
        title:   'Prioridade absoluta de loot',
        text:    'Em ordem: livros de habilidade → mochilas grandes → sacos de lixo → chave de fenda → desinfetante + ataduras → comida enlatada. Qualquer outro item é secundário até garantir esses.',
        example: 'Você encontra uma mochila military e uma espada katana no mesmo cômodo. Pegue a mochila. A katana ocupa espaço que agora você vai usar para todos os outros itens que vai encontrar.',
        type: 'info',
      },
      {
        title:   'Desmonte tudo que não usar',
        text:    'Móveis, eletrônicos quebrados, ferramentas em excesso: tudo pode ser desmontado em parafusos, arames, madeira e metal. Com loot mínimo, os materiais brutos são tão valiosos quanto itens craftados.',
        example: 'Uma cadeira desmontada vira 2 pranchas de madeira. Uma TV velha vira fios de cobre e parafusos. Uma fechadura quebrada vira metal. Em 5 min de desmontagem você tem material para reparos por uma semana.',
        type: 'info',
      },
      {
        title:   'Forrageamento: fonte principal quando loot está em zero',
        text:    'Com loot em 0,04, forrageamento se torna comparativamente muito mais valioso. Pratique em todo jardim, beira de floresta ou área com vegetação que cruzar.',
        example: 'Em uma semana de jogo com loot mínimo, sua comida vinda de forrageamento pode superar o que você encontrou em 30 containers de supermercado. Invista nos primeiros 5 níveis de Coleta de Plantas.',
        type: 'info',
      },
      {
        title:   'Geradores são tesouros raríssimos',
        text:    'Gerador em B42.19 tem frequência Extremamente Rara neste desafio. Se encontrar um, não o use imediatamente — planeje onde ele vai causar mais impacto (geladeira para preservar comida, luz de trabalho).',
        example: 'Você encontra um gerador no Dia 20. Antes de ligar, pense: uma geladeira pequena na base = comida fresca por semanas. Uma luz no perímetro externo = alarme visual de invasão noturna.',
        type: 'info',
      },
    ],
  },

  {
    title:    'Como Upar Cada Habilidade',
    icon:     'ti-trending-up',
    subtitle: 'XP 0,8× · Livros antes de praticar · Aprendiz Rápido recomendado',
    tips: [
      {
        title:   'Leia o livro ANTES de começar — sempre',
        text:    'Em B42.19, livros de habilidade concedem até 6× de multiplicador de XP para aquele nível da skill (não mais 16× como em B41). Os livros são reutilizáveis com cooldown. Sempre leia antes de praticar para maximizar cada ação.',
        example: 'Carpintaria nível 2: sem livro = 1 XP por prancha pregada × 0,8 = 0,8 XP. Com livro Expert (3×): 0,8 × 3 = 2,4 XP por ação. Você chega ao nível 3 em 1/3 do tempo.',
        type: 'critical',
      },
      {
        title:   'Furtividade e Leveza de Pés: XP passivo em toda exploração',
        text:    'Ambas sobem simplesmente por se mover agachado perto de zumbis sem ser detectado. É XP completamente passivo — você ganha enquanto explora normalmente.',
        example: 'Uma exploração de 30 minutos agachado em área com zumbis moderados gera XP suficiente para subir Furtividade de 0 a 1 sem nenhuma ação deliberada além de "se mover agachado".',
        type: 'info',
      },
      {
        title:   'Agilidade: postura de combate + caminhar — sem precisar de zumbis',
        text:    'Em B42.19, Agilidade sobe ao caminhar em postura de combate (L-Ctrl). Não precisa de zumbis por perto. Ative a postura em qualquer deslocamento longo dentro da base ou em área já limpa.',
        example: 'Caminhada de 5 min da base ao ponto de loot: ative L-Ctrl e caminhe normalmente. Você chega lá com XP de Agilidade acumulado sem custo adicional de tempo ou esforço.',
        type: 'info',
      },
      {
        title:   'Carpintaria (Trabalho em Madeira): desmonte primeiro, construa depois',
        text:    'Níveis 1–4: desmonte móveis em casas (camas, armários, mesas) — XP por cada peça desmontada. Níveis 5–8: construa paredes, pisos e escadas — XP maior por estrutura completa.',
        example: 'Uma casa de 4 cômodos tem ~15 móveis desmontáveis. Você passa 20 minutos desmontando tudo e sai com Carpintaria no nível 3 sem ter construído nada ainda.',
        type: 'info',
      },
      {
        title:   'Mecânica: inspecione e desmonte peças de carros',
        text:    'Inspecionar um veículo dá XP. Remover e reinstalar peças dá XP extra por peça. Cada carro encontrado é uma oportunidade de treino — mesmo que você não vá usar o carro.',
        example: 'Carro abandonado na estrada: você inspeciona (XP), remove o motor (XP), reinstala (XP), remove a roda (XP), reinstala (XP). Um único carro pode dar 5–8 ações de XP antes de você seguir em frente.',
        type: 'info',
      },
      {
        title:   'Eletricidade: desmonte eletrônicos grandes primeiro',
        text:    'Desmontagem com chave de fenda: TV e computador dão ~2,5 XP. Relógio e rádio dão ~0,5 XP. Priorize itens grandes. Em B42.19, você precisa de iluminação adequada para desmontar — não funciona no escuro.',
        example: 'Casa com 1 TV, 1 computador, 2 rádios e 3 relógios: comece pela TV (2,5 XP), computador (2,5 XP), depois rádios e relógios. Garanta que o cômodo tem luz — janela aberta de dia funciona.',
        type: 'info',
      },
      {
        title:   'Primeiros Socorros: trate tudo, mesmo o leve',
        text:    'XP por cada procedimento realizado, independente da gravidade. Pequeno arranhão: desinfete e enfaixe. Pequeno corte: aplique sutura. Cada ferimento é uma oportunidade de XP.',
        example: 'Um arranhão leve que você normalmente ignoraria: desinfetante + atadura = 2 ações de XP de Primeiros Socorros. Multiplique por 5 pequenos ferimentos por semana — você sobe para nível 3 sem ferimentos graves.',
        type: 'info',
      },
      {
        title:   'Culinária: adicione mais ingredientes a cada receita',
        text:    'XP aumenta com o número de ingredientes usados. Sopas e ensopados com 6–8 ingredientes dão mais XP do que receitas simples com 2 ingredientes.',
        example: 'Sopa básica (água + 2 legumes): ~1 XP. Sopa completa (água + 6 ingredientes variados): ~3 XP. Mesma ação, mesmo tempo, 3× o XP. Adicione tudo que tiver ao caldeirão.',
        type: 'info',
      },
      {
        title:   'Agricultura: quantidade de canteiros = XP constante',
        text:    'Cada ação de regar, adubar e colher gera XP. Quanto mais canteiros você mantiver ativos, mais XP por ciclo. Plante em quantidade desde a primeira semana.',
        example: 'Dois canteiros: você rega dois, colhe dois por ciclo. Dez canteiros: você rega dez, colhe dez. Com o mesmo tempo por ação, 10 canteiros geram 5× mais XP de Agricultura por sessão.',
        type: 'info',
      },
      {
        title:   'Pesca: comece no Dia 1, não espere ter fome',
        text:    'B42.19 impõe penalidade no inverno para pesca de baixo nível. Você precisa de nível 4 para pescar consistentemente no frio, e 6–7 para ser fonte primária de alimento. Pescar cedo é essencial.',
        example: 'Se você começa a pescar no Dia 30, vai chegar ao inverno ainda no nível 2–3. Pescas em temperatura negativa com nível baixo: 1 peixe a cada 15 tentativas. Comece a pescar no Dia 3.',
        type: 'warning',
      },
      {
        title:   'Manutenção: use, conserte, repita na mesma categoria',
        text:    'XP de Manutenção vem do uso de armas do mesmo tipo. Deixe a arma chegar a condição Baixa, conserte, use novamente até Baixa. Esse ciclo gera XP de Manutenção e treina a arma simultaneamente.',
        example: 'Faca (cortante): use até Baixo (40% condição) → conserte com kit de costura ou palito + trapos → use novamente até Baixo. Em 3 ciclos você já está em Manutenção nível 2 para cortantes.',
        type: 'info',
      },
      {
        title:   'Nunca espalhe XP — concentre em 2–3 habilidades',
        text:    'Com 0,8× de XP global, tentar subir todas as habilidades ao mesmo tempo resulta em nenhuma estar no nível útil quando você precisar. Defina 3 habilidades prioritárias e maximize antes das outras.',
        example: 'Semana 1: foque em Furtividade, Leveza de Pés e Agilidade (passivos). Semana 2: adicione Carpintaria para construção de base. Semana 3: Mecânica para hotwire (se não for Ladrão). Ordem importa.',
        type: 'warning',
      },
    ],
  },

  {
    title:    'Sem Energia, Sem Água',
    icon:     'ti-bolt-off',
    subtitle: 'Desligamento instantâneo · Barris de chuva · Pipe Wrench para encanamento',
    tips: [
      {
        title:   'Barril de chuva: construa antes da primeira semana',
        text:    'Em B42.19, o Barril de Chuva está no menu de Construção (tecla B → Trabalho em Madeira → Externas), não no menu de crafting. Requer Carpintaria nível 4 (ou 3 para a versão menor) + 4 pranchas + 4 pregos + 4 sacos de lixo + martelo.',
        example: 'Dia 3: você tem Carpintaria 2. Prioridade: lotar casas por 2 dias, desmontar móveis (Carpintaria → 4), encontrar sacos de lixo, construir o barril antes da primeira semana acabar.',
        type: 'critical',
      },
      {
        title:   'Sacos de lixo são críticos do Dia 1',
        text:    'Necessários para o barril de chuva, mas com loot em 0,04, são raros. Procure-os em: cozinhas, área de serviço, banheiros de prédios comerciais. Encontrar 4 no Dia 1 é objetivo concreto.',
        example: 'Você passa 3 horas lootando e encontra apenas 2 sacos de lixo. Você prioriza lixeiras e containers de lixo externos — esqueceu que cozinhas e áreas de serviço são as melhores fontes.',
        type: 'warning',
      },
      {
        title:   'Água do barril é contaminada: sempre ferva para beber',
        text:    'Água coletada em barris de chuva é tainted (contaminada). Beber diretamente causa doença. Ferva em qualquer fonte de calor antes de consumir. Pode ser usada diretamente para regar plantas e limpar feridas.',
        example: 'Você tem sede, o barril está cheio e sua panela está longe. Bebe direto — 10 segundos de "conveniência". 6 horas de jogo depois você está com diarreia severa perdendo água mais rápido do que enche o barril.',
        type: 'warning',
      },
      {
        title:   'Encanamento: barril acima da pia + Pipe Wrench',
        text:    'Com uma Chave Hidráulica (Pipe Wrench — não qualquer chave), clique com botão direito em uma pia para conectar ao barril posicionado acima dela. Restaura a torneira com água (contaminada) sem eletricidade.',
        example: 'Base no andar de cima: coloque o barril no teto acima da cozinha. Use a Pipe Wrench na pia da cozinha → conectar ao barril. Agora você tem "torneira" funcionando na base sem luz elétrica.',
        type: 'info',
      },
      {
        title:   'Cozinhe em fogueira, churrasqueira ou fogão a lenha',
        text:    'Fogões elétricos não funcionam sem eletricidade. Fogueiras (crafteáveis) e churrasqueiras (comuns em quintais) são suas cozinhas. Fogão a lenha em casas mais antigas também funciona sem energia.',
        example: 'Você encontrou um monte de comida crua perecível. Sem fogão elétrico funcionando, você acende uma fogueira no quintal da casa-base e cozinha tudo de uma vez antes que estrague.',
        type: 'info',
      },
      {
        title:   'Gerador: planeje antes de usar',
        text:    'Geradores são Extremamente Raros neste desafio. Antes de usar, decida o destino: geladeira pequena (preserva comida), luz de segurança perimetral (detecta zumbis à noite), ou bancada elétrica (crafting).',
        example: 'Você encontra um gerador no Dia 25. Sem planejar, liga em tudo. Combustível acaba em 2 dias. Planejado: liga apenas na geladeira, 12h/dia. O mesmo combustível dura 10 dias de preservação de comida.',
        type: 'info',
      },
      {
        title:   'Alimentos apodrecem rápido sem refrigeração',
        text:    'Sem geladeira ou freezer funcionando, alimentos frescos apodrecem no ritmo normal do jogo (acelerado em temperatura quente). Consuma imediatamente após coletar ou preserve com sal/vinagre.',
        example: 'Você encontra 10 tomates frescos. Temperatura está quente. Sem conservação: 2–3 dias de jogo antes de estragar. Com panela de conserva (sal): duram semanas. Não guarde fresco sem plano.',
        type: 'warning',
      },
    ],
  },

  {
    title:    'Saúde e Ferimentos',
    icon:     'ti-first-aid-kit',
    subtitle: 'Fraturas ativas · Sem kit inicial · Desinfecte tudo · Fake Dead em combate',
    tips: [
      {
        title:   'Comece sem nada: desinfetante e atadura são Dia 1',
        text:    'Sem kit inicial, você começa com zero materiais médicos. Antes de entrar em qualquer confronto, você precisa de no mínimo desinfetante e ataduras. Sem isso, um arranhão pode matar por infecção.',
        example: 'Você encontra zumbis no Dia 1 antes de achar um kit médico. Um arranhão simples: sem desinfetante, a ferida infecciona em ~24h de jogo. Você morre de febre no Dia 3.',
        type: 'critical',
      },
      {
        title:   'Desinfecte imediatamente qualquer ferimento',
        text:    'Cada ferimento não desinfetado em tempo tem chance crescente de infeccionar. Com loot médico em 0,04, cada unidade de desinfetante é preciosa — mas usá-la no ferimento errado custa menos do que uma infecção sistêmica.',
        example: 'Arranhão leve: você pensa "vou desinfetante depois". 6 horas de jogo passam. O ferimento está vermelho. Mais 6h: febre. Mais 6h: você está tão debilitado que não consegue correr. Um ferimento simples vira sentença.',
        type: 'critical',
      },
      {
        title:   'Fraturas: use escadas, nunca pule de altura',
        text:    'Com fraturas ativas e força super-humana dos zumbis, uma fratura pode surgir de: queda de 2+ andares, colisão de carro, ou um único hit de zumbi. Escadas são obrigatórias — pular janelas é roleta russa.',
        example: 'Você está no 2º andar de um prédio com zumbis subindo. A janela está a 1 andar de altura. Parece seguro pular. Fratura no tornozelo: você atterissa, ouve o estalo, e agora tenta fugir mancando dos zumbis que chegaram.',
        type: 'critical',
      },
      {
        title:   'Imobilize fraturas antes de continuar',
        text:    'Uma fratura não tratada causa dor constante, penalidade progressiva de movimento e redução de capacidade de carregamento. Imobilize com tala (plank/stick + rasgos de pano) o mais rápido possível.',
        example: 'Fratura no braço não tratada por 2 dias de jogo: você carrega 50% do peso máximo, sofre dor contínua que piora o moral, e qualquer combate é drasticamente mais difícil. 30 segundos de crafting de tala previnem dias de penalidade.',
        type: 'warning',
      },
      {
        title:   'Verifique a área antes de se curar',
        text:    'Com Fake Dead Total ativo, zumbis que parecem mortos podem se levantar enquanto você está parado aplicando ataduras. Limpe toda a área visivelmente antes de parar para tratamento.',
        example: 'Você entra em um cômodo, vê 2 "corpos" no chão e começa a se curar. Um se levanta silenciosamente enquanto você está com a animação de curativo. Você está a 1 tile de distância e não pode reagir a tempo.',
        type: 'warning',
      },
      {
        title:   'Humor afeta a taxa de aprendizado',
        text:    'Um personagem com moral baixa (com dor, estressado, com fome ou entediado) aprende todas as habilidades mais devagar. Com XP em 0,8× já penalizado, manter o moral alto é parte da estratégia de progressão.',
        example: 'Você passa 3 dias sem comer direito, com dor de fratura e sem dormir. Seu XP de Carpintaria nessa janela é ~60% do normal. Os mesmos 3 dias com moral alto valeriam 40% mais experiência.',
        type: 'info',
      },
      {
        title:   'Habilidade Primeiros Socorros reduz o gasto de material',
        text:    'Com nível alto, cada procedimento usa menos material e tem mais eficácia. Com material médico escasso, a diferença entre Primeiros Socorros 1 e 5 pode ser a diferença entre ter e não ter suprimentos para a próxima emergência.',
        example: 'Primeiros Socorros 1: 3 unidades de atadura para um ferimento grave. Primeiros Socorros 5: 1 unidade para o mesmo ferimento. Com loot médico mínimo, você 3× sua reserva efetiva.',
        type: 'info',
      },
    ],
  },

  {
    title:    'Noites, Frio e Ambiente',
    icon:     'ti-moon',
    subtitle: 'Noites escuras · Temperatura fria · Chuva seca · Helicóptero: uma vez',
    tips: [
      {
        title:   'Durma à noite — o risco supera a recompensa',
        text:    'Com noites escuras e zumbis de Visão de Águia, movimentação noturna tem custo muito alto. Dormir passa o tempo, restaura stamina, melhora moral (bônus de XP) e evita o período de maior risco.',
        example: 'Noite 5: você decide explorar um bairro com sua lanterna. 20 min depois, uma horda atraída pela luz encurrala você num beco. Alternativa: você dorme, acorda com saúde restaurada e explore de manhã com luz natural.',
        type: 'warning',
      },
      {
        title:   'Olhos de Gato: funciona em noites claras, não em escuridão total',
        text:    'Em B42.19, o traço Olhos de Gato funciona em noites abertas com lua. Em porões, cômodos sem janelas ou noites sem lua, o ambiente é pitch-black e o traço não ajuda. Tenha sempre uma vela de backup.',
        example: 'Com lua crescente você se move pela periferia sem lanterna — visível por 6–8 tiles. Você entra em um porão sem janelas: escuridão absoluta, Olhos de Gato sem efeito. Você precisa da lanterna mas está em espaço fechado — aí é seguro usá-la.',
        type: 'info',
      },
      {
        title:   'Temperatura fria: troque roupas molhadas imediatamente',
        text:    'O clima é frio no desafio. Roupas encharcadas (por chuva ou por nadar) aumentam drasticamente a perda de temperatura corporal. Hipotermia causa debuff severo de movimento e resistência.',
        example: 'Você cruza uma chuva moderada sem proteção por 10 minutos de jogo. Suas roupas ficam molhadas. Se você não trocar em 15–20 min: temperatura corporal cai, tremores começam, velocidade reduzida. Troque antes de sintomas.',
        type: 'warning',
      },
      {
        title:   'Helicóptero acontece uma vez: esconda-se imediatamente',
        text:    'O evento de helicóptero ocorre uma única vez. Quando você ouvir o barulho, abandone qualquer atividade e encontre cobertura interior imediatamente. O helicóptero atrai hordas em direção ao seu ponto de presença.',
        example: 'Você está lootando um supermercado e ouve o helicóptero. Você continua por "mais 5 minutos". Quando sai, há 40 zumbis do bairro inteiro convergindo para o prédio onde você estava. Helicóptero = pare tudo.',
        type: 'warning',
      },
      {
        title:   'Chuva é seca mas ocorre: sempre tenha barril posicionado',
        text:    'O clima do desafio é seco mas chuva acontece. Cada episódio de chuva é oportunidade de coleta de água. Posicione barris ao ar livre antes da primeira chuva — você não sabe quando a próxima vem.',
        example: 'Seu barril está dentro do celeiro por proteção. Começa a chover. Você perde toda aquela chuva porque o barril não está exposto. Barril sempre ao ar livre, coleta de água é automática.',
        type: 'info',
      },
      {
        title:   'Eventos aleatórios: mantenha rota de evacuação ativa',
        text:    'Eventos Meta (sirenes, alarmes de carro, outros) ocorrem "Algumas Vezes" neste desafio. Qualquer evento gera atração de hordas. Sua base deve ter sempre saída de emergência desbloqueada e pronta.',
        example: 'Uma sirene de carro dispara no bairro vizinho às 2h da manhã de jogo. Zumbis daquela área migram para sua zona. Se sua única saída estava barricada "para segurança", você está preso.',
        type: 'info',
      },
    ],
  },

  {
    title:    'Veículos: Use com Sabedoria',
    icon:     'ti-car',
    subtitle: 'Quase todos trancados · Condição muito baixa · Hotwire = alarme possível',
    tips: [
      {
        title:   'Quase todos os carros estão trancados',
        text:    'Frequência de veículos trancados: Muito Frequente. Sem a ocupação Ladrão, você precisará de Elétrica 1 + Mecânica 2 para hotwire — skills que levam semanas para desenvolver neste desafio.',
        example: 'Dia 5, você precisar fugir de uma horda. O único carro por perto está trancado. Sem Ladrão e sem os níveis de skill necessários, você corre a pé. A horda é 8× mais densa que o normal. Suas opções são bem piores.',
        type: 'critical',
      },
      {
        title:   'Alarme de carro dispara no hotwire, não ao entrar',
        text:    'Em B42.19, quebrar a janela para entrar em um carro NÃO dispara o alarme. O alarme tem chance de disparar durante a tentativa de hotwire. Nível mais alto de Elétrica reduz essa chance.',
        example: 'Você quebra o vidro do carro (silencioso o suficiente), entra, e começa o hotwire. O alarme dispara durante o processo. Você tem ~10 segundos para ligar o motor e sair antes que a horda chegue.',
        type: 'warning',
      },
      {
        title:   'Condição muito baixa: inspecione antes de depender',
        text:    'A condição geral dos veículos é Muito Baixa. Motor, pneus e freios podem estar críticos. Nunca planeje uma fuga usando um carro que você não inspecionou — ele pode apagar no meio da rota.',
        example: 'Você encontra um carro, entra, arranca. Motor em 15% de condição. Você dirige por 2 quarteirões, o motor fuma e apaga no meio da rua principal cercada de zumbis. Teria levado 20 segundos inspecionar antes.',
        type: 'warning',
      },
      {
        title:   'Gasolina muito baixa: sempre com galão reserva',
        text:    'Os veículos começam com gasolina Muito Baixa e a disponibilidade de postos é Baixa. Nunca saia sem verificar o nível do tanque e sem ao menos 1 galão de gasolina extra no porta-malas.',
        example: 'Expedição de loot: você dirige 10 min para o outro lado da cidade. Na volta, o tanque beira zero. Você empurra o carro a pé pelos últimos 3 quarteirões com uma horda de 8× atrás de você.',
        type: 'critical',
      },
      {
        title:   'Acidentes causam dano a você e ao carro (fraturas!)',
        text:    'Com fraturas ativas, uma colisão de carro — mesmo em velocidade moderada — pode quebrar ossos. E o carro já em condição precária vai piorar. Dirija devagar em áreas com obstáculos.',
        example: 'Você acelera para escapar de uma horda e bate em outro carro estacionado a 50 km/h. Som de fratura. Seu braço quebrou. O motor do seu carro caiu de 40% para 20% de condição. Você está machucado com um carro ainda mais crítico.',
        type: 'warning',
      },
      {
        title:   'Motores ligados atraem zumbis: desligue na base',
        text:    'Um motor ligado gera ruído contínuo. Deixar o carro ligado enquanto você está parado ou lootando nas proximidades vai acumulando atenção de zumbis mesmo distantes.',
        example: 'Você para em frente de uma casa para lotar, deixa o motor ligado "para saída rápida". Em 5 min de loot, 8 zumbis de ruas adjacentes já se aproximaram da fonte de som. Você sai para o carro rodeado.',
        type: 'info',
      },
      {
        title:   'Use carros como barricadas em rotas de acesso',
        text:    'Carros abandonados podem ser empurrados (lentamente) para bloquear estradas e entradas. Zumbis não conseguem mover veículos. Uma estrada bloqueada canaliza zumbis para os pontos que você quer controlar.',
        example: 'Sua base tem 2 rotas de acesso. Você empurra um carro danificado para bloquear a rota menor. Agora zumbis migrantes só chegam pela rota principal — onde você tem visibilidade e preparação.',
        type: 'info',
      },
    ],
  },

  {
    title:    'Defesa e Construção de Base',
    icon:     'ti-shield-lock',
    subtitle: 'Localização rural · Múltiplas camadas · Estratégia do 2º andar',
    tips: [
      {
        title:   'Base rural é obrigação, não opção',
        text:    'Com 8× de população desde o Dia 1, qualquer base urbana vai ser constantemente pressionada. Áreas rurais — fazendas, casas de lago, bordas de mapa — têm densidade muito menor e permitem controle de perímetro.',
        example: 'Base no centro de Muldraugh: ~30 zumbis no raio de 50 tiles, cada barulho atrai dezenas. Base em fazenda a 200 tiles da cidade: ~5 zumbis visíveis, 500 metros de área aberta como buffer.',
        type: 'critical',
      },
      {
        title:   'Acesso a água não é opcional na escolha de base',
        text:    'Sem eletricidade desde o Dia 1, você depende de barris de chuva (chuva seca) e fontes naturais. Escolha base com lago, rio ou riacho a menos de 200 tiles. Barris sozinhos são insuficientes no longo prazo.',
        example: 'Você escolheu uma fazenda perfeita em todos os aspectos — mas fica a 500 tiles de qualquer água. Após 2 semanas, suas reservas acabam. Você passa a fazer expedições longas de água enquanto sua base fica desprotegida.',
        type: 'warning',
      },
      {
        title:   'Zumbis abrem portas: tranque e barricade tudo',
        text:    'Com Cognição Avançada, uma porta fechada é apenas um atraso de segundos. Trancada: atraso de minutos. Trancada + barricadada com tábuas: horas. Cada camada a mais multiplica o tempo de resposta.',
        example: 'Porta da frente: trancada (60 segundos para zumbi derrubar) + 4 tábuas (+ 4 min) + 4 tábuas no lado de dentro (+ 4 min) = 9 minutos de buffer. Tempo suficiente para você escapar pelo 2º andar.',
        type: 'warning',
      },
      {
        title:   'Estratégia do 2º andar: a defesa mais segura',
        text:    'Construa uma escada interna, estabeleça toda a base no 2º andar, e DESMONTE a escada. Coloque corda de lençol pela janela. Zumbis não sobem cordas — você tem cobertura vertical total.',
        example: 'Horda de 20 zumbis bate na sua base. No térreo, 10 minutos até quebrarem tudo. No 2º andar sem escada: eles ficam embaixo para sempre. Você observa de cima, vai dormir, e de manhã eles ainda estão lá esperando.',
        type: 'info',
      },
      {
        title:   'Corda de lençol: queda possível em B42.19',
        text:    'Em B42.19, cordas de lençol muito longas têm chance de fazer o jogador cair (nova mecânica). Um toggle de sandbox pode desabilitar esse risco. Confirme se está ativado ou use cordas de 1–2 andares para minimizar risco de queda.',
        example: 'Base no 3º andar com corda de 3 andares: cada descida tem chance de queda — possível fratura na chegada. Base no 2º andar com corda de 1 andar: risco mínimo de queda, mais seguro na prática.',
        type: 'info',
      },
      {
        title:   'Duplo perímetro com cercas: afunile os atacantes',
        text:    'Cerca metálica externa + parede de madeira interna cria duas barreiras independentes. Zumbis que quebram a cerca precisam ainda derrubar a parede — tempo extra e alerta sonoro para você.',
        example: 'Horda aproxima-se: quebra a cerca externa em 5 min (barulho audível, você é alertado). Parede de madeira interna: mais 10 min. Você tem 15 min de aviso para reagir, evacuação ou contramedidas.',
        type: 'info',
      },
      {
        title:   'Corredores de morte: canalizar em fila única',
        text:    'Construa passagens estreitas (1 tile de largura) com barricadas nas laterais. Zumbis só conseguem entrar em fila única — você enfrenta 1 de cada vez independente de quantos estão do outro lado.',
        example: 'Portão de entrada: sem funil = 3 zumbis lado a lado pressionando ao mesmo tempo. Com funil de 1 tile = o primeiro entra, você elimina, o segundo entra, você elimina. A horda de 20 vira fila de espera.',
        type: 'info',
      },
      {
        title:   'Nunca se tranche sem saída alternativa',
        text:    'Toda base deve ter no mínimo duas saídas de emergência sempre desbloqueadas e praticáveis. Barricar a única saída "para mais segurança" transforma sua base em uma armadilha.',
        example: 'Horda quebra a parede norte (sua única saída). Você está armadilhado. Com uma saída emergência sul (corda de lençol, janela, portão lateral), você sai e reagrupa.',
        type: 'critical',
      },
      {
        title:   'Revise barricadas: fator 1,3× de dano de cerca',
        text:    'O desafio tem fator de dano de cerca em 1,3×, acima do padrão. Cercas e barricadas degradam mais rápido que o esperado. Faça inspeção visual do perímetro a cada 3–4 dias de jogo.',
        example: 'Você construiu sua cerca no Dia 5 e não revisou. No Dia 12, uma seção que passou despercebida está em 10% de durabilidade. Uma horda moderada a quebra facilmente. Revisão preventiva evita surpresas.',
        type: 'warning',
      },
      {
        title:   'Não construa perto de estradas movimentadas',
        text:    'Carros abandonados em estradas são pontos de atração de zumbis migrantes. Uma base próxima a uma estrada principal fica constantemente recebendo zumbis atraídos pelos veículos estacionados.',
        example: 'Base 30 tiles da rodovia principal: a cada ciclo de migração de 48h, novos zumbis da rodovia aparecem na sua borda de perímetro. Base em estrada secundária: esse fluxo é negligível.',
        type: 'info',
      },
    ],
  },

  {
    title:    'Alimentação Sustentável',
    icon:     'ti-wheat',
    subtitle: 'Agricultura essencial · Armadilhas com distância · Preservação',
    tips: [
      {
        title:   'Plante na primeira semana: agricultura é a única sustentabilidade',
        text:    'Sem agricultura, você depende de loot em 0,04 — completamente insustentável no longo prazo. A primeira semana deve incluir: encontrar sementes, preparar canteiros e plantar pelo menos 6–10 plantas.',
        example: 'Dia 7 sem agricultura plantada: você ainda tem comida enlatada de loot. Dia 21: enlatados acabaram. Você começa a agricultura agora — mas uma plantação de 10 itens leva 2 semanas para produzir. Você passa fome enquanto espera.',
        type: 'critical',
      },
      {
        title:   'Repolho: a melhor primeira plantação',
        text:    'Alta quantidade por colheita, cresce em múltiplas estações (incluindo inverno leve), e as sementes são relativamente comuns. É o consensus da comunidade para primeira plantação em runs difíceis.',
        example: '10 canteiros de repolho produzem em média 30–40 repolhos por colheita. Comparado com tomate (que apodrece rápido e é mais sensível) ou milho (que só cresce no verão), repolho é o mais versátil.',
        type: 'info',
      },
      {
        title:   'Armadilhas: 75+ tiles de distância e período noturno',
        text:    'Armadilhas só disparam quando o jogador está a mais de 75 tiles de distância. Coelhos e esquilos só estão ativos das 19h às 5h. Posicione à noite e afaste-se antes de dormir.',
        example: 'Você coloca 5 armadilhas no bosque ao lado da base e dorme a 80 tiles. De manhã: 2 coelhos. Se você tivesse dormido a 40 tiles: 0 capturas. A distância mínima não é sugestão — é mecânica do jogo.',
        type: 'info',
      },
      {
        title:   'Preserve alimentos: sal, vinagre e conservas',
        text:    'Sem refrigeração, alimentos frescos apodrecem rapidamente em temperatura quente. Preserve com sal (faz carne salgada) ou vinagre (faz conservas) para extensão significativa da vida útil.',
        example: 'Carne fresca sem preservação: 2–3 dias de jogo. Carne salgada: semanas. Se você caça ou encontra carne fresca, a primeira ação é preservar — nunca guardar fresco na esperança de comer antes de estragar.',
        type: 'warning',
      },
      {
        title:   'Pesca: comece cedo, nível 4 é o mínimo de inverno',
        text:    'B42.19 impõe penalidade de ~20% nas capturas durante o inverno. Nível 4 é o mínimo para pescar com consistência no frio. Nível 6–7 para ser fonte primária de proteína. Comece desde o Dia 1.',
        example: 'Verão, Pesca 2: 1 peixe a cada 3 tentativas. Inverno, Pesca 2: 1 peixe a cada 7–8 tentativas. Inverno, Pesca 5: 1 a cada 2–3 tentativas. O delta entre nível 2 e 5 é enorme quando você mais precisa.',
        type: 'warning',
      },
      {
        title:   'Culinária converte ingredientes básicos em mais nutrição',
        text:    'Cozinhar aumenta o valor nutricional dos alimentos. Uma refeição cozinhada satisfaz mais fome do que os mesmos ingredientes crus. Com comida escassa, extrair mais nutrição de cada item é vital.',
        example: 'Repolho cru: satisfaz ~10 unidades de fome. Repolho cozido em sopa com 4 outros ingredientes: satisfaz ~25 unidades totais. Os mesmos ingredientes, mais eficientes quando combinados e cozinhados.',
        type: 'info',
      },
      {
        title:   'Animais são Extremamente Raros: não planeje para isso',
        text:    'A frequência de animais de fazenda é Extremamente Rara neste desafio. Não inclua criação de gado na sua estratégia de alimentação para as primeiras semanas ou meses. Se encontrar, é um bônus — não um plano.',
        example: 'Você passa 2 semanas procurando galinhas para uma granja de ovos. Você poderia ter usado esse tempo para desenvolver 3 canteiros de agricultura. Foque no que você controla.',
        type: 'info',
      },
    ],
  },

  {
    title:    'Estratégia de Longo Prazo',
    icon:     'ti-calendar',
    subtitle: 'Sem respawn · Atrite territorial · Queime corpos · Mini-mapa ativo',
    tips: [
      {
        title:   'Zumbis não reaparecem: cada morte é permanente',
        text:    'RespawnHours = 0. Todo zumbi eliminado fica eliminado para sempre. O mapa fica progressivamente mais seguro com o tempo. Essa é a principal diferença estratégica deste desafio versus runs vanilla.',
        example: 'Depois de 3 semanas limpando sistematicamente seu bairro base, você pode lotar as mesmas casas sem encontrar nenhum zumbi. O que foi perigoso no Dia 1 é uma zona segura no Dia 30.',
        type: 'info',
      },
      {
        title:   'Estratégia de anel: limpe de fora para dentro',
        text:    'Comece pela periferia mais distante da sua base e avance em anéis concêntricos em direção ao centro. Cada anel limpo protege o anterior e aumenta sua zona segura progressivamente.',
        example: 'Base no km 5 da rodovia. Semana 1: limpe até o km 4 (1 km ao redor). Semana 2: km 3 (2 km de zona segura). Mês 2: você tem 5 km de zona segura em todas as direções. A cidade começa a parecer possível.',
        type: 'info',
      },
      {
        title:   'Queime corpos: previne Fake Dead e doenças',
        text:    'Corpos de zumbis em quantidade acumulada aumentam risco de doenças e, com Fake Dead Total, são pontos de ambush permanentes. Queimar em campo aberto (longe de estruturas) elimina ambos os riscos.',
        example: 'Você limpa um bairro mas deixa 50 corpos no chão. 3 dias depois, você volta ao mesmo bairro: 5 corpos são Fake Dead que "ressuscitaram". Além disso, o acúmulo começa a gerar eventos de doença.',
        type: 'warning',
      },
      {
        title:   'Mini-mapa disponível: marque tudo enquanto explora',
        text:    'O mini-mapa está habilitado neste desafio. Use ativamente: marque recursos encontrados, pontos de horda observados, rotas seguras confirmadas e zonas de perigo. O mapa anotado é um recurso que cresce com você.',
        example: 'Semana 1 sem anotações: você revisita uma casa vazia que já explorou sem saber. Semana 1 com mapa anotado: você sabe quais 8 casas já lootou, quais tinham loot útil, e qual rua tinha densidade alta de zumbis.',
        type: 'info',
      },
      {
        title:   'Migração de 48h: suas zonas podem receber reforços',
        text:    'A cada 48 horas, grupos de zumbis se redistribuem entre zonas. Áreas que você limpou podem receber migrantes de zonas adjacentes ainda populosas. Não abandone a vigilância de um bairro limpo.',
        example: 'Bairro A limpo (Dia 10). Bairro B adjacente ainda tem 200 zumbis (Dia 10). Dia 12: redistribuição. 30 zumbis do Bairro B migraram para o A. Não é bug — é mecânica. Continue monitorando.',
        type: 'warning',
      },
      {
        title:   'Porões: frequência alta, mas espaço fechado perigoso',
        text:    'Porões têm frequência Muito Alta neste desafio e podem conter loot valioso. Mas são espaços completamente fechados — sem saída fácil e com Fake Dead Total, são ambushes prontos. Entre sempre com cautela máxima.',
        example: 'Você entra em um porão com lanterna. Há 3 "corpos" no chão. Você lota um armário. Dois se levantam simultaneamente. No porão, não há espaço para criar distância de combate.',
        type: 'warning',
      },
      {
        title:   'Estabeleça múltiplos pontos de suprimentos',
        text:    'Após semanas limpando, crie depósitos secundários em pontos estratégicos. Nunca dependa de um único local para nenhum recurso crítico — incêndio, horda surpresa ou acidente pode cortar o acesso.',
        example: 'Toda sua comida está na base principal. Uma horda de migração breaches o perímetro e você precisa evacuar por dias. Sem ponto secundário de suprimentos, você sai com o que está no inventário.',
        type: 'info',
      },
      {
        title:   'Fogo para limpeza em massa: planeje o vento e a zona',
        text:    'Incêndio é a ferramenta mais eficiente para limpar grandes concentrações de zumbis. Mas deve ser planejado: vento leva as chamas, estruturas pegam fogo, loot queima. Use somente em campo aberto.',
        example: 'Você quer limpar uma rua com 80 zumbis. Você ateia fogo em um carro no meio da rua com vento soprando para longe da sua base. Os zumbis atraídos pelo fogo entram na área de chamas. Em 10 minutos, 60 eliminados.',
        type: 'info',
      },
    ],
  },
];

type FilterType = 'all' | TipType;

const TYPE_ICON: Record<TipType, string> = {
  critical: 'ti-alert-triangle',
  warning:  'ti-alert-circle',
  info:     'ti-info-circle',
};

const TYPE_LABEL: Record<TipType, string> = {
  critical: 'Crítico',
  warning:  'Atenção',
  info:     'Dica',
};

const FILTER_LABEL: Record<FilterType, string> = {
  all:      'Todos',
  ...TYPE_LABEL,
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
      if (isSearching) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.text.toLowerCase().includes(q) || (t.example ?? '').toLowerCase().includes(q);
      }
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
      <header className="tips-header">
        <div className="tips-header-inner">
          <Link to="/" className="tips-back-link">
            <i className="ti ti-arrow-left" />
            <span>Início</span>
          </Link>
          <div className="tips-header-title-block">
            <p className="tips-eyebrow">DESAFIO BRASILEIRÃO PZ · BUILD 42.19</p>
            <h1 className="tips-title">GUIA DE SOBREVIVÊNCIA</h1>
            <p className="tips-meta">
              <span>{TIP_GROUPS.length} CATEGORIAS</span>
              <span className="tips-meta-sep">·</span>
              <span>{totalTips} DICAS</span>
              <span className="tips-meta-sep">·</span>
              <span>100% B42 VERIFICADO</span>
            </p>
          </div>
        </div>
      </header>

      <div className="tips-layout">
        <nav className="tips-sidebar" aria-label="Categorias">
          <div className="tips-sidebar-search-wrap">
            <i className="ti ti-search tips-search-ico" />
            <input
              className="tips-sidebar-search"
              placeholder="Buscar dica..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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

        <main className="tips-main" ref={mainRef}>
          {!isSearching && (
            <div className="tips-cat-header">
              <div className="tips-cat-icon-wrap">
                <i className={`ti ${activeGroup.icon}`} />
              </div>
              <div className="tips-cat-text">
                <h2 className="tips-cat-title">{activeGroup.title}</h2>
                <p className="tips-cat-sub">{activeGroup.subtitle}</p>
              </div>
              <div className="tips-cat-counts">
                {typeCounts.critical > 0 && (
                  <span className="tips-cat-count tips-cat-count--critical">
                    <i className="ti ti-alert-triangle" /> {typeCounts.critical}
                  </span>
                )}
                {typeCounts.warning > 0 && (
                  <span className="tips-cat-count tips-cat-count--warning">
                    <i className="ti ti-alert-circle" /> {typeCounts.warning}
                  </span>
                )}
                {typeCounts.info > 0 && (
                  <span className="tips-cat-count tips-cat-count--info">
                    <i className="ti ti-info-circle" /> {typeCounts.info}
                  </span>
                )}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="tips-search-result-header">
              <i className="ti ti-search" />
              <span>
                Resultados para <strong>"{search}"</strong>
                {' '}— {displayGroups.reduce((s, g) => s + g.tips.length, 0)} dicas
              </span>
            </div>
          )}

          {!isSearching && (
            <div className="tips-filter-bar">
              {(['all', 'critical', 'warning', 'info'] as FilterType[]).map(t => {
                const count = t === 'all' ? activeGroup.tips.length : typeCounts[t as TipType];
                if (t !== 'all' && count === 0) return null;
                return (
                  <button
                    key={t}
                    className={`tips-filter-btn tips-filter-${t}${filter === t ? ' is-active' : ''}`}
                    onClick={() => setFilter(t)}
                  >
                    {t !== 'all' && <i className={`ti ${TYPE_ICON[t as TipType]}`} />}
                    {FILTER_LABEL[t]}
                    <span className="tips-filter-count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

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
                    <li key={ti} className={`tip-card tip-card--${type}`}>
                      <div className="tip-card-head">
                        <span className={`tip-type-badge tip-type-badge--${type}`}>
                          <i className={`ti ${TYPE_ICON[type]}`} />
                          {TYPE_LABEL[type]}
                        </span>
                        <h3 className="tip-card-title">{tip.title}</h3>
                      </div>
                      <p className="tip-card-body">{tip.text}</p>
                      {tip.example && (
                        <div className="tip-card-example">
                          <span className="tip-example-label">EXEMPLO PRÁTICO</span>
                          <p>{tip.example}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

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
