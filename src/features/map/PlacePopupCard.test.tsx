import { act, fireEvent, screen } from "@testing-library/react";

import { formatNextEventStart } from "@/lib/dates";
import type { Place, UpcomingEventByPlace } from "@/lib/types";
import { place, upcoming } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";

import { LONG_TITLE_LENGTH, PlacePopupCard, searchHref } from "./PlacePopupCard";

async function renderCard(overrides: { place?: Place; upcomingEvent?: UpcomingEventByPlace | null } = {}) {
    const onClose = vi.fn();
    const view = renderWithProviders(
        <PlacePopupCard
            place={overrides.place ?? place}
            upcomingEvent={overrides.upcomingEvent ?? null}
            onClose={onClose}
        />,
    );
    // Let the mock auth client settle so its state update happens inside act.
    await act(async () => {});
    return { ...view, onClose };
}

describe("searchHref", () => {
    it("lower-cases and encodes the term", () => {
        expect(searchHref("TECHNO")).toBe("/?q=techno");
        expect(searchHref("open air")).toBe("/?q=open%20air");
    });
});

describe("PlacePopupCard", () => {
    it("shows the upcoming event with its date, kind, tags and place chip", async () => {
        const { container } = await renderCard({ upcomingEvent: upcoming });
        const startLabel = formatNextEventStart(upcoming.start);

        expect(screen.getByRole("link", { name: `Open event ${upcoming.title}` })).toHaveAttribute(
            "href",
            `/events/${upcoming.eventId}`,
        );
        expect(screen.getByText("View event")).toBeInTheDocument();
        expect(screen.getByText(upcoming.title)).toHaveClass("titleNowrap");
        expect(screen.getByText(String(startLabel))).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Techno" })).toHaveAttribute("href", "/?q=techno");
        expect(screen.getByRole("link", { name: place.name })).toHaveAttribute("href", `/places/${place.id}`);
        expect(screen.getByRole("link", { name: "concert" })).toHaveAttribute("href", "/?q=concert");
        expect(screen.getByRole("link", { name: "ship" })).toBeInTheDocument();
        // The event kind is not repeated as a plain tag.
        expect(screen.queryByRole("link", { name: "techno" })).not.toBeInTheDocument();
        expect(container.querySelector("img")).toHaveAttribute("src", upcoming.image);
    });

    it("falls back to the place image when the event has none", async () => {
        const { container } = await renderCard({ upcomingEvent: { ...upcoming, image: null } });
        expect(container.querySelector("img")).toHaveAttribute("src", place.image);
    });

    it("shows the place itself when there is no upcoming event", async () => {
        await renderCard();
        expect(screen.getByRole("link", { name: `Open place ${place.name}` })).toHaveAttribute(
            "href",
            `/places/${place.id}`,
        );
        expect(screen.getByText("View place")).toBeInTheDocument();
        expect(screen.getByText(place.name, { selector: "span" })).toHaveClass("titleNowrap");
        expect(screen.queryByText("Techno")).not.toBeInTheDocument();
        expect(screen.queryByText(String(formatNextEventStart(upcoming.start)))).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "techno" })).toHaveAttribute("href", "/?q=techno");
    });

    it("shows at most three tags", async () => {
        await renderCard({ place: { ...place, tags: ["one", "two", "three", "four"] } });
        expect(screen.getByRole("link", { name: "three" })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "four" })).not.toBeInTheDocument();
    });

    it("widens the card and clamps long titles", async () => {
        const title = "x".repeat(LONG_TITLE_LENGTH + 1);
        await renderCard({ upcomingEvent: { ...upcoming, title } });
        const heading = screen.getByText(title);
        expect(heading).toHaveClass("titleClamp");
        expect(heading.closest(".card")).toHaveClass("wide");
    });

    it("calls onClose from the close button", async () => {
        const { onClose } = await renderCard();
        fireEvent.click(screen.getByRole("button", { name: "Close popup" }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
