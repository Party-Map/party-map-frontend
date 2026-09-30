import { place, place2 } from "@/test/fixtures";
import { type ApiMock, mockApi, requestBody } from "@/test/helpers";

import {
    createPlace,
    fetchOwnedPlaces,
    fetchPlace,
    fetchPlaceByEventId,
    fetchPlaceInvitations,
    fetchPlaces,
    respondToPlaceInvitation,
    updatePlace,
} from "./places";
import type { PlaceInvitationRequest, PlacePayload } from "./types";

const BASE = "http://api.test/api";

function sentRequests(fetchMock: ApiMock): string[] {
    return fetchMock.requests.map((request) => `${request.method} ${request.url}`);
}

const payload: PlacePayload = {
    name: "New place",
    address: "Street 1",
    city: "Budapest",
    location: { latitude: 1, longitude: 2 },
    description: "A place",
    tags: ["bar"],
    image: null,
};

describe("places api", () => {
    it("reads places", async () => {
        const owned = { id: place.id, name: place.name, address: place.address, city: place.city };
        const fetchMock = mockApi({
            "GET /api/places": [place, place2],
            "GET /api/places/place-1": place,
            "GET /api/events/event-1/place": place,
            "GET /api/places/owned-places": [owned],
        });
        await expect(fetchPlaces()).resolves.toEqual([place, place2]);
        await expect(fetchPlace("place-1")).resolves.toEqual(place);
        await expect(fetchPlaceByEventId("event-1")).resolves.toEqual(place);
        await expect(fetchOwnedPlaces()).resolves.toEqual([owned]);
        expect(sentRequests(fetchMock)).toEqual([
            `GET ${BASE}/places`,
            `GET ${BASE}/places/place-1`,
            `GET ${BASE}/events/event-1/place`,
            `GET ${BASE}/places/owned-places`,
        ]);
    });

    it("creates and updates places with a JSON payload", async () => {
        const fetchMock = mockApi({ "POST /api/places": place, "PUT /api/places/place-1": place });
        await expect(createPlace(payload)).resolves.toEqual(place);
        await expect(updatePlace("place-1", payload)).resolves.toEqual(place);
        expect(sentRequests(fetchMock)).toEqual([`POST ${BASE}/places`, `PUT ${BASE}/places/place-1`]);
        expect(requestBody(fetchMock, 0)).toEqual(payload);
        expect(requestBody(fetchMock, 1)).toEqual(payload);
    });

    it("reads and answers invitations", async () => {
        const invitation: PlaceInvitationRequest = {
            eventPlanId: "plan-1",
            state: "PENDING",
            title: "Summer Opening",
            startDateTime: "2030-07-01T18:00:00",
            endDateTime: "2030-07-02T02:00:00",
        };
        const fetchMock = mockApi({
            "GET /api/places/place-1/invitations": [invitation],
            "PUT /api/places/place-1/invitations/plan-1/respond?state=accept": null,
            "PUT /api/places/place-1/invitations/plan-1/respond?state=reject": null,
        });
        await expect(fetchPlaceInvitations("place-1")).resolves.toEqual([invitation]);
        await expect(respondToPlaceInvitation("place-1", "plan-1", "accept")).resolves.toBeUndefined();
        await expect(respondToPlaceInvitation("place-1", "plan-1", "reject")).resolves.toBeUndefined();
        expect(sentRequests(fetchMock)).toEqual([
            `GET ${BASE}/places/place-1/invitations`,
            `PUT ${BASE}/places/place-1/invitations/plan-1/respond?state=accept`,
            `PUT ${BASE}/places/place-1/invitations/plan-1/respond?state=reject`,
        ]);
        expect(requestBody(fetchMock, 1)).toBeUndefined();
    });
});
