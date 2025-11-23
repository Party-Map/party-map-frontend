import {EventType} from "@/lib/types";

export const BASE_LABEL_ZOOM = 13
export const HIGHLIGHT_LABEL_ZOOM = 11
export const LABEL_BASE_OFFSET = -76
export const LABEL_HIGHLIGHT_OFFSET = -84

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

export const MAP_PIN_COLORS = {
    active: '#ec4899', // pink-500
    highlight: '#8b5cf6', // violet-500
    dark: '#475569', // slate-600
    light: '#334155', // slate-700
}
