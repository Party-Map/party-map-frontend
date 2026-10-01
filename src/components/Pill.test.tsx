import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/helpers";

import { PillAnchor, PillButton, PillLink } from "./Pill";

describe("Pill", () => {
    it("renders a button, a router link and an external link with the same look", async () => {
        const onClick = vi.fn();
        renderWithProviders(
            <>
                <PillButton variant="primary" icon={<svg data-testid="icon" />} onClick={onClick}>
                    Share
                </PillButton>
                <PillLink to="/?focus=place-1">Show on map</PillLink>
                <PillAnchor href="https://maps.example/dir" className="extra">
                    Directions
                </PillAnchor>
            </>,
        );
        const share = screen.getByRole("button", { name: "Share" });
        expect(share).toHaveClass("pill", "primary");
        expect(share).toHaveAttribute("type", "button");
        expect(screen.getByTestId("icon")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Show on map" })).toHaveClass("pill", "secondary");
        expect(screen.getByRole("link", { name: "Show on map" })).toHaveAttribute("href", "/?focus=place-1");
        const directions = screen.getByRole("link", { name: "Directions" });
        expect(directions).toHaveClass("pill", "secondary", "extra");
        expect(directions).toHaveAttribute("target", "_blank");
        expect(directions).toHaveAttribute("rel", "noopener noreferrer");

        await userEvent.click(share);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
