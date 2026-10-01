// The app's server state: one query hook per read and one mutation hook per write. Queries throw the fetchers'
// ApiError, so a component reads `error` (404 → not found) and `refetch` (retry). Mutations invalidate the key
// families they change, so every screen showing that data refreshes.
import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import type { ManagerRole } from "@/auth/roles";

import { type AdminUserQuery, fetchAdminUser, fetchAdminUsers, grantRole, revokeRole } from "./admin";
import {
    fetchBrowseEvents,
    fetchBrowsePerformers,
    fetchBrowsePlaces,
    fetchPerformerGenres,
    fetchPlaceTags,
} from "./browse";
import { ApiError } from "./client";
import {
    addLineupInvitation,
    createEventPlan,
    deleteLineupInvitation,
    fetchEventPlan,
    fetchInvitablePlaces,
    fetchLineupInvitations,
    fetchOwnedEventPlans,
    invitePlace,
    publishEventPlan,
    updateEventPlan,
} from "./eventPlans";
import {
    fetchEvent,
    fetchEventsByPerformer,
    fetchEventsByPlace,
    fetchOwnedEvents,
    fetchUpcomingEventsByPlace,
} from "./events";
import {
    adminKeys,
    browseKeys,
    eventKeys,
    eventPlanKeys,
    likeKeys,
    performerKeys,
    placeKeys,
    searchKeys,
} from "./keys";
import { fetchLikedEvents, fetchLikedPerformers, fetchLikedPlaces, fetchLikeStatus, like, unlike } from "./likes";
import {
    createPerformer,
    fetchOwnedPerformers,
    fetchPerformer,
    fetchPerformerInvitations,
    fetchPerformers,
    respondToPerformerInvitation,
    updatePerformer,
} from "./performers";
import {
    createPlace,
    fetchOwnedPlaces,
    fetchPlace,
    fetchPlaceByEventId,
    fetchPlaceInvitations,
    fetchPlaces,
    respondToPlaceInvitation,
    updatePlace,
} from "./places";
import { search } from "./search";
import type {
    BrowseEventsQuery,
    BrowsePerformersQuery,
    BrowsePlacesQuery,
    EventPlanPayload,
    ID,
    LikedEventsGrouped,
    LikeTarget,
    LineupInvitationPayload,
    Performer,
    PerformerPayload,
    Place,
    PlacePayload,
} from "./types";

type Answer = "accept" | "reject";

/* ---------- Browse ---------- */

interface Paged {
    total: number;
    page: number;
    size: number;
}

/** The next zero-based page while the loaded pages do not cover the total yet. */
export function nextBrowsePage(page: Paged): number | undefined {
    return (page.page + 1) * page.size < page.total ? page.page + 1 : undefined;
}

interface BrowseOptions {
    /** False while the filters are not ready (the position is still being looked up). */
    enabled?: boolean;
}

/** Events page by page; the hook manages `page`, the caller the other filters. */
export function useBrowseEvents(query: Omit<BrowseEventsQuery, "page">, { enabled = true }: BrowseOptions = {}) {
    return useInfiniteQuery({
        queryKey: browseKeys.events(query),
        queryFn: ({ pageParam }) => fetchBrowseEvents({ ...query, page: pageParam }),
        initialPageParam: 0,
        getNextPageParam: nextBrowsePage,
        placeholderData: keepPreviousData,
        enabled,
    });
}

export function useBrowsePlaces(query: Omit<BrowsePlacesQuery, "page">, { enabled = true }: BrowseOptions = {}) {
    return useInfiniteQuery({
        queryKey: browseKeys.places(query),
        queryFn: ({ pageParam }) => fetchBrowsePlaces({ ...query, page: pageParam }),
        initialPageParam: 0,
        getNextPageParam: nextBrowsePage,
        placeholderData: keepPreviousData,
        enabled,
    });
}

