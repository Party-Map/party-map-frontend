vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, fireEvent, render, screen } from "@testing-library/react";

import { place } from "@/test/fixtures";
import { fakeMap, leafletMock } from "@/test/mocks/leaflet";

import { ZoomControls } from "./ZoomControls";

const latLng = [place.location.latitude, place.location.longitude];

beforeEach(() => fakeMap.reset());

describe("ZoomControls", () => {
    it("zooms in and out around the current view", () => {
        render(<ZoomControls places={[place]} openPopupId={null} />);
        fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
        expect(fakeMap.setZoom).toHaveBeenCalledWith(14);
        fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
        expect(fakeMap.setZoom).toHaveBeenCalledWith(12);
        expect(fakeMap.setZoomAround).not.toHaveBeenCalled();
        expect(screen.queryByRole("button", { name: "Center selected" })).not.toBeInTheDocument();
    });

    it("keeps clicks and scrolling away from the map", () => {
        const { container } = render(<ZoomControls places={[place]} openPopupId={null} />);
        expect(leafletMock.default.DomEvent.disableClickPropagation).toHaveBeenCalledWith(container.firstElementChild);
        expect(leafletMock.default.DomEvent.disableScrollPropagation).toHaveBeenCalledWith(container.firstElementChild);
    });

    it("recenters on the selected place and anchors zooming to it until the map is dragged", () => {
        render(<ZoomControls places={[place]} openPopupId={place.id} />);
        const center = screen.getByRole("button", { name: "Center selected" });
        expect(center).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(center);
        expect(fakeMap.project).toHaveBeenCalledWith(latLng, 13);
        expect(fakeMap.unproject).toHaveBeenCalledWith(expect.objectContaining({ x: 400, y: 200 }), 13);
        expect(fakeMap.flyTo).toHaveBeenCalledWith({ lat: 47.5, lng: 19.05 }, 13, { duration: 0.6 });
        expect(center).toHaveAttribute("aria-pressed", "true");

        fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
        expect(fakeMap.setZoomAround).toHaveBeenCalledWith(latLng, 14);
        expect(fakeMap.setZoom).not.toHaveBeenCalled();

        act(() => {
            fakeMap.fire("dragstart");
        });
        expect(center).toHaveAttribute("aria-pressed", "false");
        fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
        expect(fakeMap.setZoom).toHaveBeenCalledWith(12);
    });

    it("stops listening for drags on unmount", () => {
        const { unmount } = render(<ZoomControls places={[place]} openPopupId={null} />);
        unmount();
        expect(fakeMap.off).toHaveBeenCalledWith("dragstart", expect.any(Function));
    });
});
