import {Performer} from "@/lib/types";
import {apiGet} from "@/lib/api/api"
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