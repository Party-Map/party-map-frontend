import type { EventPlanLineupInvitation } from "@/api/types";
import { eventPlan, performer, place } from "@/test/fixtures";

import { planReadiness } from "./planReadiness";

const slot = (state: EventPlanLineupInvitation["state"], id = performer.id): EventPlanLineupInvitation => ({
    performer: { ...performer, id },
    state,
    startTime: "2030-07-01T20:00:00",
    endTime: "2030-07-01T22:00:00",
});
const withVenue = (state: "PENDING" | "ACCEPTED" | "REJECTED") => ({
    ...eventPlan,
    placeInvitation: { state, place },
});

describe("planReadiness", () => {
    it("is not ready without a venue", () => {
        const readiness = planReadiness(eventPlan, []);
        expect(readiness.ready).toBe(false);
        expect(readiness.items[0]).toMatchObject({
            id: "venue",
            done: false,
            hint: "Invite a place to host the event.",
        });
        expect(readiness.items[1]).toMatchObject({ done: true, hint: "No performers invited. A lineup is optional." });
    });

    it("names the venue while it has not answered or declined", () => {
        expect(planReadiness(withVenue("PENDING"), []).items[0]?.hint).toBe("Waiting for A38 Hajó to answer.");
        expect(planReadiness(withVenue("REJECTED"), []).items[0]?.hint).toBe(
            "A38 Hajó declined. Invite another place.",
        );
    });

    it("is ready with an accepted venue and every performer answered, counting the confirmed ones", () => {
        const readiness = planReadiness(withVenue("ACCEPTED"), [slot("ACCEPTED"), slot("REJECTED", "p2")]);
        expect(readiness).toMatchObject({ ready: true, confirmed: 1 });
        expect(readiness.items.map((item) => item.hint)).toEqual([
            "A38 Hajó will host the event.",
            "Everyone you invited has answered.",
        ]);
    });

    it("waits for pending performers", () => {
        expect(planReadiness(withVenue("ACCEPTED"), [slot("PENDING")]).items[1]?.hint).toBe(
            "1 performer has not answered yet. Wait or withdraw.",
        );
        const two = planReadiness(withVenue("ACCEPTED"), [slot("PENDING"), slot("PENDING", "p2")]);
        expect(two.ready).toBe(false);
        expect(two.items[1]?.hint).toBe("2 performers have not answered yet. Wait or withdraw.");
    });
});
