import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import type { ID, Place } from "@/api/types";

import { toLatLngTuple } from "./geo";

const SINGLE_TARGET_ZOOM = 15;
/** Relative padding around the fitted bounds so edge markers are not cut off. */
const BOUNDS_PADDING = 0.2;

/**
 * Flies to the highlighted place, or fits the viewport around all of them, once per highlight set: the places list
 * changes on every pan (it follows the viewport) and must not pull the map back.
 */
export function FitToHighlights({
    places,
    highlightIds,
    ready = true,
}: {
    places: Place[];
    highlightIds: ID[];
    /** False while highlighted places may still be missing from `places`. */
    ready?: boolean;
}) {
    const map = useMap();
    const fittedFor = useRef<ID[] | null>(null);

    useEffect(() => {
        if (!ready || fittedFor.current === highlightIds) return;
        const targets = places.filter((p) => highlightIds.includes(p.id));
        const [first] = targets;
        if (!first) return;
        fittedFor.current = highlightIds;

        if (targets.length === 1) {
            map.flyTo(toLatLngTuple(first.location), SINGLE_TARGET_ZOOM, { duration: 0.6 });
            return;
        }
        const bounds = L.latLngBounds(targets.map((p) => toLatLngTuple(p.location)));
        map.flyToBounds(bounds.pad(BOUNDS_PADDING), { duration: 0.8 });
    }, [map, places, highlightIds, ready]);

    return null;
}
