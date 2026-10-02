vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, render } from "@testing-library/react";

import { place, place2 } from "@/test/fixtures";
import { fakeMap, point } from "@/test/mocks/leaflet";

import { PanPopupMobile, PHONE_MAX_WIDTH } from "./PanPopupMobile";

function setViewportWidth(width: number) {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
}

/** Runs animation frames synchronously. */
function runFramesNow() {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
}

beforeEach(() => {
    fakeMap.reset();
    setViewportWidth(PHONE_MAX_WIDTH - 1);
});

afterEach(() => {
    setViewportWidth(1024);
    vi.unstubAllGlobals();
    fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 300));
});

describe("PanPopupMobile", () => {
    it("pans the open pin above the bottom bar on phones", () => {
        runFramesNow();
        render(<PanPopupMobile places={[place, place2]} openPopupId={place2.id} />);
        // pin at (400, 300) in an 800x600 map; wanted at (400, 600 - (76 + 48 + 12))
        expect(fakeMap.panBy).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: -164 }), {
            animate: true,
            duration: 0.35,
        });
    });

    it("does not pan again when the places are reloaded with the same coordinates", () => {
        runFramesNow();
        const { rerender } = render(<PanPopupMobile places={[place, place2]} openPopupId={place2.id} />);
        expect(fakeMap.panBy).toHaveBeenCalledTimes(1);

        rerender(<PanPopupMobile places={[{ ...place }, { ...place2 }]} openPopupId={place2.id} />);
        expect(fakeMap.panBy).toHaveBeenCalledTimes(1);

        rerender(<PanPopupMobile places={[place, place2]} openPopupId={place.id} />);
        expect(fakeMap.panBy).toHaveBeenCalledTimes(2);
    });

    it("pans again after a move that was not a drag leaves the card cut off", () => {
        runFramesNow();
        render(<PanPopupMobile places={[place]} openPopupId={place.id} />);
        expect(fakeMap.panBy).toHaveBeenCalledTimes(1);

        // A flight ends with the pin high up: the card would stick out under the top bar.
        fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 100));
        act(() => {
            fakeMap.fire("moveend");
        });
        expect(fakeMap.panBy).toHaveBeenCalledTimes(2);
        expect(fakeMap.panBy).toHaveBeenLastCalledWith(expect.objectContaining({ x: 0, y: -364 }), {
            animate: true,
            duration: 0.35,
        });

        // The pin lands inside the visible band: nothing to do.
        fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 400));
        act(() => {
            fakeMap.fire("moveend");
        });
        expect(fakeMap.panBy).toHaveBeenCalledTimes(2);
    });

    it("leaves the map where the user dragged it", () => {
        runFramesNow();
        render(<PanPopupMobile places={[place]} openPopupId={place.id} />);
        fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 100));
        act(() => {
            fakeMap.fire("dragstart");
            fakeMap.fire("moveend");
        });
        expect(fakeMap.panBy).toHaveBeenCalledTimes(1);

        // The drag flag covers one move only: the next programmatic move is handled again.
        act(() => {
            fakeMap.fire("moveend");
        });
        expect(fakeMap.panBy).toHaveBeenCalledTimes(2);
    });

    it("stops listening when the card closes", () => {
        runFramesNow();
        const { rerender } = render(<PanPopupMobile places={[place]} openPopupId={place.id} />);
        rerender(<PanPopupMobile places={[place]} openPopupId={null} />);
        expect(fakeMap.off).toHaveBeenCalledWith("dragstart", expect.any(Function));
        expect(fakeMap.off).toHaveBeenCalledWith("moveend", expect.any(Function));
        fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 100));
        act(() => {
            fakeMap.fire("moveend");
        });
        expect(fakeMap.panBy).toHaveBeenCalledTimes(1);
    });

    it("leaves the map alone on wider screens", () => {
        runFramesNow();
        setViewportWidth(PHONE_MAX_WIDTH);
        render(<PanPopupMobile places={[place]} openPopupId={place.id} />);
        expect(fakeMap.panBy).not.toHaveBeenCalled();
    });

    it("does nothing without an open popup or for an unknown place", () => {
        runFramesNow();
        const { rerender } = render(<PanPopupMobile places={[place]} openPopupId={null} />);
        rerender(<PanPopupMobile places={[place]} openPopupId="missing" />);
        expect(fakeMap.panBy).not.toHaveBeenCalled();
    });

    it("skips pans shorter than a few pixels", () => {
        runFramesNow();
        fakeMap.latLngToContainerPoint.mockReturnValue(point(402, 462));
        render(<PanPopupMobile places={[place]} openPopupId={place.id} />);
        expect(fakeMap.panBy).not.toHaveBeenCalled();
    });

    it("cancels a pending frame on unmount", () => {
        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn(() => 42),
        );
        const cancel = vi.fn();
        vi.stubGlobal("cancelAnimationFrame", cancel);
        const { unmount } = render(<PanPopupMobile places={[place]} openPopupId={place.id} />);
        unmount();
        expect(cancel).toHaveBeenCalledWith(42);
        expect(fakeMap.panBy).not.toHaveBeenCalled();
    });
});
