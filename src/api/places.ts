// Places: the public list and detail, and the owner's CRUD and invitation answers.
import { client, unwrap } from "./client";
import type { ID, PlacePayload } from "./types";

const byId = (id: ID) => ({ params: { path: { id } } });

export const fetchPlaces = () => unwrap(client.GET("/api/places"));
export const fetchPlace = (id: ID) => unwrap(client.GET("/api/places/{id}", byId(id)));
export const fetchPlaceByEventId = (eventId: ID) => unwrap(client.GET("/api/events/{id}/place", byId(eventId)));
export const fetchOwnedPlaces = () => unwrap(client.GET("/api/places/owned-places"));
export const createPlace = (payload: PlacePayload) => unwrap(client.POST("/api/places", { body: payload }));
export const updatePlace = (id: ID, payload: PlacePayload) =>
    unwrap(client.PUT("/api/places/{id}", { ...byId(id), body: payload }));
export const fetchPlaceInvitations = (id: ID) => unwrap(client.GET("/api/places/{id}/invitations", byId(id)));
export const respondToPlaceInvitation = (id: ID, eventPlanId: ID, answer: "accept" | "reject") =>
    unwrap(
        client.PUT("/api/places/{id}/invitations/{eventPlanId}/respond", {
            params: { path: { id, eventPlanId }, query: { state: answer } },
        }),
    );
