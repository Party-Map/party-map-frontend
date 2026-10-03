// The camera: the one piece of code that calls Leaflet's move methods. Every target it gets is already wall-legal
// (map/camera.ts), so a move is a single pan or flight that lands where it was told, and Leaflet's bounds
// enforcement on `moveend` never has anything to undo. It also knows whether a move is its own or the user's.
import type { Map as LeafletMap } from "leaflet";
import { useMap } from "react-leaflet";

import type { CameraTarget } from "./camera";

export interface MoveOptions {
    /** False jumps there at once (a correction at start-up); true (default) pans or flies. */
    animate?: boolean;
    /** Seconds; Leaflet's defaults otherwise. */
    duration?: number;
}

export interface Camera {
    /** Pans to the target at the same zoom, flies to it at another, or jumps without animation. Never `panBy`. */
    move(target: CameraTarget, options?: MoveOptions): void;
    /** True from the start of one of its moves until the `moveend` that closes it. */
    inFlight(): boolean;
    /** True once the user has dragged or zoomed the map themselves (or any move that was not the camera's ended). */
    userMoved(): boolean;
}

/** Zooms closer than this count as the same level: a pan, not a flight. */
const SAME_ZOOM = 1e-6;

/**
 * Leaflet's private animation stop, what `setView` and `flyTo` call first (leaflet 1.9.4, pinned). The public
 * `stop()` would do as well but zooms to the current zoom on the way, which fires a `moveend` of its own.
 */
interface Stoppable {
    _stop(): void;
}

const cameras = new WeakMap<LeafletMap, Camera>();

function createCamera(map: LeafletMap): Camera {
    let pending = false;
    let zooming = false;
    let userMoved = false;
    let queued: (() => void) | null = null;

    const onMoveEnd = () => {
        pending = false;
    };
    const onDragStart = () => {
        pending = false;
        userMoved = true;
    };
    // A zoom or move that the camera did not start is the user's (wheel, pinch, buttons, keyboard).
    const onMoveStart = () => {
        if (!pending) userMoved = true;
    };
    // `zoomanim` only fires for Leaflet's CSS zoom animation (wheel, pinch end, buttons), during which Leaflet
    // silently drops any `setView`: moves wait for its `zoomend`.
    const onZoomAnim = () => {
        zooming = true;
    };
    const onZoomEnd = () => {
        zooming = false;
        const run = queued;
        queued = null;
        run?.();
    };
    const onUnload = () => {
        map.off("moveend", onMoveEnd);
        map.off("dragstart", onDragStart);
        map.off("movestart", onMoveStart);
        map.off("zoomstart", onMoveStart);
        map.off("zoomanim", onZoomAnim);
        map.off("zoomend", onZoomEnd);
        map.off("unload", onUnload);
        cameras.delete(map);
    };
    map.on("moveend", onMoveEnd);
    map.on("dragstart", onDragStart);
    map.on("movestart", onMoveStart);
    map.on("zoomstart", onMoveStart);
    map.on("zoomanim", onZoomAnim);
    map.on("zoomend", onZoomEnd);
    map.on("unload", onUnload);

    const move: Camera["move"] = (target, { animate = true, duration } = {}) => {
        const run = () => {
            // A running pan ends here (its `moveend` fires now, before the new move is marked pending).
            (map as unknown as Stoppable)._stop();
            pending = true;
            if (!animate) map.setView(target.center, target.zoom, { animate: false });
            else if (Math.abs(target.zoom - map.getZoom()) > SAME_ZOOM)
                map.flyTo(target.center, target.zoom, { duration });
            else map.panTo(target.center, { animate: true, duration });
        };
        if (zooming) queued = run;
        else run();
    };

    return { move, inFlight: () => pending, userMoved: () => userMoved };
}

/** The camera of a map, created on first use and dropped when the map unloads. */
export function getCamera(map: LeafletMap): Camera {
    let camera = cameras.get(map);
    if (!camera) {
        camera = createCamera(map);
        cameras.set(map, camera);
    }
    return camera;
}

export function useCamera(): Camera {
    return getCamera(useMap());
}
