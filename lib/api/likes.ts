import {apiDelete, apiGet, apiPut} from "@/lib/api/api"
import type {JwtSession} from "@/lib/auth/jwt-session"
import {ID, LikedEventsGrouped, LikeStatus, LikeTarget, Performer, Place} from "@/lib/types";

function likePath(target: LikeTarget, id: ID): string {
    return `/me/likes/${target}/${id}`
}

export async function fetchLikeStatus(
    target: LikeTarget,
    id: ID,
    session: JwtSession | null
): Promise<LikeStatus> {
    return apiGet<LikeStatus>(likePath(target, id), session)
}

export async function like(
    target: LikeTarget,
    id: ID,
    session: JwtSession | null
): Promise<LikeStatus> {
    return apiPut<LikeStatus>(likePath(target, id), session)
}

export async function unlike(
    target: LikeTarget,
    id: ID,
    session: JwtSession | null
): Promise<LikeStatus> {
    return apiDelete<LikeStatus>(likePath(target, id), session)
}

export async function fetchLikedEvents(session: JwtSession | null) {
    return await apiGet<LikedEventsGrouped>(`/events/liked-events`, session)
}

export async function fetchLikedPlaces(session: JwtSession | null) {
    return await apiGet<Place[]>(`/places/liked-places`, session)
}

export async function fetchLikedPerformers(session: JwtSession | null) {
    return await apiGet<Performer[]>(`/performers/liked-performers`, session)
}
