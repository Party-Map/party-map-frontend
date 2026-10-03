vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { render } from "@testing-library/react";
import L from "leaflet";
import type { ComponentProps } from "react";

import { place, place2 } from "@/test/fixtures";
import { fakeMap, point } from "@/test/mocks/leaflet";

import { type AnchoredRect, type CameraTarget, fitTarget, project, showTarget, unproject } from "./camera";
import { CameraDirector, SEARCH_ZOOM } from "./CameraDirector";
import { toLatLngTuple } from "./geo";
import { mapInsets } from "./insets";

type Props = ComponentProps<typeof CameraDirector>;

const CARD: AnchoredRect = { left: -161, top: -288, right: 161, bottom: -68 };
const defaults: Props = {
    places: [place, place2],
    highlightIds: [],
    generation: 0,
    ready: true,
    openPopupId: null,
    openPlace: undefined,
    cardRect: null,
    restored: null,
};
const open = (of: typeof place, cardRect: AnchoredRect | null = CARD): Partial<Props> => ({
    openPopupId: of.id,
    openPlace: of,
    cardRect,
});

const view = () => {
    const size = fakeMap.getSize();
    return { center: fakeMap.getCenter(), zoom: fakeMap.getZoom(), size, insets: mapInsets(size.x) };
};
/** A centre that leaves the pin this many pixels below the viewport's centre at the current zoom. */
const centreAbove = (of: typeof place, pixels: number) =>
    unproject(project(toLatLngTuple(of.location), 13).subtract(L.point(0, pixels)), 13);

function expectMove(spy: typeof fakeMap.panTo, target: CameraTarget, options: object) {
    expect(spy).toHaveBeenCalledTimes(1);
    const args = spy.mock.calls[0] as unknown[];
    expect((args[0] as L.LatLng).equals(target.center)).toBe(true);
    if (spy === fakeMap.flyTo) expect(args[1]).toBe(target.zoom);
    expect(args[args.length - 1]).toEqual(options);
}

const renderDirector = (props: Partial<Props> = {}) => {
    const utils = render(<CameraDirector {...defaults} {...props} />);
    return { ...utils, rerender: (next: Partial<Props>) => utils.rerender(<CameraDirector {...defaults} {...next} />) };
};

beforeEach(() => {
    fakeMap.reset();
    fakeMap.getCenter.mockReturnValue(L.latLng(47.5, 19.05));
    fakeMap.getZoom.mockReturnValue(13);
});

