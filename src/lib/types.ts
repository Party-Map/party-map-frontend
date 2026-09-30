export type ID = string;

export type GeoPoint = {
    latitude: number;
    longitude: number;
};

export const LINK_TYPES = ["INSTAGRAM", "FACEBOOK", "TWITTER", "REDDIT", "WEBSITE"] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const EVENT_TYPES = ["DISCO", "TECHNO", "FESTIVAL", "JAZZ", "ALTER", "HOME", "PUB"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type SearchHitType = "PLACE" | "EVENT" | "PERFORMER";

export type LikeTarget = "events" | "places" | "performers";

export type InvitationState = "PENDING" | "ACCEPTED" | "REJECTED";

export type Link = {
    type: LinkType;
    url: string;
};

export type Place = {
    id: ID;
    name: string;
    location: GeoPoint;
    address: string;
    city: string;
    description: string;
    image: string;
    tags: string[];
    links?: Link[];
};

export type Performer = {
    id: ID;
    name: string;
    genre: string;
    bio: string;
    image: string;
    links?: Link[];
};

export type LineupItem = {
    startTime: string;
    endTime: string;
    performer: Performer;
};

export type Event = {
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
};

export type LikedEventsGrouped = {
    upcoming: Event[];
    past: Event[];
};

export type UpcomingEventByPlace = {
    placeId: ID;
    eventId: ID;
    title: string;
    image: string | null;
    start: string;
    kind: EventType;
};

export type LikeStatus = {
    liked: boolean;
};

export type SearchHit = {
    id: ID;
    type: SearchHitType;
    title: string;
    subtitle: string;
    image: string | null;
    nextEventStart: string | null;
    placeId: ID | null;
};

export type SearchResponse = {
    query: string;
    hits: SearchHit[];
};

export type GeocodeResult = {
    displayName: string;
    addressLine: string;
    location: GeoPoint;
    city?: string;
};

export type ReverseGeocodeResult = {
    displayName: string;
    addressLine: string;
    city?: string;
};

export type PlacePayload = {
    name: string;
    address: string;
    city: string;
    location: GeoPoint;
    description: string;
    tags: string[];
    image: string | null;
    links?: Link[];
};

export type PerformerPayload = {
    name: string;
    genre: string;
    bio: string;
    image: string | null;
    links?: Link[];
};

export type EventPlanPayload = {
    title: string;
    price?: string;
    kind: EventType;
    startDateTime: string;
    endDateTime: string;
    description: string;
    image?: string | null;
    links?: Link[];
};

export type PlaceListItem = {
    id: ID;
    name: string;
    address: string;
    city: string;
};

export type PerformerListItem = {
    id: ID;
    name: string;
};

export type OwnedEventListItem = {
    id: ID;
    title: string;
    start: string;
    end: string;
    placeName: string;
};

export type EventPlanListItem = {
    id: ID;
    title: string;
    startDateTime: string;
    endDateTime: string;
};

export type EventPlanPlaceInvitation = {
    state: InvitationState;
    place: Place;
};

export type EventPlanLineupInvitation = {
    state: InvitationState;
    startTime: string;
    endTime: string;
    performer: Performer;
};

export type EventPlan = {
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
};

export type PlaceInvitationRequest = {
    eventPlanId: ID;
    state: InvitationState;
    title: string;
    startDateTime: string;
    endDateTime: string;
};

export type PerformerInvitationRequest = {
    eventPlanId: ID;
    eventPlanTitle: string;
    state: InvitationState;
    startTime: string;
    endTime: string;
};

export type LineupInvitationPayload = {
    performerId: ID;
    startTime: string;
    endTime: string;
    state: InvitationState;
};
