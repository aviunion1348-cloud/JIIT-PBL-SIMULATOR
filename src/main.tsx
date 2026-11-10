import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { ExperimentProvider } from './experiment/experimentStore';
import { validateSourceData } from './data/observations';
import './styles/global.css';

// Fail loudly in development if the immutable dataset was ever altered.
const issues = validateSourceData();
if (issues.length > 0) {
  console.error('[BrewstersLab] source data integrity issue', issues);
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element missing — check index.html');
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <ExperimentProvider>
        <App />
      </ExperimentProvider>
    </BrowserRouter>
  </StrictMode>,
);
