export type ID = string

export type GeoPoint = {
    latitude: number
    longitude: number
}
export type LinkType = 'instagram' | 'facebook' |'twitter'| 'reddit' |'website'
export type Link = {
    type: LinkType
    url: string
}

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
    start: string // ISO
    end: string // ISO
    image: string
    performerIds: ID[]
    price?: string
    kind: EventType
    links?: Link[]
}
export type PlaceUpcomingEvent = {
    id: ID
    title: string
    image: string | null
    start: string
    kind: EventType
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

export type EventType = 'DISCO' | 'TECHNO' | 'FESTIVAL' | 'JAZZ' | 'ALTER' | 'HOME' | 'PUB'

export const EVENT_TYPE_BADGE_CLASSES: Record<EventType, string> = {
    DISCO: 'bg-pink-500 !text-white',
    TECHNO: 'bg-indigo-500 !text-white',
    FESTIVAL: 'bg-emerald-500 !text-white',
    JAZZ: 'bg-amber-500 !text-white',
    ALTER: 'bg-fuchsia-500 !text-white',
    HOME: 'bg-cyan-500 !text-white',
    PUB: 'bg-amber-900 !text-amber-50',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
    DISCO: 'Disco',
    TECHNO: 'Techno',
    FESTIVAL: 'Festival',
    JAZZ: 'Jazz',
    ALTER: 'Alter',
    HOME: 'House Party',
    PUB: 'Pub',
}

export type SearchHit = {
    type: 'place' | 'event' | 'performer' | 'tag'
    id: ID
    title: string
    subtitle: string
    href: string
    image: string
    placeId?: ID
    nextEventStart?: string
}

export type HighlightContextType = {
    highlightIds: string[];
    setHighlightIds: (ids: ID[]) => void;
}