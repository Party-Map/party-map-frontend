import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { readInitialTheme, ThemeProvider, useTheme } from "@/app/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/constants";

const originalMatchMedia = window.matchMedia;

function mediaQuery(matches: boolean): MediaQueryList {
    return {
        matches,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    };
}

function Probe() {
    const { theme, toggle } = useTheme();
    return (
        <button type="button" onClick={toggle}>
            {theme}
        </button>
    );
}

afterEach(() => {
    window.matchMedia = originalMatchMedia;
});

describe("readInitialTheme", () => {
    it("prefers the stored theme", () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
        expect(readInitialTheme()).toBe("dark");
        window.localStorage.setItem(THEME_STORAGE_KEY, "light");
        expect(readInitialTheme()).toBe("light");
    });

    it("ignores unknown stored values and follows the system preference", () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
        expect(readInitialTheme()).toBe("light");
        window.matchMedia = () => mediaQuery(true);
        expect(readInitialTheme()).toBe("dark");
    });

    it("falls back to the system preference when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("denied");
        });
        expect(readInitialTheme()).toBe("light");
        window.matchMedia = () => mediaQuery(true);
        expect(readInitialTheme()).toBe("dark");
    });
});

describe("ThemeProvider", () => {
    it("applies the theme to the document and persists toggles", async () => {
        render(
            <ThemeProvider>
                <Probe />
            </ThemeProvider>,
        );
        const button = screen.getByRole("button");
        expect(button).toHaveTextContent("light");
        expect(document.documentElement.dataset.theme).toBe("light");
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

        await userEvent.click(button);
        expect(button).toHaveTextContent("dark");
        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

        await userEvent.click(button);
        expect(button).toHaveTextContent("light");
        expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("starts from the stored theme", () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
        render(
            <ThemeProvider>
                <Probe />
            </ThemeProvider>,
        );
        expect(screen.getByRole("button")).toHaveTextContent("dark");
        expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("keeps working when storage writes fail", async () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota");
        });
        render(
            <ThemeProvider>
                <Probe />
            </ThemeProvider>,
        );
        await userEvent.click(screen.getByRole("button"));
        expect(screen.getByRole("button")).toHaveTextContent("dark");
        expect(document.documentElement.dataset.theme).toBe("dark");
    });
});

describe("useTheme", () => {
    it("throws outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => renderHook(() => useTheme())).toThrow("useTheme must be used inside ThemeProvider");
    });
});
