import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/helpers";

import { RadiusChips } from "./RadiusChips";

describe("RadiusChips", () => {
    it("marks the chosen radius and reports changes", async () => {
        const onChange = vi.fn();
        renderWithProviders(<RadiusChips value={25} onChange={onChange} />);
        expect(screen.getAllByRole("button").map((chip) => chip.textContent)).toEqual([
            "Any distance",
            "5 km",
            "25 km",
            "100 km",
        ]);
        expect(screen.getByRole("button", { name: "25 km" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: "Any distance" })).toHaveAttribute("aria-pressed", "false");

        await userEvent.click(screen.getByRole("button", { name: "5 km" }));
        expect(onChange).toHaveBeenCalledWith(5);
        await userEvent.click(screen.getByRole("button", { name: "Any distance" }));
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it("marks any distance when there is no radius", () => {
        renderWithProviders(<RadiusChips value={null} onChange={() => {}} />);
        expect(screen.getByRole("button", { name: "Any distance" })).toHaveAttribute("aria-pressed", "true");
    });
});
