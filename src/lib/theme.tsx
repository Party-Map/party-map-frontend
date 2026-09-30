import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { THEME_STORAGE_KEY } from "./constants";

export type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function readInitialTheme(): Theme {
    try {
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark") return saved;
    } catch {
        // storage may be unavailable (private mode); fall through to the system preference
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(readInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // ignore storage errors
        }
    }, [theme]);

    const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
    const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}
