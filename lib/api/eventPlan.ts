import {
    EventPlan,
    EventPlanAdminListItemData,
    EventPlanCreatePayload,
    EventPlanLineupInvitation,
    EventPlanLineupInvitationCreatePayload,
    EventPlanPlaceInvitationWithDate,
    PlaceAdminListItemData,
} from "@/lib/types";
import {apiDelete, apiGet, apiPost, apiPut} from "@/lib/api/api";
import {JwtSession} from "@/lib/auth/jwt-session";


export async function addEventPlan(payload: EventPlanCreatePayload, session: JwtSession | null) {
    return apiPost<EventPlan>("/event-plan", session, payload)
}

export async function updateEventPlan(id: string, payload: EventPlanCreatePayload, session: JwtSession | null) {
    return apiPut<EventPlan>(`/event-plan/${id}`, session, payload)
}

export async function fetchMyEventPlans(session: JwtSession | null) {
    return apiGet<EventPlanAdminListItemData[]>("/event-plan/owned-event-plans", session)
}

export async function fetchEventPlan(id: string, session: JwtSession | null) {
    return apiGet<EventPlan>(`/event-plan/${id}`, session)
}

export async function fetchPlacesForAdminList(session: JwtSession | null) {
    return apiGet<PlaceAdminListItemData[]>("/event-plan/places", session)
}

export async function invitePlace(id: string, placeId: string, session: JwtSession | null) {
    return apiPut(`/event-plan/${id}/invite-place/${placeId}`, session)
}

export async function getEventPlan(id: string, session: JwtSession | null) {
    return apiGet<EventPlan | null>(`/event-plan/${id}`, session)
}

export async function getInvitationForPlace(id: string, session: JwtSession | null) {
    return apiGet<EventPlanPlaceInvitationWithDate[]>(`/places/${id}/invitations`, session)
}

export async function fetchLineupInvitationsForEventPlan(id: string, session: JwtSession | null) {
    return apiGet<EventPlanLineupInvitation[]>(`/event-plan/${id}/lineup-invitations`, session)
}

export async function addLineupInvitationToEventPlan(
    id: string,
    payload: EventPlanLineupInvitationCreatePayload,
    session: JwtSession | null,
) {
    return apiPost(`/event-plan/${id}/add-lineup-invitation`, session, payload)
}

export async function deleteLineupInvitationFromEventPlan(
    id: string,
    performerId: string,
    session: JwtSession | null,
) {
    return apiDelete(`/event-plan/${id}/lineup-invitation/${performerId}`, session)
}

export async function publishEventPlan(
    id: string,
    session: JwtSession | null,
) {
    return apiPost(`/event-plan/${id}/publish`, session);
}
