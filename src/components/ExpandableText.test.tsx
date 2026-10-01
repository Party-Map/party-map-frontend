import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExpandableText } from "./ExpandableText";

/** jsdom has no layout: pretend the paragraph is taller than its clamp (or not). */
function layout(scrollHeight: number, clientHeight: number) {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => scrollHeight });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => clientHeight });
}

describe("ExpandableText", () => {
    afterEach(() => {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
        Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
    });

    it("offers More when the text overflows its lines, and Less once expanded", async () => {
        layout(400, 100);
        render(<ExpandableText text="A long story." lines={3} className="extra" />);
        const paragraph = screen.getByText("A long story.");
        expect(paragraph).toHaveClass("text", "clamped", "faded");
        expect(paragraph).toHaveStyle({ "--lines": "3" });
        expect(paragraph.parentElement).toHaveClass("extra");

        const toggle = screen.getByRole("button", { name: "More", expanded: false });
        await userEvent.click(toggle);
        expect(screen.getByRole("button", { name: "Less", expanded: true })).toBeInTheDocument();
        expect(paragraph).not.toHaveClass("clamped");
        expect(paragraph).not.toHaveClass("faded");
        expect(paragraph.getAttribute("style") ?? "").not.toContain("--lines");

        await userEvent.click(screen.getByRole("button", { name: "Less" }));
        expect(paragraph).toHaveClass("clamped");
    });

    it("shows no toggle when the text fits", () => {
        layout(80, 100);
        render(<ExpandableText text="Short." />);
        expect(screen.getByText("Short.")).toHaveClass("clamped");
        expect(screen.getByText("Short.")).not.toHaveClass("faded");
        expect(screen.queryByRole("button")).toBeNull();
    });
});
