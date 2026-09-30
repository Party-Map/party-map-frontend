import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/app/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/lib/constants";

function renderToggle(compact = false) {
    return render(
        <ThemeProvider>
            <ThemeToggle compact={compact} />
        </ThemeProvider>,
    );
}

describe("ThemeToggle", () => {
    it("switches between light and dark", async () => {
        const { container } = renderToggle();
        const button = screen.getByRole("button", { name: "Toggle theme" });
        expect(button).toHaveTextContent("Dark");
        expect(button).toHaveAttribute("aria-pressed", "false");
        expect(container.querySelector("svg")?.getAttribute("class")).toMatch(/moon/);

        await userEvent.click(button);
        expect(button).toHaveTextContent("Light");
        expect(button).toHaveAttribute("aria-pressed", "true");
        expect(container.querySelector("svg")?.getAttribute("class")).toMatch(/sun/);
        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

        await userEvent.click(button);
        expect(button).toHaveTextContent("Dark");
        expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("hides the label and grows the icon in the compact variant", () => {
        const { container } = renderToggle(true);
        const button = screen.getByRole("button", { name: "Toggle theme" });
        expect(button).toHaveClass("toggle", "compact");
        expect(button.querySelector("span")).toBeNull();
        expect(container.querySelector("svg")).toHaveAttribute("width", "22");
    });

    it("uses the small icon with a label otherwise", () => {
        const { container } = renderToggle();
        expect(screen.getByRole("button")).not.toHaveClass("compact");
        expect(container.querySelector("svg")).toHaveAttribute("width", "18");
    });
});
