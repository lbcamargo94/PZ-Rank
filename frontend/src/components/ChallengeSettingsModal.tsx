import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

const SETTINGS_GROUPS = [
  {
    title: 'Zumbis — População',
    icon: 'ti-users',
    rows: [
      { label: 'Multiplicador de população',    value: '4×' },
      { label: 'Pop. inicial',                   value: '2×' },
      { label: 'Pop. no pico',                   value: '2×' },
      { label: 'Dia do pico',                    value: 'Dia 1' },
    ],
  },
  {
    title: 'Zumbis — Comportamento',
    icon: 'ti-brain',
    rows: [
      { label: 'Velocidade',                     value: 'Aleatório (sem corredores)' },
      { label: 'Força',                          value: 'Super-humano' },
      { label: 'Resistência',                    value: 'Resistente' },
      { label: 'Audição',                        value: 'Alta' },
      { label: 'Visão',                          value: 'Águia' },
      { label: 'Memória',                        value: 'Longa' },
      { label: 'Percepção / abre portas',        value: 'Avançado' },
      { label: 'Raio de audição',                value: '100' },
      { label: 'Fingir de morto',                value: 'Total (incl. mortos pelo jogador)' },
      { label: 'Rastejadores derrubam',          value: 'Sim' },
      { label: 'Tamanho da horda',               value: '1' },
    ],
  },
  {
    title: 'Loot',
    icon: 'ti-package',
    rows: [
      { label: 'Comida',    value: '0.04 (Muito Baixo)' },
      { label: 'Armas',     value: '0.04 (Muito Baixo)' },
      { label: 'Médico',    value: '0.04 (Muito Baixo)' },
      { label: 'Munição',   value: '0.04 (Muito Baixo)' },
      { label: 'Geradores', value: 'Extremamente Raro' },
    ],
  },
  {
    title: 'Mundo',
    icon: 'ti-world',
    rows: [
      { label: 'Água',           value: 'Corta imediatamente' },
      { label: 'Eletricidade',   value: 'Corta imediatamente' },
      { label: 'Alarmes',        value: 'Muito Frequentemente' },
    ],
  },
  {
    title: 'Natureza & Clima',
    icon: 'ti-cloud',
    rows: [
      { label: 'Escuridão noturna', value: 'Escuro' },
      { label: 'Temperatura',       value: 'Frio' },
      { label: 'Chuva',             value: 'Seco' },
      { label: 'Abundância de pesca',   value: 'Muito Ruim' },
      { label: 'Abundância natural',    value: 'Muito Ruim' },
      { label: 'Eventos aleatórios',    value: 'Frequentemente' },
      { label: 'Mini-mapa',             value: 'Desativado' },
    ],
  },
  {
    title: 'Personagem',
    icon: 'ti-user',
    rows: [
      { label: 'Multiplicador global de XP', value: '0.8×' },
    ],
  },
  {
    title: 'Veículos',
    icon: 'ti-car',
    rows: [
      { label: 'Chance de gasolina',     value: 'Baixo' },
      { label: 'Gasolina inicial',        value: 'Muito Baixo' },
      { label: 'Veículos trancados',      value: 'Muito Frequentemente' },
      { label: 'Condição geral',          value: 'Muito Baixo' },
    ],
  },
  {
    title: 'Animais',
    icon: 'ti-paw',
    rows: [
      { label: 'Chance de criação de animais', value: 'Extremamente Raro' },
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
