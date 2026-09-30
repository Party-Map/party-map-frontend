// Event plans (drafts): the organizer's CRUD, the place and lineup invitations, and publishing.
import { client, unwrap } from "./client";
import type { EventPlanPayload, ID, LineupInvitationPayload } from "./types";

const byId = (id: ID) => ({ params: { path: { id } } });

export const createEventPlan = (payload: EventPlanPayload) => unwrap(client.POST("/api/event-plan", { body: payload }));
export const updateEventPlan = (id: ID, payload: EventPlanPayload) =>
    unwrap(client.PUT("/api/event-plan/{id}", { ...byId(id), body: payload }));
export const fetchOwnedEventPlans = () => unwrap(client.GET("/api/event-plan/owned-event-plans"));
export const fetchEventPlan = (id: ID) => unwrap(client.GET("/api/event-plan/{id}", byId(id)));
export const fetchInvitablePlaces = () => unwrap(client.GET("/api/event-plan/places"));
export const invitePlace = (id: ID, placeId: ID) =>
    unwrap(client.PUT("/api/event-plan/{id}/invite-place/{placeId}", { params: { path: { id, placeId } } }));
export const fetchLineupInvitations = (id: ID) =>
    unwrap(client.GET("/api/event-plan/{id}/lineup-invitations", byId(id)));
export const addLineupInvitation = (id: ID, payload: LineupInvitationPayload) =>
    unwrap(client.POST("/api/event-plan/{id}/add-lineup-invitation", { ...byId(id), body: payload }));
export const deleteLineupInvitation = (id: ID, performerId: ID) =>
    unwrap(
        client.DELETE("/api/event-plan/{id}/lineup-invitation/{performerId}", {
            params: { path: { id, performerId } },
        }),
    );
export const publishEventPlan = (id: ID) => unwrap(client.POST("/api/event-plan/{id}/publish", byId(id)));
