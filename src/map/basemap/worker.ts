import { setWorkerUrl } from "maplibre-gl";
import { version as maplibreVersion } from "maplibre-gl/package.json";

/**
 * MapLibre's worker module, copied by rsbuild.config.ts (with the module it imports) into this versioned folder;
 * the version in the path keeps the immutable /static/ cache honest across upgrades.
 */
export const MAPLIBRE_WORKER_URL = `/static/maplibre-${maplibreVersion}/maplibre-gl-worker.mjs`;

/** Point MapLibre at the copied worker; it would otherwise look next to the bundle and fail to load. */
export function configureMaplibreWorker(): void {
    setWorkerUrl(MAPLIBRE_WORKER_URL);
}
