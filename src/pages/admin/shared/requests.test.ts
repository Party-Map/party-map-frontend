import { performer } from "@/test/fixtures";

import { fromPerformerRequest, fromPlaceRequest, type InvitationRequest, sortRequests } from "./requests";

describe("invitation requests", () => {
    it("normalise a place invitation with its place", () => {
        expect(
            fromPlaceRequest(
                {
                    eventPlanId: "plan-1",
                    title: "Summer Opening",
                    startDateTime: "2030-07-01T18:00:00",
                    endDateTime: "2030-07-02T02:00:00",
                    state: "PENDING",
                },
                { id: "place-1", name: "Danube Club" },
            ),
        ).toEqual({
            key: "place-1:plan-1",
            eventPlanId: "plan-1",
            title: "Summer Opening",
            start: "2030-07-01T18:00:00",
            end: "2030-07-02T02:00:00",
            state: "PENDING",
            targetId: "place-1",
            targetName: "Danube Club",
        });
    });

    it("normalise a lineup invitation with its performer", () => {
        expect(
            fromPerformerRequest({
                eventPlanId: "plan-1",
                eventPlanTitle: "Summer Opening",
                startTime: "2030-07-01T20:00:00",
                endTime: "2030-07-01T22:00:00",
                state: "ACCEPTED",
                performer,
            }),
        ).toMatchObject({
            key: `${performer.id}:plan-1`,
            title: "Summer Opening",
            start: "2030-07-01T20:00:00",
            targetName: performer.name,
            state: "ACCEPTED",
        });
    });

    it("sort pending first, then by start", () => {
        const request = (key: string, state: InvitationRequest["state"], start: string): InvitationRequest => ({
            key,
            eventPlanId: key,
            title: key,
            start,
            end: start,
            state,
            targetId: "t",
            targetName: "t",
        });
        const sorted = sortRequests([
            request("rejected", "REJECTED", "2030-01-01"),
            request("late", "PENDING", "2030-03-01"),
            request("accepted", "ACCEPTED", "2029-01-01"),
            request("early", "PENDING", "2030-02-01"),
        ]);
        expect(sorted.map((r) => r.key)).toEqual(["early", "late", "accepted", "rejected"]);
    });
});
