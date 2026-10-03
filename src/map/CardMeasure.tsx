// Measures the open card. Rendered inside the card's Popup, it reads the popup element's box once the card is in
// the DOM and reports it relative to the pin's anchor point, so the camera (map/CameraDirector.tsx) and the labels
// (map/PlaceLabels.tsx) work with the real card, whatever its content or breakpoint, instead of a guessed size.
import type { LatLngExpression, Popup as LeafletPopup } from "leaflet";
import { type RefObject, useLayoutEffect } from "react";
import { useMap } from "react-leaflet";

import type { ID } from "@/api/types";

import type { AnchoredRect } from "./camera";

interface CardMeasureProps {
    popupRef: RefObject<LeafletPopup | null>;
    /** The card's place. */
    cardId: ID;
    /** The pin the card belongs to; a stable value, the measurement is taken once per card. */
    anchor: LatLngExpression;
    onMeasured: (cardId: ID, rect: AnchoredRect) => void;
}

export function CardMeasure({ popupRef, cardId, anchor, onMeasured }: CardMeasureProps) {
    const map = useMap();

    useLayoutEffect(() => {
        const popup = popupRef.current;
        const element = popup?.getElement();
        if (!popup || !element) return;
        // Leaflet sizes the popup around its content and positions it; react-leaflet does the same a moment later.
        popup.update();
        const box = element.getBoundingClientRect();
        const container = map.getContainer().getBoundingClientRect();
        const pin = map.latLngToContainerPoint(anchor);
        onMeasured(cardId, {
            left: box.left - container.left - pin.x,
            top: box.top - container.top - pin.y,
            right: box.right - container.left - pin.x,
            bottom: box.bottom - container.top - pin.y,
        });
    }, [map, popupRef, cardId, anchor, onMeasured]);

    return null;
}
