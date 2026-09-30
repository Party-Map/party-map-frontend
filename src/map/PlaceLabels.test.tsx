vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";

import { place, place2, upcoming } from "@/test/fixtures";
import { fakeMap, point } from "@/test/mocks/leaflet";

import { computeLabelOpacity, getPopupRect, isInsideRect, PlaceLabels } from "./PlaceLabels";

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

beforeEach(() => {
    fakeMap.reset();
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
    it("spans the card above the pin", () => {
        const rect = getPopupRect({ x: 400, y: 300 });
        expect(rect).toEqual({ left: 260, right: 540, top: 70, bottom: 310 });
        expect(isInsideRect({ x: 400, y: 100 }, rect)).toBe(true);
        expect(isInsideRect({ x: 260, y: 310 }, rect)).toBe(true);
        expect(isInsideRect({ x: 259, y: 200 }, rect)).toBe(false);
        expect(isInsideRect({ x: 400, y: 311 }, rect)).toBe(false);
    });
});

describe("PlaceLabels", () => {
    it("renders event labels and plain place labels at the projected point", () => {
        renderLabels();
        const eventLabel = labelOf(upcoming.title);
        expect(eventLabel.style.left).toBe("400px");
        expect(eventLabel.style.top).toBe("300px");
        expect(eventLabel.style.transform).toBe("translate(-50%, -76px)");
        expect(eventLabel.style.opacity).toBe("1");
        expect(eventLabel).toHaveClass("settled");
        expect(screen.getByText("Techno")).toBeInTheDocument();
        expect(screen.getByText(place.name)).toBeInTheDocument();
        expect(labelOf(place2.name)).toBeInTheDocument();
    });

    it("fades labels away from the viewport centre", () => {
        fakeMap.latLngToContainerPoint.mockReturnValue(point(40, 30));
        renderLabels();
        // distance 450 of a 540 fade extent
        expect(Number(labelOf(place2.name).style.opacity)).toBeCloseTo(0.17, 2);
    });

    it("skips labels far outside the viewport", () => {
        fakeMap.latLngToContainerPoint.mockReturnValue(point(-100, 300));
        renderLabels();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
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
        expect(labelOf(upcoming.title).style.opacity).toBe("1");
        expect(labelOf(place2.name).style.opacity).toBe("0.06");
    });

    it("hides the active label and skips labels under the popup card", () => {
        renderLabels({ openPopupId: place.id });
        const active = labelOf(upcoming.title);
        expect(active.style.opacity).toBe("0");
        expect(active.style.transform).toBe("translate(-50%, -118px) scale(0.6)");
        expect(active).toHaveAttribute("aria-hidden", "true");
        expect(active).toHaveClass("active");
        expect(screen.getByRole("button", { hidden: true })).toBeDisabled();
        // place2 projects to the same point, inside the popup rectangle
        expect(screen.queryByText(place2.name)).not.toBeInTheDocument();
    });

    it("keeps labels outside the popup rectangle, dimmed", () => {
        fakeMap.latLngToContainerPoint
            .mockReturnValueOnce(CENTRE) // popup anchor
            .mockReturnValueOnce(CENTRE) // place (active)
            .mockReturnValueOnce(point(700, 300)); // place2, right of the card
        renderLabels({ openPopupId: place.id });
        expect(labelOf(place2.name).style.opacity).toBe("0.06");
    });

    it("shows every label when the open id is unknown", () => {
        renderLabels({ openPopupId: "missing" });
        expect(screen.getAllByRole("button")).toHaveLength(2);
        expect(labelOf(place2.name).style.opacity).toBe("0.06");
    });

    it("opens a place from its label", () => {
        const { onOpen } = renderLabels();
        fireEvent.click(screen.getByRole("button", { name: new RegExp(place2.name) }));
        expect(onOpen).toHaveBeenCalledWith(place2.id);
    });

    it("re-renders per frame while the map moves and settles afterwards", async () => {
        renderLabels();
        const label = labelOf(upcoming.title);

        act(() => {
            fakeMap.fire("movestart");
        });
        expect(label).toHaveClass("moving");

        fakeMap.latLngToContainerPoint.mockReturnValue(point(120, 80));
        act(() => {
            fakeMap.fire("move");
            fakeMap.fire("move"); // coalesced into the same frame
        });
        await waitFor(() => expect(label.style.left).toBe("120px"));

        act(() => {
            fakeMap.fire("moveend");
        });
        await waitFor(() => expect(label).toHaveClass("settled"));
    });

    it("unsubscribes from the map and cancels pending frames on unmount", () => {
        const cancel = vi.spyOn(window, "cancelAnimationFrame");
        const { unmount } = renderLabels();
        act(() => {
            fakeMap.fire("zoom");
        });
        unmount();
        expect(fakeMap.off).toHaveBeenCalledTimes(6);
        expect(cancel).toHaveBeenCalled();
    });
});
