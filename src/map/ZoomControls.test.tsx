vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, fireEvent, render, screen } from "@testing-library/react";
import type L from "leaflet";

import { place } from "@/test/fixtures";
import { fakeMap, leafletMock } from "@/test/mocks/leaflet";

import { showTarget } from "./camera";
import { mapInsets } from "./insets";
import { ZoomControls } from "./ZoomControls";

const latLng = [place.location.latitude, place.location.longitude];

beforeEach(() => fakeMap.reset());

describe("ZoomControls", () => {
    it("zooms in and out around the current view", () => {
        render(<ZoomControls places={[place]} openPopupId={null} cardRect={null} />);
        fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
        expect(fakeMap.setZoom).toHaveBeenCalledWith(14);
        fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
        expect(fakeMap.setZoom).toHaveBeenCalledWith(12);
        expect(fakeMap.setZoomAround).not.toHaveBeenCalled();
        expect(screen.queryByRole("button", { name: "Center selected" })).not.toBeInTheDocument();
    });

    it("keeps clicks and scrolling away from the map", () => {
        const { container } = render(<ZoomControls places={[place]} openPopupId={null} cardRect={null} />);
        expect(leafletMock.default.DomEvent.disableClickPropagation).toHaveBeenCalledWith(container.firstElementChild);
        expect(leafletMock.default.DomEvent.disableScrollPropagation).toHaveBeenCalledWith(container.firstElementChild);
    });

    it("recenters the selected place with its card between the bars and anchors zooming to it until dragged", () => {
        const cardRect = { left: -161, top: -288, right: 161, bottom: -68 };
        render(<ZoomControls places={[place]} openPopupId={place.id} cardRect={cardRect} />);
        const center = screen.getByRole("button", { name: "Center selected" });
        expect(center).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(center);
        const size = fakeMap.getSize();
        const wanted = showTarget({
            pin: latLng as [number, number],
            card: cardRect,
            center: fakeMap.getCenter(),
            zoom: 13,
            size,
            insets: mapInsets(size.x),
            mode: "center",
        });
        expect(fakeMap.panTo).toHaveBeenCalledTimes(1);
        const [target, options] = fakeMap.panTo.mock.calls[0] as [L.LatLng, object];
        expect(target.equals(wanted.center)).toBe(true);
        expect(options).toEqual({ animate: true, duration: 0.6 });
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
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
        const { unmount } = render(<ZoomControls places={[place]} openPopupId={null} cardRect={null} />);
        unmount();
        expect(fakeMap.off).toHaveBeenCalledWith("dragstart", expect.any(Function));
    });
});