describe("CameraDirector", () => {
    it("leaves a fresh map alone", () => {
        renderDirector();
        expect(fakeMap.panTo).not.toHaveBeenCalled();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(fakeMap.setView).not.toHaveBeenCalled();
    });

    it("does not move for a card that is already in view", () => {
        renderDirector(open(place));
        expect(fakeMap.panTo).not.toHaveBeenCalled();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it("pans the least that shows an opened card, once per opening, and never on a reload of the places", () => {
        fakeMap.getCenter.mockReturnValue(centreAbove(place, 350));
        const { rerender } = renderDirector(open(place));
        const wanted = showTarget({ ...view(), pin: toLatLngTuple(place.location), card: CARD });
        expect(wanted.moved).toBe(true);
        expectMove(fakeMap.panTo, wanted, { animate: true, duration: 0.35 });

        rerender({ ...open(place), places: [{ ...place }, { ...place2 }] });
        expect(fakeMap.panTo).toHaveBeenCalledTimes(1);

        rerender({});
        rerender(open(place));
        expect(fakeMap.panTo).toHaveBeenCalledTimes(2);
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it("waits until the card is measured", () => {
        fakeMap.getCenter.mockReturnValue(centreAbove(place, 350));
        const { rerender } = renderDirector(open(place, null));
        expect(fakeMap.panTo).not.toHaveBeenCalled();
        rerender(open(place));
        expect(fakeMap.panTo).toHaveBeenCalledTimes(1);
    });

    it("zooms in around a pin whose card the wall keeps out, in one flight", () => {
        const border = { ...place2, location: { latitude: 48.567, longitude: 21.45 } };
        fakeMap.getCenter.mockReturnValue(L.latLng(48.567, 21.45));
        renderDirector({ places: [border], ...open(border) });
        const wanted = showTarget({ ...view(), pin: [48.567, 21.45], card: CARD });
        expect(wanted.zoom).toBeGreaterThan(13);
        expectMove(fakeMap.flyTo, wanted, { duration: 0.35 });
        expect(fakeMap.panTo).not.toHaveBeenCalled();
    });

    it("flies to a search's single place, centred between the bars at the search zoom, once per search", () => {
        const { rerender } = renderDirector({ highlightIds: [place2.id], generation: 1 });
        const wanted = showTarget({
            ...view(),
            zoom: SEARCH_ZOOM,
            pin: toLatLngTuple(place2.location),
            card: null,
            mode: "center",
        });
        expectMove(fakeMap.flyTo, wanted, { duration: 0.6 });

        rerender({ highlightIds: [place2.id], generation: 1, places: [{ ...place }, { ...place2 }] });
        expect(fakeMap.flyTo).toHaveBeenCalledTimes(1);
        rerender({ highlightIds: [place2.id], generation: 2 });
        expect(fakeMap.flyTo).toHaveBeenCalledTimes(2);
    });

    it("moves a picked place the map already shows the least it takes, which is often not at all", () => {
        fakeMap.getZoom.mockReturnValue(SEARCH_ZOOM);
        // The pin a little below the centre, its card above it in full view.
        const pin = toLatLngTuple(place.location);
        fakeMap.getCenter.mockReturnValue(unproject(project(pin, SEARCH_ZOOM).subtract(L.point(0, 150)), SEARCH_ZOOM));
        fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 450));
        const { rerender } = renderDirector({ highlightIds: [place.id], generation: 1, ...open(place) });
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(fakeMap.panTo).not.toHaveBeenCalled();

        // The pin near the top of the screen, still between the bars, its card cut off: pulled in, not centred.
        fakeMap.getCenter.mockReturnValue(unproject(project(pin, SEARCH_ZOOM).add(L.point(0, 150)), SEARCH_ZOOM));
        fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 150));
        rerender({ highlightIds: [place.id], generation: 2, ...open(place) });
        const wanted = showTarget({ ...view(), pin, card: CARD, mode: "minimal" });
        expect(wanted.moved).toBe(true);
        expectMove(fakeMap.panTo, wanted, { animate: true, duration: 0.6 });
        fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 300));
    });

    it("flies to a picked place together with its card, in one move once the card is measured", () => {
        const { rerender } = renderDirector({ highlightIds: [place.id], generation: 1, ...open(place, null) });
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        rerender({ highlightIds: [place.id], generation: 1, ...open(place) });
        const wanted = showTarget({
            ...view(),
            zoom: SEARCH_ZOOM,
            pin: toLatLngTuple(place.location),
            card: CARD,
            mode: "center",
        });
        expectMove(fakeMap.flyTo, wanted, { duration: 0.6 });
        rerender({ highlightIds: [place.id], generation: 1, ...open(place), places: [{ ...place }] });
        expect(fakeMap.flyTo).toHaveBeenCalledTimes(1);
        expect(fakeMap.panTo).not.toHaveBeenCalled();
    });

    it("fits several highlighted places once all of them are known", () => {
        const { rerender } = renderDirector({ highlightIds: [place.id, place2.id], generation: 1, ready: false });
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        rerender({ highlightIds: [place.id, place2.id], generation: 1 });
        const { size, insets } = view();
        const wanted = fitTarget([toLatLngTuple(place.location), toLatLngTuple(place2.location)], size, insets);
        expectMove(fakeMap.flyTo, wanted, { duration: 0.8 });
    });

    it("leaves a restored view and its card where they were, until the user searches again", () => {
        fakeMap.getCenter.mockReturnValue(centreAbove(place2, 350));
        const { rerender } = renderDirector({
            restored: { popupId: place.id, generation: 3 },
            generation: 3,
            openPopupId: place.id,
            highlightIds: [place.id],
        });
        rerender({
            restored: { popupId: place.id, generation: 3 },
            generation: 3,
            highlightIds: [place.id],
            ...open(place),
        });
        expect(fakeMap.panTo).not.toHaveBeenCalled();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();

        // Another card opened by the user is shown as usual.
        rerender({
            restored: { popupId: place.id, generation: 3 },
            generation: 3,
            highlightIds: [place.id],
            ...open(place2),
        });
        expect(fakeMap.panTo).toHaveBeenCalledTimes(1);

        rerender({ restored: { popupId: place.id, generation: 4 }, generation: 4, highlightIds: [place2.id] });
        expect(fakeMap.flyTo).toHaveBeenCalledTimes(1);
    });

    it("counts a search whose places never load as handled, so a card opened later still shows", () => {
        fakeMap.getCenter.mockReturnValue(centreAbove(place, 350));
        const { rerender } = renderDirector({ highlightIds: ["missing"], generation: 1 });
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        rerender({ highlightIds: ["missing"], generation: 1, ...open(place) });
        expect(fakeMap.panTo).toHaveBeenCalledTimes(1);
    });

    it("keeps an opened card above an overlay floating over the bottom of the map", () => {
        const overlay = document.createElement("div");
        overlay.dataset.mapInset = "bottom";
        overlay.getBoundingClientRect = () => ({ top: 400 }) as DOMRect;
        document.body.appendChild(overlay);
        try {
            renderDirector(open(place));
            const { size, insets } = view();
            const extraBottom = size.y - insets.bottom - 400;
            const wanted = showTarget({ ...view(), pin: toLatLngTuple(place.location), card: CARD, extraBottom });
            expect(wanted.moved).toBe(true);
            expectMove(fakeMap.panTo, wanted, { animate: true, duration: 0.35 });
        } finally {
            overlay.remove();
        }
    });
});
