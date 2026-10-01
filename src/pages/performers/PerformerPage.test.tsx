import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { event, performer, place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PerformerPage } from "./PerformerPage";

const ROUTE = { route: "/performers/performer-1", path: "/performers/:id" };
const ended = { ...event, id: "event-0", title: "Old Night", start: "2020-01-01T20:00:00", end: "2020-01-02T02:00:00" };
const PERFORMER_ROUTES = {
    "GET /api/performers/performer-1": performer,
    "GET /api/events?performerId=performer-1": [ended, event],
    "GET /api/places/place-1": place,
};

describe("PerformerPage", () => {
    it("shows a loading state, then the round hero, the shows with their venues, the bio and the links", async () => {
        mockApi(PERFORMER_ROUTES);
        renderWithProviders(<PerformerPage />, ROUTE);

        expect(screen.getByRole("status")).toHaveTextContent("Loading…");
        expect(document.title).not.toContain(performer.name);
        expect(await screen.findByRole("heading", { level: 1, name: performer.name })).toBeInTheDocument();
        expect(document.title).toBe("DJ Test | PartyMap");
        const portrait = screen.getByRole("img", { name: performer.name });
        expect(portrait).toHaveAttribute("src", performer.image);
        expect(portrait.parentElement).toHaveClass("round");
        expect(screen.getByText(performer.genre)).toHaveClass("eyebrow");
        expect(screen.getByText("1 upcoming show")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Performers" })).toHaveAttribute("href", "/browse/performers");

        expect(screen.getByRole("heading", { name: "Upcoming shows" })).toBeInTheDocument();
        const shows = screen.getByRole("list", { name: "Upcoming shows" });
        const row = within(shows).getByRole("link", { name: /Techno Night/ });
        expect(row).toHaveAttribute("href", "/events/event-1");
        expect(await within(row).findByText("A38 Hajó • Budapest")).toBeInTheDocument();
        expect(within(row).getByText("01/06/2030")).toHaveAttribute("datetime", event.start);
        expect(
            within(screen.getByRole("list", { name: "Past shows" })).getByRole("link", { name: /Old Night/ }),
        ).toBeInTheDocument();
        expect(screen.getByText("Past shows (1)").tagName).toBe("SUMMARY");

        expect(screen.getByText(performer.bio)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/djtest");
    });

    it("shows an empty message when the performer has no events", async () => {
        mockApi({ ...PERFORMER_ROUTES, "GET /api/events?performerId=performer-1": [] });
        renderWithProviders(<PerformerPage />, ROUTE);

        expect(await screen.findByText("No events yet.")).toBeInTheDocument();
        expect(screen.getByText("No upcoming shows")).toBeInTheDocument();
        expect(screen.queryByText(/Past shows/)).toBeNull();
    });

    it("renders the 404 page when the performer does not exist", async () => {
        mockApi({});
        renderWithProviders(<PerformerPage />, { route: "/performers/missing", path: "/performers/:id" });

        expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
    });

    it("shows an error with retry when loading fails, and recovers", async () => {
        let attempts = 0;
        mockApi({
            ...PERFORMER_ROUTES,
            "GET /api/performers/performer-1": () =>
                attempts++ === 0 ? new Response("boom", { status: 500 }) : performer,
        });
        renderWithProviders(<PerformerPage />, ROUTE);

        expect(await screen.findByRole("alert")).toHaveTextContent("Could not load this performer.");
        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: performer.name })).toBeInTheDocument();
    });

    it("neither fetches the like status nor shows the heart for anonymous visitors", async () => {
        const fetchMock = mockApi(PERFORMER_ROUTES);
        renderWithProviders(<PerformerPage />, ROUTE);

        await screen.findByRole("heading", { level: 1, name: performer.name });
        expect(screen.queryByRole("button", { name: /favorites/ })).not.toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/api/me/likes"), expect.anything());
    });

    it("fetches the like status for signed-in users and shows the heart accordingly", async () => {
        const fetchMock = mockApi({ ...PERFORMER_ROUTES, "GET /api/me/likes/performers/performer-1": { liked: true } });
        renderWithProviders(<PerformerPage />, { ...ROUTE, auth: authenticatedSnapshot() });

        expect(await screen.findByRole("button", { name: "Remove from favorites" })).toBeInTheDocument();
        expect(fetchMock.requests.map((request) => request.url)).toContain(
            "http://api.test/api/me/likes/performers/performer-1",
        );
    });
});
