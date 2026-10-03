import L from "leaflet";
import { MapPin, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";

import type { ID, Place } from "@/api/types";
import { cn } from "@/lib/utils";

import { type AnchoredRect, showTarget } from "./camera";
import { toLatLngTuple } from "./geo";
import { mapInsets } from "./insets";
import { useCamera } from "./useCamera";
import styles from "./ZoomControls.module.scss";

const RECENTER_DURATION = 0.6;

interface ZoomControlsProps {
    places: Place[];
    openPopupId: ID | null;
    /** The open card's measured box, so recentring puts the pin and its card in the middle of the free area. */
    cardRect: AnchoredRect | null;
}

/**
 * Desktop zoom buttons plus a "center selected" button while a popup is open: it centres the pin with its card
 * between the bars (through the camera, so the wall is respected). After recentering, zooming keeps the selected
 * pin in place until the user drags the map.
 */
export function ZoomControls({ places, openPopupId, cardRect }: ZoomControlsProps) {
    const map = useMap();
    const camera = useCamera();
    const rootRef = useRef<HTMLDivElement>(null);
    const [anchorActive, setAnchorActive] = useState(false);
    const selectedPlace = places.find((p) => p.id === openPopupId) ?? null;

    // Clicks and wheel events on the controls must not reach the map underneath.
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);
    }, []);

    useEffect(() => {
        const onDragStart = () => setAnchorActive(false);
        map.on("dragstart", onDragStart);
        return () => {
            map.off("dragstart", onDragStart);
        };
    }, [map]);

    const zoomBy = (delta: number) => {
        const target = map.getZoom() + delta;
        if (anchorActive && selectedPlace) map.setZoomAround(toLatLngTuple(selectedPlace.location), target);
        else map.setZoom(target);
    };

    const recenter = () => {
        if (!selectedPlace) return;
        const size = map.getSize();
        const target = showTarget({
            pin: toLatLngTuple(selectedPlace.location),
            card: cardRect,
            center: map.getCenter(),
            zoom: map.getZoom(),
            size,
            insets: mapInsets(size.x),
            mode: "center",
        });
        camera.move(target, { duration: RECENTER_DURATION });
        setAnchorActive(true);
    };

    return (
        <div ref={rootRef} className={styles.root}>
            <div className={styles.group}>
                <div className={styles.item}>
                    <button type="button" aria-label="Zoom in" className={styles.button} onClick={() => zoomBy(1)}>
                        <Plus size={18} aria-hidden />
                    </button>
                    <span className={cn(styles.tooltip, styles.below)} aria-hidden>
                        Zoom in
                    </span>
                </div>
                <div className={styles.item}>
                    <button type="button" aria-label="Zoom out" className={styles.button} onClick={() => zoomBy(-1)}>
                        <Minus size={18} aria-hidden />
                    </button>
                    <span className={cn(styles.tooltip, styles.above)} aria-hidden>
                        Zoom out
                    </span>
                </div>
            </div>

            {selectedPlace && (
                <div className={styles.item}>
                    <button
                        type="button"
                        aria-label="Center selected"
                        aria-pressed={anchorActive}
                        className={cn(styles.button, styles.recenter, anchorActive && styles.recenterActive)}
                        onClick={recenter}
                    >
                        <MapPin size={20} aria-hidden />
                    </button>
                    <span className={cn(styles.tooltip, styles.below)} aria-hidden>
                        Center selected
                    </span>
                </div>
            )}
        </div>
    );
}
