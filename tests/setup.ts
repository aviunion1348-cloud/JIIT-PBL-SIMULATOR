import '@testing-library/jest-dom/vitest';

// jsdom lacks these; the app must degrade gracefully, so we stub them here.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = (() => null) as never;
} else {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
    if (type === '2d' || type === 'webgl' || type === 'webgl2') return null;
    return (original as never as (...args: unknown[]) => unknown).call(this, type, ...rest);
  } as never;
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 16)) as never;
  window.cancelAnimationFrame = ((id: number) => window.clearTimeout(id)) as never;
}

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:stub';
  URL.revokeObjectURL = () => {};
}

// jsdom does not implement scrolling; the app only uses it for route resets.
window.scrollTo = (() => {}) as never;
