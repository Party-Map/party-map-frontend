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

/** Leaflet's zoom ceiling; the vector tiles stop at zoom 14 and MapLibre overzooms the rest (map/basemap). */
export const MAP_MAX_ZOOM = 19;

/**
 * The basemap is OpenStreetMap data (ODbL) in the OpenMapTiles schema: both credits are mandatory. The maps show no
 * attribution control (the owner's choice); the credit is in the privacy notice (components/ConsentBanner) instead.
 */
export const TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> ' +
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
/** The map's last viewport and open card, restored on the next visit (session only). */
export const MAP_MEMORY_STORAGE_KEY = "pm:map:v1";

/** Breakpoint at which the desktop top bar replaces the mobile bottom bar (matches the desktop mixin in styles/_mixins.scss). */
export const DESKTOP_MIN_WIDTH = 1024;
