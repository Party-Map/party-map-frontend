import type { Mock } from "vitest";

import {
    addLineupInvitation,
    createEventPlan,
    deleteLineupInvitation,
    fetchEventPlan,
    fetchInvitablePlaces,
    fetchLineupInvitations,
    fetchOwnedEventPlans,
    invitePlace,
    publishEventPlan,
    updateEventPlan,
} from "@/lib/api/eventPlans";
import type {
    EventPlanLineupInvitation,
    EventPlanListItem,
    EventPlanPayload,
    LineupInvitationPayload,
    PlaceListItem,
} from "@/lib/types";
import { eventPlan, performer, place } from "@/test/fixtures";
import { mockApi, requestBody } from "@/test/helpers";

const BASE = "http://api.test/api";

function sentRequests(fetchMock: Mock): string[] {
    return fetchMock.mock.calls.map((call) => {
        const [url, init] = call as [unknown, RequestInit | undefined];
        return `${init?.method ?? "GET"} ${String(url)}`;
    });
}

const payload: EventPlanPayload = {
    title: "Summer Opening",
    kind: "DISCO",
    startDateTime: "2030-07-01T18:00",
    endDateTime: "2030-07-02T02:00",
    description: "Season opener.",
    price: "2500",
    image: null,
    links: [],
};

describe("event plans api", () => {
    it("creates, updates, lists and reads plans", async () => {
        const listItem: EventPlanListItem = {
            id: eventPlan.id,
            title: eventPlan.title,
            startDateTime: eventPlan.startDateTime,
            endDateTime: eventPlan.endDateTime,
        };
        const invitable: PlaceListItem = { id: place.id, name: place.name, address: place.address, city: place.city };
        const fetchMock = mockApi({
            "POST /api/event-plan": eventPlan,
            "PUT /api/event-plan/plan-1": eventPlan,
            "GET /api/event-plan/owned-event-plans": [listItem],
            "GET /api/event-plan/plan-1": eventPlan,
            "GET /api/event-plan/places": [invitable],
        });
        await expect(createEventPlan(payload)).resolves.toEqual(eventPlan);
        await expect(updateEventPlan("plan-1", payload)).resolves.toEqual(eventPlan);
        await expect(fetchOwnedEventPlans()).resolves.toEqual([listItem]);
        await expect(fetchEventPlan("plan-1")).resolves.toEqual(eventPlan);
        await expect(fetchInvitablePlaces()).resolves.toEqual([invitable]);
        expect(sentRequests(fetchMock)).toEqual([
            `POST ${BASE}/event-plan`,
            `PUT ${BASE}/event-plan/plan-1`,
            `GET ${BASE}/event-plan/owned-event-plans`,
            `GET ${BASE}/event-plan/plan-1`,
            `GET ${BASE}/event-plan/places`,
        ]);
        expect(requestBody(fetchMock, 0)).toEqual(payload);
        expect(requestBody(fetchMock, 1)).toEqual(payload);
    });

    it("manages place and lineup invitations and publishing", async () => {
        const lineup: LineupInvitationPayload = {
            performerId: performer.id,
            startTime: "2030-07-01T20:00",
            endTime: "2030-07-01T22:00",
            state: "PENDING",
        };
        const invitation: EventPlanLineupInvitation = {
            state: "PENDING",
            startTime: lineup.startTime,
            endTime: lineup.endTime,
            performer,
        };
        const fetchMock = mockApi({
            "PUT /api/event-plan/plan-1/invite-place/place-1": null,
            "GET /api/event-plan/plan-1/lineup-invitations": [invitation],
            "POST /api/event-plan/plan-1/add-lineup-invitation": null,
            "DELETE /api/event-plan/plan-1/lineup-invitation/performer-1": null,
            "POST /api/event-plan/plan-1/publish": null,
        });
        await expect(invitePlace("plan-1", "place-1")).resolves.toBeUndefined();
        await expect(fetchLineupInvitations("plan-1")).resolves.toEqual([invitation]);
        await expect(addLineupInvitation("plan-1", lineup)).resolves.toBeUndefined();
        await expect(deleteLineupInvitation("plan-1", "performer-1")).resolves.toBeUndefined();
        await expect(publishEventPlan("plan-1")).resolves.toBeUndefined();
        expect(sentRequests(fetchMock)).toEqual([
            `PUT ${BASE}/event-plan/plan-1/invite-place/place-1`,
            `GET ${BASE}/event-plan/plan-1/lineup-invitations`,
            `POST ${BASE}/event-plan/plan-1/add-lineup-invitation`,
            `DELETE ${BASE}/event-plan/plan-1/lineup-invitation/performer-1`,
            `POST ${BASE}/event-plan/plan-1/publish`,
        ]);
        expect(requestBody(fetchMock, 0)).toBeUndefined();
        expect(requestBody(fetchMock, 2)).toEqual(lineup);
        expect(requestBody(fetchMock, 4)).toBeUndefined();
    });
});
