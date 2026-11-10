import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { NavBar } from '../components/navigation/NavBar';
import { LaboratoryFooter } from '../components/layout/LaboratoryFooter';
import { ToastHost } from '../components/feedback/ToastHost';
import { RouteFallback } from '../components/feedback/RouteFallback';
import PortalExperience from '../pages/PortalPage';

// The 3D-heavy and content-heavy pages are split so the first paint stays instant.
const TheoryPage = lazy(() => import('../pages/TheoryPage'));
const ApparatusPage = lazy(() => import('../pages/ApparatusPage'));
const ExperimentPage = lazy(() => import('../pages/ExperimentPage'));
const ObservationsPage = lazy(() => import('../pages/ObservationsPage'));
const AnalysisPage = lazy(() => import('../pages/AnalysisPage'));
const ResultsPage = lazy(() => import('../pages/ResultsPage'));
const VivaPage = lazy(() => import('../pages/VivaPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

/** Routes rendered inside the standard laboratory shell. */
function LaboratoryShell() {
  const location = useLocation();
  return (
    <>
      <NavBar />
      <main id="main" className="page-enter" key={location.pathname}>
        <Suspense fallback={<RouteFallback active />}>
          <Routes location={location}>
            <Route path="/theory" element={<TheoryPage />} />
            <Route path="/apparatus" element={<ApparatusPage />} />
            <Route path="/experiment" element={<ExperimentPage />} />
            <Route path="/observations" element={<ObservationsPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/viva" element={<VivaPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <LaboratoryFooter />
    </>
  );
}

/**
 * The portal owns the whole viewport, so it is deliberately rendered outside
 * the standard shell: its own header, its own section rail, its own cursor.
 */
function PortalShell() {
  const navigate = useNavigate();
  return <PortalExperience onArrive={(route) => navigate(route)} />;
}

export default function App() {
  const location = useLocation();
  const isPortal = location.pathname === '/';

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <a className="skip-link" href="#main">
        Skip to laboratory content
      </a>
      <ErrorBoundary fallbackTitle="This section could not be displayed">
        {isPortal ? (
          <main id="main">
            <PortalShell />
          </main>
        ) : (
          <LaboratoryShell />
        )}
      </ErrorBoundary>
      <ToastHost />
    </ErrorBoundary>
  );
}
