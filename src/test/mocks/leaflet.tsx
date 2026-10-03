/**
 * Stand-ins for react-leaflet and leaflet. jsdom has no layout engine, so map components are
 * rendered as plain elements and the map object is a bag of spies that tests can inspect. The geometry helpers
 * (`latLng`, `latLngBounds`, `point`, `bounds`, `CRS`) are Leaflet's real ones, so the camera maths (map/camera.ts)
 * runs for real under the fake map.
 *
 * Usage (must run before the component under test is imported):
 * ```ts
 * vi.mock("react-leaflet", () => import("./leaflet").then((m) => m.reactLeafletMock))
 * vi.mock("leaflet", () => import("./leaflet").then((m) => m.leafletMock))
 * vi.mock("@maplibre/maplibre-gl-leaflet", () => import("./leaflet").then((m) => m.maplibreLeafletMock))
 * ```
 * The third one stands in for the MapLibre basemap layer (map/Basemap.tsx), so maplibre-gl never loads in jsdom.
 */
import type * as Leaflet from "leaflet";
import type { LatLngBounds, LatLngExpression } from "leaflet";
import { type ReactNode, type Ref, useEffect, useImperativeHandle, useLayoutEffect, useState } from "react";
import { vi } from "vitest";

const actual = await vi.importActual<{ default?: typeof Leaflet } & typeof Leaflet>("leaflet");
/** Real Leaflet, for its geometry. */
export const RealLeaflet: typeof Leaflet = actual.default ?? actual;

interface Point {
    x: number;
    y: number;
    distanceTo: (p: Point) => number;
    divideBy: (n: number) => Point;
    add: (p: Point | [number, number]) => Point;
    subtract: (p: Point) => Point;
}

export function point(x: number, y: number): Point {
    return {
        x,
        y,
        distanceTo: (p) => Math.hypot(p.x - x, p.y - y),
        divideBy: (n) => point(x / n, y / n),
        add: (p) => (Array.isArray(p) ? point(x + p[0], y + p[1]) : point(x + p.x, y + p.y)),
        subtract: (p) => point(x - p.x, y - p.y),
    };
}

interface FakeBounds {
    getWest: () => number;
    getSouth: () => number;
    getEast: () => number;
    getNorth: () => number;
}

type Handler = (...args: unknown[]) => void;
const listeners = new Map<string, Set<Handler>>();

/** The map's container element (`.leaflet-container`); map/Sky.tsx paints the stars on its background. */
export const fakeContainer = document.createElement("div");

/** Panes created through `createPane`, by name; `getPane` finds them again like Leaflet does. */
const panes = new Map<string, HTMLElement>();

/** The `position` prop of every rendered Popup, in order; tests check it stays referentially stable. */
export const popupPositions: unknown[] = [];

/** The open card's box as the fake popup element reports it: this wide and tall, its bottom this far above the pin. */
export const fakeCardBox = { width: 322, height: 220, above: 68 };

const defaultOptions = () => ({
    maxBounds: undefined as LatLngBounds | undefined,
    minZoom: undefined as number | undefined,
    maxZoom: 19,
    zoomSnap: 0,
});

