import { api } from "@/lib/api/client";
import type { ID, Performer, PerformerInvitationRequest, PerformerListItem, PerformerPayload } from "@/lib/types";

export const fetchPerformers = () => api.get<Performer[]>("/performers");
export const fetchPerformer = (id: ID) => api.get<Performer>(`/performers/${id}`);
export const fetchOwnedPerformers = () => api.get<PerformerListItem[]>("/performers/owned-performers");
export const createPerformer = (payload: PerformerPayload) => api.post<Performer>("/performers", payload);
export const updatePerformer = (id: ID, payload: PerformerPayload) => api.put<Performer>(`/performers/${id}`, payload);
export const fetchPerformerInvitations = (id: ID) =>
    api.get<PerformerInvitationRequest[]>(`/performers/${id}/invitations`);
export const respondToPerformerInvitation = (id: ID, eventPlanId: ID, answer: "accept" | "reject") =>
    api.put<undefined>(`/performers/${id}/invitations/${eventPlanId}/respond?state=${answer}`);
