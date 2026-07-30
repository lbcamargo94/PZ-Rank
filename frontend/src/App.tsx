import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { setOnUnauthorized } from './lib/api';
import type { ModSession } from './types';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SeasonEndOverlay } from './components/SeasonEndOverlay';
import { CommunityStats } from './components/CommunityStats';
import { NewsInline }     from './components/NewsCard';
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

const QUICK_NAV = [
  { to: '/rank',          icon: 'ti-trophy',           label: 'Ranking',         sub: 'Classificação geral'   },
  { to: '/wiki',          icon: 'ti-book',             label: 'Wiki de Caça',    sub: 'Guia de caçadas'       },
  { to: '/mods',          icon: 'ti-puzzle',           label: 'Mods Permitidos', sub: 'Lista oficial'         },
  { to: '/dicas',         icon: 'ti-bulb',             label: 'Dicas',           sub: 'Guia de sobrevivência' },
  { to: '/lendas',        icon: 'ti-medal',            label: 'Lendas',          sub: 'Hall da fama'          },
  { to: '/links',         icon: 'ti-link',             label: 'Links Úteis',     sub: 'Recursos do campeonato'},
  { to: '/mapa',          icon: 'ti-map',              label: 'Mapa',            sub: 'Knox County'           },
  { to: '/transparencia', icon: 'ti-file-certificate', label: 'Transparência',   sub: 'Dados do servidor'     },
] as const;

const PAGE_SIZE  = 4;
const NAV_PAGES  = Math.ceil(QUICK_NAV.length / PAGE_SIZE);

function QuickNavCarousel() {
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPage(p => (p + 1) % NAV_PAGES);
    }, 60_000);
  }

  function handlePrev() {
    setPage(p => (p - 1 + NAV_PAGES) % NAV_PAGES);
    startTimer();
  }

  function handleNext() {
    setPage(p => (p + 1) % NAV_PAGES);
    startTimer();
  }

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pageItems = QUICK_NAV.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="home-quick-nav" aria-label="Acesso rápido">
      <div className="home-quick-nav-header">
        <p className="home-quick-nav-title">Acesso Rápido</p>
        <div className="quick-nav-controls">
          <button className="qnav-arrow-btn" onClick={handlePrev} aria-label="Anterior">
            <i className="ti ti-chevron-left" />
          </button>
          <div className="qnav-dots">
            {Array.from({ length: NAV_PAGES }, (_, i) => (
              <button
                key={i}
                className={`qnav-dot${i === page ? ' qnav-dot--active' : ''}`}
                onClick={() => { setPage(i); startTimer(); }}
                aria-label={`Página ${i + 1}`}
              />
            ))}
          </div>
          <button className="qnav-arrow-btn" onClick={handleNext} aria-label="Próximo">
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      </div>

      <div key={page} className="quick-nav-page">
        {pageItems.map(item => (
          <Link key={item.to} to={item.to} className="quick-nav-card">
            <i className={`ti ${item.icon} quick-nav-icon`} aria-hidden="true" />
            <span className="quick-nav-label">{item.label}</span>
            <span className="quick-nav-sub">{item.sub}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

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
      <CommunityStats />
      <main>
        <div className="container">

          <div className="home-grid">
            <aside className="home-aside-news">
              <NewsInline />
            </aside>
            <aside className="home-aside-ad">
              <AdBanner />
            </aside>
          </div>

          <QuickNavCarousel />

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
          <Route path="/login"             element={<AccountPage />} />
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