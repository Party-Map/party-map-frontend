import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Event } from "@/api/types";
import { event, performer, place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { LikesPage } from "./LikesPage";

const pastEvent: Event = {
    ...event,
    id: "event-2",
    title: "Old Night",
    start: "2020-01-01T20:00:00",
    end: "2020-01-02T02:00:00",
};
const LIKES_ROUTES = {
    "GET /api/events/liked-events": { upcoming: [event], past: [pastEvent] },
    "GET /api/places/liked-places": [place],
    "GET /api/performers/liked-performers": [performer],
};
const SIGNED_IN = { route: "/profile/likes", auth: authenticatedSnapshot() };

describe("LikesPage", () => {
    it("asks anonymous visitors to sign in without loading anything", async () => {
        const fetchMock = mockApi(LIKES_ROUTES);
        renderWithProviders(<LikesPage />, { route: "/profile/likes" });

        expect(await screen.findByRole("heading", { name: "Sign in required" })).toBeInTheDocument();
        expect(screen.getByText("You need to be signed in to view your likes.")).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows a loading state until the lists arrive", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() => new Promise<Response>(() => {})),
        );
        renderWithProviders(<LikesPage />, SIGNED_IN);

        expect(await screen.findByText("Loading…")).toBeInTheDocument();
        expect(screen.queryByRole("tab", { name: "Events" })).not.toBeInTheDocument();
    });

    it("loads the three lists in parallel and opens on the events tab", async () => {
        const fetchMock = mockApi(LIKES_ROUTES);
        renderWithProviders(<LikesPage />, SIGNED_IN);

        expect(await screen.findByRole("heading", { name: "Your likes" })).toBeInTheDocument();
        expect(await screen.findByRole("link", { name: event.title })).toHaveAttribute("href", "/events/event-1");
        expect(screen.getByRole("link", { name: pastEvent.title })).toHaveAttribute("href", "/events/event-2");
        expect(screen.getByRole("tab", { name: "Events" })).toHaveAttribute("aria-selected", "true");
        for (const path of [
            "/api/events/liked-events",
            "/api/places/liked-places",
            "/api/performers/liked-performers",
        ]) {
            expect(fetchMock).toHaveBeenCalledWith(`http://api.test${path}`, expect.anything());
        }

        await userEvent.click(screen.getByRole("tab", { name: "Places" }));
        expect(screen.getByRole("link", { name: place.name })).toHaveAttribute("href", "/places/place-1");
    });

    it("treats a failing list as empty and keeps the others", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        mockApi({ ...LIKES_ROUTES, "GET /api/events/liked-events": () => new Response("boom", { status: 500 }) });
        renderWithProviders(<LikesPage />, SIGNED_IN);

        expect(await screen.findByText("No upcoming events.")).toBeInTheDocument();
        expect(screen.getByText("No past events.")).toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledWith("Could not load liked events", expect.any(Error));

        await userEvent.click(screen.getByRole("tab", { name: "Performers" }));
        expect(screen.getByRole("link", { name: performer.name })).toHaveAttribute("href", "/performers/performer-1");
    });

    it("removes a row once it is unliked", async () => {
        mockApi({ ...LIKES_ROUTES, "DELETE /api/me/likes/events/event-2": { liked: false } });
        renderWithProviders(<LikesPage />, SIGNED_IN);

        const row = (await screen.findByRole("link", { name: pastEvent.title })).closest("li");
        expect(row).not.toBeNull();
        if (!row) return;
        await userEvent.click(await within(row).findByRole("button", { name: "Remove from favorites" }));

        expect(await screen.findByText(`You broke up with ${pastEvent.title}`)).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: pastEvent.title })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: event.title })).toBeInTheDocument();
    });
});
