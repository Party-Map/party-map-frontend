import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
});

// jsdom does not implement matchMedia; the theme provider reads it on mount.
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    }),
});

// Leaflet and a few components measure elements; jsdom has no layout engine.
if (!("ResizeObserver" in window)) {
    class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    Object.defineProperty(window, "ResizeObserver", { writable: true, value: ResizeObserverStub });
}

window.scrollTo = () => {};