export const fakeMap = {
    options: defaultOptions(),
    getContainer: vi.fn(() => fakeContainer),
    getPane: vi.fn((name: string) => panes.get(name)),
    createPane: vi.fn((name: string) => {
        const pane = document.createElement("div");
        pane.className = `leaflet-pane leaflet-${name}-pane`;
        panes.set(name, pane);
        return pane;
    }),
    flyTo: vi.fn(),
    flyToBounds: vi.fn(),
    panTo: vi.fn(),
    setView: vi.fn(),
    setZoom: vi.fn(),
    setZoomAround: vi.fn(),
    panBy: vi.fn(),
    /** Leaflet's private animation stop (map/useCamera.ts). */
    _stop: vi.fn(),
    getZoom: vi.fn(() => 13),
    getMinZoom: vi.fn((): number => fakeMap.options.minZoom ?? 0),
    getMaxZoom: vi.fn((): number => fakeMap.options.maxZoom),
    getBoundsZoom: vi.fn(() => 7),
    setMinZoom: vi.fn((zoom: number) => {
        fakeMap.options.minZoom = zoom;
    }),
    setMaxBounds: vi.fn((bounds: LatLngBounds) => {
        fakeMap.options.maxBounds = bounds;
    }),
    /** Leaflet's private clamp; map/MapLimits.tsx wraps it. Passes the centre through. */
    _limitCenter: vi.fn((center: unknown, _zoom: number, _bounds?: unknown) => center),
    getCenter: vi.fn(() => RealLeaflet.latLng(47.5, 19.05)),
    /** Central Budapest. */
    getBounds: vi.fn((): FakeBounds => ({
        getWest: () => 19.0,
        getSouth: () => 47.45,
        getEast: () => 19.1,
        getNorth: () => 47.55,
    })),
    getSize: vi.fn(() => point(800, 600)),
    latLngToContainerPoint: vi.fn((_latLng: unknown) => point(400, 300)),
    containerPointToLatLng: vi.fn((_point: unknown) => RealLeaflet.latLng(47.5, 19.05)),
    project: vi.fn((_latLng: unknown, _zoom?: number) => point(400, 300)),
    unproject: vi.fn((_point: unknown, _zoom?: number) => ({ lat: 47.5, lng: 19.05 })),
    dragging: { enable: vi.fn(), disable: vi.fn() },
    on: vi.fn((event: string, handler: Handler) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: Handler) => {
        listeners.get(event)?.delete(handler);
    }),
    once: vi.fn((event: string, handler: Handler) => {
        const wrapped: Handler = (...args) => {
            fakeMap.off(event, wrapped);
            handler(...args);
        };
        fakeMap.on(event, wrapped);
    }),
    /** Test helper: trigger a registered map event. */
    fire: (event: string, ...args: unknown[]) => listeners.get(event)?.forEach((h) => h(...args)),
    /** Test helper: the end of a flight or pan (Leaflet fires `zoomend`, then `moveend`). */
    settle: () => {
        fakeMap.fire("zoomend");
        fakeMap.fire("moveend");
    },
    reset: () => {
        // Whatever holds per-map state (map/useCamera.ts) lets go of this map, like on a real unload.
        fakeMap.fire("unload");
        listeners.clear();
        panes.clear();
        popupPositions.length = 0;
        fakeMap.options = defaultOptions();
        Object.values(fakeMap).forEach((v) => {
            if (typeof v === "function" && "mockClear" in v) (v as { mockClear: () => void }).mockClear();
        });
        fakeMap.dragging.enable.mockClear();
        fakeMap.dragging.disable.mockClear();
        fakeContainer.removeAttribute("style");
        fakeGlMap.setStyle.mockClear();
        fakeGlMap.addLayer.mockClear();
        fakeGlMap.getLayer.mockClear();
        fakeGlMap.on.mockClear();
        glListeners.clear();
        fakeGlLayer.addTo.mockClear();
        fakeGlLayer.remove.mockClear();
        fakeGlLayer.getMaplibreMap.mockClear();
        maplibreLeafletMock.maplibreGL.mockClear();
        fakePopup.update.mockClear();
    },
};

const glListeners = new Map<string, (event?: { id: string }) => void>();

/** The MapLibre map behind the basemap layer. */
export const fakeGlMap = {
    setStyle: vi.fn(),
    addLayer: vi.fn(),
    getLayer: vi.fn((_id: string): object | undefined => undefined),
    on: vi.fn((event: string, handler: (event?: { id: string }) => void) => glListeners.set(event, handler)),
    /** Test helper: trigger a MapLibre event registered through `on`. */
    fire: (event: string, payload?: { id: string }) => glListeners.get(event)?.(payload),
};

/** The Leaflet layer the maplibre-gl-leaflet plugin creates; tests inspect the style it was created with. */
export const fakeGlLayer = {
    addTo: vi.fn(),
    remove: vi.fn(),
    getMaplibreMap: vi.fn(() => fakeGlMap),
};

export const maplibreLeafletMock = {
    maplibreGL: vi.fn((_options: unknown) => fakeGlLayer),
};

/** The `.leaflet-popup` element of the open card; its box follows `fakeCardBox` around the pin's container point. */
const popupElement = document.createElement("div");
popupElement.className = "leaflet-popup";
let popupAnchor: unknown = null;
popupElement.getBoundingClientRect = () => {
    const pin = fakeMap.latLngToContainerPoint(popupAnchor);
    const { width, height, above } = fakeCardBox;
    const left = pin.x - width / 2;
    const top = pin.y - above - height;
    return { x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) };
};