export function useBrowsePerformers(query: Omit<BrowsePerformersQuery, "page">) {
    return useInfiniteQuery({
        queryKey: browseKeys.performers(query),
        queryFn: ({ pageParam }) => fetchBrowsePerformers({ ...query, page: pageParam }),
        initialPageParam: 0,
        getNextPageParam: nextBrowsePage,
        placeholderData: keepPreviousData,
    });
}

export function usePlaceTags() {
    return useQuery({ queryKey: browseKeys.placeTags(), queryFn: fetchPlaceTags });
}

export function usePerformerGenres() {
    return useQuery({ queryKey: browseKeys.performerGenres(), queryFn: fetchPerformerGenres });
}

/* ---------- Public pages ---------- */

/**
 * The places inside `bbox`, all places when it is undefined, and nothing yet while it is null (the map has not
 * reported its viewport). The previous result stays visible while a new viewport loads.
 */
export function usePlaces(bbox?: string | null) {
    const area = bbox ?? undefined;
    return useQuery({
        queryKey: placeKeys.list(area),
        queryFn: () => fetchPlaces(area),
        enabled: bbox !== null,
        placeholderData: keepPreviousData,
    });
}

/** Module-level so TanStack Query can reuse the combined result while the queries are unchanged. */
const loadedPlaces = (results: { data?: Place; isPending: boolean }[]) => ({
    places: results.flatMap((result) => (result.data ? [result.data] : [])),
    pending: results.some((result) => result.isPending),
});

/**
 * The places with these ids, one cached request each, and whether any is still loading. Ids that fail to load are
 * left out.
 */
export function usePlacesById(ids: ID[]): { places: Place[]; pending: boolean } {
    return useQueries({
        queries: ids.map((id) => ({ queryKey: placeKeys.detail(id), queryFn: () => fetchPlace(id) })),
        combine: loadedPlaces,
    });
}

export function useUpcomingEvents() {
    return useQuery({ queryKey: eventKeys.upcoming(), queryFn: fetchUpcomingEventsByPlace });
}

/** A place with the events held there. */
export function usePlacePage(id: ID) {
    return useQuery({
        queryKey: placeKeys.page(id),
        queryFn: async () => {
            const [place, events] = await Promise.all([fetchPlace(id), fetchEventsByPlace(id)]);
            return { place, events };
        },
    });
}

/** An event without a venue is unusual but not fatal; only the event itself decides "not found". */
async function placeOfEventIfAny(eventId: ID): Promise<Place | null> {
    try {
        return await fetchPlaceByEventId(eventId);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    }
}

/** An event with its venue (null when the event has none). */
export function useEventPage(id: ID) {
    return useQuery({
        queryKey: eventKeys.page(id),
        queryFn: async () => {
            const [event, place] = await Promise.all([fetchEvent(id), placeOfEventIfAny(id)]);
            return { event, place };
        },
    });
}

/** A performer with the events they play at. */
export function usePerformerPage(id: ID) {
    return useQuery({
        queryKey: performerKeys.page(id),
        queryFn: async () => {
            const [performer, events] = await Promise.all([fetchPerformer(id), fetchEventsByPerformer(id)]);
            return { performer, events };
        },
    });
}

/** Hits for a search query; nothing is asked for an empty query. */
export function useSearch(query: string) {
    return useQuery({ queryKey: searchKeys.query(query), queryFn: () => search(query), enabled: query.length > 0 });
}

/* ---------- Likes ---------- */

export function useLikeStatus(target: LikeTarget, id: ID, { enabled }: { enabled: boolean }) {
    return useQuery({ queryKey: likeKeys.status(target, id), queryFn: () => fetchLikeStatus(target, id), enabled });
}

export interface Likes {
    events: LikedEventsGrouped;
    places: Place[];
    performers: Performer[];
}

const NO_EVENTS: LikedEventsGrouped = { upcoming: [], past: [] };

/** A list that fails to load shows as empty instead of breaking the whole page. */
async function orEmpty<T>(request: Promise<T>, empty: T, label: string): Promise<T> {
    try {
        return await request;
    } catch (error) {
        console.error(`Could not load liked ${label}`, error);
        return empty;
    }
}

