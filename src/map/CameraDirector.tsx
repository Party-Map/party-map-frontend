// The one component that decides where the map goes on its own: a search's places (fit them all, or fly to the
// single one with its card), and a card opened from a pin or label (pan the least that shows it, zoom in when the
// wall forbids). Every target comes from map/camera.ts and goes through the camera (map/useCamera.ts), so each
// decision is exactly one move that lands where it was told; nothing here reacts to the map moving, and a restored
// view (back from a detail page) is left exactly where the user had it.
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import type { ID, Place } from "@/api/types";

import { type AnchoredRect, fitsBand, fitTarget, freeBand, showTarget } from "./camera";
import { toLatLngTuple } from "./geo";
import { mapInsets, overlayTop } from "./insets";
import { useCamera } from "./useCamera";

/** A search's single place is shown at this zoom. */
export const SEARCH_ZOOM = 15;
const CARD_DURATION = 0.35;
const FLIGHT_DURATION = 0.6;
const FIT_DURATION = 0.8;

interface CameraDirectorProps {
    places: Place[];
    highlightIds: ID[];
    /** Bumped by every user-driven change of the highlights (typing, a pick); republications leave it alone. */
    generation: number;
    /** False while highlighted places are still loading; they are fitted once all of them are known. */
    ready: boolean;
    openPopupId: ID | null;
    /** The open card's place, once loaded. */
    openPlace: Place | undefined;
    /** The open card's measured box around its pin; null until measured. */
    cardRect: AnchoredRect | null;
    /**
     * What the map restored: the remembered card and the search generation as the page found them when it mounted
     * (before any focus from the URL bumped it); null on a fresh start.
     */
    restored: RestoredMap | null;
}

export interface RestoredMap {
    popupId: ID | null;
    generation: number;
}

export function CameraDirector({
    places,
    highlightIds,
    generation,
    ready,
    openPopupId,
    openPlace,
    cardRect,
    restored,
}: CameraDirectorProps) {
    const map = useMap();
    const camera = useCamera();
    // What the view already shows: the restored card and the highlights as they were at the restore. (The map's
    // children mount one render after the page, so the page's snapshot is used, not this render's generation.)
    const shown = useRef({
        generation: restored ? restored.generation : -1,
        popupId: restored?.popupId ?? null,
    });

    useEffect(() => {
        const state = shown.current;
        const size = map.getSize();
        const insets = mapInsets(size.x);
        const view = () => {
            const top = overlayTop();
            const containerTop = map.getContainer().getBoundingClientRect().top;
            const extraBottom = top === null ? 0 : Math.max(0, size.y - insets.bottom - (top - containerTop));
            return { center: map.getCenter(), zoom: map.getZoom(), size, insets, extraBottom };
        };

        if (generation !== state.generation) {
            if (!ready) return;
            const targets = places.filter((place) => highlightIds.includes(place.id));
            const [first] = targets;
            if (!first) {
                // Nothing to show for this search (no place among the hits): on to the card, if any.
                state.generation = generation;
            } else if (targets.length === 1) {
                const opening = openPopupId === first.id;
                // Its card is about to be measured: one flight then, with the card in the picture.
                if (opening && !cardRect) return;
                state.generation = generation;
                if (opening) state.popupId = first.id;
                const pin = toLatLngTuple(first.location);
                const current = view();
                // A pick of the place the map already shows (typing flew there) moves the least it takes, not to
                // the middle; a flight from elsewhere centres the place between the bars.
                const alreadyThere =
                    Math.abs(current.zoom - SEARCH_ZOOM) < 1e-6 &&
                    fitsBand(map.latLngToContainerPoint(pin), null, freeBand(size, insets, current.extraBottom));
                const target = showTarget({
                    ...current,
                    zoom: SEARCH_ZOOM,
                    pin,
                    card: opening ? cardRect : null,
                    mode: alreadyThere ? "minimal" : "center",
                });
                if (!alreadyThere || target.moved) camera.move(target, { duration: FLIGHT_DURATION });
                return;
            } else {
                state.generation = generation;
                const points = targets.map((place) => toLatLngTuple(place.location));
                camera.move(fitTarget(points, size, insets), { duration: FIT_DURATION });
                return;
            }
        }

        if (openPopupId === null) {
            state.popupId = null;
            return;
        }
        if (openPopupId === state.popupId || !openPlace || !cardRect) return;
        state.popupId = openPopupId;
        const target = showTarget({ ...view(), pin: toLatLngTuple(openPlace.location), card: cardRect });
        if (target.moved) camera.move(target, { duration: CARD_DURATION });
    }, [camera, map, places, highlightIds, generation, ready, openPopupId, openPlace, cardRect]);

    return null;
}
