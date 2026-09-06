import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setOnUnauthorized, apiModMe } from './lib/api';
import type { ModSession } from './types';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DonationButton } from './components/DonationButton';
import { CommunityStats }      from './components/CommunityStats';
import { NewsInline }     from './components/NewsCard';
import { AdBanner }      from './components/AdBanner';
import { StreamersHighlight } from './components/StreamersHighlight';
import { RankTop10Preview }   from './components/RankTop10Preview';

// Rotas carregadas imediatamente (caminho crítico)
import { RankPage }    from './pages/RankPage';
import { PlayerPage }  from './pages/PlayerPage';
import { OverlayPage } from './pages/OverlayPage';
import { OverlayTop10Page } from './pages/OverlayTop10Page';

// Rotas lazy — carregadas sob demanda
const RegrasPage            = lazy(() => import('./pages/RegrasPage').then(m => ({ default: m.RegrasPage })));
const PainelPage            = lazy(() => import('./pages/PainelPage').then(m => ({ default: m.PainelPage })));
const WikiPage              = lazy(() => import('./pages/WikiPage').then(m => ({ default: m.WikiPage })));
const WikiHuntingPage       = lazy(() => import('./pages/WikiHuntingPage').then(m => ({ default: m.WikiHuntingPage })));
const ModsPage              = lazy(() => import('./pages/ModsPage').then(m => ({ default: m.ModsPage })));
const TipsPage              = lazy(() => import('./pages/TipsPage').then(m => ({ default: m.TipsPage })));
const GuiaFerraria          = lazy(() => import('./pages/GuiaFerraria').then(m => ({ default: m.GuiaFerraria })));
const GuiaEntalhamento      = lazy(() => import('./pages/GuiaEntalhamento').then(m => ({ default: m.GuiaEntalhamento })));
const GuiaCostura           = lazy(() => import('./pages/GuiaCostura').then(m => ({ default: m.GuiaCostura })));
const VerifyEmailPage       = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ResetPasswordPage     = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ActivateAccountPage   = lazy(() => import('./pages/ActivateAccountPage').then(m => ({ default: m.ActivateAccountPage })));
const AccountPage           = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const ProfilePage           = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ForgotPasswordPage    = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResendVerificationPage = lazy(() => import('./pages/ResendVerificationPage').then(m => ({ default: m.ResendVerificationPage })));
const ClaimAccountPage      = lazy(() => import('./pages/ClaimAccountPage').then(m => ({ default: m.ClaimAccountPage })));
const LegendsPage           = lazy(() => import('./pages/LegendsPage').then(m => ({ default: m.LegendsPage })));
const TransparenciaPage     = lazy(() => import('./pages/TransparenciaPage').then(m => ({ default: m.TransparenciaPage })));
const MapPage               = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));
const LinksUteisPage        = lazy(() => import('./pages/LinksUteisPage').then(m => ({ default: m.LinksUteisPage })));
const ModeratorRegisterPage = lazy(() => import('./pages/ModeratorRegisterPage').then(m => ({ default: m.ModeratorRegisterPage })));
const ModResetPasswordPage  = lazy(() => import('./pages/ModResetPasswordPage').then(m => ({ default: m.ModResetPasswordPage })));

const QUICK_NAV = [
  { to: '/rank',          icon: 'ti-trophy',           key: 'rank'          },
  { to: '/regras',        icon: 'ti-book',             key: 'rules'         },
  { to: '/wiki',          icon: 'ti-book-2',           key: 'wiki'          },
  { to: '/mods',          icon: 'ti-puzzle',           key: 'mods'          },
  { to: '/dicas',         icon: 'ti-bulb',             key: 'tips'          },
  { to: '/lendas',        icon: 'ti-medal',            key: 'legends'       },
  { to: '/links',         icon: 'ti-link',             key: 'links'         },
  { to: '/transparencia', icon: 'ti-file-certificate', key: 'transparency'  },
] as const;

