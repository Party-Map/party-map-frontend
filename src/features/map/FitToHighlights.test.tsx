vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { render } from "@testing-library/react";
import { place, place2 } from "@/test/fixtures";
import { fakeMap, leafletMock } from "@/test/mocks/leaflet";
import { FitToHighlights } from "./FitToHighlights";

beforeEach(() => fakeMap.reset());

describe("FitToHighlights", () => {
    it("does nothing without highlights or with unknown ids", () => {
        const { rerender } = render(<FitToHighlights places={[place, place2]} highlightIds={[]} />);
        rerender(<FitToHighlights places={[place, place2]} highlightIds={["missing"]} />);
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(fakeMap.flyToBounds).not.toHaveBeenCalled();
    });

    it("flies to a single highlighted place", () => {
        render(<FitToHighlights places={[place, place2]} highlightIds={[place2.id]} />);
        expect(fakeMap.flyTo).toHaveBeenCalledWith([place2.location.latitude, place2.location.longitude], 15, {
            duration: 0.6,
        });
        expect(fakeMap.flyToBounds).not.toHaveBeenCalled();
    });

    it("fits padded bounds around several highlighted places", () => {
        render(<FitToHighlights places={[place, place2]} highlightIds={[place.id, place2.id, "missing"]} />);
        expect(leafletMock.default.latLngBounds).toHaveBeenCalledWith([
            [place.location.latitude, place.location.longitude],
            [place2.location.latitude, place2.location.longitude],
        ]);
        expect(fakeMap.flyToBounds).toHaveBeenCalledWith(expect.objectContaining({ padded: true }), { duration: 0.8 });
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });
});
