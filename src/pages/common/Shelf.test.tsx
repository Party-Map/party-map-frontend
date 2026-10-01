import { screen, within } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { MediaCard } from "./MediaCard";
import { Shelf } from "./Shelf";

describe("Shelf", () => {
    it("titles a scrolling list of cards with a see-all link", () => {
        renderWithProviders(
            <Shelf title="More at A38 Hajó" action={{ to: "/places/place-1", label: "All events" }}>
                <MediaCard
                    to="/events/event-2"
                    image="https://images.example/b.jpg"
                    title="Jazz Brunch"
                    secondary="Sunday"
                    kind="JAZZ"
                />
                <MediaCard to="/events/event-3" title="Late Set" />
            </Shelf>,
        );
        expect(screen.getByRole("heading", { level: 2, name: "More at A38 Hajó" })).toHaveClass("title");
        expect(screen.getByRole("link", { name: "All events ›" })).toHaveAttribute("href", "/places/place-1");
        const track = screen.getByRole("list", { name: "More at A38 Hajó" });
        expect(track).toHaveClass("track");
        const cards = within(track).getAllByRole("listitem");
        expect(cards).toHaveLength(2);
        expect(cards[0]).toHaveClass("card");
        const first = within(cards[0]!).getByRole("link", { name: /Jazz Brunch/ });
        expect(first).toHaveAttribute("href", "/events/event-2");
        expect(first).toHaveTextContent("Sunday");
        expect(within(first).getByText("Jazz")).toHaveClass("badge", "kind");
        expect(within(first).getByRole("presentation").parentElement).toHaveClass("card", "ambient");
        expect(within(cards[1]!).queryByText("Jazz")).toBeNull();
    });

    it("has no see-all link without an action", () => {
        renderWithProviders(
            <Shelf title="Shows">
                <MediaCard to="/events/event-3" title="Late Set" />
            </Shelf>,
        );
        expect(screen.queryByRole("link", { name: /›/ })).toBeNull();
    });
});
