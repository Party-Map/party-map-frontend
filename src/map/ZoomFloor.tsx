import type { LatLngBoundsLiteral } from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** The country's extent: the smallest view the map allows is the whole of Hungary. */
export const HUNGARY_BOUNDS: LatLngBoundsLiteral = [
    [45.737, 16.114],
    [48.585, 22.897],
];

/**
 * Keeps the map from zooming out beyond the whole country: the floor is the zoom at which Hungary fills the
 * viewport, recomputed whenever the viewport changes size.
 */
export function ZoomFloor() {
    const map = useMap();

    useEffect(() => {
        const apply = () => {
            const floor = map.getBoundsZoom(HUNGARY_BOUNDS, false);
            map.setMinZoom(floor);
            if (map.getZoom() < floor) map.setZoom(floor);
        };
        apply();
        map.on("resize", apply);
        return () => {
            map.off("resize", apply);
        };
    }, [map]);

    return null;
}
