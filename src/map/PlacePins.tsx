// The pins: one Leaflet marker per place with a shared icon per state (pins.ts), positions and click handlers kept
// per place so react-leaflet only re-binds what changed when the places list or the open card changes.
import { useMemo } from "react";
import { Marker } from "react-leaflet";

import type { ID, Place } from "@/api/types";

import { toLatLngTuple } from "./geo";
import { getPinIcon } from "./pins";

interface PlacePinsProps {
    places: Place[];
    openPopupId: ID | null;
    highlightIds: ID[];
    /** A stable function: every change re-binds the click handler of every pin. */
    onOpen: (id: ID) => void;
}

export function PlacePins({ places, openPopupId, highlightIds, onOpen }: PlacePinsProps) {
    const pins = useMemo(
        () =>
            places.map((place) => ({
                place,
                position: toLatLngTuple(place.location),
                handlers: { click: () => onOpen(place.id) },
            })),
        [places, onOpen],
    );

    return (
        <>
            {pins.map(({ place, position, handlers }) => (
                <Marker
                    key={place.id}
                    position={position}
                    icon={getPinIcon({
                        isActive: place.id === openPopupId,
                        isHighlighted: highlightIds.includes(place.id),
                    })}
                    eventHandlers={handlers}
                />
            ))}
        </>
    );
}
