import {Event, EventAdminListItemData, ID, UpcomingEventByPlace} from '@/lib/types'
import {apiGet} from "@/lib/api/api"
import type {JwtSession} from "@/lib/auth/jwt-session";


export async function fetchEvent(id: ID, session: JwtSession | null): Promise<Event> {
    return apiGet<Event>(`/events/${id}`, session)
}

export async function fetchEventSByPlaceId(id: ID, session: JwtSession | null): Promise<Event[]> {
    return apiGet<Event[]>(`/events?placeId=${id}`, session)
}

export async function fetchEventsByPerformerId(id: ID, session: JwtSession | null): Promise<Event[]> {
    return apiGet<Event[]>(`/events?performerId=${id}`, session)
}

export async function fetchUpcomingEventsForAllPlaces(session: JwtSession | null): Promise<UpcomingEventByPlace[]> {
    return apiGet<UpcomingEventByPlace[]>("/events/upcoming-events", session)
}

export async function fetchMyEvents(session: JwtSession | null) {
    return apiGet<EventAdminListItemData[]>("/events/owned-events", session)
}