function QuickNav() {
  const { t } = useTranslation();
  return (
    <section className="home-quick-nav" aria-label={t('home.quick_nav.aria')}>
      <p className="home-quick-nav-title">{t('home.quick_nav.title')}</p>
      <div className="quick-nav-grid">
        {QUICK_NAV.map(item => (
          <Link key={item.to} to={item.to} className="quick-nav-card">
            <i className={`ti ${item.icon} quick-nav-icon`} aria-hidden="true" />
            <span className="quick-nav-label">{t(`home.quick_nav.${item.key}.label`)}</span>
            <span className="quick-nav-sub">{t(`home.quick_nav.${item.key}.sub`)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MainView() {
  const navigate = useNavigate();
  const { toast, clearToast } = useToast();

  return (
    <>
      <Header onPainel={() => navigate('/painel')} />
      <CommunityStats />
      <main>
        <div className="container home-layout">
          <StreamersHighlight />
          <div className="home-main-col">
            <div className="home-top-row">
              <NewsInline />
              <div className="home-patrocinio">
                <AdBanner />
              </div>
            </div>
            <QuickNav />
          </div>
          <RankTop10Preview />
        </div>
      </main>
      <Toast {...toast} onClose={clearToast} />
    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  // Overlays são consumidos como browser source no OBS — sem chrome do site
  // (footer, botão de doação) por cima, senão aparecem sobrepostos na gravação.
  const isOverlay = location.pathname.startsWith('/overlay/');
  const [modSession, setModSession] = useState<ModSession | null>(null);

  useEffect(() => {
    setOnUnauthorized(() => setModSession(null));
    // Tenta restaurar sessão de moderador via cookie HttpOnly (persiste entre abas e recargas).
    apiModMe().then(setModSession).catch(() => {});
  }, []);

  return (
    <>
      <div className="page-body">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<MainView />} />
            <Route path="/rank" element={<RankPage />} />
            <Route path="/player/:id" element={<PlayerPage />} />
            <Route path="/overlay/top10" element={<OverlayTop10Page />} />
            <Route path="/overlay/:id" element={<OverlayPage />} />
            <Route path="/wiki" element={<WikiPage />} />
            <Route path="/wiki/cacada" element={<WikiHuntingPage />} />
            <Route path="/mods" element={<ModsPage />} />
            <Route path="/dicas" element={<TipsPage />} />
            <Route path="/dicas/ferraria" element={<GuiaFerraria />} />
            <Route path="/dicas/entalhamento" element={<GuiaEntalhamento />} />
            <Route path="/dicas/costura" element={<GuiaCostura />} />
            <Route path="/regras" element={<RegrasPage />} />
            <Route path="/verificar-email"  element={<VerifyEmailPage />} />
            <Route path="/redefinir-senha"  element={<ResetPasswordPage />} />
            <Route path="/ativar-conta"     element={<ActivateAccountPage />} />
            <Route path="/login"             element={<AccountPage />} />
            <Route path="/perfil"           element={<ProfilePage />} />
            <Route path="/esqueci-senha"    element={<ForgotPasswordPage />} />
            <Route path="/verificar-conta"  element={<ResendVerificationPage />} />
            <Route path="/cadastrar-conta"  element={<ClaimAccountPage />} />
            <Route path="/lendas"           element={<LegendsPage />} />
            <Route path="/transparencia"    element={<TransparenciaPage />} />
            <Route path="/mapa"             element={<MapPage />} />
            <Route path="/links"            element={<LinksUteisPage />} />
            <Route path="/painel" element={
              <PainelPage
                session={modSession}
                onSession={setModSession}
                onBack={() => navigate(-1)}
              />
            } />
            <Route path="/painel/convite/:token"     element={<ModeratorRegisterPage />} />
            <Route path="/painel/redefinir-senha"   element={<ModResetPasswordPage />} />
          </Routes>
        </Suspense>
      </div>
      {!isOverlay && <Footer />}
      {!isOverlay && <DonationButton />}
    </>
  );
}
