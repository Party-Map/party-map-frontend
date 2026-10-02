import L, { type Map as LeafletMap } from "leaflet";
import { type ReactNode, useEffect, useMemo, useReducer, useState } from "react";
import { createPortal } from "react-dom";
import { Marker, useMap } from "react-leaflet";

import type { ID, Place, UpcomingEventByPlace } from "@/api/types";
import { KindBadge } from "@/components/KindBadge";
import { BASE_LABEL_ZOOM, HIGHLIGHT_LABEL_ZOOM, LABEL_BASE_OFFSET, LABEL_HIGHLIGHT_OFFSET } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { toLatLngTuple } from "./geo";
import styles from "./PlaceLabels.module.scss";

export interface PopupRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface XY {
    x: number;
    y: number;
}

/** The Leaflet pane the labels live in: above the pins, below the popup (see map/leaflet.scss). */
export const LABEL_PANE = "labels";
/** Screen-space box the popup card covers around its pin; labels underneath it are hidden. */
const POPUP_HALF_WIDTH = 140;
const POPUP_HEIGHT_ABOVE = 230;
const POPUP_HEIGHT_BELOW = 10;
/** Labels fade with their distance from the viewport centre; the fade spans this share of the short side. */
const FADE_EXTENT = 0.9;
const MIN_OPACITY = 0.15;
const DIMMED_OPACITY = 0.06;
/** The map events after which the labels' opacities are worked out again. */
const SETTLE_EVENTS = ["moveend", "zoomend", "resize"] as const;

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

/**
 * Re-renders the caller once the map has settled after a pan, zoom or resize. While the map moves, Leaflet carries
 * the labels along with the pins (they are markers in the same map pane), so nothing has to render per frame.
 */
function useSettledView(map: LeafletMap): void {
    const [, settle] = useReducer((n: number) => n + 1, 0);
    useEffect(() => {
        SETTLE_EVENTS.forEach((event) => map.on(event, settle));
        return () => SETTLE_EVENTS.forEach((event) => map.off(event, settle));
    }, [map]);
}

/** Makes sure the labels' pane exists before the first label marker is added to the map. */
function useLabelPane(map: LeafletMap): void {
    useState(() => map.getPane(LABEL_PANE) ?? map.createPane(LABEL_PANE));
}

interface LabelMarkerProps {
    place: Place;
    opacity: number;
    children: ReactNode;
}

/**
 * A non-interactive Leaflet marker in the labels pane with an empty div icon that the label content is portalled
 * into: Leaflet positions it with the pins on every pan and zoom frame, React only renders the content. Clicks
 * inside stay off the map (which would close the open card).
 */
function LabelMarker({ place, opacity, children }: LabelMarkerProps) {
    const [host] = useState(() => document.createElement("div"));
    const icon = useMemo(() => L.divIcon({ html: host, className: "pm-label-marker", iconSize: [0, 0] }), [host]);
    useEffect(() => {
        L.DomEvent.disableClickPropagation(host);
    }, [host]);
    const { latitude, longitude } = place.location;
    const position = useMemo(() => toLatLngTuple({ latitude, longitude }), [latitude, longitude]);

    return (
        <Marker
            position={position}
            icon={icon}
            pane={LABEL_PANE}
            interactive={false}
            keyboard={false}
            opacity={opacity}
        >
            {createPortal(children, host)}
        </Marker>
    );
}

interface PlaceLabelsProps {
    places: Place[];
    upcomingMap: Map<ID, UpcomingEventByPlace>;
    highlightIds: ID[];
    openPopupId: ID | null;
    onOpen: (id: ID) => void;
}

/**
 * HTML labels above the pins. Each is a Leaflet marker, so it moves with its pin while the map pans and zooms; the
 * opacities (distance fade, dimming behind a selection, hiding under the open card) are worked out once the map
 * settles.
 */
export function PlaceLabels({ places, upcomingMap, highlightIds, openPopupId, onOpen }: PlaceLabelsProps) {
    const map = useMap();
    useLabelPane(map);
    useSettledView(map);

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
        <>
            {places.map((place) => {
                const pt = map.latLngToContainerPoint(toLatLngTuple(place.location));
                const isActive = place.id === openPopupId;
                const underCard = !isActive && popupRect !== null && isInsideRect(pt, popupRect);
                const hidden = isActive || underCard;
                const isHighlighted = highlightIds.includes(place.id);
                const opacity = hidden
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
                    <LabelMarker key={place.id} place={place} opacity={opacity}>
                        <div
                            className={cn(styles.label, isActive && styles.active, hidden && styles.hidden)}
                            style={{ transform }}
                            aria-hidden={hidden}
                        >
                            <button
                                type="button"
                                className={styles.button}
                                onClick={() => onOpen(place.id)}
                                disabled={hidden}
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
                    </LabelMarker>
                );
            })}
        </>
    );
}
