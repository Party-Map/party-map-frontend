// Place and performer invitations arrive in two API shapes; the admin pages show both as one kind of request.
import type { ID, InvitationState, PerformerInvitationRequest, PlaceInvitationRequest } from "@/api/types";

export type Answer = "accept" | "reject";

export interface InvitationRequest {
    /** Unique per row: one plan can invite several of the manager's places or performers. */
    key: string;
    eventPlanId: ID;
    title: string;
    start: string;
    end: string;
    state: InvitationState;
    /** The invited place or performer. */
    targetId: ID;
    targetName: string;
}

export function fromPlaceRequest(request: PlaceInvitationRequest, place: { id: ID; name: string }): InvitationRequest {
    return {
        key: `${place.id}:${request.eventPlanId}`,
        eventPlanId: request.eventPlanId,
        title: request.title,
        start: request.startDateTime,
        end: request.endDateTime,
        state: request.state,
        targetId: place.id,
        targetName: place.name,
    };
}

export function fromPerformerRequest(request: PerformerInvitationRequest): InvitationRequest {
    return {
        key: `${request.performer.id}:${request.eventPlanId}`,
        eventPlanId: request.eventPlanId,
        title: request.eventPlanTitle,
        start: request.startTime,
        end: request.endTime,
        state: request.state,
        targetId: request.performer.id,
        targetName: request.performer.name,
    };
}

const ORDER: Record<InvitationState, number> = { PENDING: 0, ACCEPTED: 1, REJECTED: 2 };

/** Pending first (they need an answer), then by start time. */
export function sortRequests(requests: InvitationRequest[]): InvitationRequest[] {
    return requests.toSorted((a, b) => ORDER[a.state] - ORDER[b.state] || a.start.localeCompare(b.start));
}
