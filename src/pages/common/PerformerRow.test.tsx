import { screen, within } from "@testing-library/react";

import { browsePerformer } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";

import { MediaList } from "./MediaList";
import { PerformerRow } from "./PerformerRow";

describe("PerformerRow", () => {
    it("links to the performer with a round portrait and the genre", () => {
        renderWithProviders(
            <MediaList label="Performers">
                <PerformerRow item={browsePerformer} />
            </MediaList>,
        );
        const link = screen.getByRole("link", { name: /DJ Test/ });
        expect(link).toHaveAttribute("href", "/performers/performer-1");
        expect(link).toHaveTextContent("techno");
        expect(within(link).getByRole("presentation").parentElement).toHaveClass("round");
    });
});
