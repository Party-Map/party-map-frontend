import type { LatLngTuple } from "leaflet";
import { useMemo } from "react";

import type { GeoPoint } from "@/api/types";

/** Leaflet works with [lat, lng] tuples; the API sends GeoPoint objects. */
export function toLatLngTuple(point: GeoPoint): LatLngTuple {
    return [point.latitude, point.longitude];
}

/** The part of Leaflet's LatLngBounds that `toBbox` reads. */
export interface ViewBounds {
    getWest(): number;
    getSouth(): number;
    getEast(): number;
    getNorth(): number;
}

/** How far beyond the visible area places are loaded, as a share of the viewport's width and height. */
const BBOX_PADDING = 0.5;
/** Edges snap outward to this grid (degrees, about 1 km), so small pans reuse the cached result. */
const BBOX_GRID = 0.01;

/** Absorbs floating-point noise such as 18.95 / 0.01 = 1894.9999999999998. */
const EPSILON = 1e-9;

const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));
const snapDown = (value: number) => Number((Math.floor(value / BBOX_GRID + EPSILON) * BBOX_GRID).toFixed(2));
const snapUp = (value: number) => Number((Math.ceil(value / BBOX_GRID - EPSILON) * BBOX_GRID).toFixed(2));

/**
 * The `bbox` query value ("minLon,minLat,maxLon,maxLat") for the places around the viewport: padded by half a
 * screen each way, snapped outward to the grid and clamped to valid coordinates.
 */
export function toBbox(bounds: ViewBounds): string {
    const padLng = (bounds.getEast() - bounds.getWest()) * BBOX_PADDING;
    const padLat = (bounds.getNorth() - bounds.getSouth()) * BBOX_PADDING;
    const west = clamp(snapDown(bounds.getWest() - padLng), 180);
    const south = clamp(snapDown(bounds.getSouth() - padLat), 90);
    const east = clamp(snapUp(bounds.getEast() + padLng), 180);
    const north = clamp(snapUp(bounds.getNorth() + padLat), 90);
    return `${west},${south},${east},${north}`;
}

/**
 * A LatLng tuple that keeps its identity while the coordinates stay the same, for props that react-leaflet treats
 * as "moved" on every new object (a Popup's `position` re-opens it). Null without coordinates.
 */
export function useStableLatLng(latitude: number | undefined, longitude: number | undefined): LatLngTuple | null {
    return useMemo(
        () => (latitude === undefined || longitude === undefined ? null : [latitude, longitude]),
        [latitude, longitude],
    );
}
