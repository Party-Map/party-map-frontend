/**
 * Stand-ins for react-leaflet and leaflet. jsdom has no layout engine, so map components are
 * rendered as plain elements and the map object is a bag of spies that tests can inspect.
 *
 * Usage (must run before the component under test is imported):
 * ```ts
 * vi.mock("react-leaflet", () => import("./leaflet").then((m) => m.reactLeafletMock))
 * vi.mock("leaflet", () => import("./leaflet").then((m) => m.leafletMock))
 * vi.mock("@maplibre/maplibre-gl-leaflet", () => import("./leaflet").then((m) => m.maplibreLeafletMock))
 * ```
 * The third one stands in for the MapLibre basemap layer (map/Basemap.tsx), so maplibre-gl never loads in jsdom.
 */
import type { ReactNode } from "react";
import { vi } from "vitest";

interface Point {
    x: number;
    y: number;
    distanceTo: (p: Point) => number;
    divideBy: (n: number) => Point;
    add: (p: [number, number]) => Point;
    subtract: (p: Point) => Point;
}

export function point(x: number, y: number): Point {
    return {
        x,
        y,
        distanceTo: (p) => Math.hypot(p.x - x, p.y - y),
        divideBy: (n) => point(x / n, y / n),
        add: ([dx, dy]) => point(x + dx, y + dy),
        subtract: (p) => point(x - p.x, y - p.y),
    };
}

interface FakeBounds {
    getWest: () => number;
    getSouth: () => number;
    getEast: () => number;
    getNorth: () => number;
}

const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

/** The map's container element (`.leaflet-container`); map/Sky.tsx paints the stars on its background. */
export const fakeContainer = document.createElement("div");

export const fakeMap = {
    getContainer: vi.fn(() => fakeContainer),
    flyTo: vi.fn(),
    flyToBounds: vi.fn(),
    setView: vi.fn(),
    setZoom: vi.fn(),
    setZoomAround: vi.fn(),
    panBy: vi.fn(),
    getZoom: vi.fn(() => 13),
    getBoundsZoom: vi.fn(() => 7),
    setMinZoom: vi.fn(),
    getCenter: vi.fn(() => ({ lat: 47.5, lng: 19.05 })),
    /** Central Budapest. */
    getBounds: vi.fn((): FakeBounds => ({
        getWest: () => 19.0,
        getSouth: () => 47.45,
        getEast: () => 19.1,
        getNorth: () => 47.55,
    })),
    getSize: vi.fn(() => point(800, 600)),
    latLngToContainerPoint: vi.fn(() => point(400, 300)),
    project: vi.fn(() => point(400, 300)),
    unproject: vi.fn(() => ({ lat: 47.5, lng: 19.05 })),
    dragging: { enable: vi.fn(), disable: vi.fn() },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        listeners.get(event)?.delete(handler);
    }),
    /** Test helper: trigger a registered map event. */
    fire: (event: string, ...args: unknown[]) => listeners.get(event)?.forEach((h) => h(...args)),
    reset: () => {
        listeners.clear();
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

const mapEventHandlers = new Map<string, (...args: unknown[]) => void>();

export const reactLeafletMock = {
    MapContainer: ({ children, center, zoom }: { children?: ReactNode; center?: unknown; zoom?: number }) => (
        <div data-testid="map" data-center={JSON.stringify(center)} data-zoom={zoom}>
            {children}
        </div>
    ),
    Marker: ({
        children,
        position,
        eventHandlers,
    }: {
        children?: ReactNode;
        position: unknown;
        eventHandlers?: Record<string, () => void>;
    }) => (
        <div
            data-testid="marker"
            data-position={JSON.stringify(position)}
            role="button"
            tabIndex={0}
            onClick={eventHandlers?.click}
            onKeyDown={eventHandlers?.click}
        >
            {children}
        </div>
    ),
    Popup: ({ children }: { children?: ReactNode }) => <div data-testid="popup">{children}</div>,
    Circle: ({ radius }: { radius: number }) => <div data-testid="circle" data-radius={radius} />,
    useMap: () => fakeMap,
    useMapEvent: (name: string, handler: (...args: unknown[]) => void) => {
        mapEventHandlers.set(name, handler);
        return fakeMap;
    },
    useMapEvents: (handlers: Record<string, (...args: unknown[]) => void>) => {
        Object.entries(handlers).forEach(([name, handler]) => mapEventHandlers.set(name, handler));
        return fakeMap;
    },
    /** Test helper: invoke a handler registered through useMapEvent(s). */
    fireMapEvent: (name: string, ...args: unknown[]) => mapEventHandlers.get(name)?.(...args),
};

export const leafletMock = {
    default: {
        divIcon: vi.fn((options: unknown) => ({ options })),
        icon: vi.fn((options: unknown) => ({ options })),
        latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
        latLngBounds: vi.fn((coords: unknown) => ({ coords, pad: vi.fn(() => ({ coords, padded: true })) })),
        point: vi.fn((x: number, y: number) => point(x, y)),
        DomEvent: { disableClickPropagation: vi.fn(), disableScrollPropagation: vi.fn() },
    },
};
