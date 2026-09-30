import { api } from "@/lib/api/client";
import type { Event, ID, OwnedEventListItem, UpcomingEventByPlace } from "@/lib/types";

export const fetchEvent = (id: ID) => api.get<Event>(`/events/${id}`);
export const fetchEventsByPlace = (placeId: ID) => api.get<Event[]>(`/events?placeId=${encodeURIComponent(placeId)}`);
export const fetchEventsByPerformer = (performerId: ID) =>
    api.get<Event[]>(`/events?performerId=${encodeURIComponent(performerId)}`);
export const fetchUpcomingEventsByPlace = () => api.get<UpcomingEventByPlace[]>("/events/upcoming-events");
export const fetchOwnedEvents = () => api.get<OwnedEventListItem[]>("/events/owned-events");
