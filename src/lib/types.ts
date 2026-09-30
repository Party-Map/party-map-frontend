export type ID = string;

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

export const LINK_TYPES = ["INSTAGRAM", "FACEBOOK", "TWITTER", "REDDIT", "WEBSITE"] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const EVENT_TYPES = ["DISCO", "TECHNO", "FESTIVAL", "JAZZ", "ALTER", "HOME", "PUB"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type SearchHitType = "PLACE" | "EVENT" | "PERFORMER";

export type LikeTarget = "events" | "places" | "performers";

export type InvitationState = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Link {
    type: LinkType;
    url: string;
}

export interface Place {
    id: ID;
    name: string;
    location: GeoPoint;
    address: string;
    city: string;
    description: string;
    image: string;
    tags: string[];
    links?: Link[];
}

export interface Performer {
    id: ID;
    name: string;
    genre: string;
    bio: string;
    image: string;
    links?: Link[];
}

export interface LineupItem {
    startTime: string;
    endTime: string;
    performer: Performer;
}

export interface Event {
    id: ID;
    title: string;
    placeId: ID;
    description: string;
    start: string;
    end: string;
    image: string;
    lineupItems?: LineupItem[];
    price?: string;
    kind: EventType;
    links?: Link[];
}

export interface LikedEventsGrouped {
    upcoming: Event[];
    past: Event[];
}

export interface UpcomingEventByPlace {
    placeId: ID;
    eventId: ID;
    title: string;
    image: string | null;
    start: string;
    kind: EventType;
}

export interface LikeStatus {
    liked: boolean;
}

export interface SearchHit {
    id: ID;
    type: SearchHitType;
    title: string;
    subtitle: string;
    image: string | null;
    nextEventStart: string | null;
    placeId: ID | null;
}

export interface SearchResponse {
    query: string;
    hits: SearchHit[];
}

export interface GeocodeResult {
    displayName: string;
    addressLine: string;
    location: GeoPoint;
    city?: string;
}

export interface ReverseGeocodeResult {
    displayName: string;
    addressLine: string;
    city?: string;
}

export interface PlacePayload {
    name: string;
    address: string;
    city: string;
    location: GeoPoint;
    description: string;
    tags: string[];
    image: string | null;
    links?: Link[];
}

export interface PerformerPayload {
    name: string;
    genre: string;
    bio: string;
    image: string | null;
    links?: Link[];
}

export interface EventPlanPayload {
    title: string;
    price?: string;
    kind: EventType;
    startDateTime: string;
    endDateTime: string;
    description: string;
    image?: string | null;
    links?: Link[];
}

export interface PlaceListItem {
    id: ID;
    name: string;
    address: string;
    city: string;
}

export interface PerformerListItem {
    id: ID;
    name: string;
}

export interface OwnedEventListItem {
    id: ID;
    title: string;
    start: string;
    end: string;
    placeName: string;
}

export interface EventPlanListItem {
    id: ID;
    title: string;
    startDateTime: string;
    endDateTime: string;
}

export interface EventPlanPlaceInvitation {
    state: InvitationState;
    place: Place;
}

export interface EventPlanLineupInvitation {
    state: InvitationState;
    startTime: string;
    endTime: string;
    performer: Performer;
}

export interface EventPlan {
    id: ID;
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    price?: string;
    kind: EventType;
    links?: Link[];
    image?: string | null;
    placeInvitation: EventPlanPlaceInvitation | null;
    lineupInvitations: EventPlanLineupInvitation[];
}

export interface PlaceInvitationRequest {
    eventPlanId: ID;
    state: InvitationState;
    title: string;
    startDateTime: string;
    endDateTime: string;
}

export interface PerformerInvitationRequest {
    eventPlanId: ID;
    eventPlanTitle: string;
    state: InvitationState;
    startTime: string;
    endTime: string;
}

export interface LineupInvitationPayload {
    performerId: ID;
    startTime: string;
    endTime: string;
    state: InvitationState;
}
