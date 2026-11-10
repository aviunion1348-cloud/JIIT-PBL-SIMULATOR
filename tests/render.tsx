import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import App from '../src/app/App';
import { ExperimentProvider } from '../src/experiment/experimentStore';
import { SESSION_KEY } from '../src/experiment/persistence';

export function renderApp(route = '/') {
  window.localStorage.removeItem(SESSION_KEY);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ExperimentProvider>
        <App />
      </ExperimentProvider>
    </MemoryRouter>,
  );
}

export function renderWithProvider(element: ReactElement, route = '/') {
  window.localStorage.removeItem(SESSION_KEY);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ExperimentProvider>{element}</ExperimentProvider>
    </MemoryRouter>,
  );
}
