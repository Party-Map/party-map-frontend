import L, { type LatLngBounds, type LatLngBoundsLiteral, type Map as LeafletMap } from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { mapInsets } from "./insets";

/** The country's extent: the smallest view the map allows is the whole of Hungary, and the view never leaves it. */
export const HUNGARY_EXTENT = { south: 45.737, west: 16.114, north: 48.585, east: 22.897 };
export const HUNGARY_BOUNDS: LatLngBoundsLiteral = [
    [HUNGARY_EXTENT.south, HUNGARY_EXTENT.west],
    [HUNGARY_EXTENT.north, HUNGARY_EXTENT.east],
];

/**
 * The country's extent grown by the bars' cover at the map's current zoom, so the view's wall sits that many pixels
 * beyond the border: the country can slide under a bar, and at the floor it sits centred between them.
 */
export function paddedBounds(map: LeafletMap, top: number, bottom: number): LatLngBounds {
    const zoom = map.getZoom();
    const { south, west, north, east } = HUNGARY_EXTENT;
    const northWest = map.project([north, west], zoom).subtract(L.point(0, top));
    const southEast = map.project([south, east], zoom).add(L.point(0, bottom));
    return L.latLngBounds([map.unproject(northWest, zoom), map.unproject(southEast, zoom)]);
}

/**
 * Keeps the whole country on the screen: the zoom floor is the level at which Hungary fills the part of the viewport
 * the bars leave free, and the map's wall (`maxBounds`, see MapView) is the country's extent plus the bars' cover.
 * Both follow the viewport size; the wall, being geographic, also follows the zoom.
 */
export function MapLimits() {
    const map = useMap();

    useEffect(() => {
        const apply = () => {
            const { top, bottom } = mapInsets(map.getSize().x);
            const floor = map.getBoundsZoom(HUNGARY_BOUNDS, false, L.point(0, top + bottom));
            map.setMinZoom(floor);
            if (map.getZoom() < floor) map.setZoom(floor);
            map.setMaxBounds(paddedBounds(map, top, bottom));
        };
        apply();
        map.on("resize", apply);
        map.on("zoomend", apply);
        return () => {
            map.off("resize", apply);
            map.off("zoomend", apply);
        };
    }, [map]);

    return null;
}
