// Query keys, one small factory per API area. A family's `all` key prefixes every key in it, so invalidating
// `placeKeys.all` refreshes every place query after a place changes.
import type { ID, LikeTarget } from "./types";

export const placeKeys = {
    all: ["places"] as const,
    list: () => [...placeKeys.all, "list"] as const,
    page: (id: ID) => [...placeKeys.all, "page", id] as const,
    detail: (id: ID) => [...placeKeys.all, "detail", id] as const,
    owned: () => [...placeKeys.all, "owned"] as const,
    invitations: (id: ID) => [...placeKeys.all, "invitations", id] as const,
};

export const performerKeys = {
    all: ["performers"] as const,
    list: () => [...performerKeys.all, "list"] as const,
    page: (id: ID) => [...performerKeys.all, "page", id] as const,
    detail: (id: ID) => [...performerKeys.all, "detail", id] as const,
    owned: () => [...performerKeys.all, "owned"] as const,
    invitations: (id: ID) => [...performerKeys.all, "invitations", id] as const,
};

export const eventKeys = {
    all: ["events"] as const,
    page: (id: ID) => [...eventKeys.all, "page", id] as const,
    upcoming: () => [...eventKeys.all, "upcoming"] as const,
    owned: () => [...eventKeys.all, "owned"] as const,
};

export const eventPlanKeys = {
    all: ["event-plans"] as const,
    owned: () => [...eventPlanKeys.all, "owned"] as const,
    detail: (id: ID) => [...eventPlanKeys.all, "detail", id] as const,
    lineup: (id: ID) => [...eventPlanKeys.all, "lineup", id] as const,
    invitablePlaces: () => [...eventPlanKeys.all, "invitable-places"] as const,
};

export const searchKeys = {
    all: ["search"] as const,
    query: (q: string) => [...searchKeys.all, q] as const,
};

export const likeKeys = {
    all: ["likes"] as const,
    status: (target: LikeTarget, id: ID) => [...likeKeys.all, "status", target, id] as const,
    mine: () => [...likeKeys.all, "mine"] as const,
};
