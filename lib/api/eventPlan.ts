import {EventPlan, EventPlanAdminListItemData, EventPlanCreatePayload, PlaceAdminListItemData,} from "@/lib/types";
import {apiGet, apiPost, apiPut} from "@/lib/api/api";
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