import type { Mock } from "vitest";

import {
    createPerformer,
    fetchOwnedPerformers,
    fetchPerformer,
    fetchPerformerInvitations,
    fetchPerformers,
    respondToPerformerInvitation,
    updatePerformer,
} from "@/lib/api/performers";
import type { PerformerInvitationRequest, PerformerPayload } from "@/lib/types";
import { performer } from "@/test/fixtures";
import { mockApi, requestBody } from "@/test/helpers";

const BASE = "http://api.test/api";

function sentRequests(fetchMock: Mock): string[] {
    return fetchMock.mock.calls.map((call) => {
        const [url, init] = call as [unknown, RequestInit | undefined];
        return `${init?.method ?? "GET"} ${String(url)}`;
    });
}

const payload: PerformerPayload = {
    name: "DJ New",
    genre: "house",
    bio: "Spins.",
    image: null,
    links: [{ type: "WEBSITE", url: "https://dj.example" }],
};

describe("performers api", () => {
    it("reads performers", async () => {
        const owned = { id: performer.id, name: performer.name };
        const fetchMock = mockApi({
            "GET /api/performers": [performer],
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/owned-performers": [owned],
        });
        await expect(fetchPerformers()).resolves.toEqual([performer]);
        await expect(fetchPerformer("performer-1")).resolves.toEqual(performer);
        await expect(fetchOwnedPerformers()).resolves.toEqual([owned]);
        expect(sentRequests(fetchMock)).toEqual([
            `GET ${BASE}/performers`,
            `GET ${BASE}/performers/performer-1`,
            `GET ${BASE}/performers/owned-performers`,
        ]);
    });

    it("creates and updates performers with a JSON payload", async () => {
        const fetchMock = mockApi({ "POST /api/performers": performer, "PUT /api/performers/performer-1": performer });
        await expect(createPerformer(payload)).resolves.toEqual(performer);
        await expect(updatePerformer("performer-1", payload)).resolves.toEqual(performer);
        expect(sentRequests(fetchMock)).toEqual([`POST ${BASE}/performers`, `PUT ${BASE}/performers/performer-1`]);
        expect(requestBody(fetchMock, 0)).toEqual(payload);
        expect(requestBody(fetchMock, 1)).toEqual(payload);
    });

    it("reads and answers invitations", async () => {
        const invitation: PerformerInvitationRequest = {
            eventPlanId: "plan-1",
            eventPlanTitle: "Summer Opening",
            state: "PENDING",
            startTime: "2030-07-01T20:00:00",
            endTime: "2030-07-01T22:00:00",
        };
        const fetchMock = mockApi({
            "GET /api/performers/performer-1/invitations": [invitation],
            "PUT /api/performers/performer-1/invitations/plan-1/respond?state=accept": null,
            "PUT /api/performers/performer-1/invitations/plan-1/respond?state=reject": null,
        });
        await expect(fetchPerformerInvitations("performer-1")).resolves.toEqual([invitation]);
        await expect(respondToPerformerInvitation("performer-1", "plan-1", "accept")).resolves.toBeUndefined();
        await expect(respondToPerformerInvitation("performer-1", "plan-1", "reject")).resolves.toBeUndefined();
        expect(sentRequests(fetchMock)).toEqual([
            `GET ${BASE}/performers/performer-1/invitations`,
            `PUT ${BASE}/performers/performer-1/invitations/plan-1/respond?state=accept`,
            `PUT ${BASE}/performers/performer-1/invitations/plan-1/respond?state=reject`,
        ]);
        expect(requestBody(fetchMock, 1)).toBeUndefined();
    });
});
