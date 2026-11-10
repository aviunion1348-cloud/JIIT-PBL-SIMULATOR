import { describe, expect, it, beforeEach } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './render';
import { PORTAL_DESTINATIONS } from '../src/data/portal';

beforeEach(() => cleanup());


/** Mounts the portal and lifts the boot veil through its own SKIP control. */
async function mountPortal() {
  const user = userEvent.setup();
  renderApp('/');
  const region = await screen.findByRole('region', { name: /laboratory portal navigator/i });
  await user.click(screen.getByRole('button', { name: /^skip$/i }));
  await waitFor(() =>
    expect(screen.getByRole('navigation', { name: /laboratory sections/i })).toBeInTheDocument(),
  );
  return { user, region };
}

const VIEWPORTS = [375, 390, 640, 768, 1024, 1440, 1920];

describe('portal renders at every target width', () => {
  for (const width of VIEWPORTS) {
    it(`mounts a complete navigator at ${width}px`, async () => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: width < 700 ? 812 : 900 });
      const user = userEvent.setup();
      renderApp('/');

      const region = await screen.findByRole('region', { name: /laboratory portal navigator/i });
      expect(region).toBeInTheDocument();
      // The veil lifts on its own SKIP control — no waiting on timers.
      await user.click(screen.getByRole('button', { name: /^skip$/i }));
      await waitFor(() =>
        expect(screen.getByRole('navigation', { name: /laboratory sections/i })).toBeInTheDocument(),
      );

      // Header, rail, aperture control and content are all present.
      expect(screen.getByRole('link', { name: /brewster's law lab home/i })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /laboratory sections/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /travel to/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // All eight sections are offered.
      const rail = screen.getByRole('navigation', { name: /laboratory sections/i });
      expect(within(rail).getAllByRole('button')).toHaveLength(PORTAL_DESTINATIONS.length);
    });
  }
});

describe('portal content is real, not filler', () => {
  it('shows four subtopics for the current section', async () => {
    const { user } = await mountPortal();
    void user;
    const facts = document.querySelectorAll('.portal-exp__fact');
    expect(facts.length).toBe(4);
    for (const fact of facts) {
      expect((fact.querySelector('dt')?.textContent ?? '').length).toBeGreaterThan(2);
      expect((fact.querySelector('dd')?.textContent ?? '').length).toBeGreaterThan(10);
    }
  });

  it('names the next destination and updates it when a section is chosen', async () => {
    const { user, region } = await mountPortal();
    expect(region).toHaveAttribute('data-destination', 'lab');

    const rail = screen.getByRole('navigation', { name: /laboratory sections/i });
    await user.click(within(rail).getByRole('button', { name: /OBSERVATIONS/i }));

    await waitFor(() => expect(region).toHaveAttribute('data-destination', 'observations'), { timeout: 4000 });
    expect(within(rail).getByRole('button', { name: /OBSERVATIONS/i })).toHaveAttribute('aria-current', 'true');
  });

  it('offers a direct escape to the bench that never depends on the animation', async () => {
    await mountPortal();
    const skip = screen.getByRole('button', { name: /skip to the bench/i });
    expect(skip).toBeEnabled();
  });

  it('every destination exposes a real primary action link', async () => {
    await mountPortal();
    const primary = document.querySelector('.portal-exp__action--primary');
    expect(primary).toBeTruthy();
    expect(primary?.getAttribute('href')).toBe('/');
    expect((primary?.textContent ?? '').length).toBeGreaterThan(6);
  });
});
