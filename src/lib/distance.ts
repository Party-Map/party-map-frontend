// Distances for the UI, from the kilometres the browse API reports.

/** "350 m" under a kilometre, "3.2 km" under ten, "120 km" beyond. */
export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
}
