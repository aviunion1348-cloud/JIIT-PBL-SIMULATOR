import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import App from '../src/app/App';
import { ExperimentProvider } from '../src/experiment/experimentStore';

export function renderApp(route = '/') {
  window.localStorage.clear();
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ExperimentProvider>
        <App />
      </ExperimentProvider>
    </MemoryRouter>,
  );
}

/** Renders without clearing storage — for tests that seed a session first. */
export function renderAppNoClear(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ExperimentProvider>
        <App />
      </ExperimentProvider>
    </MemoryRouter>,
  );
}

export function renderWithProvider(element: ReactElement, route = '/') {
  window.localStorage.clear();
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ExperimentProvider>{element}</ExperimentProvider>
    </MemoryRouter>,
  );
}
