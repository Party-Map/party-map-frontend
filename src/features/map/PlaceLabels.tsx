import { useEffect, useReducer, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { useMap } from "react-leaflet";
import { KindBadge } from "@/components/KindBadge";
import { BASE_LABEL_ZOOM, HIGHLIGHT_LABEL_ZOOM, LABEL_BASE_OFFSET, LABEL_HIGHLIGHT_OFFSET } from "@/lib/constants";
import { cx } from "@/lib/cx";
import type { ID, Place, UpcomingEventByPlace } from "@/lib/types";
import { toLatLngTuple } from "./geo";
import styles from "./PlaceLabels.module.css";

export type PopupRect = { left: number; right: number; top: number; bottom: number };

type XY = { x: number; y: number };

/** Screen-space box the popup card covers around its pin; labels underneath it are hidden. */
const POPUP_HALF_WIDTH = 140;
const POPUP_HEIGHT_ABOVE = 230;
const POPUP_HEIGHT_BELOW = 10;
/** Labels this far outside the viewport are not rendered at all. */
const OFFSCREEN_MARGIN = 80;
/** Labels fade with their distance from the viewport centre; the fade spans this share of the short side. */
const FADE_EXTENT = 0.9;
const MIN_OPACITY = 0.15;
const DIMMED_OPACITY = 0.06;
/** How long after the last move/zoom event the map counts as still interacting. */
const SETTLE_MS = 80;

export function getPopupRect(anchor: XY): PopupRect {
    return {
        left: anchor.x - POPUP_HALF_WIDTH,
        right: anchor.x + POPUP_HALF_WIDTH,
        top: anchor.y - POPUP_HEIGHT_ABOVE,
        bottom: anchor.y + POPUP_HEIGHT_BELOW,
    };
}

export function isInsideRect(point: XY, rect: PopupRect): boolean {
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

/**
 * Highlighted labels are fully visible; while something is selected the rest recede; otherwise
 * labels fade with their distance from the viewport centre.
 */
export function computeLabelOpacity(options: {
    isHighlighted: boolean;
    hasSelection: boolean;
    distance: number;
    maxDistance: number;
}): number {
    const { isHighlighted, hasSelection, distance, maxDistance } = options;
    if (isHighlighted) return 1;
    if (hasSelection) return DIMMED_OPACITY;
    return Math.max(MIN_OPACITY, Math.min(1, 1 - distance / maxDistance));
}

/** Re-renders the caller once per animation frame while the map moves; reports whether it is moving. */
function useMapInteraction(map: LeafletMap): boolean {
    const [, rerender] = useReducer((n: number) => n + 1, 0);
    const [isInteracting, setIsInteracting] = useState(false);

    useEffect(() => {
        let frame: number | null = null;
        let settleTimer: ReturnType<typeof setTimeout> | null = null;
        let interacting = false;

        const schedule = () => {
            if (frame !== null) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                rerender();
            });
        };
        const onStart = () => {
            if (!interacting) {
                interacting = true;
                setIsInteracting(true);
            }
            schedule();
        };
        const onEnd = () => {
            schedule();
            requestAnimationFrame(() => {
                interacting = false;
                settleTimer = setTimeout(() => {
                    if (!interacting) setIsInteracting(false);
                }, SETTLE_MS);
            });
        };

        map.on("movestart", onStart);
        map.on("zoomstart", onStart);
        map.on("move", schedule);
        map.on("zoom", schedule);
        map.on("moveend", onEnd);
        map.on("zoomend", onEnd);

        return () => {
            map.off("movestart", onStart);
            map.off("zoomstart", onStart);
            map.off("move", schedule);
            map.off("zoom", schedule);
            map.off("moveend", onEnd);
            map.off("zoomend", onEnd);
            if (frame !== null) cancelAnimationFrame(frame);
            if (settleTimer !== null) clearTimeout(settleTimer);
        };
    }, [map]);

    return isInteracting;
}

type PlaceLabelsProps = {
    places: Place[];
    upcomingMap: Map<ID, UpcomingEventByPlace>;
    highlightIds: ID[];
    openPopupId: ID | null;
    onOpen: (id: ID) => void;
};

/** HTML labels above the pins, positioned from the map projection on every frame the map moves. */
export function PlaceLabels({ places, upcomingMap, highlightIds, openPopupId, onOpen }: PlaceLabelsProps) {
    const map = useMap();
    const isInteracting = useMapInteraction(map);

    const hasHighlights = highlightIds.length > 0;
    const minZoom = hasHighlights ? HIGHLIGHT_LABEL_ZOOM : BASE_LABEL_ZOOM;
    if (map.getZoom() < minZoom) return null;

    const size = map.getSize();
    const centre = size.divideBy(2);
    const maxDistance = Math.min(size.x, size.y) * FADE_EXTENT;
    const openPlace = places.find((p) => p.id === openPopupId);
    const popupRect = openPlace ? getPopupRect(map.latLngToContainerPoint(toLatLngTuple(openPlace.location))) : null;
    const hasSelection = openPopupId !== null || hasHighlights;

    return (
        <div className={styles.layer}>
            {places.map((place) => {
                const pt = map.latLngToContainerPoint(toLatLngTuple(place.location));
                const offscreen =
                    pt.x < -OFFSCREEN_MARGIN ||
                    pt.y < -OFFSCREEN_MARGIN ||
                    pt.x > size.x + OFFSCREEN_MARGIN ||
                    pt.y > size.y + OFFSCREEN_MARGIN;
                if (offscreen) return null;

                const isActive = place.id === openPopupId;
                if (!isActive && popupRect && isInsideRect(pt, popupRect)) return null;

                const isHighlighted = highlightIds.includes(place.id);
                const opacity = isActive
                    ? 0
                    : computeLabelOpacity({
                          isHighlighted,
                          hasSelection,
                          distance: centre.distanceTo(pt),
                          maxDistance,
                      });
                const offsetY = isHighlighted || isActive ? LABEL_HIGHLIGHT_OFFSET : LABEL_BASE_OFFSET;
                const transform = isActive
                    ? `translate(-50%, ${offsetY - 34}px) scale(0.6)`
                    : `translate(-50%, ${offsetY}px)`;
                const upcoming = upcomingMap.get(place.id);

                return (
                    <div
                        key={place.id}
                        className={cx(
                            styles.label,
                            isActive && styles.active,
                            isInteracting ? styles.moving : styles.settled,
                        )}
                        style={{ left: pt.x, top: pt.y, transform, opacity }}
                        aria-hidden={isActive}
                    >
                        <button
                            type="button"
                            className={styles.button}
                            onClick={() => onOpen(place.id)}
                            disabled={isActive}
                        >
                            {upcoming ? (
                                <>
                                    <span className={styles.eventTitle}>{upcoming.title}</span>
                                    <span className={styles.meta}>
                                        <span className={styles.placeName}>{place.name}</span>
                                        <KindBadge kind={upcoming.kind} size="sm" />
                                    </span>
                                </>
                            ) : (
                                <span className={styles.placeOnly}>{place.name}</span>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
