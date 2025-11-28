import {Performer, PerformerAdminListItemData, PerformerCreatePayload,} from "@/lib/types";
import {apiGet, apiPost, apiPut} from "@/lib/api/api"
import type {JwtSession} from "@/lib/auth/jwt-session";

export async function fetchPerformers(session: JwtSession | null): Promise<Performer[]> {
    return apiGet<Performer[]>("/performers", session)
}

export async function fetchPerformer(id: string, session: JwtSession | null): Promise<Performer> {
    return apiGet<Performer>(`/performers/${id}`, session)
}

export async function fetchPerformersByEventId(id: string, session: JwtSession | null): Promise<Performer[]> {
    return apiGet<Performer[]>(`/events?performerId=${id}`, session)
}

export async function fetchMyPerformers(session: JwtSession | null) {
    return apiGet<PerformerAdminListItemData[]>("/performers/owned-performers", session)
}

export async function addPerformer(payload: PerformerCreatePayload, session: JwtSession | null) {
    return apiPost<Performer>("/performers", session, payload)
}

export async function updatePerformer(id: string, payload: PerformerCreatePayload, session: JwtSession | null) {
    return apiPut<Performer>(`/performers/${id}`, session, payload)
}