// Query keys, one small factory per API area. A family's `all` key prefixes every key in it, so invalidating
// `placeKeys.all` refreshes every place query after a place changes.
import type { AdminUserQuery } from "./admin";
import type { BrowseEventsQuery, BrowsePerformersQuery, BrowsePlacesQuery, ID, LikeTarget } from "./types";

export const placeKeys = {
    all: ["places"] as const,
    list: (bbox?: string) => [...placeKeys.all, "list", bbox ?? "all"] as const,
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
    byPlace: (placeId: ID) => [...eventKeys.all, "by-place", placeId] as const,
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

export const adminKeys = {
    all: ["admin"] as const,
    users: () => [...adminKeys.all, "users"] as const,
    userList: (query: AdminUserQuery) => [...adminKeys.users(), "list", query.q ?? "", query.page, query.size] as const,
    user: (id: ID) => [...adminKeys.users(), "detail", id] as const,
};

export const browseKeys = {
    all: ["browse"] as const,
    events: (query: BrowseEventsQuery) => [...browseKeys.all, "events", query] as const,
    places: (query: BrowsePlacesQuery) => [...browseKeys.all, "places", query] as const,
    performers: (query: BrowsePerformersQuery) => [...browseKeys.all, "performers", query] as const,
    placeTags: () => [...browseKeys.all, "place-tags"] as const,
    performerGenres: () => [...browseKeys.all, "performer-genres"] as const,
};
