/**
 * Stand-ins for react-leaflet and leaflet. jsdom has no layout engine, so map components are
 * rendered as plain elements and the map object is a bag of spies that tests can inspect.
 *
 * Usage (must run before the component under test is imported):
 * ```ts
 * vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock))
 * vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock))
 * ```
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

const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

export const fakeMap = {
    flyTo: vi.fn(),
    flyToBounds: vi.fn(),
    setView: vi.fn(),
    setZoom: vi.fn(),
    setZoomAround: vi.fn(),
    panBy: vi.fn(),
    getZoom: vi.fn(() => 13),
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
    },
};

const mapEventHandlers = new Map<string, (...args: unknown[]) => void>();

export const reactLeafletMock = {
    MapContainer: ({ children }: { children?: ReactNode }) => <div data-testid="map">{children}</div>,
    TileLayer: ({ url }: { url: string }) => <div data-testid="tile-layer" data-url={url} />,
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
