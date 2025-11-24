import type {ReactNode} from "react";

export type ID = string

export type GeoPoint = {
    latitude: number
    longitude: number
}
export type LinkType = 'instagram' | 'facebook' | 'twitter' | 'reddit' | 'website'

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
    performerIds: ID[]
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