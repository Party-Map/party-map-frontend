import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/helpers";

import { Button, buttonClass, ButtonLink } from "./Button";

describe("buttonClass", () => {
    it("uses the primary variant and medium size by default", () => {
        expect(buttonClass({})).toBe("button primary md");
    });

    it("combines variant, size, block and extra classes", () => {
        expect(buttonClass({ variant: "danger", size: "sm", block: true, className: "extra" })).toBe(
            "button danger sm block extra",
        );
    });

    it.each(["primary", "secondary", "ghost", "danger", "success", "bar"] as const)(
        "has a class for the %s variant",
        (variant) => {
            expect(buttonClass({ variant })).toBe(`button ${variant} md`);
        },
    );
});

describe("Button", () => {
    it("renders a type=button by default and forwards props", async () => {
        const onClick = vi.fn();
        render(
            <Button variant="secondary" size="sm" onClick={onClick} data-testid="save">
                Save
            </Button>,
        );
        const button = screen.getByRole("button", { name: "Save" });
        expect(button).toHaveAttribute("type", "button");
        expect(button).toHaveClass("button", "secondary", "sm");
        expect(button).toHaveAttribute("data-testid", "save");
        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("allows submit buttons and disabling", () => {
        render(
            <Button type="submit" block disabled>
                Go
            </Button>,
        );
        const button = screen.getByRole("button", { name: "Go" });
        expect(button).toHaveAttribute("type", "submit");
        expect(button).toHaveClass("block");
        expect(button).toBeDisabled();
    });
});

describe("ButtonLink", () => {
    it("renders an anchor styled as a button", () => {
        renderWithProviders(
            <ButtonLink to="/events/1" variant="ghost" size="sm" block className="extra">
                Open
            </ButtonLink>,
        );
        const link = screen.getByRole("link", { name: "Open" });
        expect(link).toHaveAttribute("href", "/events/1");
        expect(link).toHaveClass("button", "ghost", "sm", "block", "extra");
    });
});
