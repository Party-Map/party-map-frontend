import { act, renderHook } from "@testing-library/react";

import { DEFAULT_MAP_CENTER } from "@/lib/constants";

import { LocationProvider, useUserLocation } from "./LocationProvider";

type Success = (position: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (error: { code: number }) => void;

/** Installs a geolocation stub whose answer the test controls. */
function stubGeolocation(getCurrentPosition: (ok: Success, fail: Failure) => void) {
    const stub = { getCurrentPosition: vi.fn(getCurrentPosition) };
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: stub });
    return stub;
}

const renderLocation = () => renderHook(() => useUserLocation(), { wrapper: LocationProvider });

describe("LocationProvider", () => {
    afterEach(() => {
        Reflect.deleteProperty(navigator, "geolocation");
    });

    it("starts idle at the default centre and reports an unavailable API", () => {
        const { result } = renderLocation();
        expect(result.current.status).toBe("idle");
        expect(result.current.origin).toEqual(DEFAULT_MAP_CENTER);
        expect(result.current.isFallback).toBe(true);

        act(() => result.current.request());
        expect(result.current.status).toBe("unavailable");
        expect(result.current.origin).toEqual(DEFAULT_MAP_CENTER);
    });

    it("uses the position once granted and does not ask again", () => {
        const stub = stubGeolocation((ok) => ok({ coords: { latitude: 47.5, longitude: 19.1 } }));
        const { result } = renderLocation();

        act(() => result.current.request());
        expect(result.current.status).toBe("granted");
        expect(result.current.position).toEqual({ latitude: 47.5, longitude: 19.1 });
        expect(result.current.origin).toEqual({ latitude: 47.5, longitude: 19.1 });
        expect(result.current.isFallback).toBe(false);

        act(() => result.current.request());
        expect(stub.getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it("is locating while the browser answers and asks only once at a time", () => {
        let answer: Success | undefined;
        const stub = stubGeolocation((ok) => {
            answer = ok;
        });
        const { result } = renderLocation();

        act(() => result.current.request());
        act(() => result.current.request());
        expect(result.current.status).toBe("locating");
        expect(stub.getCurrentPosition).toHaveBeenCalledTimes(1);

        act(() => answer?.({ coords: { latitude: 1, longitude: 2 } }));
        expect(result.current.status).toBe("granted");
    });

    it("falls back to the default centre when denied or failing, and can be asked again", () => {
        const stub = stubGeolocation((_ok, fail) => fail({ code: 1 }));
        const { result } = renderLocation();

        act(() => result.current.request());
        expect(result.current.status).toBe("denied");
        expect(result.current.origin).toEqual(DEFAULT_MAP_CENTER);

        stub.getCurrentPosition.mockImplementation((_ok: Success, fail: Failure) => fail({ code: 2 }));
        act(() => result.current.request());
        expect(result.current.status).toBe("unavailable");
        expect(stub.getCurrentPosition).toHaveBeenCalledTimes(2);
    });

    it("keeps the request function stable", () => {
        const { result, rerender } = renderLocation();
        const { request } = result.current;
        rerender();
        expect(result.current.request).toBe(request);
    });
});

describe("useUserLocation", () => {
    it("throws outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => renderHook(() => useUserLocation())).toThrow(
            "useUserLocation must be used inside LocationProvider",
        );
    });
});
