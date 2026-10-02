import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

import type { ID, Place } from "@/api/types";

import { toLatLngTuple } from "./geo";
import { BOTTOM_INSET, TOP_INSET } from "./insets";

/** Below this viewport width the popup would collide with the bottom bar, so the pin is panned above it. */
export const PHONE_MAX_WIDTH = 768;
const PIN_HEIGHT = 48;
const MARGIN = 12;
/** The card's height above the pin head (see getPopupRect in PlaceLabels.tsx). */
const CARD_HEIGHT = 230;
/** Pans shorter than this are not worth animating. */
const MIN_PAN_DISTANCE = 6;

/** The pin's y where the card sits just under the top bar and the pin just above the bottom bar. */
function visibleBand(height: number): { top: number; bottom: number } {
    return { top: TOP_INSET + CARD_HEIGHT + PIN_HEIGHT, bottom: height - (BOTTOM_INSET + PIN_HEIGHT + MARGIN) };
}

/**
 * On phones, pans the map so the open pin sits just above the bottom bar with its popup in view: when the card
 * opens, and again after any move the user did not drag (a flight to a search hit, a zoom) leaves the card cut off.
 * It reacts to the open place's coordinates, not to the places array, so a viewport load after the user dragged
 * the card elsewhere does not pull the map back.
 */
export function PanPopupMobile({ places, openPopupId }: { places: Place[]; openPopupId: ID | null }) {
    const map = useMap();
    const place = openPopupId === null ? undefined : places.find((p) => p.id === openPopupId);
    const latitude = place?.location.latitude;
    const longitude = place?.location.longitude;

    useEffect(() => {
        if (latitude === undefined || longitude === undefined || window.innerWidth >= PHONE_MAX_WIDTH) return;
        let frame: number | null = null;
        let dragging = false;

        const pinPoint = () => map.latLngToContainerPoint(toLatLngTuple({ latitude, longitude }));
        const panIntoPlace = () => {
            frame = requestAnimationFrame(() => {
                frame = null;
                const current = pinPoint();
                const size = map.getSize();
                const desired = L.point(size.x / 2, visibleBand(size.y).bottom);
                const offset = current.subtract(desired);
                if (Math.abs(offset.x) + Math.abs(offset.y) < MIN_PAN_DISTANCE) return;
                map.panBy(offset, { animate: true, duration: 0.35 });
            });
        };
        const onDragStart = () => {
            dragging = true;
        };
        const onMoveEnd = () => {
            if (dragging) {
                dragging = false;
                return;
            }
            const band = visibleBand(map.getSize().y);
            const { y } = pinPoint();
            if (y < band.top || y > band.bottom) panIntoPlace();
        };

        map.on("dragstart", onDragStart);
        map.on("moveend", onMoveEnd);
        panIntoPlace();

        return () => {
            map.off("dragstart", onDragStart);
            map.off("moveend", onMoveEnd);
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, [map, latitude, longitude]);

    return null;
}
