import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { formatDateTimeRange } from "@/lib/format";
import { event, performer, place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { EventPage } from "./EventPage";

const ROUTE = { route: "/events/event-1", path: "/events/:id" };
const EVENT_ROUTES = { "GET /api/events/event-1": event, "GET /api/events/event-1/place": place };

describe("EventPage", () => {
    it("shows a loading state, then the event with venue, price, links and lineup", async () => {
        mockApi(EVENT_ROUTES);
        renderWithProviders(<EventPage />, ROUTE);

        expect(screen.getByRole("status")).toHaveTextContent("Loading…");
        expect(await screen.findByRole("heading", { level: 1, name: event.title })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: event.title })).toHaveAttribute("src", event.image);
        expect(screen.getByText(formatDateTimeRange(event.start, event.end))).toBeInTheDocument();
        expect(screen.getByRole("link", { name: place.name })).toHaveAttribute("href", "/places/place-1");
        expect(screen.getByText("Price: 3000")).toBeInTheDocument();
        expect(screen.getByText(event.description)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute("href", "https://facebook.com/events/1");
        expect(screen.getByRole("heading", { name: "Lineup & Set Times" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: performer.name })).toHaveAttribute("href", "/performers/performer-1");
    });

    it("tolerates a missing venue, omits a missing price and says when no lineup is announced", async () => {
        mockApi({ "GET /api/events/event-1": { ...event, price: undefined, lineupItems: [] } });
        renderWithProviders(<EventPage />, ROUTE);

        await screen.findByRole("heading", { level: 1, name: event.title });
        expect(screen.queryByText(/^at /)).not.toBeInTheDocument();
        expect(screen.queryByText(/^Price:/)).not.toBeInTheDocument();
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
        expect(await screen.findByRole("link", { name: place.name })).toBeInTheDocument();
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
