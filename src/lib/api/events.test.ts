import type { Mock } from "vitest";

import {
    fetchEvent,
    fetchEventsByPerformer,
    fetchEventsByPlace,
    fetchOwnedEvents,
    fetchUpcomingEventsByPlace,
} from "@/lib/api/events";
import type { OwnedEventListItem } from "@/lib/types";
import { event, upcoming } from "@/test/fixtures";
import { mockApi, requestBody } from "@/test/helpers";

const BASE = "http://api.test/api";

function sentRequests(fetchMock: Mock): string[] {
    return fetchMock.mock.calls.map((call) => {
        const [url, init] = call as [unknown, RequestInit | undefined];
        return `${init?.method ?? "GET"} ${String(url)}`;
    });
}

describe("events api", () => {
    it("reads events by id, place and performer with encoded query parameters", async () => {
        const fetchMock = mockApi({
            "GET /api/events/event-1": event,
            "GET /api/events?placeId=place%201": [event],
            "GET /api/events?performerId=performer%2F1": [event],
        });
        await expect(fetchEvent("event-1")).resolves.toEqual(event);
        await expect(fetchEventsByPlace("place 1")).resolves.toEqual([event]);
        await expect(fetchEventsByPerformer("performer/1")).resolves.toEqual([event]);
        expect(sentRequests(fetchMock)).toEqual([
            `GET ${BASE}/events/event-1`,
            `GET ${BASE}/events?placeId=place%201`,
            `GET ${BASE}/events?performerId=performer%2F1`,
        ]);
        expect(requestBody(fetchMock, 0)).toBeUndefined();
    });

    it("lists upcoming and owned events", async () => {
        const owned: OwnedEventListItem = {
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            placeName: "A38 Hajó",
        };
        const fetchMock = mockApi({
            "GET /api/events/upcoming-events": [upcoming],
            "GET /api/events/owned-events": [owned],
        });
        await expect(fetchUpcomingEventsByPlace()).resolves.toEqual([upcoming]);
        await expect(fetchOwnedEvents()).resolves.toEqual([owned]);
        expect(sentRequests(fetchMock)).toEqual([
            `GET ${BASE}/events/upcoming-events`,
            `GET ${BASE}/events/owned-events`,
        ]);
    });
});
