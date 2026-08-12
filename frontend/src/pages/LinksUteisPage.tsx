import { Link } from 'react-router-dom';
import linksBg from '../../assets/background/tela-de-links-uteis.webp';

const DISCORD_URL         = 'https://discord.gg/ebhts347WJ';
const COMPANION_WIN_URL   = 'https://github.com/lbcamargo94/PZ-Rank-Companion/releases/download/v1.9.3/PZ.Rank.Companion.Setup.1.9.3.exe';
const COMPANION_MAC_ARM   = 'https://github.com/lbcamargo94/PZ-Rank-Companion/releases/download/v1.9.3/PZ.Rank.Companion.1.9.3.Mac.arm64.dmg';
const COMPANION_MAC_X64   = 'https://github.com/lbcamargo94/PZ-Rank-Companion/releases/download/v1.9.3/PZ.Rank.Companion.1.9.3.Mac.x64.dmg';
const COMPANION_VER       = 'v1.9.3';

export function LinksUteisPage() {
  return (
    <main className="lu-page claim-page-wrap" style={{ backgroundImage: `url(${linksBg})` }}>
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
          <div className="lu-card lu-card--multi">
            <div className="lu-card-icon lu-card-icon--companion">
              <i className="ti ti-device-desktop-analytics" aria-hidden="true" />
            </div>
            <div className="lu-card-body">
              <h2 className="lu-card-title">PZ Rank Companion <span className="lu-ver">{COMPANION_VER}</span></h2>
              <p className="lu-card-desc">
                Aplicativo que detecta automaticamente suas runs e envia os dados
                ao ranking. Necessário para participar do campeonato.
              </p>
            </div>
            <div className="lu-card-actions">
              <a href={COMPANION_WIN_URL} className="btn-lu btn-lu--companion" download>
                <i className="ti ti-brand-windows" aria-hidden="true" />
                Windows
              </a>
              <a href={COMPANION_MAC_ARM} className="btn-lu btn-lu--companion-mac" download>
                <i className="ti ti-brand-apple" aria-hidden="true" />
                macOS Apple Silicon
              </a>
              <a href={COMPANION_MAC_X64} className="btn-lu btn-lu--companion-mac" download>
                <i className="ti ti-brand-apple" aria-hidden="true" />
                macOS Intel
              </a>
              <p className="lu-mac-note">
                <i className="ti ti-info-circle" aria-hidden="true" />
                Mac: clique direito no app → Abrir
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
