import { Link } from 'react-router-dom';

const DISCORD_URL     = 'https://discord.gg/LINK_DO_DISCORD';
const COMPANION_URL   = 'https://github.com/lbcamargo94/PZ-Rank-Companion/releases/download/v1.7.3/PZ.Rank.Companion.Setup.1.7.3.exe';
const COMPANION_VER   = 'v1.7.3';

export function LinksUteisPage() {
  return (
    <main className="lu-page">
      <div className="container lu-container">
        <div className="lu-header">
          <Link to="/" className="back-link">
            <i className="ti ti-arrow-left" aria-hidden="true" /> Voltar
          </Link>
          <h1 className="lu-title">Links Úteis</h1>
          <p className="lu-sub">Recursos essenciais do Campeonato Brasileiro PZ</p>
        </div>

        <div className="lu-grid">

          {/* Discord */}
          <div className="lu-card">
            <div className="lu-card-icon lu-card-icon--discord">
              <i className="ti ti-brand-discord" aria-hidden="true" />
            </div>
            <div className="lu-card-body">
              <h2 className="lu-card-title">Servidor Discord</h2>
              <p className="lu-card-desc">
                Comunidade oficial do Campeonato Brasileiro PZ. Anúncios, suporte,
                discussões e partidas ao vivo.
              </p>
            </div>
            <a
              href={DISCORD_URL}
              className="btn-lu btn-lu--discord"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="ti ti-brand-discord" aria-hidden="true" />
              Entrar no Discord
            </a>
          </div>

          {/* Companion */}
          <div className="lu-card">
            <div className="lu-card-icon lu-card-icon--companion">
              <i className="ti ti-device-desktop-analytics" aria-hidden="true" />
            </div>
            <div className="lu-card-body">
              <h2 className="lu-card-title">PZ Rank Companion <span className="lu-ver">{COMPANION_VER}</span></h2>
              <p className="lu-card-desc">
                Aplicativo para Windows que detecta automaticamente suas runs e
                envia os dados ao ranking. Necessário para participar do campeonato.
              </p>
            </div>
            <a
              href={COMPANION_URL}
              className="btn-lu btn-lu--companion"
              download
            >
              <i className="ti ti-download" aria-hidden="true" />
              Baixar para Windows
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
