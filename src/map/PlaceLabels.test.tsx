vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, fireEvent, render, screen } from "@testing-library/react";
import L from "leaflet";
import type { ComponentProps } from "react";

import { place, place2, upcoming } from "@/test/fixtures";
import { fakeMap, point } from "@/test/mocks/leaflet";

import { computeLabelOpacity, getPopupRect, isInsideRect, LABEL_PANE, PlaceLabels } from "./PlaceLabels";

const CENTRE = point(400, 300);

function renderLabels(overrides: Partial<ComponentProps<typeof PlaceLabels>> = {}) {
    const onOpen = vi.fn();
    const view = render(
        <PlaceLabels
            places={[place, place2]}
            upcomingMap={new Map([[place.id, upcoming]])}
            highlightIds={[]}
            openPopupId={null}
            onOpen={onOpen}
            {...overrides}
        />,
    );
    return { ...view, onOpen };
}

function labelOf(text: string): HTMLElement {
    const label = screen.getByText(text).closest(".label");
    if (!(label instanceof HTMLElement)) throw new Error(`no label around "${text}"`);
    return label;
}

/** The Leaflet marker carrying the label; its opacity is what Leaflet applies to the icon element. */
function markerOf(text: string): HTMLElement {
    const marker = screen.getByText(text).closest("[data-testid='label-marker']");
    if (!(marker instanceof HTMLElement)) throw new Error(`no label marker around "${text}"`);
    return marker;
}

const opacityOf = (text: string) => markerOf(text).dataset.opacity;

beforeEach(() => {
    fakeMap.reset();
    vi.mocked(L.divIcon).mockClear();
    vi.mocked(L.DomEvent.disableClickPropagation).mockClear();
    fakeMap.getZoom.mockReturnValue(13);
    fakeMap.latLngToContainerPoint.mockReturnValue(CENTRE);
});

describe("computeLabelOpacity", () => {
    it("keeps highlighted labels fully visible", () => {
        expect(computeLabelOpacity({ isHighlighted: true, hasSelection: true, distance: 500, maxDistance: 100 })).toBe(
            1,
        );
    });

    it("dims other labels while something is selected", () => {
        expect(computeLabelOpacity({ isHighlighted: false, hasSelection: true, distance: 0, maxDistance: 100 })).toBe(
            0.06,
        );
    });

    it("fades with the distance from the centre, clamped to [0.15, 1]", () => {
        expect(computeLabelOpacity({ isHighlighted: false, hasSelection: false, distance: 0, maxDistance: 100 })).toBe(
            1,
        );
        expect(computeLabelOpacity({ isHighlighted: false, hasSelection: false, distance: 50, maxDistance: 100 })).toBe(
            0.5,
        );
        expect(
            computeLabelOpacity({ isHighlighted: false, hasSelection: false, distance: 200, maxDistance: 100 }),
        ).toBe(0.15);
    });
});

describe("getPopupRect / isInsideRect", () => {
    it("spans a generous card above the pin until the card is measured", () => {
        const rect = getPopupRect({ x: 400, y: 300 });
        expect(rect).toEqual({ left: 240, right: 560, top: 10, bottom: 310 });
        expect(isInsideRect({ x: 400, y: 100 }, rect)).toBe(true);
        expect(isInsideRect({ x: 240, y: 310 }, rect)).toBe(true);
        expect(isInsideRect({ x: 239, y: 200 }, rect)).toBe(false);
        expect(isInsideRect({ x: 400, y: 311 }, rect)).toBe(false);
    });

    it("takes the measured card's box, still reaching a little below the pin", () => {
        const rect = getPopupRect({ x: 400, y: 300 }, { left: -161, top: -288, right: 161, bottom: -68 });
        expect(rect).toEqual({ left: 239, right: 561, top: 12, bottom: 310 });
    });
});

