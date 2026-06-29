import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

const SETTINGS_GROUPS = [
  {
    title: 'Zumbis — Geral',
    icon: 'ti-users',
    rows: [
      { label: 'Quantidade',                   value: 'Normal' },
      { label: 'Distribuição',                 value: 'Foco Urbano' },
      { label: 'Intervalo de respawn',          value: 'Nenhum' },
      { label: 'Migração zumbi',               value: 'Sim' },
    ],
  },
  {
    title: 'Zumbis — Comportamento',
    icon: 'ti-brain',
    rows: [
      { label: 'Velocidade',                   value: 'Aleatório (0% corredores)' },
      { label: 'Força',                         value: 'Super-humano' },
      { label: 'Resistência',                  value: 'Resistente' },
      { label: 'Transmissão de infecção',      value: 'Sangue + Saliva' },
      { label: 'Mortalidade da infecção',      value: '2–3 Dias' },
      { label: 'Tempo de reanimação',          value: '0–1 Minutos' },
      { label: 'Percepção',                    value: 'Avançado (usa portas)' },
      { label: 'Rastejantes em veículos',      value: 'Frequentemente' },
      { label: 'Memória',                      value: 'Longo' },
      { label: 'Visão',                         value: 'Olhos de Águia' },
      { label: 'Audição',                      value: 'Alta' },
      { label: 'Fingir de morto',              value: 'Total' },
      { label: 'Danos a construções',          value: 'Sim' },
      { label: 'Atividade Dia/Noite',          value: 'Ambos' },
      { label: 'Derrubar sobrevivente',        value: 'Sim' },
      { label: 'Rastejadores derrubam',        value: 'Sim' },
      { label: 'Ataque em cercas',             value: 'Sim' },
      { label: 'Defesa do zumbi',              value: '2.0' },
      { label: 'Defesa máx. de armadura',      value: '85' },
      { label: 'Chance de arma equipada',      value: '6' },
      { label: 'Área de spawn do jogador',     value: 'Dentro do edifício e ao redor' },
    ],
  },
  {
    title: 'Zumbis — Avançado',
    icon: 'ti-adjustments',
    rows: [
      { label: 'Multiplicador de população',    value: '4.0×' },
      { label: 'Pop. inicial',                  value: '2.0×' },
      { label: 'Pop. no pico',                  value: '2.0×' },
      { label: 'Dia do pico',                   value: 'Dia 1' },
      { label: 'Respawn',                       value: 'Desativado (0h)' },
      { label: 'Horas para migração',           value: '12h' },
      { label: 'Distância do som',              value: '100' },
      { label: 'Tamanho da horda',              value: '1' },
      { label: 'Variação do grupo da horda',    value: '50' },
      { label: 'Distância para formação',       value: '20' },
      { label: 'Distância de separação',        value: '15' },
      { label: 'Raio de distância da horda',    value: '3' },
      { label: 'Contagem antes da exclusão',    value: '300' },
    ],
  },
  {
    title: 'Loot',
    icon: 'ti-package',
    rows: [
      { label: 'Comida',                        value: '0.04 (Muito Baixo)' },
      { label: 'Comida enlatada',               value: '0.04 (Muito Baixo)' },
      { label: 'Armas corpo a corpo',           value: '0.04 (Muito Baixo)' },
      { label: 'Armas de longo alcance',        value: '0.04 (Muito Baixo)' },
      { label: 'Munição',                       value: '0.04 (Muito Baixo)' },
      { label: 'Medicamentos',                  value: '0.04 (Muito Baixo)' },
      { label: 'Equipamentos de sobrev.',       value: '0.04 (Muito Baixo)' },
      { label: 'Mecânica',                      value: '0.04 (Muito Baixo)' },
      { label: 'Livros de habilidade',          value: '0.04 (Muito Baixo)' },
      { label: 'Recursos de receitas',          value: '0.04 (Muito Baixo)' },
      { label: 'Literatura',                    value: '0.04 (Muito Baixo)' },
      { label: 'Roupas',                        value: '0.04 (Muito Baixo)' },
      { label: 'Mochilas',                      value: '0.04 (Muito Baixo)' },
      { label: 'Chaves',                        value: '0.04 (Muito Baixo)' },
      { label: 'Mídia',                         value: '0.04 (Muito Baixo)' },
      { label: 'Lembranças',                    value: '0.04 (Muito Baixo)' },
      { label: 'Culinária',                     value: '0.04 (Muito Baixo)' },
      { label: 'Materiais',                     value: '0.04 (Muito Baixo)' },
      { label: 'Agricultura',                   value: '0.04 (Muito Baixo)' },
      { label: 'Ferramentas',                   value: '0.04 (Muito Baixo)' },
      { label: 'Outros',                        value: '0.04 (Muito Baixo)' },
      { label: 'Geradores',                     value: 'Extremamente Raro' },
    ],
  },
  {
    title: 'Mundo',
    icon: 'ti-world',
    rows: [
      { label: 'Água',                          value: 'Corta imediatamente' },
      { label: 'Eletricidade',                  value: 'Corta imediatamente' },
      { label: 'Casas com alarmes',             value: 'Muito Frequentemente' },
      { label: 'Casas trancadas',               value: 'Frequentemente' },
      { label: 'Propagação de fogo',            value: 'Sim' },
      { label: 'Bombas de gasolina infinitas',  value: 'Sim' },
      { label: 'Gasolina inicial (mín/máx)',    value: '0.0 / 0.8' },
      { label: 'Chance de bomba vazia',         value: '20%' },
      { label: 'Validade das lâmpadas',         value: '2.0' },
      { label: 'Decomposição do alimento',      value: 'Normal' },
      { label: 'Tempo de despawn',              value: '24h' },
    ],
  },
  {
    title: 'Natureza & Clima',
    icon: 'ti-cloud',
    rows: [
      { label: 'Escuridão noturna',             value: 'Escuro' },
      { label: 'Temperatura',                   value: 'Frio' },
      { label: 'Chuva',                         value: 'Seco' },
      { label: 'Intensidade máx. da neblina',   value: 'Normal' },
      { label: 'Velocidade da erosão',          value: 'Lento (200 Dias)' },
      { label: 'Dias para erosão iniciar',      value: '0' },
      { label: 'Abundância de pesca',           value: 'Muito Ruim' },
      { label: 'Abundância natural',            value: 'Muito Ruim' },
      { label: 'Estado do cultivo',             value: 'Muito Baixo' },
      { label: 'Neve no chão',                  value: 'Sim' },
    ],
  },
  {
    title: 'Ambiente',
    icon: 'ti-map',
    rows: [
      { label: 'Evento do helicóptero',         value: 'Uma Vez' },
      { label: 'Eventos aleatórios',            value: 'Frequentemente' },
      { label: 'Eventos de sono',               value: 'Nunca' },
      { label: 'Consumo do gerador',            value: '0.1' },
      { label: 'Aleatoriedade de casas',        value: 'Raro' },
      { label: 'Acidentes de trânsito',         value: 'Raro' },
      { label: 'Casas de sobreviventes',        value: 'Raro' },
      { label: 'Mini-mapa',                     value: 'Desativado' },
    ],
  },
  {
    title: 'Personagem',
    icon: 'ti-user',
    rows: [
      { label: 'Multiplicador global de XP',    value: '0.8×' },
      { label: 'Pontos extras de traços',       value: '0' },
      { label: 'Fator de tensão muscular',      value: '0.7' },
      { label: 'Fator de desconforto',          value: '0.8' },
      { label: 'Sem roupas pretas',             value: 'Sim' },
      { label: 'Vulnerabilidade traseira',      value: 'Alto' },
      { label: 'Dano por armas de fogo',        value: 'Apenas Zumbis' },
      { label: 'Dias de descanso de leitura',   value: '45' },
      { label: 'Penalidade de traços neg.',     value: 'Nenhum' },
      { label: 'Min/página skill book',         value: '2.0' },
      { label: 'XP máx. de desmontagem',        value: '0' },
      { label: 'XP máx. de mídia',             value: '3' },
      { label: 'Escalada fácil',               value: 'Não' },
      { label: 'Nutrição',                      value: 'Sim' },
    ],
  },
  {
    title: 'Veículos',
    icon: 'ti-car',
    rows: [
      { label: 'Taxa de spawn',                 value: 'Baixo' },
      { label: 'Chance de gasolina',            value: 'Baixo' },
      { label: 'Gasolina inicial',              value: 'Muito Baixo' },
      { label: 'Consumo de gasolina',           value: '1.0' },
      { label: 'Veículos trancados',            value: 'Muito Frequentemente' },
      { label: 'Condição geral',                value: 'Muito Baixo' },
      { label: 'Congestionamento',              value: 'Sim' },
      { label: 'Carros com alarme',             value: 'Raro' },
    ],
  },
  {
    title: 'Animais',
    icon: 'ti-paw',
    rows: [
      { label: 'Chance de aparecer animais',    value: 'Extremamente Raro' },
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