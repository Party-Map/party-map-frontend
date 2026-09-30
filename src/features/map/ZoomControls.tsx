import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapPin, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";
import { cx } from "@/lib/cx";
import type { ID, Place } from "@/lib/types";
import { toLatLngTuple } from "./geo";
import styles from "./ZoomControls.module.css";

/** After recentering the selected pin sits this many pixels above the viewport centre, leaving room for its popup. */
const RECENTER_OFFSET_Y = -100;

type ZoomControlsProps = {
    places: Place[];
    openPopupId: ID | null;
};

/**
 * Desktop zoom buttons plus a "center selected" button while a popup is open. After recentering,
 * zooming keeps the selected pin in place until the user drags the map.
 */
export function ZoomControls({ places, openPopupId }: ZoomControlsProps) {
    const map = useMap();
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
        const zoom = map.getZoom();
        const shifted = map.project(toLatLngTuple(selectedPlace.location), zoom).add([0, RECENTER_OFFSET_Y]);
        map.flyTo(map.unproject(shifted, zoom), zoom, { duration: 0.6 });
        setAnchorActive(true);
    };

    return (
        <div ref={rootRef} className={styles.root}>
            <div className={styles.group}>
                <div className={styles.item}>
                    <button type="button" aria-label="Zoom in" className={styles.button} onClick={() => zoomBy(1)}>
                        <Plus size={18} aria-hidden />
                    </button>
                    <span className={cx(styles.tooltip, styles.below)} aria-hidden>
                        Zoom in
                    </span>
                </div>
                <div className={styles.item}>
                    <button type="button" aria-label="Zoom out" className={styles.button} onClick={() => zoomBy(-1)}>
                        <Minus size={18} aria-hidden />
                    </button>
                    <span className={cx(styles.tooltip, styles.above)} aria-hidden>
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
                        className={cx(styles.button, styles.recenter, anchorActive && styles.recenterActive)}
                        onClick={recenter}
                    >
                        <MapPin size={20} aria-hidden />
                    </button>
                    <span className={cx(styles.tooltip, styles.below)} aria-hidden>
                        Center selected
                    </span>
                </div>
            )}
        </div>
    );
}
