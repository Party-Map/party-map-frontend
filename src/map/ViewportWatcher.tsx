import { useCallback, useEffect } from "react";
import { useMap, useMapEvent } from "react-leaflet";

import { toBbox } from "./geo";
import type { MapViewState } from "./mapMemory";

interface ViewportWatcherProps {
    /** The area to load places for ("minLon,minLat,maxLon,maxLat"). */
    onChange?: (bbox: string) => void;
    /** The centre and zoom, for remembering the view. */
    onViewChange?: (view: MapViewState) => void;
}

/** Reports the viewport once when the map mounts, then after every pan or zoom. */
export function ViewportWatcher({ onChange, onViewChange }: ViewportWatcherProps) {
    const map = useMap();
    const report = useCallback(() => {
        onChange?.(toBbox(map.getBounds()));
        const center = map.getCenter();
        onViewChange?.({ center: [center.lat, center.lng], zoom: map.getZoom() });
    }, [map, onChange, onViewChange]);
    useMapEvent("moveend", report);
    useEffect(() => report(), [report]);
    return null;
}
