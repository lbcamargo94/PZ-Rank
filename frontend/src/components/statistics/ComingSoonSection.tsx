import { SectionHeader } from './StatsUi';

// Seções pedidas que ainda não têm dado confiável no servidor. Detalhes técnicos
// e o caminho pra implementar cada uma: docs/estatisticas.md.
const PENDING = [
  { icon: '🎮', title: 'O que os sobreviventes fazem',
    text: 'Casas saqueadas, itens fabricados, refeições, ovos, leite, cidades visitadas e outras ações. O mod já conta, mas esses números ainda não chegam ao site.' },
  { icon: '☠️', title: 'Principais causas de morte',
    text: 'Registrada só em parte das mortes. Vai aparecer quando houver cobertura suficiente.' },
  { icon: '💀', title: 'Onde os sobreviventes mais morrem',
    text: 'O mapa de calor já existe; falta identificar a cidade de cada região do mapa.' },
  { icon: '🗺️', title: 'Onde os jogadores começam',
    text: 'A cidade inicial não é registrada hoje.' },
  { icon: '📈', title: 'Evolução ao longo do tempo',
    text: 'Gráficos semanais/mensais de inscrições, runs e mortes.' },
];

export function ComingSoonSection() {
  return (
    <section className="stats-section">
      <SectionHeader id="em-breve" icon="🚧" title="Em breve" sub="Estatísticas que ainda não podem ser calculadas com os dados atuais." />
      <ul className="stats-pending">
        {PENDING.map(p => (
          <li key={p.title}>
            <span aria-hidden="true">{p.icon}</span>
            <div><strong>{p.title}</strong><p>{p.text}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
