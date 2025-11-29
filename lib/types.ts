import type {ReactNode} from "react";

export type ID = string

export type GeoPoint = {
    latitude: number
    longitude: number
}
export type LinkType = 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'REDDIT' | 'WEBSITE'

export type EventType = 'DISCO' | 'TECHNO' | 'FESTIVAL' | 'JAZZ' | 'ALTER' | 'HOME' | 'PUB'

export type SearchHitType = 'PLACE' | 'EVENT' | 'PERFORMER'

export type LikeTarget = "events" | "places" | "performers"

export type Place = {
    id: ID
    name: string
    location: GeoPoint
    address: string
    city: string
    description: string
    image: string
    tags: string[]
    links?: Link[]
}

export type Performer = {
    id: ID
    name: string
    genre: string
    bio: string
    image: string
    links?: Link[]
}

export type Event = {
    id: ID
    title: string
    placeId: ID
    description: string
    start: string
    end: string
    image: string
    lineupItems?: LineupItem[]
    price?: string
    kind: EventType
    links?: Link[]
}
export type LikedEventsGrouped = {
    upcoming: Event[]
    past: Event[]
}
export type UpcomingEventByPlace = {
    placeId: ID
    eventId: ID
    title: string
    image: string | null
    start: string
    kind: EventType
}

export type Link = {
    type: LinkType
    url: string
}

export type LikeStatus = {
    liked: boolean
}

export type PopupRect = {
    left: number;
    right: number;
    top: number;
    bottom: number
}

export type TagDisplayPopup = {
    key: string
    label: string
    kind?: EventType
    isKind: boolean
}

export type SearchTypeMeta = {
    icon: ReactNode
    bg: string
    ring: string
    fg: string
    label: string
}

export type SearchHit = {
    id: string
    type: SearchHitType
    title: string
    subtitle: string
    image: string | null
    nextEventStart: string | null
    placeId: string | null
}

export type SearchResponse = {
    query: string
    hits: SearchHit[]
}

export type HighlightContextType = {
    highlightIds: string[];
    setHighlightIds: (ids: ID[]) => void;
}

export type PinIconState = {
    isActive: boolean
    isHighlighted: boolean
    isDark: boolean
}

export type GeocodeResult = {
    displayName: string
    addressLine?: string
    location: GeoPoint
    city?: string
    postcode?: string
}
export type ReverseGeocodeResult = {
    displayName: string
    addressLine: string
    city?: string
}

export type PlaceCreatePayload = {
    name: string
    address: string
    city: string
    location: GeoPoint
    description: string
    tags: string[]
    image: string | null
    links?: Link[]
}

export type PlaceFormInitialValues = {
    name?: string
    address?: string
    city?: string
    location?: GeoPoint | null
    description?: string
    tags?: string[]
    image?: string | null
    links?: Link[]
}

export type PlaceAdminListItemData = {
    id: ID
    name: string
    address: string
    city: string
}
export type PerformerAdminListItemData = {
    id: ID
    name: string
}
export type EventAdminListItemData = {
    id: ID
    title: string
    start: string
    end: string
    placeName: string
}

export type PerformerCreatePayload = {
    name: string
    genre: string
    bio: string
    image: string | null
    links?: Link[]
}

export type PerformerFormInitialValues = {
    name?: string
    genre?: string
    bio?: string
    image?: string | null
    links?: Link[]
}
export type EventPlan = {
    id: ID
    title: string
    description: string
    startDateTime: string
    endDateTime: string
    price?: string
    kind: EventType
    links?: Link[]
    image?: string | null
    placeInvitation: EventPlanPlaceInvitation | null
    lineupInvitations: EventPlanLineupInvitation[]
}
export type EventPlanCreatePayload = {
    title: string
    price?: string
    kind: EventType
    startDateTime: string
    endDateTime: string
    description: string
    links?: Link[]
    image?: string | null
}
export type EventPlanFormInitialValues = {
    title?: string
    price?: string
    kind?: EventType
    startDateTime?: string
    endDateTime?: string
    description?: string
    links?: Link[]
    image?: string | null
}
export type EventPlanAdminListItemData = {
    id: ID
    title: string
    startDateTime: string
    endDateTime: string
}
export type LinkConfig = {
    type: LinkType
    label: string
    prefix: string
}
export type LineupItem = {
    startTime: string
    endTime: string
    performer: Performer
}


export type EventPlanPlaceInvitation = {
    state: string
    place: Place
}

export type EventPlanLineupInvitation = {
    state: string
    startTime: string
    endTime: string
    performer: Performer
}
export type EventPlanPlaceInvitationWithDate = {
    eventPlanId: ID;
    state: string;
    title: string;
    startDateTime: string;
    endDateTime: string;
}
export type PerformerLineupInvitationWithDate = {
    eventPlanId: ID;
    eventPlanTitle: string;
    state: string;
    startTime: string;
    endTime: string;
}
export type EventPlanLineupInvitationCreatePayload = {
    performerId: ID
    startTime: string
    endTime: string
    state: string
}
export type InviteItem = {
    performerId?: string
    startTime: string // "HH:MM"
    endTime: string   // "HH:MM"
    inviteState?: string
}
