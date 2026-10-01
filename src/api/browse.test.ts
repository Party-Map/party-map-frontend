import { browseEventsPage, browsePerformersPage, browsePlacesPage, performerGenres, placeTags } from "@/test/fixtures";
import { mockApi } from "@/test/helpers";

import {
    fetchBrowseEvents,
    fetchBrowsePerformers,
    fetchBrowsePlaces,
    fetchPerformerGenres,
    fetchPlaceTags,
} from "./browse";

const sent = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe("browse api", () => {
    it("sends every event filter as a query parameter and leaves the unset ones out", async () => {
        const fetchMock = mockApi({ "GET /api/browse/events": browseEventsPage });
        await expect(
            fetchBrowseEvents({
                lat: 47.5,
                lon: 19,
                radiusKm: 25,
                kind: "TECHNO",
                q: "night",
                sort: "start",
                page: 1,
                size: 20,
            }),
        ).resolves.toEqual(browseEventsPage);
        await fetchBrowseEvents({ size: 20 });

        expect(new URL(fetchMock.requests[0]!.url).pathname).toBe("/api/browse/events");
        expect(sent(fetchMock.requests[0]!.url)).toEqual({
            lat: "47.5",
            lon: "19",
            radiusKm: "25",
            kind: "TECHNO",
            q: "night",
            sort: "start",
            page: "1",
            size: "20",
        });
        expect(sent(fetchMock.requests[1]!.url)).toEqual({ size: "20" });
    });

    it("reads places and performers with their filters", async () => {
        const fetchMock = mockApi({
            "GET /api/browse/places": browsePlacesPage,
            "GET /api/browse/performers": browsePerformersPage,
        });
        await expect(fetchBrowsePlaces({ lat: 1, lon: 2, tag: "ruin", sort: "name" })).resolves.toEqual(
            browsePlacesPage,
        );
        await expect(fetchBrowsePerformers({ genre: "house", q: "dj", page: 2 })).resolves.toEqual(
            browsePerformersPage,
        );
        expect(sent(fetchMock.requests[0]!.url)).toEqual({ lat: "1", lon: "2", tag: "ruin", sort: "name" });
        expect(sent(fetchMock.requests[1]!.url)).toEqual({ genre: "house", q: "dj", page: "2" });
    });

    it("reads the facets", async () => {
        const fetchMock = mockApi({
            "GET /api/browse/place-tags": placeTags,
            "GET /api/browse/performer-genres": performerGenres,
        });
        await expect(fetchPlaceTags()).resolves.toEqual(placeTags);
        await expect(fetchPerformerGenres()).resolves.toEqual(performerGenres);
        expect(fetchMock.requests.map((request) => new URL(request.url).pathname)).toEqual([
            "/api/browse/place-tags",
            "/api/browse/performer-genres",
        ]);
    });
});
