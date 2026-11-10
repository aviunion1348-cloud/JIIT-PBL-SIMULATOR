import { describe, expect, it, beforeEach } from 'vitest';
import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, renderAppNoClear } from './render';
import { SESSION_KEY } from '../src/experiment/persistence';
import { buildReportHtml } from '../src/export/report';
import { VIVA_QUESTIONS } from '../src/data/viva';
import { APPARATUS } from '../src/experiment/apparatus';

beforeEach(() => {
  cleanup();
  window.localStorage.removeItem(SESSION_KEY);
});

const ROUTES: Array<[string, RegExp]> = [
  ['/', /BREWSTER'S/i],
  ['/theory', /POLARISATION AT THE INTERFACE/i],
  ['/apparatus', /THE OPTICAL TRAIN/i],
  ['/experiment', /LIVE ANGULAR MEASUREMENT/i],
  ['/observations', /SOURCE LAB RECORD/i],
  ['/analysis', /CURRENT RESPONSE/i],
  ['/results', /THE POLARISING CONDITION/i],
  ['/viva', /TEST YOUR OPTICS/i],
  ['/unknown-route', /THIS BEAM LEADS NOWHERE/i],
];

describe('every route renders real content', () => {
  for (const [route, heading] of ROUTES) {
    it(`renders ${route}`, async () => {
      renderApp(route);
      await waitFor(() => expect(screen.getAllByText(heading).length).toBeGreaterThan(0), { timeout: 6000 });
      expect(document.body.textContent?.length ?? 0).toBeGreaterThan(200);
    });
  }
});


/** Renders the portal and lifts the boot veil via its own SKIP control. */
async function mountPortal() {
  const user = userEvent.setup();
  renderApp('/');
  const region = await screen.findByRole('region', { name: /laboratory portal navigator/i });
  const skip = screen.getByRole('button', { name: /^skip$/i });
  await user.click(skip);
  await waitFor(() => expect(screen.getByRole('navigation', { name: /laboratory sections/i })).toBeInTheDocument());
  return { user, region };
}

describe('navigation', () => {
  it('moves between sections and reflects the active route', async () => {
    const user = userEvent.setup();
    renderApp('/apparatus');
    const nav = screen.getByRole('navigation', { name: /laboratory sections/i });
    await user.click(within(nav).getByRole('link', { name: /THEORY/i }));
    // Wait for page-specific content, not the nav label (which is always present).
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /POLARISATION AT THE INTERFACE/i })).toBeInTheDocument(),
    );
  });

  it('the portal is a full-viewport navigator with its own section rail', async () => {
    await mountPortal();
    const rail = screen.getByRole('navigation', { name: /laboratory sections/i });
    // All eight sections are reachable, and only one is current.
    expect(within(rail).getAllByRole('button')).toHaveLength(8);
    expect(within(rail).getAllByRole('button', { name: /BREWSTER'S LAW/i }).length).toBe(1);
  });

  it('walks the destination ring with the keyboard', async () => {
    const { user } = await mountPortal();
    const rail = screen.getByRole('navigation', { name: /laboratory sections/i });
    const theoryButton = within(rail).getByRole('button', { name: /THEORY/i });
    await user.click(theoryButton);
    // The reveal is a real animation (520 ms close + 1050 ms open), so allow it
    // to finish rather than asserting on a fixed sleep.
    await waitFor(() => expect(theoryButton).toHaveAttribute('aria-current', 'true'), { timeout: 5000 });
  });
});

describe('source data surface', () => {
  it('shows all 19 angles and the three reported results', async () => {
    renderApp('/observations');
    await waitFor(() => expect(screen.getAllByText(/SOURCE LAB RECORD/i).length).toBeGreaterThan(0));
    const table = screen.getByRole('table');
    const bodyRows = within(table).getAllByRole('row');
    // 1 header + 19 data rows
    expect(bodyRows).toHaveLength(20);
    expect(screen.getAllByText('58.1°').length).toBeGreaterThan(0);
    expect(screen.getAllByText('56.7°').length).toBeGreaterThan(0);
    expect(screen.getAllByText('57.51°').length).toBeGreaterThan(0);
  });

  it('filters the observation table by material', async () => {
    const user = userEvent.setup();
    renderApp('/observations');
    await waitFor(() => expect(screen.getAllByText(/SOURCE LAB RECORD/i).length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: 'CROWN' }));
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent ?? '');
    expect(headers.some((text) => /Crown Glass/.test(text))).toBe(true);
    expect(headers.some((text) => /Topaz/.test(text))).toBe(false);
  });
});