/** Everything the signed-in user liked. */
export function useMyLikes({ enabled }: { enabled: boolean }) {
    return useQuery({
        queryKey: likeKeys.mine(),
        queryFn: async (): Promise<Likes> => {
            const [events, places, performers] = await Promise.all([
                orEmpty(fetchLikedEvents(), NO_EVENTS, "events"),
                orEmpty(fetchLikedPlaces(), [], "places"),
                orEmpty(fetchLikedPerformers(), [], "performers"),
            ]);
            return { events, places, performers };
        },
        enabled,
    });
}

/**
 * Like or unlike something; resolves with the new state. The likes page keeps an unliked row until it is next
 * opened (so a misclick can be undone), so only the like state itself is updated here.
 */
export function useToggleLike(target: LikeTarget, id: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (liked: boolean) => (liked ? like(target, id) : unlike(target, id)),
        onSuccess: (status) => queryClient.setQueryData(likeKeys.status(target, id), status),
    });
}

/* ---------- Admin: places ---------- */

export function useOwnedPlaces({ enabled = true }: { enabled?: boolean } = {}) {
    return useQuery({ queryKey: placeKeys.owned(), queryFn: fetchOwnedPlaces, enabled });
}

export function usePlace(id: ID) {
    return useQuery({ queryKey: placeKeys.detail(id), queryFn: () => fetchPlace(id) });
}

export function usePlaceInvitations(id: ID, { enabled = true }: { enabled?: boolean } = {}) {
    return useQuery({ queryKey: placeKeys.invitations(id), queryFn: () => fetchPlaceInvitations(id), enabled });
}

export function useCreatePlace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: PlacePayload) => createPlace(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: placeKeys.all }),
    });
}

export function useUpdatePlace(id: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: PlacePayload) => updatePlace(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: placeKeys.all }),
    });
}

/** Answers an event plan's invitation to one of the manager's places. */
export function useRespondToPlaceInvitation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ placeId, eventPlanId, answer }: { placeId: ID; eventPlanId: ID; answer: Answer }) =>
            respondToPlaceInvitation(placeId, eventPlanId, answer),
        onSuccess: (_, { placeId }) =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: placeKeys.invitations(placeId) }),
                queryClient.invalidateQueries({ queryKey: eventPlanKeys.all }),
            ]),
    });
}

/** Every invitation to every place the manager owns, each with its place. */
export function usePlaceRequests() {
    const owned = useOwnedPlaces();
    const places = owned.data ?? [];
    const results = useQueries({
        queries: places.map((place) => ({
            queryKey: placeKeys.invitations(place.id),
            queryFn: () => fetchPlaceInvitations(place.id),
        })),
    });
    return {
        places,
        requests: places.flatMap((place, index) => (results[index]?.data ?? []).map((request) => ({ request, place }))),
        isPending: owned.isPending || results.some((result) => result.isPending),
        isError: owned.isError || results.some((result) => result.isError),
        refetch: () => {
            void owned.refetch();
            for (const result of results) void result.refetch();
        },
    };
}

/* ---------- Admin: performers ---------- */

export function usePerformers() {
    return useQuery({ queryKey: performerKeys.list(), queryFn: fetchPerformers });
}

export function useOwnedPerformers({ enabled = true }: { enabled?: boolean } = {}) {
    return useQuery({ queryKey: performerKeys.owned(), queryFn: fetchOwnedPerformers, enabled });
}

export function usePerformer(id: ID) {
    return useQuery({ queryKey: performerKeys.detail(id), queryFn: () => fetchPerformer(id) });
}

export function usePerformerInvitations(id: ID, { enabled = true }: { enabled?: boolean } = {}) {
    return useQuery({ queryKey: performerKeys.invitations(id), queryFn: () => fetchPerformerInvitations(id), enabled });
}

export function useCreatePerformer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: PerformerPayload) => createPerformer(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: performerKeys.all }),
    });
}

export function useUpdatePerformer(id: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: PerformerPayload) => updatePerformer(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: performerKeys.all }),
    });
}

