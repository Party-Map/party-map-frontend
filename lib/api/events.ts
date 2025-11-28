import {Event, EventAdminListItemData, UpcomingEventByPlace} from '@/lib/types'
import {apiGet} from "@/lib/api/api"
import type {JwtSession} from "@/lib/auth/jwt-session";

export async function fetchEvents(session: JwtSession | null): Promise<Event[]> {
    return apiGet<Event[]>("/events", session)
}

export async function fetchEvent(id: string, session: JwtSession | null): Promise<Event> {
    return apiGet<Event>(`/events/${id}`, session)
}

export async function fetchEventSByPlaceId(id: string, session: JwtSession | null): Promise<Event[]> {
    return apiGet<Event[]>(`/events?placeId=${id}`, session)
}

export async function fetchEventsByPerformerId(id: string, session: JwtSession | null): Promise<Event[]> {
    return apiGet<Event[]>(`/events?performerId=${id}`, session)
}

export async function fetchUpcomingEventsForAllPlaces(session: JwtSession | null): Promise<UpcomingEventByPlace[]> {
    return apiGet<UpcomingEventByPlace[]>("/events/upcoming-events", session)
}

export async function fetchMyEvents(session: JwtSession | null) {
    return apiGet<EventAdminListItemData[]>("/events/owned-events", session)
}