/** What a `ref` on the Popup gets: the Leaflet popup's `update()` and element (map/CardMeasure.tsx). */
export const fakePopup = { update: vi.fn(), getElement: () => popupElement };

export const reactLeafletMock = {
    MapContainer: ({
        children,
        center,
        zoom,
        maxBoundsViscosity,
        zoomSnap,
        bounceAtZoomLimits,
    }: {
        children?: ReactNode;
        center?: unknown;
        zoom?: number;
        maxBoundsViscosity?: number;
        zoomSnap?: number;
        bounceAtZoomLimits?: boolean;
    }) => (
        <div
            data-testid="map"
            data-center={JSON.stringify(center)}
            data-zoom={zoom}
            data-max-bounds-viscosity={maxBoundsViscosity}
            data-zoom-snap={zoomSnap}
            data-bounce-at-zoom-limits={bounceAtZoomLimits}
        >
            {children}
        </div>
    ),
    /**
     * Pins render as a clickable box. A marker in the `labels` pane (map/PlaceLabels.tsx) is a `label-marker`
     * whose div icon element is attached under it, so the label content portalled into it is in the document.
     */
    Marker: ({
        children,
        position,
        eventHandlers,
        icon,
        pane,
        opacity,
    }: {
        children?: ReactNode;
        position: unknown;
        eventHandlers?: Record<string, () => void>;
        icon?: { options?: { html?: unknown } };
        pane?: string;
        opacity?: number;
    }) => {
        const html = icon?.options?.html;
        const clickable = eventHandlers?.click !== undefined;
        return (
            <div
                data-testid={pane === "labels" ? "label-marker" : "marker"}
                data-position={JSON.stringify(position)}
                data-opacity={opacity}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={eventHandlers?.click}
                onKeyDown={eventHandlers?.click}
                ref={(el) => {
                    if (el && html instanceof Element && html.parentElement !== el) el.appendChild(html);
                }}
            >
                {children}
            </div>
        );
    },
    Popup: ({
        children,
        position,
        ref,
    }: {
        children?: ReactNode;
        position?: LatLngExpression;
        ref?: Ref<typeof fakePopup>;
    }) => {
        popupPositions.push(position);
        popupAnchor = position;
        useImperativeHandle(ref, () => fakePopup, []);
        // Like react-leaflet, the content goes in one commit after the popup opened (and its ref was set).
        const [open, setOpen] = useState(false);
        useLayoutEffect(() => setOpen(true), []);
        return (
            <div data-testid="popup" className="leaflet-popup">
                {open ? children : null}
            </div>
        );
    },
    Circle: ({ radius }: { radius: number }) => <div data-testid="circle" data-radius={radius} />,
    useMap: () => fakeMap,
    useMapEvent: (name: string, handler: Handler) => {
        useEffect(() => {
            fakeMap.on(name, handler);
            return () => fakeMap.off(name, handler);
        }, [name, handler]);
        return fakeMap;
    },
    useMapEvents: (handlers: Record<string, Handler>) => {
        useEffect(() => {
            Object.entries(handlers).forEach(([name, handler]) => fakeMap.on(name, handler));
            return () => Object.entries(handlers).forEach(([name, handler]) => fakeMap.off(name, handler));
        }, [handlers]);
        return fakeMap;
    },
    /** Test helper: trigger a map event, whether registered through `map.on` or `useMapEvent(s)`. */
    fireMapEvent: (name: string, ...args: unknown[]) => fakeMap.fire(name, ...args),
};

export const leafletMock = {
    default: {
        CRS: RealLeaflet.CRS,
        LatLng: RealLeaflet.LatLng,
        LatLngBounds: RealLeaflet.LatLngBounds,
        Point: RealLeaflet.Point,
        Bounds: RealLeaflet.Bounds,
        latLng: RealLeaflet.latLng,
        latLngBounds: RealLeaflet.latLngBounds,
        point: RealLeaflet.point,
        bounds: RealLeaflet.bounds,
        divIcon: vi.fn((options: unknown) => ({ options })),
        icon: vi.fn((options: unknown) => ({ options })),
        DomEvent: { disableClickPropagation: vi.fn(), disableScrollPropagation: vi.fn() },
    },
};
