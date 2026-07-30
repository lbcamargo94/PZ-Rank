import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { setOnUnauthorized } from './lib/api';
import type { ModSession } from './types';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SeasonEndOverlay } from './components/SeasonEndOverlay';
import { CommunityStats } from './components/CommunityStats';
import { NewsButton }     from './components/NewsCard';
import { AdBanner }      from './components/AdBanner';
import { RulesModal } from './components/RulesModal';
import { ChallengeSettingsModal } from './components/ChallengeSettingsModal';
import { PainelPage } from './pages/PainelPage';
import { PlayerPage } from './pages/PlayerPage';
import { OverlayPage } from './pages/OverlayPage';
import { WikiPage } from './pages/WikiPage';
import { WikiHuntingPage } from './pages/WikiHuntingPage';
import { ModsPage } from './pages/ModsPage';
import { TipsPage } from './pages/TipsPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';
import { AccountPage } from './pages/AccountPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ClaimAccountPage } from './pages/ClaimAccountPage';
import { ResendVerificationPage } from './pages/ResendVerificationPage';
import { LegendsPage }            from './pages/LegendsPage';
import { TransparenciaPage }      from './pages/TransparenciaPage';
import { MapPage }                from './pages/MapPage';
import { LinksUteisPage }         from './pages/LinksUteisPage';
import { RankPage }               from './pages/RankPage';

function MainView() {
  const navigate = useNavigate();
  const [showRules,    setShowRules]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast, clearToast } = useToast();

  return (
    <>
      <Header
        onPainel={() => navigate('/painel')}
        onRules={() => setShowRules(true)}
        onSettings={() => setShowSettings(true)}
      />
      <SeasonEndOverlay />
      <main>
        <CommunityStats />

        <div className="container news-trigger-row">
          <NewsButton />
        </div>

        <div className="container ad-banner-container">
          <AdBanner />
        </div>

        <div className="container home-rank-cta">
          <Link to="/rank" className="btn-primary btn-lg">
            <i className="ti ti-trophy" aria-hidden="true" /> Ver Ranking
          </Link>
        </div>
      </main>

      <Toast {...toast} onClose={clearToast} />

      {showRules    && <RulesModal             onClose={() => setShowRules(false)}    />}
      {showSettings && <ChallengeSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [modSession, setModSession] = useState<ModSession | null>(() => {
    try {
      const raw = sessionStorage.getItem('mod_session');
      return raw ? (JSON.parse(raw) as ModSession) : null;
    } catch { return null; }
  });

  useEffect(() => {
    setOnUnauthorized(() => setModSession(null));
  }, []);

  useEffect(() => {
    if (modSession) sessionStorage.setItem('mod_session', JSON.stringify(modSession));
    else sessionStorage.removeItem('mod_session');
  }, [modSession]);

  return (
    <>
      <div className="page-body">
        <Routes>
          <Route path="/" element={<MainView />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/player/:id" element={<PlayerPage />} />
          <Route path="/overlay/:id" element={<OverlayPage />} />
          <Route path="/wiki" element={<WikiPage />} />
          <Route path="/wiki/cacada" element={<WikiHuntingPage />} />
          <Route path="/mods" element={<ModsPage />} />
          <Route path="/dicas" element={<TipsPage />} />
          <Route path="/verificar-email"  element={<VerifyEmailPage />} />
          <Route path="/redefinir-senha"  element={<ResetPasswordPage />} />
          <Route path="/ativar-conta"     element={<ActivateAccountPage />} />
          <Route path="/minha-conta"      element={<AccountPage />} />
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
              onBack={() => navigate('/')}
            />
          } />
        </Routes>
      </div>
      <Footer />
    </>
  );
}