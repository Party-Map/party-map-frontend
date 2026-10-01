import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/helpers";

import { Chip, ChipLink, ChipRow } from "./Chip";

describe("Chip", () => {
    it("announces its pressed state and reacts to clicks", async () => {
        const onClick = vi.fn();
        renderWithProviders(
            <ChipRow label="Kind">
                <Chip pressed onClick={onClick} icon={<svg data-testid="icon" />}>
                    Jazz
                </Chip>
                <Chip>Techno</Chip>
            </ChipRow>,
        );
        const jazz = screen.getByRole("button", { name: "Jazz", pressed: true });
        expect(jazz).toHaveClass("chip", "pressed");
        expect(jazz).toHaveAttribute("type", "button");
        expect(screen.getByTestId("icon")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Techno", pressed: false })).not.toHaveClass("pressed");
        expect(screen.getByRole("group", { name: "Kind" })).toHaveClass("row");

        await userEvent.click(jazz);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("renders a chip link with the same look", () => {
        renderWithProviders(
            <ChipLink to="/browse/places?tag=ruin" className="extra">
                ruin
            </ChipLink>,
        );
        const link = screen.getByRole("link", { name: "ruin" });
        expect(link).toHaveAttribute("href", "/browse/places?tag=ruin");
        expect(link).toHaveClass("chip", "extra");
    });
});