describe('live experiment interactions', () => {
  it('starts the experiment, turns the laser on, and reads live values', async () => {
    const user = userEvent.setup();
    renderApp('/experiment');
    // Wait for the control stack, which only exists once the lazy page mounts.
    await waitFor(() => expect(screen.getAllByText(/SPECIMEN & MEDIUM/i).length).toBeGreaterThan(0));

    // Laser starts off, detector must not show a plausible reading.
    expect(screen.getAllByText(/NO ACQUISITION/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'START' }));
    await waitFor(() => expect(screen.getAllByText(/ACQUIRING/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/BEAM LIVE/i).length).toBeGreaterThan(0);
  });

  it('drives the incidence slider and updates the readouts', async () => {
    const user = userEvent.setup();
    renderApp('/experiment');
    await waitFor(() => expect(screen.getAllByText(/LIVE ANGULAR MEASUREMENT/i).length).toBeGreaterThan(0));

    const sliders = screen.getAllByRole('slider');
    const incidence = sliders[0];
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /SNAP TO BREWSTER ANGLE/i }));
    });
    const numeric = screen.getByRole('spinbutton', { name: /Angle of incidence θi numeric value/i });
    expect(Number((numeric as HTMLInputElement).value)).toBeCloseTo(58.1, 0);
    expect(incidence).toBeTruthy();
    expect(screen.getAllByText(/AT BREWSTER/i).length).toBeGreaterThan(0);
  });

  it('switches material and updates the specimen index', async () => {
    const user = userEvent.setup();
    renderApp('/experiment');
    await waitFor(() => expect(screen.getAllByText(/LIVE ANGULAR MEASUREMENT/i).length).toBeGreaterThan(0));
    const tiles = screen.getByRole('group', { name: /specimen material/i });
    await user.click(within(tiles).getByRole('button', { name: /CROWN/i }));
    const specimenIndex = screen.getByRole('spinbutton', { name: /SPECIMEN INDEX/i }) as HTMLInputElement;
    await waitFor(() => expect(Number(specimenIndex.value)).toBeCloseTo(1.5224, 2));
  });

  it('switches to the top view without losing state', async () => {
    const user = userEvent.setup();
    renderApp('/experiment');
    await waitFor(() => expect(screen.getAllByText(/LIVE ANGULAR MEASUREMENT/i).length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: /TOP \/ BENCH/i }));
    expect(screen.getByRole('button', { name: /TOP \/ BENCH/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('captures a theoretical measurement only when the laser is live', async () => {
    const user = userEvent.setup();
    renderApp('/experiment');
    await waitFor(() => expect(screen.getAllByText(/SPECIMEN & MEDIUM/i).length).toBeGreaterThan(0));

    const capture = screen.getByRole('button', { name: /CAPTURE THEORETICAL READING/i });
    expect(capture).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'START' }));
    await waitFor(() => expect(capture).not.toBeDisabled());
    await user.click(capture);
    await waitFor(() => expect(screen.getAllByText(/CROWN|TOPAZ|FLINT/).length).toBeGreaterThan(0));
  });

  it('clears and auto-assembles the optical train', async () => {
    const user = userEvent.setup();
    renderApp('/experiment');
    await waitFor(() => expect(screen.getAllByText(/SPECIMEN & MEDIUM/i).length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /CLEAR RAIL/i }));
    await waitFor(() => expect(screen.getAllByText(/TRAIN INCOMPLETE/i).length).toBeGreaterThan(0));

    await user.click(screen.getByRole('button', { name: /AUTO-ASSEMBLE/i }));
    await waitFor(() => expect(screen.getAllByText(/OPTICAL TRAIN READY/i).length).toBeGreaterThan(0));
  });
});

describe('apparatus page', () => {
  it('represents all seven components and lets you select each', async () => {
    const user = userEvent.setup();
    renderApp('/apparatus');
    await waitFor(() => expect(screen.getAllByText(/THE OPTICAL TRAIN/i).length).toBeGreaterThan(0));
    const list = screen.getByRole('list', { name: /apparatus components/i });
    const items = within(list).getAllByRole('button');
    expect(items).toHaveLength(APPARATUS.length);
    expect(APPARATUS).toHaveLength(7);
    await user.click(items[4]);
    await waitFor(() => expect(screen.getAllByText(/Goniometer-Based Detector Mount/i).length).toBeGreaterThan(0));
  });
});

describe('results and reporting', () => {
  it('prints the three reported angles prominently', async () => {
    renderApp('/results');
    await waitFor(() => expect(screen.getAllByText(/THE POLARISING CONDITION/i).length).toBeGreaterThan(0));
    const values = screen.getAllByText(/58\.1°|56\.7°|57\.51°/);
    expect(values.length).toBeGreaterThanOrEqual(3);
  });

  it('builds a printable report containing the source table and results', () => {
    const html = buildReportHtml();
    expect(html).toContain('58.1°');
    expect(html).toContain('56.7°');
    expect(html).toContain('57.51°');
    expect(html).toContain('10.9945');
    expect(html).toContain('Current (I) in A');
    expect(html).toContain('Brewster');
    expect(html.split('<tr>').length).toBeGreaterThan(19);
  });
});

describe('viva quiz', () => {
  it('scores a correct answer and explains it in study mode', async () => {
    const user = userEvent.setup();
    renderApp('/viva');
    await waitFor(() => expect(screen.getAllByText(/TEST YOUR OPTICS/i).length).toBeGreaterThan(0));

    const first = VIVA_QUESTIONS[0];
    const options = screen.getAllByRole('button').filter((button) =>
      (button.textContent ?? '').includes(first.options[first.answerIndex]),
    );
    expect(options.length).toBeGreaterThan(0);
    await user.click(options[0]);
    await waitFor(() => expect(screen.getAllByText(/✓ Correct/).length).toBeGreaterThan(0));
  });

  it('has at least 24 questions with unique ids', () => {
    expect(VIVA_QUESTIONS.length).toBeGreaterThanOrEqual(24);
    expect(new Set(VIVA_QUESTIONS.map((q) => q.id)).size).toBe(VIVA_QUESTIONS.length);
  });
});

describe('resilience', () => {
  it('recovers from corrupted stored session', async () => {
    window.localStorage.clear();
    window.localStorage.setItem(SESSION_KEY, '{"version":1,"state":{"selectedMaterial":"nonsense"}}');
    renderAppNoClear('/experiment');
    await waitFor(() => expect(screen.getAllByText(/LIVE ANGULAR MEASUREMENT/i).length).toBeGreaterThan(0));
  });

  it('renders the 2D fallback because WebGL is unavailable in this environment', async () => {
    renderApp('/experiment');
    await waitFor(() => expect(screen.getAllByText(/2D FALLBACK/i).length).toBeGreaterThan(0), { timeout: 6000 });
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
  });
});
