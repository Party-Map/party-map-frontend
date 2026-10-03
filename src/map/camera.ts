// The map's camera maths. Every programmatic move of the map is worked out here to its final, wall-legal destination
// before it starts (map/useCamera.ts runs it as one animation), so Leaflet's own bounds enforcement on `moveend` never
// has anything to undo and no listener ever moves the map in reaction to a move. Pure functions over Leaflet's CRS,
// which is exactly what `map.project` and `map.unproject` call, so the tests run them against real Leaflet.
import L, {
    type Bounds,
    type LatLng,
    type LatLngBounds,
    type LatLngBoundsLiteral,
    type LatLngExpression,
    type Point,
} from "leaflet";

import { MAP_MAX_ZOOM } from "@/lib/constants";

import type { MapInsets } from "./insets";

/** The country's extent: the smallest view the map allows is the whole of Hungary, and the view never leaves it. */
export const HUNGARY_EXTENT = { south: 45.737, west: 16.114, north: 48.585, east: 22.897 };
export const HUNGARY_BOUNDS: LatLngBoundsLiteral = [
    [HUNGARY_EXTENT.south, HUNGARY_EXTENT.west],
    [HUNGARY_EXTENT.north, HUNGARY_EXTENT.east],
];

/** A viewport size in CSS pixels (what `map.getSize()` reports). */
export interface Size {
    x: number;
    y: number;
}

/** A box in pixels relative to a pin's anchor point: negative values are above or left of the anchor. */
export interface AnchoredRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** The part of the viewport the bars leave free, in container pixels. */
export interface Band {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface CameraTarget {
    center: LatLng;
    zoom: number;
}

export type FitMode = "minimal" | "center";

const CRS = L.CRS.EPSG3857;
/** The pin icon's box around its anchor (pins.ts: iconSize [36, 48], iconAnchor [18, 44]). */
export const PIN_RECT: AnchoredRect = { left: -18, top: -44, right: 18, bottom: 4 };
/** Pins and cards keep this much room from the bars and the edges. */
export const BAND_MARGIN = 12;
/** Leaflet rounds pan offsets to whole pixels, so a miss within a pixel is not a miss. */
const FIT_TOLERANCE = 1;
/** Pans and flights shorter than this are not worth starting. */
const MIN_MOVE_PX = 1;
/** Fitting several places: room around the outermost pins (labels sit up to ~120 px above a pin). */
const FIT_PADDING = { x: 80, top: 120, bottom: 64 };
/** Fitting several places never zooms in further than this, so two neighbours still show their surroundings. */
export const FIT_MAX_ZOOM = 16;
/** Showing a pin zooms in as far as this, at most, when the wall keeps its card out of the band. */
export const SHOW_MAX_ZOOM = 16;

export function project(latLng: LatLngExpression, zoom: number): Point {
    return CRS.latLngToPoint(L.latLng(latLng), zoom);
}

export function unproject(point: Point, zoom: number): LatLng {
    return CRS.pointToLatLng(point, zoom);
}

export function insideExtent(latLng: LatLngExpression): boolean {
    return L.latLngBounds(HUNGARY_BOUNDS).contains(L.latLng(latLng));
}

/**
 * The wall: the country's extent grown by the bars' cover in pixels at the given zoom, so the view's edge may sit
 * that many pixels beyond the border (the country can slide under a bar) and at the floor the country is centred
 * between the bars. Being geographic, it follows the zoom; callers compute it for the zoom they are going to.
 */
export function wall(zoom: number, insets: MapInsets): LatLngBounds {
    const { south, west, north, east } = HUNGARY_EXTENT;
    const northWest = project([north, west], zoom).subtract(L.point(0, insets.top));
    const southEast = project([south, east], zoom).add(L.point(0, insets.bottom));
    return L.latLngBounds(unproject(northWest, zoom), unproject(southEast, zoom));
}

/** Leaflet's `_rebound`: centres the view when the bounds are smaller than it, otherwise pushes it back inside. */
function rebound(left: number, right: number): number {
    return left + right > 0
        ? Math.round(left - right) / 2
        : Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
}

/** Leaflet's `_getBoundsOffset`: the pixel offset that brings a view box inside the bounds at the zoom. */
function boundsOffset(viewBounds: Bounds, bounds: LatLngBounds, zoom: number): Point {
    const projected = L.bounds(project(bounds.getNorthEast(), zoom), project(bounds.getSouthWest(), zoom));
    const minOffset = projected.getTopLeft().subtract(viewBounds.getTopLeft());
    const maxOffset = projected.getBottomRight().subtract(viewBounds.getBottomRight());
    return L.point(rebound(minOffset.x, -maxOffset.x), rebound(minOffset.y, -maxOffset.y));
}

/**
 * The closest centre to the wanted one at which a view of the given size stays inside the bounds: a port of
 * Leaflet's `_limitCenter` (offsets of a pixel or less are ignored, exactly as Leaflet does), so what this returns
 * is what Leaflet would settle on anyway.
 */
export function clampCenter(center: LatLngExpression, zoom: number, size: Size, bounds: LatLngBounds): LatLng {
    const centerPoint = project(center, zoom);
    const viewHalf = L.point(size.x, size.y).divideBy(2);
    const viewBounds = L.bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf));
    const offset = boundsOffset(viewBounds, bounds, zoom);
    if (Math.abs(offset.x) <= 1 && Math.abs(offset.y) <= 1) return L.latLng(center);
    return unproject(centerPoint.add(offset), zoom);
}

