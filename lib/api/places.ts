import {Place, PlaceAdminListItemData, PlaceCreatePayload, UpcomingEventByPlace} from "@/lib/types";
import {apiGet, apiPost, apiPut} from "@/lib/api/api"
import type {JwtSession} from "@/lib/auth/jwt-session";

export async function fetchPlaces(session: JwtSession | null) {
    return await apiGet<Place[]>("/places", session)
}

export async function fetchPlace(id: string, session: JwtSession | null) {
    return await apiGet<Place>(`/places/${id}`, session)
}

export async function fetchPlaceByEventId(id: string, session: JwtSession | null) {
    return await apiGet<Place>(`/events/${id}/place`, session)
}

export async function fetchUpcomingEventByPlaceId(placeId: string, session: JwtSession | null) {
    return await apiGet<UpcomingEventByPlace>(`/places/${placeId}/upcoming-event`, session)
}

export async function fetchMyPlaces(session: JwtSession | null) {
    return apiGet<PlaceAdminListItemData[]>("/places/owned-places", session)
}

export async function addPlace(payload: PlaceCreatePayload, session: JwtSession | null) {
    return apiPost<Place>("/places", session, payload)
}

export async function updatePlace(id: string, payload: PlaceCreatePayload, session: JwtSession | null) {
    return apiPut<Place>(`/places/${id}`, session, payload)
}

export async function respondToEventInvitation(id: string, eventPlanId: string, state: string, session: JwtSession | null) {
    return apiPut(`/places/${id}/invitations/${eventPlanId}/respond?state=${state}`, session)
}

