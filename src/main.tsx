import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { ExperimentProvider } from './experiment/experimentStore';
import { validateSourceData } from './data/observations';

// Fonts are bundled at build time from npm packages — no runtime CDN request.
// Only the weights actually used are imported, and each family is latin-subset.
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
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
