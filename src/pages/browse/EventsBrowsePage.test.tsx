import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { browseEvent, browseEventsPage } from "@/test/fixtures";
import { type ApiMock, mockApi, renderWithProviders, type SentRequest } from "@/test/helpers";

import { EventsBrowsePage } from "./EventsBrowsePage";

const eventRequests = (fetchMock: ApiMock) =>
    fetchMock.requests
        .filter((request) => new URL(request.url).pathname === "/api/browse/events")
        .map((request) => Object.fromEntries(new URL(request.url).searchParams));

const renderEvents = (route = "/browse/events") =>
    renderWithProviders(<EventsBrowsePage />, { route, path: "/browse/events" });

describe("EventsBrowsePage", () => {
    afterEach(() => {
        Reflect.deleteProperty(navigator, "geolocation");
    });

    it("lists the events around Budapest when the device has no position", async () => {
        const fetchMock = mockApi({ "GET /api/browse/events": browseEventsPage });
        renderEvents();
        const list = await screen.findByRole("list", { name: "Events" });
        expect(within(list).getByRole("link", { name: /Techno Night/ })).toHaveAttribute("href", "/events/event-1");
        expect(within(list).getByRole("link", { name: /Jazz Brunch/ })).toBeInTheDocument();
        expect(screen.getByText("2 events")).toBeInTheDocument();
        expect(eventRequests(fetchMock)).toEqual([{ lat: "47.4979", lon: "19.0402", size: "20", page: "0" }]);
        expect(screen.getByRole("button", { name: "Budapest · Use my location" })).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("distance");
    });

    it("waits for the device position and then searches around it", async () => {
        let answer: ((position: { coords: { latitude: number; longitude: number } }) => void) | undefined;
        Object.defineProperty(navigator, "geolocation", {
            configurable: true,
            value: {
                getCurrentPosition: (ok: typeof answer) => {
                    answer = ok;
                },
            },
        });
        const fetchMock = mockApi({ "GET /api/browse/events": browseEventsPage });
        renderEvents();
        expect(screen.getByRole("status")).toHaveTextContent("Finding events near you…");
        expect(eventRequests(fetchMock)).toEqual([]);

        answer?.({ coords: { latitude: 47.5, longitude: 19.1 } });
        await screen.findByRole("list", { name: "Events" });
        expect(eventRequests(fetchMock)).toEqual([{ lat: "47.5", lon: "19.1", size: "20", page: "0" }]);
        expect(screen.getByRole("button", { name: "Near you", pressed: true })).toBeInTheDocument();
    });

    it("sends the URL filters and changes them with the chips and the sort", async () => {
        const fetchMock = mockApi({ "GET /api/browse/events": browseEventsPage });
        renderEvents("/browse/events?kind=TECHNO&search=night&radius=25&sort=start");
        await screen.findByRole("list", { name: "Events" });
        expect(eventRequests(fetchMock)).toEqual([
            {
                lat: "47.4979",
                lon: "19.0402",
                radiusKm: "25",
                kind: "TECHNO",
                q: "night",
                sort: "start",
                size: "20",
                page: "0",
            },
        ]);
        expect(screen.getByRole("button", { name: "Techno", pressed: true })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "25 km", pressed: true })).toBeInTheDocument();
        expect(screen.getByRole("searchbox", { name: "Search events" })).toHaveValue("night");
        expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("start");

        await userEvent.click(screen.getByRole("button", { name: "Jazz" }));
        await userEvent.click(screen.getByRole("button", { name: "Any distance" }));
        await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "distance");
        await screen.findByRole("button", { name: "Jazz", pressed: true });
        expect(eventRequests(fetchMock).at(-1)).toEqual({
            lat: "47.4979",
            lon: "19.0402",
            kind: "JAZZ",
            q: "night",
            size: "20",
            page: "0",
        });

        await userEvent.click(screen.getByRole("button", { name: "Jazz" }));
        await screen.findByRole("button", { name: "Jazz", pressed: false });
        expect(eventRequests(fetchMock).at(-1)).not.toHaveProperty("kind");
    });

    it("loads the next page on demand", async () => {
        const first = { ...browseEventsPage, total: 3, size: 2 };
        const second = { items: [{ ...browseEvent, id: "event-3", title: "Late Set" }], total: 3, page: 1, size: 2 };
        mockApi({
            "GET /api/browse/events": (request: SentRequest) =>
                new URL(request.url).searchParams.get("page") === "1" ? second : first,
        });
        renderEvents();
        await screen.findByRole("list", { name: "Events" });
        expect(screen.getByText("3 events")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Load more" }));
        expect(await screen.findByRole("link", { name: /Late Set/ })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
    });

    it("explains an empty result and offers a retry after a failure", async () => {
        mockApi({ "GET /api/browse/events": { items: [], total: 0, page: 0, size: 20 } });
        renderEvents();
        expect(await screen.findByText("No events match. Try a wider distance or fewer filters.")).toBeInTheDocument();
    });

    it("offers a retry after a failure", async () => {
        const fetchMock = mockApi({ "GET /api/browse/events": () => new Response("boom", { status: 500 }) });
        renderEvents();
        expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the events.");
        fetchMock.mockImplementation(
            async () =>
                new Response(JSON.stringify(browseEventsPage), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }),
        );
        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("list", { name: "Events" })).toBeInTheDocument();
    });
});
