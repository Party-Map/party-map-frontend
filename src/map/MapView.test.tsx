vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));
vi.mock("@maplibre/maplibre-gl-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.maplibreLeafletMock));
vi.mock("./pins", async (importOriginal) => {
    const actual = await importOriginal<typeof pinsModule>();
    return { ...actual, getPinIcon: vi.fn(actual.getPinIcon) };
});

import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import L from "leaflet";
import type { ComponentProps } from "react";

import { place, place2, upcoming } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";
import {
    fakeGlLayer,
    fakeMap,
    fakePopup,
    maplibreLeafletMock,
    popupPositions,
    reactLeafletMock,
} from "@/test/mocks/leaflet";

import { project, showTarget, unproject } from "./camera";
import { toLatLngTuple } from "./geo";
import { mapInsets } from "./insets";
import { MapView } from "./MapView";
import type * as pinsModule from "./pins";
import { getPinIcon } from "./pins";

const CARD = { left: -161, top: -288, right: 161, bottom: -68 };

async function renderView(overrides: Partial<ComponentProps<typeof MapView>> = {}) {
    const onOpenPlace = vi.fn();
    const onClosePopup = vi.fn();
    renderWithProviders(
        <MapView
            places={[place, place2]}
            upcomingMap={new Map([[place.id, upcoming]])}
            highlightIds={[]}
            generation={0}
            openPopupId={null}
            onOpenPlace={onOpenPlace}
            onClosePopup={onClosePopup}
            {...overrides}
        />,
    );
    // Let the mock auth client settle so its state update happens inside act.
    await act(async () => {});
    return { onOpenPlace, onClosePopup };
}

function marker(index: number): HTMLElement {
    const el = screen.getAllByTestId("marker")[index];
    if (!el) throw new Error(`no marker at ${index}`);
    return el;
}

beforeEach(() => {
    fakeMap.reset();
    fakeMap.getCenter.mockReturnValue(L.latLng(47.5, 19.05));
});

describe("MapView", () => {
    it("renders the basemap and a marker per place, walled in and with fractional zoom", async () => {
        await renderView();
        await waitFor(() => expect(fakeGlLayer.addTo).toHaveBeenCalledWith(fakeMap));
        expect(maplibreLeafletMock.maplibreGL).toHaveBeenCalledWith(expect.objectContaining({ interactive: false }));
        expect(screen.getAllByTestId("marker")).toHaveLength(2);
        // The view is walled in (MapLimits sets the bounds), so Hungary cannot be pushed off the screen; a pinch
        // ends where the fingers stop and cannot go past the floor.
        const map = screen.getByTestId("map");
        expect(map).toHaveAttribute("data-max-bounds-viscosity", "1");
        expect(map).toHaveAttribute("data-zoom-snap", "0");
        expect(map).toHaveAttribute("data-bounce-at-zoom-limits", "false");
        expect(fakeMap.setMaxBounds).toHaveBeenCalled();
        expect(marker(1)).toHaveAttribute(
            "data-position",
            JSON.stringify([place2.location.latitude, place2.location.longitude]),
        );
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
        // The probe is there in development builds (Vitest runs in one).
        expect(window.__pmMap).toBe(fakeMap);
    });

    it("opens a place when its marker is clicked", async () => {
        const { onOpenPlace } = await renderView();
        fireEvent.click(marker(1));
        expect(onOpenPlace).toHaveBeenCalledWith(place2.id);
    });

    it("shows the popup card for the open place and closes it from the card", async () => {
        const { onClosePopup } = await renderView({ openPopupId: place.id });
        const popup = screen.getByTestId("popup");
        expect(popup).toHaveTextContent(upcoming.title);
        fireEvent.click(within(popup).getByRole("button", { name: "Close popup" }));
        expect(onClosePopup).toHaveBeenCalledTimes(1);
    });

    it("measures the open card and moves only when it is cut off", async () => {
        await renderView({ openPopupId: place.id });
        expect(fakePopup.update).toHaveBeenCalledTimes(1);
        expect(fakeMap.panTo).not.toHaveBeenCalled();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it("pans a card that opens cut off into view, the least it takes", async () => {
        const pin = toLatLngTuple(place.location);
        const center = unproject(project(pin, 13).subtract(L.point(0, 350)), 13);
        fakeMap.getCenter.mockReturnValue(center);
        await renderView({ openPopupId: place.id });
        const size = fakeMap.getSize();
        const wanted = showTarget({ pin, card: CARD, center, zoom: 13, size, insets: mapInsets(size.x) });
        expect(fakeMap.panTo).toHaveBeenCalledTimes(1);
        const [target] = fakeMap.panTo.mock.calls[0] as [L.LatLng];
        expect(target.equals(wanted.center)).toBe(true);
    });

    it("shows the place itself when it has no upcoming event", async () => {
        await renderView({ openPopupId: place2.id });
        expect(screen.getByTestId("popup")).toHaveTextContent(place2.name);
    });

    it("keeps the popup position stable while the places are reloaded, so the card is not re-opened", async () => {
        const props = {
            upcomingMap: new Map(),
            highlightIds: [],
            generation: 0,
            openPopupId: place.id,
            onOpenPlace: vi.fn(),
            onClosePopup: vi.fn(),
        };
        renderWithProviders(<MapView places={[place, place2]} {...props} />).rerender(
            <MapView places={[{ ...place }, { ...place2 }]} {...props} />,
        );
        await act(async () => {});
        expect(popupPositions.length).toBeGreaterThanOrEqual(2);
        expect(popupPositions[0]).toEqual([place.location.latitude, place.location.longitude]);
        expect(popupPositions.every((position) => position === popupPositions[0])).toBe(true);
        expect(fakePopup.update).toHaveBeenCalledTimes(1);
    });

    it("renders no popup for an unknown id", async () => {
        await renderView({ openPopupId: "missing" });
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
    });

    it("closes the popup on a map background click", async () => {
        const { onClosePopup } = await renderView({ openPopupId: place.id });
        act(() => {
            reactLeafletMock.fireMapEvent("click");
        });
        expect(onClosePopup).toHaveBeenCalledTimes(1);
    });

    it("marks the open pin active and the searched pins highlighted", async () => {
        await renderView({ openPopupId: place.id, highlightIds: [place2.id] });
        expect(getPinIcon).toHaveBeenCalledWith({ isActive: true, isHighlighted: false });
        expect(getPinIcon).toHaveBeenCalledWith({ isActive: false, isHighlighted: true });
    });

    it("starts from the remembered view with its card, without moving", async () => {
        await renderView({
            openPopupId: place.id,
            initialView: { center: [47.4771, 19.0621], zoom: 15 },
            restored: { popupId: place.id, generation: 0 },
        });
        const map = screen.getByTestId("map");
        expect(map).toHaveAttribute("data-center", "[47.4771,19.0621]");
        expect(map).toHaveAttribute("data-zoom", "15");
        expect(screen.getByTestId("popup")).toHaveTextContent(upcoming.title);
        expect(fakeMap.panTo).not.toHaveBeenCalled();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });
});
