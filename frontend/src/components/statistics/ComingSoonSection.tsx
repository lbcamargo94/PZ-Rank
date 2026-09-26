import { SectionHeader } from './StatsUi';

// Seções pedidas que ainda não têm dado confiável no servidor. Detalhes técnicos
// e o caminho pra implementar cada uma: docs/estatisticas.md.
const PENDING = [
  { icon: '🗺️', title: 'Onde os jogadores começam',
    text: 'A cidade inicial não é registrada hoje.' },
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