/** Answers an event plan's invitation to one of the manager's performers. */
export function useRespondToPerformerInvitation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ performerId, eventPlanId, answer }: { performerId: ID; eventPlanId: ID; answer: Answer }) =>
            respondToPerformerInvitation(performerId, eventPlanId, answer),
        onSuccess: (_, { performerId }) =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: performerKeys.invitations(performerId) }),
                queryClient.invalidateQueries({ queryKey: eventPlanKeys.all }),
            ]),
    });
}

/** Every lineup invitation to every performer the manager owns (each request carries its performer). */
export function usePerformerRequests() {
    const owned = useOwnedPerformers();
    const performers = owned.data ?? [];
    const results = useQueries({
        queries: performers.map((performer) => ({
            queryKey: performerKeys.invitations(performer.id),
            queryFn: () => fetchPerformerInvitations(performer.id),
        })),
    });
    return {
        performers,
        requests: results.flatMap((result) => result.data ?? []),
        isPending: owned.isPending || results.some((result) => result.isPending),
        isError: owned.isError || results.some((result) => result.isError),
        refetch: () => {
            void owned.refetch();
            for (const result of results) void result.refetch();
        },
    };
}

/* ---------- Admin: event plans ---------- */

export function useOwnedEventPlans() {
    return useQuery({ queryKey: eventPlanKeys.owned(), queryFn: fetchOwnedEventPlans });
}

export function useOwnedEvents() {
    return useQuery({ queryKey: eventKeys.owned(), queryFn: fetchOwnedEvents });
}

export function useEventPlan(id: ID) {
    return useQuery({ queryKey: eventPlanKeys.detail(id), queryFn: () => fetchEventPlan(id) });
}

export function useLineupInvitations(planId: ID) {
    return useQuery({ queryKey: eventPlanKeys.lineup(planId), queryFn: () => fetchLineupInvitations(planId) });
}

export function useInvitablePlaces() {
    return useQuery({ queryKey: eventPlanKeys.invitablePlaces(), queryFn: fetchInvitablePlaces });
}

export function useCreateEventPlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: EventPlanPayload) => createEventPlan(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: eventPlanKeys.all }),
    });
}

export function useUpdateEventPlan(id: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: EventPlanPayload) => updateEventPlan(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: eventPlanKeys.all }),
    });
}

export function useInvitePlace(planId: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (placeId: ID) => invitePlace(planId, placeId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: eventPlanKeys.detail(planId) }),
    });
}

/** Invites a performer; the plan's lineup and the plan itself reload, so the workspace's checklist follows. */
export function useAddLineupInvitation(planId: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: LineupInvitationPayload) => addLineupInvitation(planId, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: eventPlanKeys.lineup(planId) }),
    });
}

/** Withdraws a performer's invitation; the lineup reloads. */
export function useDeleteLineupInvitation(planId: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (performerId: ID) => deleteLineupInvitation(planId, performerId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: eventPlanKeys.lineup(planId) }),
    });
}

/** Publishing turns the plan into a live event and deletes the plan. */
export function usePublishEventPlan(planId: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => publishEventPlan(planId),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: eventPlanKeys.all }),
                queryClient.invalidateQueries({ queryKey: eventKeys.all }),
                queryClient.invalidateQueries({ queryKey: placeKeys.all }),
            ]),
    });
}

/* ---------- Admin: platform users ---------- */

/** A page of users; the previous page stays visible while the next one (or a new search) loads. */
export function useAdminUsers(query: AdminUserQuery) {
    return useQuery({
        queryKey: adminKeys.userList(query),
        queryFn: () => fetchAdminUsers(query),
        placeholderData: keepPreviousData,
    });
}

export function useAdminUser(id: ID) {
    return useQuery({ queryKey: adminKeys.user(id), queryFn: () => fetchAdminUser(id) });
}

/** Grants (`grant: true`) or revokes a manager role; every user list and detail refreshes afterwards. */
export function useChangeUserRole(id: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ role, grant }: { role: ManagerRole; grant: boolean }) =>
            grant ? grantRole(id, role) : revokeRole(id, role),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.users() }),
    });
}
