import { useEffect } from "react";
import { useMap, useMapEvent } from "react-leaflet";

import { toBbox } from "./geo";

/** Reports the area to load places for: once when the map mounts, then after every pan or zoom. */
export function ViewportWatcher({ onChange }: { onChange: (bbox: string) => void }) {
    const map = useMap();
    useMapEvent("moveend", () => onChange(toBbox(map.getBounds())));
    useEffect(() => onChange(toBbox(map.getBounds())), [map, onChange]);
    return null;
}
