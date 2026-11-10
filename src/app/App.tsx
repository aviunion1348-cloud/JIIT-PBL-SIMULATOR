import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { NavBar } from '../components/navigation/NavBar';
import { LaboratoryFooter } from '../components/layout/LaboratoryFooter';
import { ToastHost } from '../components/feedback/ToastHost';
import { RouteFallback } from '../components/feedback/RouteFallback';
import HomePage from '../pages/HomePage';

// The 3D-heavy pages are split so the first paint stays instant.
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

function RoutedPages() {
  const location = useLocation();
  return (
    <main id="main" className="page-enter" key={location.pathname}>
      <RouteFallback />
      <Suspense fallback={<RouteFallback active />}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
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
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <a className="skip-link" href="#main">
        Skip to laboratory content
      </a>
      <NavBar />
      <ErrorBoundary fallbackTitle="This section could not be displayed">
        <RoutedPages />
      </ErrorBoundary>
      <LaboratoryFooter />
      <ToastHost />
    </ErrorBoundary>
  );
}
