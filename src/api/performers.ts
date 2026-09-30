// Performers: the public list and detail, and the manager's CRUD and invitation answers.
import { client, unwrap } from "./client";
import type { ID, PerformerPayload } from "./types";

const byId = (id: ID) => ({ params: { path: { id } } });

export const fetchPerformers = () => unwrap(client.GET("/api/performers"));
export const fetchPerformer = (id: ID) => unwrap(client.GET("/api/performers/{id}", byId(id)));
export const fetchOwnedPerformers = () => unwrap(client.GET("/api/performers/owned-performers"));
export const createPerformer = (payload: PerformerPayload) => unwrap(client.POST("/api/performers", { body: payload }));
export const updatePerformer = (id: ID, payload: PerformerPayload) =>
    unwrap(client.PUT("/api/performers/{id}", { ...byId(id), body: payload }));
export const fetchPerformerInvitations = (id: ID) => unwrap(client.GET("/api/performers/{id}/invitations", byId(id)));
export const respondToPerformerInvitation = (id: ID, eventPlanId: ID, answer: "accept" | "reject") =>
    unwrap(
        client.PUT("/api/performers/{id}/invitations/{eventPlanId}/respond", {
            params: { path: { id, eventPlanId }, query: { state: answer } },
        }),
    );
