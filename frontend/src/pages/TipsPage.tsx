import { Link } from 'react-router-dom';
import './tips.css';

interface GuideCard {
  to: string;
  icon: string;
  name: string;
  desc: string;
  level: string;
  available: boolean;
}

const GUIDES: GuideCard[] = [
  {
    to: '/dicas/ferraria',
    icon: 'ti-hammer',
    name: 'Ferraria',
    desc: 'Do nível 0 ao 10: sequência de receitas, infraestrutura, carvão, ferro e rota otimizada para o Brasileirão.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/entalhamento',
    icon: 'ti-axe',
    name: 'Entalhamento',
    desc: 'Guia completo para atingir nível 10 em Entalhamento (Whittling) com eficiência máxima de XP.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/costura',
    icon: 'ti-needle-thread',
    name: 'Costura',
    desc: 'Materiais, padrões e receitas mais eficientes para evoluir Costura ao máximo.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/carpintaria',
    icon: 'ti-trees',
    name: 'Carpintaria',
    desc: 'Sequência de construção e receitas de XP otimizadas para Carpintaria no Brasileirão.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/mecanica',
    icon: 'ti-tool',
    name: 'Mecânica',
    desc: 'Rota de evolução em Mecânica: peças, veículos e aproveitamento de loot 0,04.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/eletrica',
    icon: 'ti-bolt',
    name: 'Elétrica',
    desc: 'Componentes elétricos, geradores e receitas de XP mais rentáveis para Elétrica.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/manutencao',
    icon: 'ti-tools',
    name: 'Manutenção',
    desc: 'Como maximizar Manutenção e prolongar a durabilidade das suas ferramentas e armas.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/condicionamento',
    icon: 'ti-run',
    name: 'Condicionamento Físico',
    desc: 'Exercícios, peso e rotinas de XP para subir Condicionamento Físico rapidamente.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/culinaria',
    icon: 'ti-chef-hat',
    name: 'Culinária',
    desc: 'Receitas, utensílios, calor e rota de progressão para maximizar Culinária no Brasileirão.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/agricultura',
    icon: 'ti-seeding',
    name: 'Agricultura',
    desc: 'Calendário de plantio, sementes, água e compostos para evoluir Agricultura ao máximo.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/animais',
    icon: 'ti-paw',
    name: 'Cuidados com Animais',
    desc: 'Espécies, recintos, água e rotina diária para subir Cuidados com Animais eficientemente.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/abate',
    icon: 'ti-meat',
    name: 'Abate',
    desc: 'Gancho, peixes, grandes animais e subprodutos — rota completa para dominar Abate.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/ceramica',
    icon: 'ti-building',
    name: 'Cerâmica',
    desc: 'Argila, forno, torno, moldes e receitas para evoluir Cerâmica do zero ao nível 10.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/coleta',
    icon: 'ti-leaf',
    name: 'Coleta',
    desc: 'Biomas, ervas, clima e rota de circuito para maximizar XP de Coleta no Brasileirão.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/rastreamento',
    icon: 'ti-paw-filled',
    name: 'Rastreamento',
    desc: 'Pistas de fauna, cercado de coelhos e sessões reais para evoluir Rastreamento ao máximo.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/armadilhas',
    icon: 'ti-target',
    name: 'Armadilhas',
    desc: 'Fórmula de captura, tipos de armadilha, iscas e zonas para maximizar Armadilhas.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/lascamento',
    icon: 'ti-rock',
    name: 'Lascamento',
    desc: 'Ferramentas de pedra, receitas de XP e rota mínima para chegar ao nível 10 em poucas ações.',
    level: '0 → 10',
    available: true,
  },
  {
    to: '/dicas/alvenaria',
    icon: 'ti-wall',
    name: 'Alvenaria',
    desc: 'Blocos, cimento, paredes de pedra e fortaleza permanente — rota completa de Alvenaria.',
    level: '0 → 10',
    available: true,
  },
];

export function TipsPage() {
  return (
    <div className="tips-page">
      <header className="tips-header">
        <div className="tips-header-inner">
          <Link to="/" className="tips-back">
            <i className="ti ti-arrow-left" />
            <span>Início</span>
          </Link>
        </div>
      </header>

      <div className="tips-body">
        <div className="tips-hero">
          <div className="tips-eyebrow">Brasileirão PZ · Build 42.20.x</div>
          <h1 className="tips-title">Guias Definitivos</h1>
          <p className="tips-subtitle">
            Manuais completos de progressão de habilidades, otimizados para as condições extremas do Brasileirão —
            10× zumbis, loot 0,04, água e energia cortadas no dia 1.
          </p>
        </div>

        <div className="tips-grid">
          {GUIDES.map(guide => (
            guide.available ? (
              <Link key={guide.to} to={guide.to} className="tips-card tips-card-available">
                <div className="tips-card-icon">
                  <i className={`ti ${guide.icon}`} />
                </div>
                <h2 className="tips-card-name">{guide.name}</h2>
                <p className="tips-card-desc">{guide.desc}</p>
                <div className="tips-card-footer">
                  <span className="tips-card-badge available">{guide.level}</span>
                  <span className="tips-card-arr"><i className="ti ti-arrow-right" /></span>
                </div>
              </Link>
            ) : (
              <div key={guide.to} className="tips-card tips-card-soon">
                <div className="tips-card-icon">
                  <i className={`ti ${guide.icon}`} />
                </div>
                <h2 className="tips-card-name">{guide.name}</h2>
                <p className="tips-card-desc">{guide.desc}</p>
                <div className="tips-card-footer">
                  <span className="tips-card-badge">Em breve</span>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
