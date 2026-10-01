import { act, screen, waitFor } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";
import { fakeGlLayer, fakeMap, leafletMock, reactLeafletMock } from "@/test/mocks/leaflet";

import { LocationMapPicker } from "./LocationMapPicker";

vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));
vi.mock("@maplibre/maplibre-gl-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.maplibreLeafletMock));

describe("LocationMapPicker", () => {
    beforeEach(() => fakeMap.reset());

    it("builds the marker from the bundled Leaflet images", () => {
        renderWithProviders(<LocationMapPicker value={null} onChange={() => {}} />);
        expect(leafletMock.default.icon).toHaveBeenCalledTimes(1);
        expect(leafletMock.default.icon).toHaveBeenCalledWith(
            expect.objectContaining({
                iconUrl: expect.stringContaining("marker-icon.png"),
                iconRetinaUrl: expect.stringContaining("marker-icon-2x.png"),
                shadowUrl: expect.stringContaining("marker-shadow.png"),
            }),
        );
    });

    it("shows the default centre on the basemap when there is no value", async () => {
        renderWithProviders(<LocationMapPicker value={null} onChange={() => {}} />);
        await waitFor(() => expect(fakeGlLayer.addTo).toHaveBeenCalledWith(fakeMap));
        expect(screen.getByTestId("marker")).toHaveAttribute("data-position", JSON.stringify([47.4979, 19.0402]));
        expect(fakeMap.setView).not.toHaveBeenCalled();
    });

    it("reports clicks as a geo point", () => {
        const onChange = vi.fn();
        renderWithProviders(<LocationMapPicker value={null} onChange={onChange} />);

        act(() => {
            reactLeafletMock.fireMapEvent("click", { latlng: { lat: 47.5, lng: 19.05 } });
        });
        expect(onChange).toHaveBeenCalledWith({ latitude: 47.5, longitude: 19.05 });
    });

    it("places the marker on the value and recenters when it changes", () => {
        const { rerender } = renderWithProviders(
            <LocationMapPicker value={{ latitude: 47.5, longitude: 19.05 }} onChange={() => {}} />,
        );
        expect(screen.getByTestId("marker")).toHaveAttribute("data-position", JSON.stringify([47.5, 19.05]));
        expect(fakeMap.setView).toHaveBeenCalledTimes(1);
        expect(fakeMap.setView).toHaveBeenLastCalledWith([47.5, 19.05], 13);

        rerender(<LocationMapPicker value={{ latitude: 47.6, longitude: 19.1 }} onChange={() => {}} />);
        expect(fakeMap.setView).toHaveBeenCalledTimes(2);
        expect(fakeMap.setView).toHaveBeenLastCalledWith([47.6, 19.1], 13);

        rerender(<LocationMapPicker value={{ latitude: 47.6, longitude: 19.1 }} onChange={() => {}} />);
        expect(fakeMap.setView).toHaveBeenCalledTimes(2);
    });
});
