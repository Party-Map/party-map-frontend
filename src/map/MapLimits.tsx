// Keeps the whole country on the screen: the zoom floor is where Hungary fills the part of the viewport the bars
// leave free, and the wall (`maxBounds` at full viscosity, see MapView) is the country's extent plus the bars' cover.
// Both follow the viewport size; the wall, being pixels at a zoom, also follows the zoom (map/camera.ts).
import L, { type LatLng, type LatLngBounds, type Map as LeafletMap } from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { clampCenter, floorZoom, wall } from "./camera";
import { type MapInsets, mapInsets } from "./insets";
import { getCamera } from "./useCamera";

export { HUNGARY_BOUNDS, HUNGARY_EXTENT } from "./camera";

/** Leaflet's private clamp that every `setView` and bounds enforcement goes through (leaflet 1.9.4, pinned). */
interface LimitCenter {
    _limitCenter: (this: LeafletMap, center: LatLng, zoom: number, bounds?: LatLngBounds) => LatLng;
}

/**
 * Makes the map clamp against the wall of the zoom it is going to. Leaflet clamps a `setView` target with
 * `_limitCenter(center, zoom, options.maxBounds)` before any zoom animation starts, and the wall is pixels at a
 * zoom, so a wheel, pinch or button zoom near the border would otherwise be clamped against the old zoom's wall
 * and corrected with a second pan afterwards. Returns the undo.
 */
export function installZoomAwareWall(map: LeafletMap, insetsOf: () => MapInsets): () => void {
    const target = map as unknown as LimitCenter;
    const original = target._limitCenter;
    target._limitCenter = function limitCenter(this: LeafletMap, center, zoom, bounds) {
        const effective = bounds !== undefined && bounds === this.options.maxBounds ? wall(zoom, insetsOf()) : bounds;
        return original.call(this, center, zoom, effective);
    };
    return () => {
        target._limitCenter = original;
    };
}

export function MapLimits() {
    const map = useMap();

    useEffect(() => {
        const camera = getCamera(map);
        const insetsOf = () => mapInsets(map.getSize().x);
        const uninstall = installZoomAwareWall(map, insetsOf);
        let applying = false;

        const apply = () => {
            if (applying) return;
            applying = true;
            const size = map.getSize();
            const insets = insetsOf();
            const floor = floorZoom(size, insets);
            const zoom = Math.max(map.getZoom(), floor);
            const bounds = wall(zoom, insets);
            const center = L.latLng(map.getCenter());
            const inside = clampCenter(center, zoom, size, bounds);
            // A view outside the limits (a restored one, on another screen size) is corrected without animation,
            // before the floor and the wall go in: both would animate the correction themselves.
            if (zoom !== map.getZoom() || !inside.equals(center))
                camera.move({ center: inside, zoom }, { animate: false });
            map.setMinZoom(floor);
            map.setMaxBounds(bounds);
            applying = false;
        };
        apply();
        map.on("resize", apply);
        map.on("zoomend", apply);
        return () => {
            map.off("resize", apply);
            map.off("zoomend", apply);
            uninstall();
        };
    }, [map]);

    return null;
}
