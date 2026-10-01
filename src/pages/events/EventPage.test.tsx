import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { formatDateTimeRange } from "@/lib/format";
import { event, performer, place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { EventPage } from "./EventPage";

const ROUTE = { route: "/events/event-1", path: "/events/:id" };
const EVENT_ROUTES = { "GET /api/events/event-1": event, "GET /api/events/event-1/place": place };
const later = { ...event, id: "event-2", title: "Jazz Brunch", kind: "JAZZ" as const, image: null };
const ended = { ...event, id: "event-0", title: "Old Night", start: "2020-01-01T20:00:00", end: "2020-01-02T02:00:00" };

describe("EventPage", () => {
    it("shows a loading state, then the hero with the venue, the lineup, the about block and the links", async () => {
        mockApi(EVENT_ROUTES);
        renderWithProviders(<EventPage />, ROUTE);

        expect(screen.getByRole("status")).toHaveTextContent("Loading…");
        expect(document.title).not.toContain(event.title);
        expect(await screen.findByRole("heading", { level: 1, name: event.title })).toBeInTheDocument();
        expect(document.title).toBe("Techno Night | PartyMap");
        expect(screen.getByRole("img", { name: event.title })).toHaveAttribute("src", event.image);
        expect(screen.getByText("Techno")).toHaveClass("badge");
        const when = screen.getByText(formatDateTimeRange(event.start, event.end));
        expect(when.tagName).toBe("TIME");
        expect(when).toHaveAttribute("datetime", event.start);
        const venue = screen.getByRole("link", { name: "A38 Hajó, Budapest" });
        expect(venue).toHaveAttribute("href", "/places/place-1");
        expect(venue.closest("address")).not.toBeNull();
        expect(screen.getAllByRole("link", { name: "Show on map" })[0]).toHaveAttribute("href", "/?focus=place-1");
        expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
            "href",
            "https://www.google.com/maps/dir/?api=1&destination=47.4771,19.0621",
        );
        expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/browse/events");

        const lineup = screen.getByRole("list", { name: "Lineup" });
        const row = within(lineup).getByRole("link", { name: /DJ Test/ });
        expect(row).toHaveAttribute("href", "/performers/performer-1");
        expect(row).toHaveTextContent("1");
        expect(row).toHaveTextContent(performer.genre);
        expect(row).toHaveTextContent("22:00 – 00:00");

        expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
        expect(screen.getByText(event.description)).toBeInTheDocument();
        expect(screen.getByText("3000")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute("href", "https://facebook.com/events/1");
        expect(screen.queryByRole("heading", { name: /More at/ })).toBeNull();
    });

    it("shelves the venue's other upcoming events, without itself and the ended ones", async () => {
        mockApi({ ...EVENT_ROUTES, "GET /api/events?placeId=place-1": [event, later, ended] });
        renderWithProviders(<EventPage />, ROUTE);

        const shelf = await screen.findByRole("list", { name: "More at A38 Hajó" });
        expect(within(shelf).getAllByRole("listitem")).toHaveLength(1);
        const card = within(shelf).getByRole("link", { name: /Jazz Brunch/ });
        expect(card).toHaveAttribute("href", "/events/event-2");
        expect(within(card).getByRole("presentation")).toHaveAttribute("src", place.image);
        expect(screen.getByRole("link", { name: "All events ›" })).toHaveAttribute("href", "/places/place-1");
    });

    it("tolerates a missing venue, omits a missing price and says when no lineup is announced", async () => {
        mockApi({ "GET /api/events/event-1": { ...event, price: undefined, lineupItems: [] } });
        renderWithProviders(<EventPage />, ROUTE);

        await screen.findByRole("heading", { level: 1, name: event.title });
        expect(screen.queryByRole("link", { name: /Show on map/ })).toBeNull();
        expect(screen.queryByRole("link", { name: "Directions" })).toBeNull();
        expect(screen.queryByText("3000")).toBeNull();
        expect(screen.getByText("No lineup announced yet.")).toBeInTheDocument();
    });

    it("renders the 404 page when the event does not exist", async () => {
        mockApi({});
        renderWithProviders(<EventPage />, { route: "/events/missing", path: "/events/:id" });

        expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
    });

    it("shows an error with retry when the venue fails for another reason, and recovers", async () => {
        let attempts = 0;
        mockApi({
            ...EVENT_ROUTES,
            "GET /api/events/event-1/place": () => (attempts++ === 0 ? new Response("boom", { status: 500 }) : place),
        });
        renderWithProviders(<EventPage />, ROUTE);

        expect(await screen.findByRole("alert")).toHaveTextContent("Could not load this event.");
        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("link", { name: "A38 Hajó, Budapest" })).toBeInTheDocument();
    });

    it("neither fetches the like status nor shows the heart for anonymous visitors", async () => {
        const fetchMock = mockApi(EVENT_ROUTES);
        renderWithProviders(<EventPage />, ROUTE);

        await screen.findByRole("heading", { level: 1, name: event.title });
        expect(screen.queryByRole("button", { name: /favorites/ })).not.toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/api/me/likes"), expect.anything());
    });

    it("fetches the like status for signed-in users and shows the heart accordingly", async () => {
        const fetchMock = mockApi({ ...EVENT_ROUTES, "GET /api/me/likes/events/event-1": { liked: false } });
        renderWithProviders(<EventPage />, { ...ROUTE, auth: authenticatedSnapshot() });

        expect(await screen.findByRole("button", { name: "Add to favorites" })).toBeInTheDocument();
        expect(fetchMock.requests.map((request) => request.url)).toContain(
            "http://api.test/api/me/likes/events/event-1",
        );
    });
});
