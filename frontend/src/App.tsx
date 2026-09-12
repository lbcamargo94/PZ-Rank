import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setOnUnauthorized, apiModMe } from './lib/api';
import type { ModSession } from './types';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NAV_ITEMS } from './lib/nav';
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
const GuiaCarpintaria       = lazy(() => import('./pages/GuiaCarpintaria').then(m => ({ default: m.GuiaCarpintaria })));
const GuiaMecanica          = lazy(() => import('./pages/GuiaMecanica').then(m => ({ default: m.GuiaMecanica })));
const GuiaEletrica          = lazy(() => import('./pages/GuiaEletrica').then(m => ({ default: m.GuiaEletrica })));
const GuiaManutencao        = lazy(() => import('./pages/GuiaManutencao').then(m => ({ default: m.GuiaManutencao })));
const GuiaCondicionamento   = lazy(() => import('./pages/GuiaCondicionamento').then(m => ({ default: m.GuiaCondicionamento })));
const GuiaCulinaria         = lazy(() => import('./pages/GuiaCulinaria').then(m => ({ default: m.GuiaCulinaria })));
const GuiaAgricultura       = lazy(() => import('./pages/GuiaAgricultura').then(m => ({ default: m.GuiaAgricultura })));
const GuiaAnimais           = lazy(() => import('./pages/GuiaAnimais').then(m => ({ default: m.GuiaAnimais })));
const GuiaAbate             = lazy(() => import('./pages/GuiaAbate').then(m => ({ default: m.GuiaAbate })));
const GuiaCeramica          = lazy(() => import('./pages/GuiaCeramica').then(m => ({ default: m.GuiaCeramica })));
const GuiaColeta            = lazy(() => import('./pages/GuiaColeta').then(m => ({ default: m.GuiaColeta })));
const GuiaRastreamento      = lazy(() => import('./pages/GuiaRastreamento').then(m => ({ default: m.GuiaRastreamento })));
const GuiaArmadilhas        = lazy(() => import('./pages/GuiaArmadilhas').then(m => ({ default: m.GuiaArmadilhas })));
const GuiaLascamento        = lazy(() => import('./pages/GuiaLascamento').then(m => ({ default: m.GuiaLascamento })));
const GuiaAlvenaria         = lazy(() => import('./pages/GuiaAlvenaria').then(m => ({ default: m.GuiaAlvenaria })));
const ComparePage           = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
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

// NAV_ITEMS importado de lib/nav.ts — fonte única de verdade para nav + quick access

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function QuickNav() {
  const { t } = useTranslation();
  return (
    <section className="home-quick-nav" aria-label={t('home.quick_nav.aria')}>
      <p className="home-quick-nav-title">{t('home.quick_nav.title')}</p>
      <div className="quick-nav-grid">
        {NAV_ITEMS.map(item => (
          <Link key={item.to} to={item.to} className="quick-nav-card">
            <i className={`ti ${item.icon} quick-nav-icon`} aria-hidden="true" />
            <span className="quick-nav-label">{t(`home.quick_nav.${item.quickKey}.label`)}</span>
            <span className="quick-nav-sub">{t(`home.quick_nav.${item.quickKey}.sub`)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MainView() {
  const { toast, clearToast } = useToast();

  return (
    <>
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
        {!isOverlay && <Header onPainel={() => navigate('/painel')} />}
        <Suspense fallback={null}>
          <ScrollToTop />
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
            <Route path="/dicas/carpintaria" element={<GuiaCarpintaria />} />
            <Route path="/dicas/mecanica" element={<GuiaMecanica />} />
            <Route path="/dicas/eletrica" element={<GuiaEletrica />} />
            <Route path="/dicas/manutencao" element={<GuiaManutencao />} />
            <Route path="/dicas/condicionamento" element={<GuiaCondicionamento />} />
            <Route path="/dicas/culinaria" element={<GuiaCulinaria />} />
            <Route path="/dicas/agricultura" element={<GuiaAgricultura />} />
            <Route path="/dicas/animais" element={<GuiaAnimais />} />
            <Route path="/dicas/abate" element={<GuiaAbate />} />
            <Route path="/dicas/ceramica" element={<GuiaCeramica />} />
            <Route path="/dicas/coleta" element={<GuiaColeta />} />
            <Route path="/dicas/rastreamento" element={<GuiaRastreamento />} />
            <Route path="/dicas/armadilhas" element={<GuiaArmadilhas />} />
            <Route path="/dicas/lascamento" element={<GuiaLascamento />} />
            <Route path="/dicas/alvenaria" element={<GuiaAlvenaria />} />
            <Route path="/comparar" element={<ComparePage />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      {!isOverlay && <Footer />}
      {!isOverlay && <DonationButton />}
    </>
  );
}
