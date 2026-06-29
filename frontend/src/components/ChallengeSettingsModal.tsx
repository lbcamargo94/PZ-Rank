import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

const SETTINGS_GROUPS = [
  {
    title: 'Tempo e Hora',
    icon: 'ti-clock',
    rows: [
      { label: 'Duração do dia',                   value: '1 Hora e 30 Minutos' },
      { label: 'Meses desde o Apocalipse',          value: '0' },
      { label: 'Mês de início',                     value: 'Julho' },
      { label: 'Dia de início',                     value: '9' },
      { label: 'Hora de início',                    value: '09:00' },
    ],
  },
  {
    title: 'Zumbis — Geral',
    icon: 'ti-users',
    rows: [
      { label: 'Quantidade',                        value: 'Normal' },
      { label: 'Distribuição',                      value: 'Foco Urbano' },
      { label: 'Ruído de Voronoi',                  value: 'Sim' },
      { label: 'Intervalo de respawn',              value: 'Nenhum' },
      { label: 'Migração zumbi',                    value: 'Sim' },
    ],
  },
  {
    title: 'Zumbis — Comportamento',
    icon: 'ti-brain',
    rows: [
      { label: 'Velocidade',                        value: 'Aleatório (0% corredores)' },
      { label: 'Força',                             value: 'Super-humano' },
      { label: 'Resistência',                       value: 'Resistente' },
      { label: 'Transmissão de infecção',           value: 'Sangue + Saliva' },
      { label: 'Mortalidade da infecção',           value: '2–3 Dias' },
      { label: 'Tempo de reanimação',               value: '0–1 Minutos' },
      { label: 'Percepção',                         value: 'Avançado (usa portas)' },
      { label: 'Abertura aleatória de portas',      value: '0 (Nenhum)' },
      { label: 'Rastejantes em veículos',           value: 'Frequentemente' },
      { label: 'Memória',                           value: 'Longo' },
      { label: 'Visão',                             value: 'Olhos de Águia' },
      { label: 'Audição',                           value: 'Alta' },
      { label: 'Novo sistema de furtividade',       value: 'Sim' },
      { label: 'Ataques no ambiente',               value: 'Não' },
      { label: 'Danos a construções',               value: 'Sim' },
      { label: 'Atividade Dia/Noite',               value: 'Ambos' },
      { label: 'Ativação de alarme por zumbi',      value: 'Sim' },
      { label: 'Derrubar sobrevivente',             value: 'Sim' },
      { label: 'Rastejadores derrubam',             value: 'Sim' },
      { label: 'Ataque em cercas',                  value: 'Sim' },
      { label: 'Fake Dead (reanimação)',            value: 'Total' },
      { label: 'Defesa do zumbi',                   value: '2.0' },
      { label: 'Defesa máx. de armadura',           value: '85' },
      { label: 'Chance de arma equipada',           value: '6' },
      { label: 'Mult. dano e zumbis derrubados',    value: '1.0' },
      { label: 'Área de spawn do jogador',          value: 'Dentro do edifício e ao redor' },
    ],
  },
  {
    title: 'Zumbis — Avançado',
    icon: 'ti-adjustments',
    rows: [
      { label: 'Multiplicador de população',        value: '4.0×' },
      { label: 'Pop. inicial',                      value: '2.0×' },
      { label: 'Pop. no pico',                      value: '2.0×' },
      { label: 'Dia do pico',                       value: 'Dia 1' },
      { label: 'Horas de respawn',                  value: '0.0 (Desativado)' },
      { label: 'Horas de respawn (não visitadas)',   value: '0.0 (Desativado)' },
      { label: 'Multiplicador de respawn',           value: '0.0' },
      { label: 'Horas para migração',               value: '12h' },
      { label: 'Distância do som',                  value: '100' },
      { label: 'Tamanho da horda',                  value: '1' },
      { label: 'Variação do grupo da horda',        value: '50' },
      { label: 'Distância para formação de hordas', value: '20' },
      { label: 'Distância de separação da horda',   value: '15' },
      { label: 'Raio de distância da horda',        value: '3' },
      { label: 'Contagem antes da exclusão',        value: '300' },
    ],
  },
  {
    title: 'Loot — Geral',
    icon: 'ti-package',
    rows: [
      { label: 'Horas para loot reaparecer',        value: '0' },
      { label: 'Respawn de itens',                  value: '0' },
      { label: 'Máx. itens para reaparecimento',    value: '5' },
      { label: 'Construção impede reaparecimento',  value: 'Sim' },
      { label: 'Chance máx. de loot de edifício',   value: '25' },
      { label: 'Dias até chance máx. de saque',     value: '90' },
      { label: 'Mult. loot de construção rural',    value: '0.5' },
      { label: 'Porcentagem máx. loot diminuída',   value: '20' },
      { label: 'Dias até máx. de loot diminuída',   value: '3650' },
      { label: 'Máx. salas de edifício saqueadas',  value: '50' },
    ],
  },
  {
    title: 'Loot — Raridade',
    icon: 'ti-package-off',
    rows: [
      { label: 'Alimentos perecíveis',              value: '0.04 (Muito Baixo)' },
      { label: 'Alimentos não perecíveis',          value: '0.04 (Muito Baixo)' },
      { label: 'Armas corpo a corpo',               value: '0.04 (Muito Baixo)' },
      { label: 'Armas de longo alcance',            value: '0.04 (Muito Baixo)' },
      { label: 'Munição',                           value: '0.04 (Muito Baixo)' },
      { label: 'Medicamentos',                      value: '0.04 (Muito Baixo)' },
      { label: 'Essencial de sobrevivência',        value: '0.04 (Muito Baixo)' },
      { label: 'Mecânica',                          value: '0.04 (Muito Baixo)' },
      { label: 'Livros de habilidade',              value: '0.04 (Muito Baixo)' },
      { label: 'Recursos de receitas',              value: '0.04 (Muito Baixo)' },
      { label: 'Literatura',                        value: '0.04 (Muito Baixo)' },
      { label: 'Roupas',                            value: '0.04 (Muito Baixo)' },
      { label: 'Mochilas',                          value: '0.04 (Muito Baixo)' },
      { label: 'Chaves',                            value: '0.04 (Muito Baixo)' },
      { label: 'Mídia',                             value: '0.04 (Muito Baixo)' },
      { label: 'Lembranças',                        value: '0.04 (Muito Baixo)' },
      { label: 'Culinária',                         value: '0.04 (Muito Baixo)' },
      { label: 'Materiais',                         value: '0.04 (Muito Baixo)' },
      { label: 'Agricultura',                       value: '0.04 (Muito Baixo)' },
      { label: 'Ferramentas',                       value: '0.04 (Muito Baixo)' },
      { label: 'Outros',                            value: '0.04 (Muito Baixo)' },
      { label: 'Geradores',                         value: 'Extremamente Raro' },
    ],
  },
  {
    title: 'Mundo',
    icon: 'ti-world',
    rows: [
      { label: 'Desligamento da água',              value: 'Instantâneo' },
      { label: 'Desligamento da eletricidade',      value: 'Instantâneo' },
      { label: 'Decaimento da bateria do alarme',   value: '0–5 Anos' },
      { label: 'Casas com alarmes',                 value: 'Muito Frequentemente' },
      { label: 'Casas trancadas',                   value: 'Frequentemente' },
      { label: 'Propagação de fogo',                value: 'Sim' },
      { label: 'Funcionamento externo do gerador',  value: 'Sim' },
      { label: 'Alcance do gerador',                value: '20' },
      { label: 'Alcance vertical do gerador',       value: '3' },
      { label: 'Bombas de gasolina infinitas',      value: 'Sim' },
      { label: 'Gasolina inicial mín.',             value: '0.0' },
      { label: 'Gasolina inicial máx.',             value: '0.8' },
      { label: 'Chance de bomba de gasolina vazia', value: '20%' },
      { label: 'Validade das lâmpadas',             value: '2.0' },
      { label: 'Decomposição do alimento',          value: 'Normal' },
      { label: 'Eficiência da refrigeração',        value: 'Normal' },
      { label: 'Remoção do alimento podre',         value: '-1 (automático)' },
      { label: 'Tempo de despawn',                  value: '24h' },
      { label: 'Whitelist de despawn',              value: 'Não' },
    ],
  },
  {
    title: 'Mundo — Porões',
    icon: 'ti-stairs-down',
    rows: [
      { label: 'Frequência de geração de porões',   value: 'Às Vezes' },
      { label: 'Máx. horas de combustível de fogo', value: '8' },
    ],
  },
  {
    title: 'Natureza',
    icon: 'ti-leaf',
    rows: [
      { label: 'Escuridão durante a noite',         value: 'Escuro' },
      { label: 'Temperatura',                       value: 'Frio' },
      { label: 'Chuva',                             value: 'Seco' },
      { label: 'Intensidade máx. da neblina',       value: 'Normal' },
      { label: 'Intensidade máx. efeitos de chuva', value: 'Normal' },
      { label: 'Velocidade da erosão',              value: 'Lento (200 Dias)' },
      { label: 'Dias para erosão iniciar',          value: '0' },
      { label: 'Velocidade da agricultura',         value: '1.0' },
      { label: 'Tempo de compostagem',              value: '2 Semanas' },
      { label: 'Abundância da pesca',               value: 'Muito Ruim' },
      { label: 'Abundância natural',                value: 'Muito Ruim' },
      { label: 'Estado do cultivo',                 value: 'Muito Baixo' },
      { label: 'Abundância da plantação',           value: '1.0' },
      { label: 'Matar colheitas dentro de casa',    value: 'Sim' },
      { label: 'Estações de crescimento',           value: 'Sim' },
      { label: 'Fazendas não no nível do solo',     value: 'Não' },
      { label: 'Neve no chão',                      value: 'Sim' },
      { label: 'Alerta de água contaminada',        value: 'Sim' },
      { label: 'Índice máx. de pragas',             value: '25' },
      { label: 'Dias até índice máx. de pragas',    value: '90' },
      { label: 'Chance de argila — Lago',           value: '0.05' },
      { label: 'Chance de argila — Rio',            value: '0.05' },
    ],
  },
  {
    title: 'Ambiente',
    icon: 'ti-map',
    rows: [
      { label: 'Evento do helicóptero',             value: 'Uma Vez' },
      { label: 'Eventos aleatórios',                value: 'Frequentemente' },
      { label: 'Eventos de sono',                   value: 'Nunca' },
      { label: 'Consumo de combustível do gerador', value: '0.1' },
      { label: 'Aleatoriedade de casas',            value: 'Raro' },
      { label: 'Acidentes de trânsito',             value: 'Raro' },
      { label: 'Casas de sobreviventes',            value: 'Raro' },
      { label: 'Mapas anotados',                    value: 'Algumas Vezes' },
      { label: 'Decomposição de cadáveres',         value: '216.0h' },
      { label: 'Impacto da decomp. na saúde',       value: 'Normal' },
      { label: 'Impacto da saúde zumbi',            value: 'Não' },
      { label: 'Nível de sangue',                   value: 'Normal' },
      { label: 'Vida útil do respingo de sangue',   value: '0 dias' },
      { label: 'Aparecimento de larvas',            value: 'Em cadáveres e ao redor' },
      { label: 'Meta conhecimento de mídia',        value: 'Completamente Escondido' },
      { label: 'Ciclo de Dia/Noite',                value: 'Normal' },
      { label: 'Ciclo climático',                   value: 'Normal' },
      { label: 'Ciclo de neblina',                  value: 'Normal' },
      { label: 'Zumbis danificam cercas',           value: '25' },
      { label: 'Multiplicador de danos de cerca',   value: '1.0' },
    ],
  },
  {
    title: 'Ambiente — Mapa',
    icon: 'ti-map-2',
    rows: [
      { label: 'Permitir uso de mapas',             value: 'Sim' },
      { label: 'Permitir Mini-Mapa',                value: 'Não' },
      { label: 'Locais abertos no início',          value: 'Não' },
      { label: 'Luz necessária para ler o mapa',    value: 'Sim' },
    ],
  },
  {
    title: 'Personagem',
    icon: 'ti-user',
    rows: [
      { label: 'Necessidades físicas',              value: 'Normal' },
      { label: 'Recuperação de fôlego',             value: 'Normal' },
      { label: 'Nutrição',                          value: 'Sim' },
      { label: 'Kit inicial',                       value: 'Não' },
      { label: 'Pontos extras de traços',           value: '0' },
      { label: 'Resistência de construção',         value: 'Normal' },
      { label: 'Gravidade de lesões',               value: 'Normal' },
      { label: 'Fraturas',                          value: 'Sim' },
      { label: 'Fator de tensão muscular',          value: '0.7' },
      { label: 'Fator de desconforto',              value: '0.8' },
      { label: 'Fator de dano de infecção',         value: '1.0' },
      { label: 'Degradação de roupas',              value: 'Normal' },
      { label: 'Sem roupas pretas',                 value: 'Sim' },
      { label: 'Vulnerabilidade traseira',          value: 'Alto' },
      { label: 'Múltiplo acerto com armas',         value: 'Não' },
      { label: 'Dano por armas de fogo',            value: 'Apenas Zumbis' },
      { label: 'Mult. ruído de armas de fogo',      value: '1.0' },
      { label: 'Mult. atolamento de arma de fogo',  value: '1.0' },
      { label: 'Mult. moodles de arma de fogo',     value: '1.0' },
      { label: 'Mult. clima de arma de fogo',       value: '1.0' },
      { label: 'Efeito de capacete (arma de fogo)', value: 'Sim' },
      { label: 'Disrupção e movimento corpo a corpo', value: 'Sim' },
      { label: 'Todas as roupas desbloqueadas',     value: 'Não' },
      { label: 'Permitir envenenamento',            value: 'Sim' },
      { label: 'Dias de descanso de leitura',       value: '45' },
      { label: 'Penalidade de traços negativos',    value: 'Nenhum' },
      { label: 'Min/página skill book',             value: '2.0' },
      { label: 'XP máx. de desmontagem',            value: '0' },
      { label: 'XP máx. de mídia',                 value: '3' },
      { label: 'Escalada fácil',                    value: 'Não' },
      { label: 'Ver receitas não conhecidas',       value: 'Sim' },
      { label: 'Multiplicador global de XP',        value: '0.8×' },
      { label: 'Usar multiplicador global',         value: 'Sim' },
    ],
  },
  {
    title: 'Veículos',
    icon: 'ti-car',
    rows: [
      { label: 'Habilitar veículos',                value: 'Sim' },
      { label: 'Fácil uso',                         value: 'Não' },
      { label: 'Veículo recente de sobrevivente',   value: 'Baixo' },
      { label: 'Multiplicador de atração',          value: '1.0' },
      { label: 'Taxa de spawn de veículos',         value: 'Baixo' },
      { label: 'Chance de ter gasolina',            value: 'Baixo' },
      { label: 'Gasolina inicial',                  value: 'Muito Baixo' },
      { label: 'Consumo de gasolina',               value: '1.0' },
      { label: 'Frequência de veículos trancados',  value: 'Muito Frequentemente' },
      { label: 'Condição geral',                    value: 'Muito Baixo' },
      { label: 'Congestionamento de carros acid.',  value: 'Sim' },
      { label: 'Frequência de carros com alarme',   value: 'Raro' },
      { label: 'Dano ao jogador em acidente',       value: 'Sim' },
      { label: 'Dano no carro em impactos',         value: 'Normal' },
      { label: 'Desligamento da sirene',            value: '0.0' },
      { label: 'Dano ao jogador atingido por carro',value: 'Nenhum' },
      { label: 'Sirenes atraem zumbis',             value: 'Sim' },
    ],
  },
  {
    title: 'Animais',
    icon: 'ti-paw',
    rows: [
      { label: 'Velocidade de redução de stats',    value: 'Normal' },
      { label: 'Tempo de gravidez',                 value: 'Normal' },
      { label: 'Hora de eclosão dos ovos',          value: 'Normal' },
      { label: 'Velocidade de envelhecimento',      value: 'Normal' },
      { label: 'Velocidade de produção de leite',   value: 'Normal' },
      { label: 'Velocidade de produção de lã',      value: 'Normal' },
      { label: 'Chance de aparecer animais',        value: 'Extremamente Raro' },
      { label: 'Tempo de crescimento da grama',     value: '240' },
      { label: 'Meta predador',                     value: 'Não' },
      { label: 'Época da reprodução',               value: 'Sim' },
      { label: 'Animais atraem zumbis',             value: 'Sim' },
      { label: 'Chance de rastros de animais',      value: 'Algumas Vezes' },
      { label: 'Chance de trilhas de animais',      value: 'Algumas Vezes' },
    ],
  },
];

export function ChallengeSettingsModal({ onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box settings-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        <div className="settings-modal-header">
          <span className="settings-modal-tag">// CONFIGURAÇÕES OFICIAIS</span>
          <h2 className="modal-title"><i className="ti ti-settings" /> Configurações do Desafio</h2>
          <p className="settings-modal-sub">
            Todas as configurações do sandbox devem ser idênticas ao preset oficial
            <strong> "Brasileirão PZ"</strong>. O mod verifica automaticamente e marca
            o jogador como <strong>Desclassificado</strong> se houver divergência.
          </p>
        </div>

        <div className="settings-modal-body">
          {SETTINGS_GROUPS.map(group => (
            <section key={group.title} className="settings-group">
              <h3 className="settings-group-title">
                <i className={`ti ${group.icon}`} /> {group.title}
              </h3>
              <div className="settings-rows">
                {group.rows.map(row => (
                  <div key={row.label} className="settings-row">
                    <span className="settings-row-label">{row.label}</span>
                    <span className="settings-row-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}