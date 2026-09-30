// The colour theme: light, dark or the system's. The viewer's choice lives in localStorage; the theme in
// effect is the `dark` class and `color-scheme` on <html>, which base.scss keys the dark tokens on. While
// nothing is chosen the theme follows prefers-color-scheme, live. index.html applies the same rule before
// first paint, so there is no flash of the wrong theme.
import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "./constants";

export type Theme = "light" | "dark";
export type ThemeChoice = Theme | "system";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();
// The last choice made on this page: it stands in when storage cannot keep it.
let pageChoice: ThemeChoice = "system";

/** The stored choice, else the one made on this page, else "system". */
export function readThemeChoice(): ThemeChoice {
    try {
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark") return saved;
    } catch {
        // Storage may be unavailable (private mode, blocked site data).
    }
    return pageChoice;
}

/** The theme a choice resolves to. */
export function resolveTheme(choice: ThemeChoice = readThemeChoice()): Theme {
    if (choice !== "system") return choice;
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Put the theme in effect on <html> and return it. */
export function applyTheme(): Theme {
    const theme = resolveTheme();
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    return theme;
}

/** Store a choice ("system" forgets it) and apply it. */
export function setThemeChoice(choice: ThemeChoice): void {
    pageChoice = choice;
    try {
        if (choice === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
        else window.localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch {
        // Without storage the choice lasts for this page only.
    }
    applyTheme();
    listeners.forEach((listener) => listener());
}

/**
 * Keep the theme in effect while the system preference or another tab's choice changes.
 * Returns the unsubscribe function.
 */
export function watchTheme(listener: () => void = () => undefined): () => void {
    const onChange = () => {
        applyTheme();
        listener();
    };
    const onStorage = (event: StorageEvent) => {
        if (event.key === THEME_STORAGE_KEY) onChange();
    };
    const query = window.matchMedia(DARK_QUERY);
    listeners.add(listener);
    query.addEventListener("change", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(listener);
        query.removeEventListener("change", onChange);
        window.removeEventListener("storage", onStorage);
    };
}

/** The theme in effect, and a toggle that stores the opposite as an explicit choice. */
export function useTheme(): { theme: Theme; toggle: () => void } {
    const theme = useSyncExternalStore(
        watchTheme,
        () => resolveTheme(),
        () => "light" as const,
    );
    return { theme, toggle: () => setThemeChoice(theme === "dark" ? "light" : "dark") };
}
