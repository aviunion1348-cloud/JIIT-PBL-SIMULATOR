import { describe, expect, it } from 'vitest';
import {
  PORTAL_DESTINATIONS,
  buildSceneData,
  destinationAt,
  nextIndex,
} from '../src/data/portal';
import {
  advanceTilt,
  computeMaskGeometry,
  createMaskState,
  easeInOutCubic,
  project,
  roundedRectPoints,
  TILT_X,
  TILT_Y,
  updateTiltTargets,
} from '../src/portal/maskEngine';
import { ROUTES } from '../src/app/routes';

describe('portal destination model', () => {
  it('covers every laboratory route exactly once', () => {
    const portalRoutes = PORTAL_DESTINATIONS.map((entry) => entry.route);
    const knownRoutes = ROUTES.map((route) => route.path);
    expect(new Set(portalRoutes).size).toBe(portalRoutes.length);
    for (const route of portalRoutes) expect(knownRoutes).toContain(route);
    // Every non-home route is reachable from the portal.
    for (const route of knownRoutes) expect(portalRoutes).toContain(route);
  });

  it('gives every destination real subtopics', () => {
    for (const destination of PORTAL_DESTINATIONS) {
      expect(destination.subtopics.length).toBe(4);
      for (const subtopic of destination.subtopics) {
        expect(subtopic.term.length).toBeGreaterThan(2);
        expect(subtopic.detail.length).toBeGreaterThan(10);
      }
      expect(destination.action.length).toBeGreaterThan(4);
      expect(destination.index).toMatch(/^\[\d{2}\]$/);
    }
  });

  it('wraps around the ring in both directions', () => {
    expect(nextIndex(PORTAL_DESTINATIONS.length - 1)).toBe(0);
    expect(destinationAt(PORTAL_DESTINATIONS.length).key).toBe(PORTAL_DESTINATIONS[0].key);
    expect(destinationAt(-1).key).toBe(PORTAL_DESTINATIONS[PORTAL_DESTINATIONS.length - 1].key);
  });

  it('ignores unknown indices rather than throwing', () => {
    expect(() => destinationAt(Number.NaN)).not.toThrow();
    expect(destinationAt(Number.NaN)).toBeDefined();
  });

  it('derives scene geometry from the real physics engine', () => {
    const scene = buildSceneData(PORTAL_DESTINATIONS[0]);
    expect(scene.brewsterDeg).toBeGreaterThan(50);
    expect(scene.brewsterDeg).toBeLessThan(65);
    expect(scene.refractionDeg).not.toBeNull();
    expect(scene.reflectedFraction).toBeGreaterThanOrEqual(0);
    expect(scene.reflectedFraction).toBeLessThanOrEqual(1);
  });
});

describe('mask geometry', () => {
  it('accumulates the four corner arcs into a closed outline', () => {
    const points = roundedRectPoints(320, 350, 90);
    // 4 corners × 11 samples
    expect(points).toHaveLength(44);
    // Every point sits inside the rect bounds.
    for (const [x, y] of points) {
      expect(Math.abs(x)).toBeLessThanOrEqual(160.0001);
      expect(Math.abs(y)).toBeLessThanOrEqual(175.0001);
    }
  });

  it('clamps the corner radius to half the shorter side', () => {
    const tiny = roundedRectPoints(40, 20, 90);
    for (const [, y] of tiny) expect(Math.abs(y)).toBeLessThanOrEqual(10.0001);
  });

  it('at zero expansion the aperture matches the DOM rect', () => {
    const state = createMaskState();
    state.maskScale = 1;
    const geometry = computeMaskGeometry(state, { x: 500, y: 200, width: 320, height: 350 }, 1440, 900);
    const xs = geometry.points.map(([x]) => x);
    const ys = geometry.points.map(([, y]) => y);
    expect(Math.min(...xs)).toBeCloseTo(500, 4);
    expect(Math.max(...xs)).toBeCloseTo(820, 4);
    expect(Math.min(...ys)).toBeCloseTo(200, 4);
    expect(Math.max(...ys)).toBeCloseTo(550, 4);
  });

  it('at full expansion the aperture covers the viewport and relaxes tilt', () => {
    const state = createMaskState();
    state.expansion = 1;
    state.rotX = 12;
    state.rotY = -14;
    const geometry = computeMaskGeometry(state, { x: 500, y: 200, width: 320, height: 350 }, 1440, 900);
    expect(geometry.rotX).toBe(0);
    expect(geometry.rotY).toBe(0);
    // A fully expanded aperture covers the viewport edge to edge, exactly.
    const xs = geometry.points.map(([x]) => x);
    const ys = geometry.points.map(([, y]) => y);
    expect(Math.min(...xs)).toBeCloseTo(0, 6);
    expect(Math.max(...xs)).toBeCloseTo(1440, 6);
    expect(Math.min(...ys)).toBeCloseTo(0, 6);
    expect(Math.max(...ys)).toBeCloseTo(900, 6);
  });

  it('projects with the documented focal length', () => {
    const [x, y] = project(10, 0, 0, 0, 0, 0);
    expect(x).toBeCloseTo(10, 6);
    expect(y).toBeCloseTo(0, 6);
    // A point pushed away from the viewer shrinks.
    const [far] = project(100, 0, 0, 45, 0, 0);
    expect(far).toBeLessThan(100);
  });

  it('stays inside the published tilt envelope', () => {
    const state = createMaskState();
    // Pointer hard into a corner.
    updateTiltTargets(state, 100000, 100000, 1000, 1000);
    expect(Math.abs(state.targetY)).toBeLessThanOrEqual(TILT_Y * 2);
    expect(Math.abs(state.targetX)).toBeLessThanOrEqual(TILT_X * 2);
    for (let i = 0; i < 400; i += 1) advanceTilt(state, 16, false);
    expect(Math.abs(state.rotX)).toBeLessThanOrEqual(TILT_X * 2 + 0.001);
    expect(Math.abs(state.rotY)).toBeLessThanOrEqual(TILT_Y * 2 + 0.001);
  });

  it('never tilts when reduced motion is requested', () => {
    const state = createMaskState();
    updateTiltTargets(state, 0, 0, 1000, 1000);
    advanceTilt(state, 16, true);
    expect(state.rotX).toBe(0);
    expect(state.rotY).toBe(0);
  });
});

describe('easing', () => {
  it('is pinned at both ends and symmetric at the midpoint', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
  });

  it('clamps out-of-range input', () => {
    expect(easeInOutCubic(-4)).toBe(0);
    expect(easeInOutCubic(9)).toBe(1);
  });
});
