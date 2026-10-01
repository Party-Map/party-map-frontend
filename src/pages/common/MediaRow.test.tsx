import { screen, within } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { MediaList } from "./MediaList";
import { MediaRow } from "./MediaRow";

describe("MediaRow", () => {
    it("is one link with the artwork, three lines and the kind badge, in a named list", () => {
        renderWithProviders(
            <MediaList label="Events">
                <MediaRow
                    to="/events/event-1"
                    image="https://images.example/night.jpg"
                    title="Techno Night"
                    secondary="A38 Hajó • Budapest"
                    meta={<time dateTime="2030-06-01T20:00:00">Tomorrow</time>}
                    kind="TECHNO"
                    trailing={<button type="button">Like</button>}
                />
            </MediaList>,
        );
        const list = screen.getByRole("list", { name: "Events" });
        expect(list).toHaveClass("list");
        const link = within(list).getByRole("link", { name: /Techno Night/ });
        expect(link).toHaveAttribute("href", "/events/event-1");
        expect(link).toHaveTextContent("A38 Hajó • Budapest");
        expect(within(link).getByText("Tomorrow")).toHaveAttribute("datetime", "2030-06-01T20:00:00");
        expect(within(link).getByText("Techno")).toHaveClass("badge", "sm", "kind");
        expect(within(link).getByRole("presentation").parentElement).toHaveClass("row", "square", "ambient");
        const like = within(list).getByRole("button", { name: "Like" });
        expect(link).not.toContainElement(like);
    });

    it("leaves out the optional parts and can be round", () => {
        renderWithProviders(
            <MediaList label="Performers">
                <MediaRow to="/performers/performer-1" title="DJ Test" shape="round" />
            </MediaList>,
        );
        const link = screen.getByRole("link", { name: "DJ Test" });
        expect(link.querySelectorAll("span")).toHaveLength(2);
        expect(within(link).getByRole("presentation").parentElement).toHaveClass("round");
        expect(within(link).getByRole("presentation").parentElement).not.toHaveClass("ambient");
    });
});
