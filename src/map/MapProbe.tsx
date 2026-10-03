// Hands the Leaflet map and its camera to the page's scripts in development builds only, for the Playwright map
// behaviour spec (e2e/helpers/map.ts): it counts moves and reads the view. Never part of the production bundle.
import type { Map as LeafletMap } from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { type Camera, useCamera } from "./useCamera";

declare global {
    interface Window {
        __pmMap?: LeafletMap;
        __pmCamera?: Camera;
    }
}

export function MapProbe() {
    const map = useMap();
    const camera = useCamera();

    useEffect(() => {
        window.__pmMap = map;
        window.__pmCamera = camera;
        return () => {
            delete window.__pmMap;
            delete window.__pmCamera;
        };
    }, [map, camera]);

    return null;
}
