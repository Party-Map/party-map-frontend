import type { GeoPoint } from "@/api/types";

/** Google Maps directions to the point; the app opens it in a new tab and the phone hands it to its maps app. */
export function directionsUrl(point: GeoPoint): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
}