/** Clamps a zoom; an infinite one (nothing to fit, so any zoom fits) takes the ceiling, an undefined one the floor. */
function clampZoom(zoom: number, floor: number, ceiling: number): number {
    if (zoom === Number.POSITIVE_INFINITY) return Math.max(floor, ceiling);
    return Number.isFinite(zoom) ? Math.max(floor, Math.min(ceiling, zoom)) : floor;
}

/** The zoom at which the whole country fills the part of the viewport the bars leave free (fractional). */
export function floorZoom(size: Size, insets: MapInsets): number {
    const { south, west, north, east } = HUNGARY_EXTENT;
    const extent = L.bounds(project([north, west], 0), project([south, east], 0)).getSize();
    const free = L.point(size.x, size.y - insets.top - insets.bottom);
    const scale = Math.min(free.x / extent.x, free.y / extent.y);
    return clampZoom(Math.log2(scale), 0, MAP_MAX_ZOOM);
}

/** The area between the bars (and above any overlay reported as `extraBottom`), with a margin from the edges. */
export function freeBand(size: Size, insets: MapInsets, extraBottom = 0): Band {
    return {
        left: BAND_MARGIN,
        top: insets.top + BAND_MARGIN,
        right: size.x - BAND_MARGIN,
        bottom: size.y - insets.bottom - extraBottom - BAND_MARGIN,
    };
}

/** The box a pin and its card (if any) cover together, relative to the pin's anchor. */
function pinAndCard(card: AnchoredRect | null): AnchoredRect {
    if (!card) return PIN_RECT;
    return {
        left: Math.min(PIN_RECT.left, card.left),
        top: Math.min(PIN_RECT.top, card.top),
        right: Math.max(PIN_RECT.right, card.right),
        bottom: Math.max(PIN_RECT.bottom, card.bottom),
    };
}

function shiftAxis(low: number, high: number, bandLow: number, bandHigh: number, center: boolean): number {
    if (center || high - low > bandHigh - bandLow) return (bandLow + bandHigh) / 2 - (low + high) / 2;
    if (low < bandLow) return bandLow - low;
    if (high > bandHigh) return bandHigh - high;
    return 0;
}

/**
 * How far the content has to shift on the screen so the pin and its card sit inside the band: the smallest shift
 * per axis (`minimal`, zero when they already fit; centred when they are larger than the band) or the shift that
 * centres them (`center`, the Center-selected button).
 */
export function cardFit(pin: Point, card: AnchoredRect | null, band: Band, mode: FitMode = "minimal"): Point {
    const box = pinAndCard(card);
    const center = mode === "center";
    return L.point(
        shiftAxis(pin.x + box.left, pin.x + box.right, band.left, band.right, center),
        shiftAxis(pin.y + box.top, pin.y + box.bottom, band.top, band.bottom, center),
    );
}

/** Whether the pin and its card are inside the band, give or take Leaflet's pixel rounding. */
export function fitsBand(pin: Point, card: AnchoredRect | null, band: Band): boolean {
    const box = pinAndCard(card);
    return (
        pin.x + box.left >= band.left - FIT_TOLERANCE &&
        pin.x + box.right <= band.right + FIT_TOLERANCE &&
        pin.y + box.top >= band.top - FIT_TOLERANCE &&
        pin.y + box.bottom <= band.bottom + FIT_TOLERANCE
    );
}

