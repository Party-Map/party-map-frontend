import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

import type { ID, Place } from "@/api/types";

import { toLatLngTuple } from "./geo";

/** Below this viewport width the popup would collide with the bottom bar, so the pin is panned above it. */
export const PHONE_MAX_WIDTH = 768;
/** Bottom bar height plus its bottom padding (see bars.module.css), in pixels. */
const BOTTOM_BAR_CLEARANCE = 64 + 16;
const PIN_HEIGHT = 48;
const MARGIN = 12;
/** Pans shorter than this are not worth animating. */
const MIN_PAN_DISTANCE = 6;

/** On phones, pans the map so the open pin sits just above the bottom bar with its popup in view. */
export function PanPopupMobile({ places, openPopupId }: { places: Place[]; openPopupId: ID | null }) {
    const map = useMap();

    useEffect(() => {
        if (!openPopupId || window.innerWidth >= PHONE_MAX_WIDTH) return;
        const place = places.find((p) => p.id === openPopupId);
        if (!place) return;

        const frame = requestAnimationFrame(() => {
            const current = map.latLngToContainerPoint(toLatLngTuple(place.location));
            const size = map.getSize();
            const desired = L.point(size.x / 2, size.y - (BOTTOM_BAR_CLEARANCE + PIN_HEIGHT + MARGIN));
            const offset = current.subtract(desired);
            if (Math.abs(offset.x) + Math.abs(offset.y) < MIN_PAN_DISTANCE) return;
            map.panBy(offset, { animate: true, duration: 0.35 });
        });

        return () => cancelAnimationFrame(frame);
    }, [map, places, openPopupId]);

    return null;
}
