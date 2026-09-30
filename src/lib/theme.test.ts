import { act, renderHook } from "@testing-library/react";

import { THEME_STORAGE_KEY } from "./constants";
import { applyTheme, readThemeChoice, resolveTheme, setThemeChoice, useTheme, watchTheme } from "./theme";

type ChangeListener = () => void;

/** A controllable prefers-color-scheme media query. */
function stubSystem(dark: boolean) {
    const listeners = new Set<ChangeListener>();
    const query = {
        matches: dark,
        addEventListener: (_: string, l: ChangeListener) => listeners.add(l),
        removeEventListener: (_: string, l: ChangeListener) => listeners.delete(l),
    };
    vi.spyOn(window, "matchMedia").mockImplementation(() => query as unknown as MediaQueryList);
    return {
        listeners,
        set(next: boolean) {
            query.matches = next;
            listeners.forEach((l) => l());
        },
    };
}

const root = document.documentElement;

afterEach(() => {
    setThemeChoice("system");
    root.classList.remove("dark");
    root.style.colorScheme = "";
});

describe("readThemeChoice", () => {
    it("reads a stored light or dark choice", () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
        expect(readThemeChoice()).toBe("dark");
        window.localStorage.setItem(THEME_STORAGE_KEY, "light");
        expect(readThemeChoice()).toBe("light");
    });

    it("falls back to the system for missing or unknown values", () => {
        expect(readThemeChoice()).toBe("system");
        window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
        expect(readThemeChoice()).toBe("system");
    });

    it("falls back to the system when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("denied");
        });
        expect(readThemeChoice()).toBe("system");
    });
});

describe("resolveTheme", () => {
    it("follows the system preference for the system choice", () => {
        const system = stubSystem(false);
        expect(resolveTheme("system")).toBe("light");
        system.set(true);
        expect(resolveTheme("system")).toBe("dark");
    });

    it("keeps an explicit choice", () => {
        stubSystem(true);
        expect(resolveTheme("light")).toBe("light");
        expect(resolveTheme("dark")).toBe("dark");
    });
});

describe("applyTheme", () => {
    it("sets the dark class and the colour scheme on <html>", () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
        expect(applyTheme()).toBe("dark");
        expect(root).toHaveClass("dark");
        expect(root.style.colorScheme).toBe("dark");

        window.localStorage.setItem(THEME_STORAGE_KEY, "light");
        expect(applyTheme()).toBe("light");
        expect(root).not.toHaveClass("dark");
        expect(root.style.colorScheme).toBe("light");
    });
});

describe("setThemeChoice", () => {
    it("stores, applies and forgets a choice", () => {
        stubSystem(false);
        setThemeChoice("dark");
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
        expect(root).toHaveClass("dark");

        setThemeChoice("system");
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
        expect(root).not.toHaveClass("dark");
    });

    it("keeps the choice for this page when storage cannot store it", () => {
        stubSystem(false);
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("denied");
        });
        setThemeChoice("dark");
        expect(readThemeChoice()).toBe("dark");
        expect(root).toHaveClass("dark");
    });
});

describe("watchTheme", () => {
    it("follows system changes while nothing is chosen, and stops when unsubscribed", () => {
        const system = stubSystem(false);
        const listener = vi.fn();
        const stop = watchTheme(listener);

        system.set(true);
        expect(root).toHaveClass("dark");
        expect(listener).toHaveBeenCalledTimes(1);

        stop();
        expect(system.listeners.size).toBe(0);
        system.set(false);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("picks up a choice made in another tab", () => {
        stubSystem(false);
        const listener = vi.fn();
        const stop = watchTheme(listener);

        window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
        window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
        expect(listener).not.toHaveBeenCalled();
        window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
        expect(listener).toHaveBeenCalledTimes(1);
        expect(root).toHaveClass("dark");
        stop();
    });

    it("works without a listener", () => {
        const system = stubSystem(false);
        const stop = watchTheme();
        system.set(true);
        expect(root).toHaveClass("dark");
        stop();
    });
});

describe("useTheme", () => {
    it("toggles between light and dark as an explicit choice", () => {
        stubSystem(false);
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe("light");

        act(() => result.current.toggle());
        expect(result.current.theme).toBe("dark");
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

        act(() => result.current.toggle());
        expect(result.current.theme).toBe("light");
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    });
});
