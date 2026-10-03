vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, render, screen } from "@testing-library/react";
import type L from "leaflet";

import { fakeMap } from "@/test/mocks/leaflet";

import { showTarget } from "./camera";
import { mapInsets } from "./insets";
import { MAX_ACCURACY_RADIUS_M, UserLocation } from "./UserLocation";

type SuccessCallback = (position: GeolocationPosition) => void;

function positionAt(latitude: number, longitude: number, accuracy: number): GeolocationPosition {
    const coords = {
        latitude,
        longitude,
        accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
    };
    return { coords, timestamp: 0, toJSON: () => ({}) };
}

function installGeolocation() {
    const callbacks: { current?: SuccessCallback; watch?: SuccessCallback } = {};
    const geolocation = {
        getCurrentPosition: vi.fn((success: SuccessCallback) => {
            callbacks.current = success;
        }),
        watchPosition: vi.fn((success: SuccessCallback) => {
            callbacks.watch = success;
            return 7;
        }),
        clearWatch: vi.fn(),
    };
    Object.defineProperty(navigator, "geolocation", { value: geolocation, configurable: true });
    return { geolocation, callbacks };
}

/** Where the camera is expected to fly for a fix: the dot centred between the bars at the given zoom. */
function flightFor(latitude: number, longitude: number, zoom: number) {
    const size = fakeMap.getSize();
    return showTarget({
        pin: [latitude, longitude],
        card: null,
        center: fakeMap.getCenter(),
        zoom,
        size,
        insets: mapInsets(size.x),
        mode: "center",
    });
}

const flewTo = (target: { center: L.LatLng; zoom: number }) => {
    expect(fakeMap.flyTo).toHaveBeenCalledTimes(1);
    const [center, zoom, options] = fakeMap.flyTo.mock.calls[0] as [L.LatLng, number, object];
    expect(center.equals(target.center)).toBe(true);
    expect(zoom).toBe(target.zoom);
    expect(options).toEqual({ duration: 0.8 });
};

beforeEach(() => fakeMap.reset());
afterEach(() => {
    Reflect.deleteProperty(navigator, "geolocation");
    fakeMap.getZoom.mockReturnValue(13);
});

describe("UserLocation", () => {
    it("renders nothing without geolocation support", () => {
        render(<UserLocation auto cardOpen={false} />);
        expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
    });

    it("shows the marker without flying to it unless auto", () => {
        const { callbacks } = installGeolocation();
        render(<UserLocation auto={false} cardOpen={false} />);
        act(() => callbacks.current?.(positionAt(47.5, 19.05, 50)));
        expect(screen.getByTestId("marker")).toHaveAttribute("data-position", "[47.5,19.05]");
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it("flies to the first fix, centred between the bars, and shows the marker with its accuracy circle", () => {
        const { geolocation, callbacks } = installGeolocation();
        render(<UserLocation auto cardOpen={false} />);
        expect(geolocation.getCurrentPosition).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function),
            expect.objectContaining({ enableHighAccuracy: true }),
        );
        expect(screen.queryByTestId("marker")).not.toBeInTheDocument();

        act(() => callbacks.current?.(positionAt(47.52, 19.08, 50)));
        flewTo(flightFor(47.52, 19.08, 14));
        expect(fakeMap.panBy).not.toHaveBeenCalled();
        expect(screen.getByTestId("marker")).toHaveAttribute("data-position", "[47.52,19.08]");
        expect(screen.getByTestId("circle")).toHaveAttribute("data-radius", "50");
    });

    it("keeps the current zoom when already closer than the minimum, which makes it a pan", () => {
        fakeMap.getZoom.mockReturnValue(16);
        const { callbacks } = installGeolocation();
        render(<UserLocation auto cardOpen={false} />);
        act(() => callbacks.current?.(positionAt(47.52, 19.08, 50)));
        const wanted = flightFor(47.52, 19.08, 16);
        expect(fakeMap.panTo).toHaveBeenCalledTimes(1);
        const [center, options] = fakeMap.panTo.mock.calls[0] as [L.LatLng, object];
        expect(center.equals(wanted.center)).toBe(true);
        expect(options).toEqual({ animate: true, duration: 0.8 });
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it("stays put when a card is open by the time the fix arrives, and when auto was turned off meanwhile", () => {
        const { callbacks } = installGeolocation();
        const { rerender, unmount } = render(<UserLocation auto cardOpen={false} />);
        rerender(<UserLocation auto cardOpen />);
        act(() => callbacks.current?.(positionAt(47.52, 19.08, 50)));
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(screen.getByTestId("marker")).toBeInTheDocument();
        unmount();

        fakeMap.reset();
        const again = installGeolocation();
        const second = render(<UserLocation auto cardOpen={false} />);
        second.rerender(<UserLocation auto={false} cardOpen={false} />);
        act(() => again.callbacks.current?.(positionAt(47.52, 19.08, 50)));
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(again.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it("stays put once the user has moved the map, and for a fix outside the country", () => {
        const { callbacks } = installGeolocation();
        const { unmount } = render(<UserLocation auto cardOpen={false} />);
        act(() => fakeMap.fire("dragstart"));
        act(() => callbacks.current?.(positionAt(47.52, 19.08, 50)));
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        unmount();

        fakeMap.reset();
        const abroad = installGeolocation();
        render(<UserLocation auto cardOpen={false} />);
        act(() => abroad.callbacks.current?.(positionAt(50.07, 19.94, 50)));
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(screen.getByTestId("marker")).toHaveAttribute("data-position", "[50.07,19.94]");
    });

    it("caps the accuracy circle and omits it when accuracy is unknown", () => {
        const { callbacks } = installGeolocation();
        render(<UserLocation auto cardOpen={false} />);
        act(() => callbacks.watch?.(positionAt(47.5, 19.05, 5000)));
        expect(screen.getByTestId("circle")).toHaveAttribute("data-radius", String(MAX_ACCURACY_RADIUS_M));
        act(() => callbacks.watch?.(positionAt(47.5, 19.05, 0)));
        expect(screen.queryByTestId("circle")).not.toBeInTheDocument();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it("follows position updates and stops watching on unmount", () => {
        const { geolocation, callbacks } = installGeolocation();
        const { unmount } = render(<UserLocation auto cardOpen={false} />);
        act(() => callbacks.current?.(positionAt(47.5, 19.05, 20)));
        act(() => callbacks.watch?.(positionAt(48, 20, 10)));
        expect(screen.getByTestId("marker")).toHaveAttribute("data-position", "[48,20]");
        unmount();
        expect(geolocation.clearWatch).toHaveBeenCalledWith(7);
    });
});
