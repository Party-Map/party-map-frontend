import {Place, PlaceUpcomingEvent} from "@/lib/types";
import {apiGet} from "@/lib/api/api"
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
    return await apiGet<PlaceUpcomingEvent>(`/places/${placeId}/upcoming-event`, session)
}