vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, render } from "@testing-library/react";

import { fakeMap, point } from "@/test/mocks/leaflet";

import { BOTTOM_INSET, TOP_INSET } from "./insets";
import { HUNGARY_BOUNDS, HUNGARY_EXTENT, MapLimits, paddedBounds } from "./MapLimits";

beforeEach(() => {
    fakeMap.reset();
    // A flat 100 px per degree projection at every zoom, so the padding can be checked in degrees.
    fakeMap.project.mockImplementation((latLng: unknown) => {
        const [lat, lng] = latLng as [number, number];
        return point(lng * 100, -lat * 100);
    });
    fakeMap.unproject.mockImplementation((p: unknown) => {
        const { x, y } = p as { x: number; y: number };
        return { lat: -y / 100, lng: x / 100 };
    });
});

describe("MapLimits", () => {
    it("floors the zoom at the level where the whole country fits between the bars, and follows resizes", () => {
        fakeMap.getSize.mockReturnValue(point(1440, 900));
        fakeMap.getBoundsZoom.mockReturnValue(7);
        fakeMap.getZoom.mockReturnValue(13);
        render(<MapLimits />);
        // Desktop width: only the top bar covers the map.
        expect(fakeMap.getBoundsZoom).toHaveBeenCalledWith(
            HUNGARY_BOUNDS,
            false,
            expect.objectContaining({ x: 0, y: TOP_INSET }),
        );
        expect(fakeMap.setMinZoom).toHaveBeenCalledWith(7);
        expect(fakeMap.setZoom).not.toHaveBeenCalled();

        fakeMap.getSize.mockReturnValue(point(390, 844));
        fakeMap.getBoundsZoom.mockReturnValue(6);
        act(() => fakeMap.fire("resize"));
        expect(fakeMap.getBoundsZoom).toHaveBeenLastCalledWith(
            HUNGARY_BOUNDS,
            false,
            expect.objectContaining({ x: 0, y: TOP_INSET + BOTTOM_INSET }),
        );
        expect(fakeMap.setMinZoom).toHaveBeenLastCalledWith(6);
    });

    it("zooms in to the floor when the map starts further out", () => {
        fakeMap.getBoundsZoom.mockReturnValue(7);
        fakeMap.getZoom.mockReturnValue(5);
        render(<MapLimits />);
        expect(fakeMap.setZoom).toHaveBeenCalledWith(7);
    });

    it("walls the view in at the country's extent plus the bars' cover, again after every zoom", () => {
        fakeMap.getSize.mockReturnValue(point(1440, 900));
        fakeMap.getZoom.mockReturnValue(10);
        render(<MapLimits />);
        expect(fakeMap.setMaxBounds).toHaveBeenCalledTimes(1);
        const bounds = fakeMap.setMaxBounds.mock.calls[0]?.[0] as { coords: [unknown, unknown] };
        const { south, west, north, east } = HUNGARY_EXTENT;
        expect(bounds.coords).toEqual([
            { lat: expect.closeTo(north + TOP_INSET / 100, 6), lng: west },
            { lat: expect.closeTo(south, 6), lng: east },
        ]);
        expect(fakeMap.project).toHaveBeenCalledWith([north, west], 10);

        fakeMap.getSize.mockReturnValue(point(390, 844));
        fakeMap.getZoom.mockReturnValue(12);
        act(() => fakeMap.fire("zoomend"));
        expect(fakeMap.setMaxBounds).toHaveBeenCalledTimes(2);
        const phone = fakeMap.setMaxBounds.mock.calls[1]?.[0] as { coords: [unknown, unknown] };
        expect(phone.coords).toEqual([
            { lat: expect.closeTo(north + TOP_INSET / 100, 6), lng: west },
            { lat: expect.closeTo(south - BOTTOM_INSET / 100, 6), lng: east },
        ]);
        expect(fakeMap.unproject).toHaveBeenLastCalledWith(expect.anything(), 12);
    });

    it("stops listening on unmount", () => {
        const { unmount } = render(<MapLimits />);
        unmount();
        expect(fakeMap.off).toHaveBeenCalledWith("resize", expect.any(Function));
        expect(fakeMap.off).toHaveBeenCalledWith("zoomend", expect.any(Function));
    });
});

describe("paddedBounds", () => {
    it("grows the box by the given pixels north and south only", () => {
        fakeMap.getZoom.mockReturnValue(9);
        const bounds = paddedBounds(fakeMap as never, 50, 25) as unknown as { coords: [unknown, unknown] };
        const { south, west, north, east } = HUNGARY_EXTENT;
        expect(bounds.coords).toEqual([
            { lat: expect.closeTo(north + 0.5, 6), lng: west },
            { lat: expect.closeTo(south - 0.25, 6), lng: east },
        ]);
    });
});
