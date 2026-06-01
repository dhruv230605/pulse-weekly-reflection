import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for jsdom (needed by Recharts)
(globalThis as Record<string, unknown>).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
