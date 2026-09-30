// The signed-in user's likes: the like state of one thing, toggling it, and everything liked.
import { client, unwrap } from "./client";
import type { ID, LikeStatus, LikeTarget } from "./types";

type LikeCall = (id: ID) => Promise<LikeStatus>;

// One typed path per target; the backend has no generic /me/likes/{target}/{id} route.
const CALLS: Record<LikeTarget, { get: LikeCall; put: LikeCall; delete: LikeCall }> = {
    events: {
        get: (eventId) => unwrap(client.GET("/api/me/likes/events/{eventId}", { params: { path: { eventId } } })),
        put: (eventId) => unwrap(client.PUT("/api/me/likes/events/{eventId}", { params: { path: { eventId } } })),
        delete: (eventId) => unwrap(client.DELETE("/api/me/likes/events/{eventId}", { params: { path: { eventId } } })),
    },
    places: {
        get: (placeId) => unwrap(client.GET("/api/me/likes/places/{placeId}", { params: { path: { placeId } } })),
        put: (placeId) => unwrap(client.PUT("/api/me/likes/places/{placeId}", { params: { path: { placeId } } })),
        delete: (placeId) => unwrap(client.DELETE("/api/me/likes/places/{placeId}", { params: { path: { placeId } } })),
    },
    performers: {
        get: (performerId) =>
            unwrap(client.GET("/api/me/likes/performers/{performerId}", { params: { path: { performerId } } })),
        put: (performerId) =>
            unwrap(client.PUT("/api/me/likes/performers/{performerId}", { params: { path: { performerId } } })),
        delete: (performerId) =>
            unwrap(client.DELETE("/api/me/likes/performers/{performerId}", { params: { path: { performerId } } })),
    },
};

export const fetchLikeStatus = (target: LikeTarget, id: ID) => CALLS[target].get(id);
export const like = (target: LikeTarget, id: ID) => CALLS[target].put(id);
export const unlike = (target: LikeTarget, id: ID) => CALLS[target].delete(id);
export const fetchLikedEvents = () => unwrap(client.GET("/api/events/liked-events"));
export const fetchLikedPlaces = () => unwrap(client.GET("/api/places/liked-places"));
export const fetchLikedPerformers = () => unwrap(client.GET("/api/performers/liked-performers"));