export interface ShowOptions {
    /** The pin to show. */
    pin: LatLngExpression;
    /** The open card's box around the pin, measured; null for a bare pin. */
    card: AnchoredRect | null;
    /** The current view. */
    center: LatLngExpression;
    zoom: number;
    size: Size;
    insets: MapInsets;
    /** Extra cover at the bottom (an overlay above the bottom bar), band only, not wall. */
    extraBottom?: number;
    mode?: FitMode;
    /** When the wall keeps the card out of the band, zoom in around the pin a level at a time, up to this zoom. */
    maxZoom?: number;
}

export interface ShowTarget extends CameraTarget {
    /** False when the view already shows the pin and card as wanted (within a pixel), so no move is needed. */
    moved: boolean;
}

/**
 * Where the map has to go for the pin (and its card) to sit inside the band: the minimal (or centring) shift at the
 * current zoom, clamped to the wall; when the wall still leaves the card out, the same one zoom level in around the
 * pin, and so on up to `maxZoom` (zooming in always makes room: a pin at the border at the floor needs about six
 * levels). The result is wall-legal, so the move lands exactly there and Leaflet has nothing to correct.
 */
export function showTarget(options: ShowOptions): ShowTarget {
    const {
        pin,
        card,
        center,
        zoom,
        size,
        insets,
        extraBottom = 0,
        mode = "minimal",
        maxZoom = SHOW_MAX_ZOOM,
    } = options;
    const band = freeBand(size, insets, extraBottom);
    const half = L.point(size.x, size.y).divideBy(2);
    const pinNow = half.add(project(pin, zoom).subtract(project(center, zoom)));
    const wanted = pinNow.add(cardFit(pinNow, card, band, mode));
    // Zooming in makes room only when the pin and card can fit the band at all; when they are larger than it
    // (a phone held sideways) the shift centres them and that is the best any zoom can do.
    const box = pinAndCard(card);
    const canFit = box.right - box.left <= band.right - band.left && box.bottom - box.top <= band.bottom - band.top;
    const ceiling = canFit ? Math.min(Math.max(zoom, maxZoom), MAP_MAX_ZOOM) : zoom;
    const attempt = (z: number) => {
        const candidate = unproject(project(pin, z).subtract(wanted.subtract(half)), z);
        const clamped = clampCenter(candidate, z, size, wall(z, insets));
        const actual = half.add(project(pin, z).subtract(project(clamped, z)));
        return { center: clamped, zoom: z, fits: fitsBand(actual, card, band) };
    };

    let best = attempt(zoom);
    while (!best.fits && best.zoom < ceiling) best = attempt(Math.min(best.zoom + 1, ceiling));
    const moved = best.zoom !== zoom || project(best.center, zoom).distanceTo(project(center, zoom)) >= MIN_MOVE_PX;
    return { center: best.center, zoom: best.zoom, moved };
}

/**
 * The view that shows all the points between the bars with room for their pins and labels: Leaflet's own bounds
 * fit with the bars as padding, never further in than `maxZoom` nor out than the floor, clamped to the wall.
 */
export function fitTarget(
    points: LatLngExpression[],
    size: Size,
    insets: MapInsets,
    maxZoom = FIT_MAX_ZOOM,
): CameraTarget {
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p)));
    const paddingTopLeft = L.point(FIT_PADDING.x, insets.top + FIT_PADDING.top);
    const paddingBottomRight = L.point(FIT_PADDING.x, insets.bottom + FIT_PADDING.bottom);
    const free = L.point(size.x, size.y).subtract(paddingTopLeft.add(paddingBottomRight));
    const extent = L.bounds(project(bounds.getNorthWest(), 0), project(bounds.getSouthEast(), 0)).getSize();
    const zoom = clampZoom(Math.log2(Math.min(free.x / extent.x, free.y / extent.y)), floorZoom(size, insets), maxZoom);

    const paddingOffset = paddingBottomRight.subtract(paddingTopLeft).divideBy(2);
    const southWest = project(bounds.getSouthWest(), zoom);
    const northEast = project(bounds.getNorthEast(), zoom);
    const center = unproject(southWest.add(northEast).divideBy(2).add(paddingOffset), zoom);
    return { center: clampCenter(center, zoom, size, wall(zoom, insets)), zoom };
}
