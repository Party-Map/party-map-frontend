// Published events: detail, the lists by place or performer, the map's next event per place, the owner's list.
import { client, unwrap } from "./client";
import type { ID } from "./types";

export const fetchEvent = (id: ID) => unwrap(client.GET("/api/events/{id}", { params: { path: { id } } }));
export const fetchEventsByPlace = (placeId: ID) =>
    unwrap(client.GET("/api/events", { params: { query: { placeId } } }));
export const fetchEventsByPerformer = (performerId: ID) =>
    unwrap(client.GET("/api/events", { params: { query: { performerId } } }));
export const fetchUpcomingEventsByPlace = () => unwrap(client.GET("/api/events/upcoming-events"));
export const fetchOwnedEvents = () => unwrap(client.GET("/api/events/owned-events"));
