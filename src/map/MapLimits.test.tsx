vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, render } from "@testing-library/react";
import L, { type LatLngBounds } from "leaflet";

import { fakeMap, point } from "@/test/mocks/leaflet";

import { clampCenter, floorZoom, wall } from "./camera";
import { BOTTOM_INSET, TOP_INSET } from "./insets";
import { installZoomAwareWall, MapLimits } from "./MapLimits";

const DESKTOP = { top: TOP_INSET, bottom: 0 };
const PHONE = { top: TOP_INSET, bottom: BOTTOM_INSET };

const lastMaxBounds = () => fakeMap.setMaxBounds.mock.lastCall![0];

beforeEach(() => {
    fakeMap.reset();
    fakeMap.getSize.mockReturnValue(point(1440, 900));
    fakeMap.getZoom.mockReturnValue(13);
    fakeMap.getCenter.mockReturnValue(L.latLng(47.5, 19.05));
});

describe("MapLimits", () => {
    it("floors the zoom where the whole country fits between the bars, and follows resizes both ways", () => {
        render(<MapLimits />);
        const desktopFloor = floorZoom({ x: 1440, y: 900 }, DESKTOP);
        expect(fakeMap.setMinZoom).toHaveBeenLastCalledWith(desktopFloor);
        expect(Number.isInteger(desktopFloor)).toBe(false);
        expect(fakeMap.setView).not.toHaveBeenCalled();

        // A phone in portrait: the floor goes down, not only up (Leaflet's getBoundsZoom would have kept it).
        fakeMap.getSize.mockReturnValue(point(412, 839));
        act(() => fakeMap.fire("resize"));
        const phoneFloor = floorZoom({ x: 412, y: 839 }, PHONE);
        expect(phoneFloor).toBeLessThan(desktopFloor);
        expect(fakeMap.setMinZoom).toHaveBeenLastCalledWith(phoneFloor);

        fakeMap.getSize.mockReturnValue(point(1440, 900));
        act(() => fakeMap.fire("resize"));
        expect(fakeMap.setMinZoom).toHaveBeenLastCalledWith(desktopFloor);
    });

    it("jumps to the floor without animation when the map starts further out, before the floor goes in", () => {
        fakeMap.getZoom.mockReturnValue(5);
        render(<MapLimits />);
        const floor = floorZoom({ x: 1440, y: 900 }, DESKTOP);
        expect(fakeMap.setView).toHaveBeenCalledWith(expect.anything(), floor, { animate: false });
        expect(fakeMap.setView.mock.invocationCallOrder[0]).toBeLessThan(
            fakeMap.setMinZoom.mock.invocationCallOrder[0]!,
        );
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(fakeMap.setZoom).not.toHaveBeenCalled();
    });

    it("corrects a restored view outside the wall without animation", () => {
        fakeMap.getCenter.mockReturnValue(L.latLng(50, 19));
        render(<MapLimits />);
        const inside = clampCenter([50, 19], 13, { x: 1440, y: 900 }, wall(13, DESKTOP));
        expect(fakeMap.setView).toHaveBeenCalledTimes(1);
        const [center, zoom, options] = fakeMap.setView.mock.calls[0] as [L.LatLng, number, object];
        expect(center.equals(inside)).toBe(true);
        expect(zoom).toBe(13);
        expect(options).toEqual({ animate: false });
    });

    it("walls the view in at the country's extent plus the bars' cover, again after every zoom", () => {
        fakeMap.getZoom.mockReturnValue(10);
        render(<MapLimits />);
        expect(fakeMap.setMaxBounds).toHaveBeenCalledTimes(1);
        expect(lastMaxBounds().equals(wall(10, DESKTOP))).toBe(true);

        fakeMap.getSize.mockReturnValue(point(412, 839));
        fakeMap.getZoom.mockReturnValue(12);
        act(() => fakeMap.fire("zoomend"));
        expect(fakeMap.setMaxBounds).toHaveBeenCalledTimes(2);
        expect(lastMaxBounds().equals(wall(12, PHONE))).toBe(true);
        expect(fakeMap.setView).not.toHaveBeenCalled();
    });

    it("clamps a zoom's target against the wall of the zoom it is going to, and lets go on unmount", () => {
        const original = fakeMap._limitCenter;
        const { unmount } = render(<MapLimits />);
        const limit = fakeMap._limitCenter as unknown as (
            center: L.LatLng,
            zoom: number,
            bounds?: LatLngBounds,
        ) => L.LatLng;
        expect(limit).not.toBe(original);

        const center = L.latLng(48.5, 21);
        const result = limit.call(fakeMap, center, 16, fakeMap.options.maxBounds);
        expect(result).toBe(center);
        const passed = original.mock.lastCall?.[2] as LatLngBounds;
        expect(passed.equals(wall(16, DESKTOP))).toBe(true);
        expect(passed.equals(fakeMap.options.maxBounds!)).toBe(false);

        // Other bounds (a fitBounds target) and no bounds pass through untouched.
        const other = L.latLngBounds([47, 19], [48, 20]);
        limit.call(fakeMap, center, 16, other);
        expect(original.mock.lastCall?.[2]).toBe(other);
        limit.call(fakeMap, center, 16, undefined);
        expect(original.mock.lastCall?.[2]).toBeUndefined();

        unmount();
        expect(fakeMap._limitCenter).toBe(original);
        expect(fakeMap.off).toHaveBeenCalledWith("resize", expect.any(Function));
        expect(fakeMap.off).toHaveBeenCalledWith("zoomend", expect.any(Function));
    });
});

describe("installZoomAwareWall", () => {
    it("reads the insets at clamp time", () => {
        const insets = vi.fn(() => PHONE);
        const undo = installZoomAwareWall(fakeMap as never, insets);
        fakeMap.options.maxBounds = wall(13, PHONE);
        const limit = fakeMap._limitCenter as unknown as (
            center: L.LatLng,
            zoom: number,
            bounds?: LatLngBounds,
        ) => L.LatLng;
        limit.call(fakeMap, L.latLng(47.5, 19), 14, fakeMap.options.maxBounds);
        expect(insets).toHaveBeenCalledTimes(1);
        undo();
    });
});
