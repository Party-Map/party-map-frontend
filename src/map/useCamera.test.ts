vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { renderHook } from "@testing-library/react";
import L from "leaflet";

import { fakeMap } from "@/test/mocks/leaflet";

import { getCamera, useCamera } from "./useCamera";

const target = { center: L.latLng(47.6, 19.2), zoom: 13 };

beforeEach(() => fakeMap.reset());

describe("useCamera", () => {
    it("is one camera per map, the same from the hook", () => {
        const { result } = renderHook(() => useCamera());
        expect(result.current).toBe(getCamera(fakeMap as never));
        fakeMap.reset();
        expect(getCamera(fakeMap as never)).not.toBe(result.current);
    });

    it("pans at the same zoom, flies to another, and jumps when told not to animate", () => {
        const camera = getCamera(fakeMap as never);
        camera.move(target, { duration: 0.4 });
        expect(fakeMap._stop).toHaveBeenCalledTimes(1);
        expect(fakeMap.setZoom).not.toHaveBeenCalled();
        expect(fakeMap.panTo).toHaveBeenCalledWith(target.center, { animate: true, duration: 0.4 });
        expect(fakeMap.flyTo).not.toHaveBeenCalled();

        camera.move({ ...target, zoom: 15 }, { duration: 0.6 });
        expect(fakeMap.flyTo).toHaveBeenCalledWith(target.center, 15, { duration: 0.6 });

        camera.move({ ...target, zoom: 15 }, { animate: false });
        expect(fakeMap.setView).toHaveBeenCalledWith(target.center, 15, { animate: false });
        expect(fakeMap.panBy).not.toHaveBeenCalled();
    });

    it("is in flight from a move until its moveend, and a drag ends that too", () => {
        const camera = getCamera(fakeMap as never);
        expect(camera.inFlight()).toBe(false);
        camera.move(target);
        expect(camera.inFlight()).toBe(true);
        fakeMap.fire("movestart");
        expect(camera.userMoved()).toBe(false);
        fakeMap.fire("moveend");
        expect(camera.inFlight()).toBe(false);

        camera.move(target);
        fakeMap.fire("dragstart");
        expect(camera.inFlight()).toBe(false);
        expect(camera.userMoved()).toBe(true);
    });

    it("counts a move or zoom it did not start as the user's", () => {
        const camera = getCamera(fakeMap as never);
        expect(camera.userMoved()).toBe(false);
        fakeMap.fire("zoomstart");
        expect(camera.userMoved()).toBe(true);
        expect(getCamera(fakeMap as never).userMoved()).toBe(true);
    });

    it("waits for a running zoom animation before moving, keeping only the latest move", () => {
        const camera = getCamera(fakeMap as never);
        fakeMap.fire("zoomanim");
        camera.move(target);
        camera.move({ ...target, zoom: 15 });
        expect(fakeMap.panTo).not.toHaveBeenCalled();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(camera.inFlight()).toBe(false);

        fakeMap.fire("zoomend");
        expect(fakeMap.flyTo).toHaveBeenCalledTimes(1);
        expect(fakeMap.panTo).not.toHaveBeenCalled();
        expect(camera.inFlight()).toBe(true);

        fakeMap.fire("zoomend");
        expect(fakeMap.flyTo).toHaveBeenCalledTimes(1);
    });

    it("lets go of the map when it unloads", () => {
        const camera = getCamera(fakeMap as never);
        fakeMap.fire("unload");
        expect(fakeMap.off).toHaveBeenCalledWith("moveend", expect.any(Function));
        expect(getCamera(fakeMap as never)).not.toBe(camera);
    });
});
