vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, render, screen } from "@testing-library/react";
import { fakeMap } from "@/test/mocks/leaflet";
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

beforeEach(() => fakeMap.reset());
afterEach(() => {
    Reflect.deleteProperty(navigator, "geolocation");
    fakeMap.getZoom.mockReturnValue(13);
});

describe("UserLocation", () => {
    it("renders nothing without geolocation support", () => {
        render(<UserLocation auto />);
        expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
    });

    it("does not ask for the position unless auto", () => {
        const { geolocation } = installGeolocation();
        render(<UserLocation auto={false} />);
        expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
        expect(geolocation.watchPosition).not.toHaveBeenCalled();
    });

    it("flies to the first fix and shows the marker with its accuracy circle", () => {
        const { geolocation, callbacks } = installGeolocation();
        render(<UserLocation auto />);
        expect(geolocation.getCurrentPosition).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function),
            expect.objectContaining({ enableHighAccuracy: true }),
        );
        expect(screen.queryByTestId("marker")).not.toBeInTheDocument();

        act(() => callbacks.current?.(positionAt(47.5, 19.05, 50)));
        expect(fakeMap.flyTo).toHaveBeenCalledWith([47.5, 19.05], 14, { duration: 0.8 });
        expect(screen.getByTestId("marker")).toHaveAttribute("data-position", "[47.5,19.05]");
        expect(screen.getByTestId("circle")).toHaveAttribute("data-radius", "50");
    });

    it("keeps the current zoom when already closer than the minimum", () => {
        fakeMap.getZoom.mockReturnValue(16);
        const { callbacks } = installGeolocation();
        render(<UserLocation auto />);
        act(() => callbacks.current?.(positionAt(47.5, 19.05, 50)));
        expect(fakeMap.flyTo).toHaveBeenCalledWith([47.5, 19.05], 16, { duration: 0.8 });
    });

    it("caps the accuracy circle and omits it when accuracy is unknown", () => {
        const { callbacks } = installGeolocation();
        render(<UserLocation auto />);
        act(() => callbacks.watch?.(positionAt(47.5, 19.05, 5000)));
        expect(screen.getByTestId("circle")).toHaveAttribute("data-radius", String(MAX_ACCURACY_RADIUS_M));
        act(() => callbacks.watch?.(positionAt(47.5, 19.05, 0)));
        expect(screen.queryByTestId("circle")).not.toBeInTheDocument();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it("follows position updates and stops watching on unmount", () => {
        const { geolocation, callbacks } = installGeolocation();
        const { unmount } = render(<UserLocation auto />);
        act(() => callbacks.current?.(positionAt(47.5, 19.05, 20)));
        act(() => callbacks.watch?.(positionAt(48, 20, 10)));
        expect(screen.getByTestId("marker")).toHaveAttribute("data-position", "[48,20]");
        unmount();
        expect(geolocation.clearWatch).toHaveBeenCalledWith(7);
    });
});
