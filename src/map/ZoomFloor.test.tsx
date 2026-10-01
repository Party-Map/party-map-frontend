vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));

import { act, render } from "@testing-library/react";

import { fakeMap } from "@/test/mocks/leaflet";

import { HUNGARY_BOUNDS, ZoomFloor } from "./ZoomFloor";

beforeEach(() => fakeMap.reset());

describe("ZoomFloor", () => {
    it("floors the zoom at the level where the whole country fits, and follows resizes", () => {
        fakeMap.getBoundsZoom.mockReturnValue(7);
        fakeMap.getZoom.mockReturnValue(13);
        render(<ZoomFloor />);
        expect(fakeMap.getBoundsZoom).toHaveBeenCalledWith(HUNGARY_BOUNDS, false);
        expect(fakeMap.setMinZoom).toHaveBeenCalledWith(7);
        expect(fakeMap.setZoom).not.toHaveBeenCalled();

        fakeMap.getBoundsZoom.mockReturnValue(8);
        act(() => fakeMap.fire("resize"));
        expect(fakeMap.setMinZoom).toHaveBeenLastCalledWith(8);
    });

    it("zooms in to the floor when the map starts further out", () => {
        fakeMap.getBoundsZoom.mockReturnValue(7);
        fakeMap.getZoom.mockReturnValue(5);
        render(<ZoomFloor />);
        expect(fakeMap.setZoom).toHaveBeenCalledWith(7);
    });

    it("stops listening on unmount", () => {
        const { unmount } = render(<ZoomFloor />);
        unmount();
        expect(fakeMap.off).toHaveBeenCalledWith("resize", expect.any(Function));
    });
});
