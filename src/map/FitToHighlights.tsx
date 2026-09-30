import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

import type { ID, Place } from "@/api/types";

import { toLatLngTuple } from "./geo";

const SINGLE_TARGET_ZOOM = 15;
/** Relative padding around the fitted bounds so edge markers are not cut off. */
const BOUNDS_PADDING = 0.2;

/** Flies to the highlighted place, or fits the viewport around all of them. */
export function FitToHighlights({ places, highlightIds }: { places: Place[]; highlightIds: ID[] }) {
    const map = useMap();

    useEffect(() => {
        const targets = places.filter((p) => highlightIds.includes(p.id));
        const [first] = targets;
        if (!first) return;

        if (targets.length === 1) {
            map.flyTo(toLatLngTuple(first.location), SINGLE_TARGET_ZOOM, { duration: 0.6 });
            return;
        }
        const bounds = L.latLngBounds(targets.map((p) => toLatLngTuple(p.location)));
        map.flyToBounds(bounds.pad(BOUNDS_PADDING), { duration: 0.8 });
    }, [map, places, highlightIds]);

    return null;
}
