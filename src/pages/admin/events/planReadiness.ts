// Whether an event plan can be published, and what is still missing, from the rules the API enforces on publish:
// a venue accepted and no performer invitation still waiting for an answer.
import type { EventPlan, EventPlanLineupInvitation } from "@/api/types";

export interface ReadinessItem {
    id: "venue" | "lineup";
    label: string;
    done: boolean;
    hint: string;
}

export interface Readiness {
    ready: boolean;
    items: ReadinessItem[];
    /** Performers who said yes; they become the published event's lineup. */
    confirmed: number;
}

function venueItem(plan: EventPlan): ReadinessItem {
    const invitation = plan.placeInvitation;
    const label = "A venue accepted";
    if (!invitation) return { id: "venue", label, done: false, hint: "Invite a place to host the event." };
    const name = invitation.place.name;
    switch (invitation.state) {
        case "ACCEPTED":
            return { id: "venue", label, done: true, hint: `${name} will host the event.` };
        case "PENDING":
            return { id: "venue", label, done: false, hint: `Waiting for ${name} to answer.` };
        case "REJECTED":
            return { id: "venue", label, done: false, hint: `${name} declined. Invite another place.` };
    }
}

function lineupItem(lineup: EventPlanLineupInvitation[]): ReadinessItem {
    const label = "Every invited performer answered";
    const waiting = lineup.filter((invitation) => invitation.state === "PENDING").length;
    if (lineup.length === 0) {
        return { id: "lineup", label, done: true, hint: "No performers invited. A lineup is optional." };
    }
    if (waiting === 0) return { id: "lineup", label, done: true, hint: "Everyone you invited has answered." };
    return {
        id: "lineup",
        label,
        done: false,
        hint: `${waiting} ${waiting === 1 ? "performer has" : "performers have"} not answered yet. Wait or withdraw.`,
    };
}

export function planReadiness(plan: EventPlan, lineup: EventPlanLineupInvitation[]): Readiness {
    const items = [venueItem(plan), lineupItem(lineup)];
    return {
        ready: items.every((item) => item.done),
        items,
        confirmed: lineup.filter((invitation) => invitation.state === "ACCEPTED").length,
    };
}
