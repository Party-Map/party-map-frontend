import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, vi } from "vitest";

import { resetSession } from "@/auth/session";

afterEach(() => {
    cleanup();
    resetSession();
    // sonner keeps its toasts in a module-level store; start every test with none.
    toast.dismiss();
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
// cmdk scrolls the chosen option into view; jsdom has no layout to scroll.
Element.prototype.scrollIntoView = () => {};
