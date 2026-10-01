import { screen, within } from "@testing-library/react";

import { browseEvent, browseEvent2 } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";

import { EventRow } from "./EventRow";
import { MediaList } from "./MediaList";

describe("EventRow", () => {
    it("shows the venue, the time with a machine-readable start, the distance and the kind", () => {
        renderWithProviders(
            <MediaList label="Events">
                <EventRow item={browseEvent} now={new Date("2030-05-31T10:00:00")} />
            </MediaList>,
        );
        const link = screen.getByRole("link", { name: /Techno Night/ });
        expect(link).toHaveAttribute("href", "/events/event-1");
        expect(link).toHaveTextContent("A38 Hajó • Budapest");
        expect(within(link).getByText("Tomorrow 20:00 – Sunday 04:00")).toHaveAttribute(
            "datetime",
            "2030-06-01T20:00:00",
        );
        expect(link).toHaveTextContent("· 3.2 km");
        expect(within(link).getByText("Techno")).toHaveClass("badge");
    });

    it("leaves the distance out when the API sent none", () => {
        renderWithProviders(
            <MediaList label="Events">
                <EventRow item={{ ...browseEvent2, distanceKm: null }} />
            </MediaList>,
        );
        const link = screen.getByRole("link", { name: /Jazz Brunch/ });
        expect(link).not.toHaveTextContent("km");
        expect(within(link).getByText("Jazz")).toHaveClass("badge");
    });
});
