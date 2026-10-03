vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));
vi.mock("./pins", async (importOriginal) => {
    const actual = await importOriginal<typeof pinsModule>();
    return { ...actual, getPinIcon: vi.fn(actual.getPinIcon) };
});

import { fireEvent, render, screen } from "@testing-library/react";

import { place, place2 } from "@/test/fixtures";
import { fakeMap } from "@/test/mocks/leaflet";

import type * as pinsModule from "./pins";
import { getPinIcon } from "./pins";
import { PlacePins } from "./PlacePins";

beforeEach(() => {
    fakeMap.reset();
    vi.mocked(getPinIcon).mockClear();
});

describe("PlacePins", () => {
    it("renders a pin per place at its position, active or highlighted as told, and opens it on a click", () => {
        const onOpen = vi.fn();
        render(
            <PlacePins places={[place, place2]} openPopupId={place.id} highlightIds={[place2.id]} onOpen={onOpen} />,
        );
        const markers = screen.getAllByTestId("marker");
        expect(markers).toHaveLength(2);
        expect(markers[1]).toHaveAttribute(
            "data-position",
            JSON.stringify([place2.location.latitude, place2.location.longitude]),
        );
        expect(getPinIcon).toHaveBeenCalledWith({ isActive: true, isHighlighted: false });
        expect(getPinIcon).toHaveBeenCalledWith({ isActive: false, isHighlighted: true });

        fireEvent.click(markers[1]!);
        expect(onOpen).toHaveBeenCalledWith(place2.id);
    });
});
