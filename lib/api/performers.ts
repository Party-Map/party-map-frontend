import {
    ID,
    Performer,
    PerformerAdminListItemData,
    PerformerCreatePayload,
    PerformerLineupInvitationWithDate,
} from "@/lib/types";
import {apiGet, apiPost, apiPut} from "@/lib/api/api"
import type {JwtSession} from "@/lib/auth/jwt-session";

export async function fetchPerformers(session: JwtSession | null): Promise<Performer[]> {
    return apiGet<Performer[]>("/performers", session)
}

export async function fetchPerformer(id: ID, session: JwtSession | null): Promise<Performer> {
    return apiGet<Performer>(`/performers/${id}`, session)
}

export async function fetchMyPerformers(session: JwtSession | null) {
    return apiGet<PerformerAdminListItemData[]>("/performers/owned-performers", session)
}

export async function addPerformer(payload: PerformerCreatePayload, session: JwtSession | null) {
    return apiPost<Performer>("/performers", session, payload)
}

export async function updatePerformer(id: ID, payload: PerformerCreatePayload, session: JwtSession | null) {
    return apiPut<Performer>(`/performers/${id}`, session, payload)
}

export async function getLineupInvitationsForPerformer(id: ID, session: JwtSession | null) {
    return apiGet<PerformerLineupInvitationWithDate[]>(`/performers/${id}/invitations`, session)
}

export async function respondToLineupInvitation(id: ID, eventPlanId: ID, state: string, session: JwtSession | null) {
    return apiPut(`/performers/${id}/invitations/${eventPlanId}/respond?state=${state}`, session)
}