describe("PlaceLabels", () => {
    it("renders each label as a marker in the labels pane, lifted above its pin", () => {
        renderLabels();
        expect(fakeMap.createPane).toHaveBeenCalledWith(LABEL_PANE);

        const markers = screen.getAllByTestId("label-marker");
        expect(markers).toHaveLength(2);
        expect(markerOf(upcoming.title)).toHaveAttribute(
            "data-position",
            JSON.stringify([place.location.latitude, place.location.longitude]),
        );
        expect(opacityOf(upcoming.title)).toBe("1");
        expect(labelOf(upcoming.title).style.transform).toBe("translate(-50%, -76px)");
        expect(screen.getByText("Techno")).toBeInTheDocument();
        expect(screen.getByText(place.name)).toBeInTheDocument();
        expect(labelOf(place2.name)).toBeInTheDocument();

        // The icon is an empty div the label content is portalled into, and clicks inside never reach the map.
        const [options] = vi.mocked(L.divIcon).mock.calls[0] ?? [];
        expect(options).toMatchObject({ className: "pm-label-marker", iconSize: [0, 0] });
        expect(options?.html).toBeInstanceOf(HTMLDivElement);
        expect(L.DomEvent.disableClickPropagation).toHaveBeenCalledWith(options?.html);
    });

    it("reuses the labels pane when the map already has one", () => {
        fakeMap.createPane(LABEL_PANE);
        fakeMap.createPane.mockClear();
        renderLabels();
        expect(fakeMap.getPane).toHaveBeenCalledWith(LABEL_PANE);
        expect(fakeMap.createPane).not.toHaveBeenCalled();
    });

    it("keeps the icon and position of a label across re-renders with the same coordinates", () => {
        const { rerender } = renderLabels();
        expect(L.divIcon).toHaveBeenCalledTimes(2);
        rerender(
            <PlaceLabels
                places={[{ ...place }, { ...place2 }]}
                upcomingMap={new Map()}
                highlightIds={[]}
                openPopupId={null}
                onOpen={vi.fn()}
            />,
        );
        expect(L.divIcon).toHaveBeenCalledTimes(2);
        expect(screen.getAllByTestId("label-marker")).toHaveLength(2);
    });

    it("fades labels away from the viewport centre", () => {
        fakeMap.latLngToContainerPoint.mockReturnValue(point(40, 30));
        renderLabels();
        // distance 450 of a 540 fade extent
        expect(Number(opacityOf(place2.name))).toBeCloseTo(0.17, 2);
    });

    it("hides all labels below the minimum zoom, lower when places are highlighted", () => {
        fakeMap.getZoom.mockReturnValue(12);
        const { rerender } = renderLabels();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();

        rerender(
            <PlaceLabels
                places={[place, place2]}
                upcomingMap={new Map()}
                highlightIds={[place.id]}
                openPopupId={null}
                onOpen={vi.fn()}
            />,
        );
        expect(screen.getAllByRole("button")).toHaveLength(2);

        fakeMap.getZoom.mockReturnValue(10);
        rerender(
            <PlaceLabels
                places={[place, place2]}
                upcomingMap={new Map()}
                highlightIds={[place.id]}
                openPopupId={null}
                onOpen={vi.fn()}
            />,
        );
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("lifts highlighted labels and dims the rest", () => {
        renderLabels({ highlightIds: [place.id] });
        expect(labelOf(upcoming.title).style.transform).toBe("translate(-50%, -84px)");
        expect(opacityOf(upcoming.title)).toBe("1");
        expect(opacityOf(place2.name)).toBe("0.06");
    });

    it("hides the active label and the labels under the popup card without unmounting them", () => {
        renderLabels({ openPopupId: place.id });
        const active = labelOf(upcoming.title);
        expect(opacityOf(upcoming.title)).toBe("0");
        expect(active.style.transform).toBe("translate(-50%, -118px) scale(0.6)");
        expect(active).toHaveAttribute("aria-hidden", "true");
        expect(active).toHaveClass("active", "hidden");
        // place2 projects to the same point, inside the popup rectangle: faded out, so it can fade back in later.
        const covered = labelOf(place2.name);
        expect(opacityOf(place2.name)).toBe("0");
        expect(covered).toHaveClass("hidden");
        expect(covered).not.toHaveClass("active");
        expect(screen.getAllByRole("button", { hidden: true }).every((b) => b.hasAttribute("disabled"))).toBe(true);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("keeps labels outside the popup rectangle, dimmed", () => {
        fakeMap.latLngToContainerPoint
            .mockReturnValueOnce(CENTRE) // popup anchor
            .mockReturnValueOnce(CENTRE) // place (active)
            .mockReturnValueOnce(point(700, 300)); // place2, right of the card
        renderLabels({ openPopupId: place.id });
        expect(opacityOf(place2.name)).toBe("0.06");
        expect(labelOf(place2.name)).not.toHaveClass("hidden");
    });

    it("hides only what the measured card really covers", () => {
        const beside = () =>
            fakeMap.latLngToContainerPoint
                .mockReturnValueOnce(CENTRE) // popup anchor
                .mockReturnValueOnce(CENTRE) // place (active)
                .mockReturnValueOnce(point(470, 200)); // place2: under a guessed card, beside a narrow measured one
        beside();
        const { unmount } = renderLabels({ openPopupId: place.id });
        expect(labelOf(place2.name)).toHaveClass("hidden");
        unmount();

        beside();
        renderLabels({ openPopupId: place.id, cardRect: { left: -50, top: -200, right: 50, bottom: -68 } });
        expect(labelOf(place2.name)).not.toHaveClass("hidden");
        expect(opacityOf(place2.name)).toBe("0.06");
    });

    it("shows every label when the open id is unknown", () => {
        renderLabels({ openPopupId: "missing" });
        expect(screen.getAllByRole("button")).toHaveLength(2);
        expect(opacityOf(place2.name)).toBe("0.06");
    });

    it("opens a place from its label", () => {
        const { onOpen } = renderLabels();
        fireEvent.click(screen.getByRole("button", { name: new RegExp(place2.name) }));
        expect(onOpen).toHaveBeenCalledWith(place2.id);
    });

    it("leaves the labels alone while the map moves and works the opacities out once it settles", () => {
        renderLabels();
        expect(fakeMap.on).not.toHaveBeenCalledWith("move", expect.any(Function));
        expect(fakeMap.on).not.toHaveBeenCalledWith("zoom", expect.any(Function));

        fakeMap.latLngToContainerPoint.mockReturnValue(point(40, 30));
        act(() => {
            fakeMap.fire("move");
        });
        expect(opacityOf(place2.name)).toBe("1");

        act(() => {
            fakeMap.fire("moveend");
        });
        expect(Number(opacityOf(place2.name))).toBeCloseTo(0.17, 2);

        fakeMap.latLngToContainerPoint.mockReturnValue(CENTRE);
        act(() => {
            fakeMap.fire("zoomend");
        });
        expect(opacityOf(place2.name)).toBe("1");
    });

    it("unsubscribes from the map on unmount", () => {
        const { unmount } = renderLabels();
        unmount();
        expect(fakeMap.off).toHaveBeenCalledTimes(3);
        expect(fakeMap.off).toHaveBeenCalledWith("moveend", expect.any(Function));
        expect(fakeMap.off).toHaveBeenCalledWith("zoomend", expect.any(Function));
        expect(fakeMap.off).toHaveBeenCalledWith("resize", expect.any(Function));
    });
});
