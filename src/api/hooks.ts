// The app's server state: one query hook per read and one mutation hook per write. Queries throw the fetchers'
// ApiError, so a component reads `error` (404 → not found) and `refetch` (retry). Mutations invalidate the key
// families they change, so every screen showing that data refreshes.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
import { eventKeys, eventPlanKeys, likeKeys, performerKeys, placeKeys } from "./keys";
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
import type {
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

/* ---------- Public pages ---------- */

export function usePlaces() {
    return useQuery({ queryKey: placeKeys.list(), queryFn: fetchPlaces });
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

export function useOwnedPlaces() {
    return useQuery({ queryKey: placeKeys.owned(), queryFn: fetchOwnedPlaces });
}

export function usePlace(id: ID) {
    return useQuery({ queryKey: placeKeys.detail(id), queryFn: () => fetchPlace(id) });
}

export function usePlaceInvitations(id: ID) {
    return useQuery({ queryKey: placeKeys.invitations(id), queryFn: () => fetchPlaceInvitations(id) });
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

export function useRespondToPlaceInvitation(placeId: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventPlanId, answer }: { eventPlanId: ID; answer: Answer }) =>
            respondToPlaceInvitation(placeId, eventPlanId, answer),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: placeKeys.invitations(placeId) }),
                queryClient.invalidateQueries({ queryKey: eventPlanKeys.all }),
            ]),
    });
}

/* ---------- Admin: performers ---------- */

export function usePerformers() {
    return useQuery({ queryKey: performerKeys.list(), queryFn: fetchPerformers });
}

export function useOwnedPerformers() {
    return useQuery({ queryKey: performerKeys.owned(), queryFn: fetchOwnedPerformers });
}

export function usePerformer(id: ID) {
    return useQuery({ queryKey: performerKeys.detail(id), queryFn: () => fetchPerformer(id) });
}

export function usePerformerInvitations(id: ID) {
    return useQuery({ queryKey: performerKeys.invitations(id), queryFn: () => fetchPerformerInvitations(id) });
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

export function useRespondToPerformerInvitation(performerId: ID) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventPlanId, answer }: { eventPlanId: ID; answer: Answer }) =>
            respondToPerformerInvitation(performerId, eventPlanId, answer),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: performerKeys.invitations(performerId) }),
                queryClient.invalidateQueries({ queryKey: eventPlanKeys.all }),
            ]),
    });
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

// The lineup editor keeps its rows (sent or not) as local state while it is open, so these two do not refetch the
// lineup: a refetch would remount the editor and drop the rows not sent yet. It reloads the next time it opens.
export function useAddLineupInvitation(planId: ID) {
    return useMutation({
        mutationFn: (payload: LineupInvitationPayload) => addLineupInvitation(planId, payload),
    });
}

export function useDeleteLineupInvitation(planId: ID) {
    return useMutation({
        mutationFn: (performerId: ID) => deleteLineupInvitation(planId, performerId),
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
