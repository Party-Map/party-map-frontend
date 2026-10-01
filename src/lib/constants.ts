import type { EventType, GeoPoint, LinkType } from "@/api/types";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
    DISCO: "Disco",
    TECHNO: "Techno",
    FESTIVAL: "Festival",
    JAZZ: "Jazz",
    ALTER: "Alter",
    HOME: "House Party",
    PUB: "Pub",
};

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
    INSTAGRAM: "Instagram",
    FACEBOOK: "Facebook",
    TWITTER: "Twitter",
    REDDIT: "Reddit",
    WEBSITE: "Website",
};

export const LINK_TYPE_PREFIXES: Record<LinkType, string> = {
    INSTAGRAM: "https://instagram.com/",
    FACEBOOK: "https://facebook.com/",
    TWITTER: "https://twitter.com/",
    REDDIT: "https://reddit.com/",
    WEBSITE: "https://",
};

/** Budapest */
export const DEFAULT_MAP_CENTER: GeoPoint = { latitude: 47.4979, longitude: 19.0402 };
export const DEFAULT_MAP_ZOOM = 13;

/**
 * OpenStreetMap's standard tiles need no API key (CARTO basemaps do since 2026). Dark mode is a
 * CSS filter on the tile pane, see map/leaflet.scss.
 */
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const BASE_LABEL_ZOOM = 13;
export const HIGHLIGHT_LABEL_ZOOM = 11;
export const LABEL_BASE_OFFSET = -76;
export const LABEL_HIGHLIGHT_OFFSET = -84;

export const PLACEHOLDER_IMAGE = "/placeholder.svg";

/** Browse lists load this many rows per page. */
export const BROWSE_PAGE_SIZE = 20;
/** The distance chips of the browse lists (kilometres); "any distance" is the absence of a radius. */
export const BROWSE_RADIUS_OPTIONS_KM = [5, 25, 100] as const;
/** How many tag or genre chips the browse filters show. */
export const BROWSE_FACET_LIMIT = 12;

export const SEARCH_DEBOUNCE_MS = 300;
export const GEOCODE_DEBOUNCE_MS = 400;

export const CONSENT_STORAGE_KEY = "pm:consent:v1";
export const THEME_STORAGE_KEY = "theme";

/** Breakpoint at which the desktop top bar replaces the mobile bottom bar (matches the desktop mixin in styles/_mixins.scss). */
export const DESKTOP_MIN_WIDTH = 1024;
