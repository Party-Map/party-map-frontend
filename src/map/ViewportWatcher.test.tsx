vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));

import { act, render } from "@testing-library/react";

import { fakeMap, reactLeafletMock } from "@/test/mocks/leaflet";

import { ViewportWatcher } from "./ViewportWatcher";

beforeEach(() => fakeMap.reset());

describe("ViewportWatcher", () => {
    it("reports the padded viewport on mount and after each move", () => {
        const onChange = vi.fn();
        render(<ViewportWatcher onChange={onChange} />);
        expect(onChange).toHaveBeenLastCalledWith("18.95,47.4,19.15,47.6");

        fakeMap.getBounds.mockReturnValue({
            getWest: () => 20.1,
            getSouth: () => 46.2,
            getEast: () => 20.2,
            getNorth: () => 46.3,
        });
        act(() => {
            reactLeafletMock.fireMapEvent("moveend");
        });
        expect(onChange).toHaveBeenLastCalledWith("20.05,46.15,20.25,46.35");
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("reports the centre and zoom for remembering the view", () => {
        const onViewChange = vi.fn();
        render(<ViewportWatcher onViewChange={onViewChange} />);
        expect(onViewChange).toHaveBeenLastCalledWith({ center: [47.5, 19.05], zoom: 13 });

        fakeMap.getCenter.mockReturnValue({ lat: 46.2, lng: 20.1 });
        fakeMap.getZoom.mockReturnValue(11);
        act(() => {
            reactLeafletMock.fireMapEvent("moveend");
        });
        expect(onViewChange).toHaveBeenLastCalledWith({ center: [46.2, 20.1], zoom: 11 });
        fakeMap.getCenter.mockReturnValue({ lat: 47.5, lng: 19.05 });
        fakeMap.getZoom.mockReturnValue(13);
    });
});
