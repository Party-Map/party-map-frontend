import { api } from "@/lib/api/client";
import type { ID, LikedEventsGrouped, LikeStatus, LikeTarget, Performer, Place } from "@/lib/types";

const likePath = (target: LikeTarget, id: ID) => `/me/likes/${target}/${id}`;

export const fetchLikeStatus = (target: LikeTarget, id: ID) => api.get<LikeStatus>(likePath(target, id));
export const like = (target: LikeTarget, id: ID) => api.put<LikeStatus>(likePath(target, id));
export const unlike = (target: LikeTarget, id: ID) => api.delete<LikeStatus>(likePath(target, id));

export const fetchLikedEvents = () => api.get<LikedEventsGrouped>("/events/liked-events");
export const fetchLikedPlaces = () => api.get<Place[]>("/places/liked-places");
export const fetchLikedPerformers = () => api.get<Performer[]>("/performers/liked-performers");
