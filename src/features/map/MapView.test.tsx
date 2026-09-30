vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));
vi.mock("./pins", async (importOriginal) => {
    const actual = await importOriginal<typeof pinsModule>();
    return { ...actual, getPinIcon: vi.fn(actual.getPinIcon) };
});

import type { ComponentProps } from "react";
import type * as pinsModule from "./pins";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { place, place2, upcoming } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";
import { fakeMap, reactLeafletMock } from "@/test/mocks/leaflet";
import { MapView } from "./MapView";
import { getPinIcon } from "./pins";

import { TILE_URL } from "@/lib/constants";

async function renderView(overrides: Partial<ComponentProps<typeof MapView>> = {}) {
    const onOpenPlace = vi.fn();
    const onClosePopup = vi.fn();
    renderWithProviders(
        <MapView
            places={[place, place2]}
            upcomingMap={new Map([[place.id, upcoming]])}
            highlightIds={[]}
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

beforeEach(() => fakeMap.reset());

describe("MapView", () => {
    it("renders the tiles and a marker per place", async () => {
        await renderView();
        expect(screen.getByTestId("tile-layer")).toHaveAttribute("data-url", TILE_URL);
        expect(screen.getAllByTestId("marker")).toHaveLength(2);
        expect(marker(1)).toHaveAttribute(
            "data-position",
            JSON.stringify([place2.location.latitude, place2.location.longitude]),
        );
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
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

    it("shows the place itself when it has no upcoming event", async () => {
        await renderView({ openPopupId: place2.id });
        expect(screen.getByTestId("popup")).toHaveTextContent(place2.name);
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
});
