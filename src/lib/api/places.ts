import { api } from "@/lib/api/client";
import type { ID, Place, PlaceInvitationRequest, PlaceListItem, PlacePayload } from "@/lib/types";

export const fetchPlaces = () => api.get<Place[]>("/places");
export const fetchPlace = (id: ID) => api.get<Place>(`/places/${id}`);
export const fetchPlaceByEventId = (eventId: ID) => api.get<Place>(`/events/${eventId}/place`);
export const fetchOwnedPlaces = () => api.get<PlaceListItem[]>("/places/owned-places");
export const createPlace = (payload: PlacePayload) => api.post<Place>("/places", payload);
export const updatePlace = (id: ID, payload: PlacePayload) => api.put<Place>(`/places/${id}`, payload);
export const fetchPlaceInvitations = (id: ID) => api.get<PlaceInvitationRequest[]>(`/places/${id}/invitations`);
export const respondToPlaceInvitation = (id: ID, eventPlanId: ID, answer: "accept" | "reject") =>
    api.put<void>(`/places/${id}/invitations/${eventPlanId}/respond?state=${answer}`);
