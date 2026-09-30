import type { LatLngTuple } from "leaflet";
import type { GeoPoint } from "@/lib/types";

/** Leaflet works with [lat, lng] tuples; the API sends GeoPoint objects. */
export function toLatLngTuple(point: GeoPoint): LatLngTuple {
    return [point.latitude, point.longitude];
}
