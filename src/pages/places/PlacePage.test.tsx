import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { event, place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PlacePage } from "./PlacePage";

const ROUTE = { route: "/places/place-1", path: "/places/:id" };
const ended = { ...event, id: "event-0", title: "Old Night", start: "2020-01-01T20:00:00", end: "2020-01-02T02:00:00" };
const PLACE_ROUTES = { "GET /api/places/place-1": place, "GET /api/events?placeId=place-1": [ended, event] };

describe("PlacePage", () => {
    it("shows a loading state, then the hero, the upcoming and past events, the tags and the links", async () => {
        mockApi(PLACE_ROUTES);
        renderWithProviders(<PlacePage />, ROUTE);

        expect(screen.getByRole("status")).toHaveTextContent("Loading…");
        expect(document.title).not.toContain(place.name);
        expect(await screen.findByRole("heading", { level: 1, name: place.name })).toBeInTheDocument();
        expect(document.title).toBe("A38 Hajó | PartyMap");
        expect(screen.getByRole("img", { name: place.name })).toHaveAttribute("src", place.image);
        const address = screen.getByText(`${place.address}, ${place.city}`);
        expect(address.tagName).toBe("ADDRESS");
        expect(screen.getAllByRole("link", { name: "Show on map" })[0]).toHaveAttribute("href", "/?focus=place-1");
        expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
            "href",
            "https://www.google.com/maps/dir/?api=1&destination=47.4771,19.0621",
        );
        expect(screen.getByRole("link", { name: "Places" })).toHaveAttribute("href", "/browse/places");

        expect(screen.getByRole("heading", { name: "Upcoming events" })).toBeInTheDocument();
        const upcoming = screen.getByRole("list", { name: "Upcoming events" });
        const row = within(upcoming).getByRole("link", { name: /Techno Night/ });
        expect(row).toHaveAttribute("href", "/events/event-1");
        expect(row).toHaveTextContent("3000");
        expect(within(row).getByText("Techno")).toHaveClass("badge");
        expect(within(upcoming).queryByRole("link", { name: /Old Night/ })).toBeNull();
        const past = screen.getByText("Past events (1)");
        expect(past.tagName).toBe("SUMMARY");
        expect(
            within(screen.getByRole("list", { name: "Past events" })).getByRole("link", { name: /Old Night/ }),
        ).toBeInTheDocument();

        expect(screen.getByText(place.description!)).toBeInTheDocument();
        const tags = within(screen.getByRole("list", { name: "Tags" })).getAllByRole("link");
        expect(tags).toHaveLength(3);
        expect(tags[0]).toHaveAttribute("href", "/browse/places?tag=concert");
        expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://a38.hu");
    });

    it("shows an empty message without events and no tag list without tags", async () => {
        mockApi({
            "GET /api/places/place-1": { ...place, tags: [], description: null },
            "GET /api/events?placeId=place-1": [],
        });
        renderWithProviders(<PlacePage />, ROUTE);

        expect(await screen.findByText("No events yet.")).toBeInTheDocument();
        expect(screen.queryByRole("list", { name: "Tags" })).not.toBeInTheDocument();
        expect(screen.queryByText(/Past events/)).toBeNull();
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
        expect(fetchMock.requests.map((request) => request.url)).toContain(
            "http://api.test/api/me/likes/places/place-1",
        );
    });
});
