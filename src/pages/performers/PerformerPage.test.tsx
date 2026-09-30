import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { event, performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PerformerPage } from "./PerformerPage";

const ROUTE = { route: "/performers/performer-1", path: "/performers/:id" };
const PERFORMER_ROUTES = {
    "GET /api/performers/performer-1": performer,
    "GET /api/events?performerId=performer-1": [event],
};

describe("PerformerPage", () => {
    it("shows a loading state, then the performer with genre, bio, links and events", async () => {
        mockApi(PERFORMER_ROUTES);
        renderWithProviders(<PerformerPage />, ROUTE);

        expect(screen.getByRole("status")).toHaveTextContent("Loading…");
        expect(await screen.findByRole("heading", { level: 1, name: performer.name })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: performer.name })).toHaveAttribute("src", performer.image);
        expect(screen.getByText(performer.genre)).toBeInTheDocument();
        expect(screen.getByText(performer.bio)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/djtest");
        expect(screen.getByRole("heading", { name: "Events" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: event.title })).toHaveAttribute("href", "/events/event-1");
    });

    it("shows an empty message when the performer has no events", async () => {
        mockApi({ ...PERFORMER_ROUTES, "GET /api/events?performerId=performer-1": [] });
        renderWithProviders(<PerformerPage />, ROUTE);

        expect(await screen.findByText("No events yet.")).toBeInTheDocument();
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
        expect(fetchMock).toHaveBeenCalledWith(
            "http://api.test/api/me/likes/performers/performer-1",
            expect.anything(),
        );
    });
});
