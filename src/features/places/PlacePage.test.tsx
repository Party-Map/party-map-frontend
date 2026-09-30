import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PlacePage } from "@/features/places";
import { event, place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

const ROUTE = { route: "/places/place-1", path: "/places/:id" };
const PLACE_ROUTES = { "GET /api/places/place-1": place, "GET /api/events?placeId=place-1": [event] };

describe("PlacePage", () => {
    it("shows a loading state, then the place with its tags, links and events", async () => {
        mockApi(PLACE_ROUTES);
        renderWithProviders(<PlacePage />, ROUTE);

        expect(screen.getByRole("status")).toHaveTextContent("Loading…");
        expect(await screen.findByRole("heading", { level: 1, name: place.name })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: place.name })).toHaveAttribute("src", place.image);
        expect(screen.getByText(`${place.address}, ${place.city}`)).toBeInTheDocument();
        expect(screen.getByText(place.description)).toBeInTheDocument();
        expect(within(screen.getByRole("list", { name: "Tags" })).getAllByRole("listitem")).toHaveLength(3);
        expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://a38.hu");
        expect(screen.getByRole("heading", { name: "Upcoming events" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: event.title })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Details →" })).toHaveAttribute("href", "/events/event-1");
    });

    it("shows an empty message without events and no tag list without tags", async () => {
        mockApi({ "GET /api/places/place-1": { ...place, tags: [] }, "GET /api/events?placeId=place-1": [] });
        renderWithProviders(<PlacePage />, ROUTE);

        expect(await screen.findByText("No events yet.")).toBeInTheDocument();
        expect(screen.queryByRole("list", { name: "Tags" })).not.toBeInTheDocument();
    });

    it("renders the 404 page when the place does not exist", async () => {
        mockApi({});
        renderWithProviders(<PlacePage />, { route: "/places/missing", path: "/places/:id" });

        expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
    });

    it("shows an error with retry when loading fails, and recovers", async () => {
        let attempts = 0;
        mockApi({
            ...PLACE_ROUTES,
            "GET /api/places/place-1": () => (attempts++ === 0 ? new Response("boom", { status: 500 }) : place),
        });
        renderWithProviders(<PlacePage />, ROUTE);

        expect(await screen.findByRole("alert")).toHaveTextContent("Could not load this place.");
        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: place.name })).toBeInTheDocument();
    });

    it("neither fetches the like status nor shows the heart for anonymous visitors", async () => {
        const fetchMock = mockApi(PLACE_ROUTES);
        renderWithProviders(<PlacePage />, ROUTE);

        await screen.findByRole("heading", { level: 1, name: place.name });
        expect(screen.queryByRole("button", { name: /favorites/ })).not.toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/api/me/likes"), expect.anything());
    });

    it("fetches the like status for signed-in users and shows the heart accordingly", async () => {
        const fetchMock = mockApi({ ...PLACE_ROUTES, "GET /api/me/likes/places/place-1": { liked: true } });
        renderWithProviders(<PlacePage />, { ...ROUTE, auth: authenticatedSnapshot() });

        expect(await screen.findByRole("button", { name: "Remove from favorites" })).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/me/likes/places/place-1", expect.anything());
    });
});
