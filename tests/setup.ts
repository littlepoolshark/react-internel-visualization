import '@testing-library/jest-dom';

// Polyfill ResizeObserver for ReactFlow in jsdom
(globalThis as typeof globalThis & { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

