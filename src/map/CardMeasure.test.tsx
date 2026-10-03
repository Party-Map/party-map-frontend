vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));

import { render } from "@testing-library/react";
import type { Popup as LeafletPopup } from "leaflet";

import { fakeCardBox, fakeMap, fakePopup, point } from "@/test/mocks/leaflet";

import { CardMeasure } from "./CardMeasure";

const anchor: [number, number] = [47.4771, 19.0621];
const cardId = "place-1";

beforeEach(() => fakeMap.reset());

describe("CardMeasure", () => {
    it("lays the popup out and reports its box relative to the pin's anchor", () => {
        const onMeasured = vi.fn();
        fakeMap.latLngToContainerPoint.mockReturnValue(point(500, 400));
        render(
            <CardMeasure
                cardId={cardId}
                popupRef={{ current: fakePopup as unknown as LeafletPopup }}
                anchor={anchor}
                onMeasured={onMeasured}
            />,
        );
        expect(fakePopup.update).toHaveBeenCalledTimes(1);
        expect(fakeMap.latLngToContainerPoint).toHaveBeenCalledWith(anchor);
        const { width, height, above } = fakeCardBox;
        expect(onMeasured).toHaveBeenCalledWith(cardId, {
            left: -width / 2,
            top: -above - height,
            right: width / 2,
            bottom: -above,
        });
        fakeMap.latLngToContainerPoint.mockReturnValue(point(400, 300));
    });

    it("measures once per card, not on every render", () => {
        const onMeasured = vi.fn();
        const popupRef = { current: fakePopup as unknown as LeafletPopup };
        const { rerender } = render(
            <CardMeasure cardId={cardId} popupRef={popupRef} anchor={anchor} onMeasured={onMeasured} />,
        );
        rerender(<CardMeasure cardId={cardId} popupRef={popupRef} anchor={anchor} onMeasured={onMeasured} />);
        expect(onMeasured).toHaveBeenCalledTimes(1);
    });

    it("waits when the popup or its element is not there yet", () => {
        const onMeasured = vi.fn();
        render(<CardMeasure cardId={cardId} popupRef={{ current: null }} anchor={anchor} onMeasured={onMeasured} />);
        const detached = { update: vi.fn(), getElement: () => undefined } as unknown as LeafletPopup;
        render(
            <CardMeasure cardId={cardId} popupRef={{ current: detached }} anchor={anchor} onMeasured={onMeasured} />,
        );
        expect(onMeasured).not.toHaveBeenCalled();
    });
});
