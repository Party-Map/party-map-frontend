import type { LatLngTuple } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Marker, useMap } from "react-leaflet";

import { insideExtent, showTarget } from "./camera";
import { mapInsets } from "./insets";
import { createYouAreHereIcon } from "./pins";
import { useCamera } from "./useCamera";

/** Accuracy circles larger than this would swallow the map; cap them. */
export const MAX_ACCURACY_RADIUS_M = 200;
const FIRST_FIX_MIN_ZOOM = 14;
const FLIGHT_DURATION = 0.8;
const POSITION_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 10_000 };

interface Fix {
    position: LatLngTuple;
    accuracy: number;
}

function toFix(position: GeolocationPosition): Fix {
    return { position: [position.coords.latitude, position.coords.longitude], accuracy: position.coords.accuracy };
}

// Location denied or unavailable: the map simply shows no position marker.
const ignoreLocationError = () => undefined;

interface UserLocationProps {
    /** Fly to the first fix (a fresh visit without highlights); off for a restored view or with highlights. */
    auto: boolean;
    cardOpen: boolean;
}

/**
 * "You are here" marker with an accuracy circle, following the device position. When `auto` the map flies to the
 * first fix, but only if, by the time it arrives, no card is open, the user has not moved the map themselves and
 * the fix lies inside the country (the wall would push a flight beyond it back anyway).
 */
export function UserLocation({ auto, cardOpen }: UserLocationProps) {
    const map = useMap();
    const camera = useCamera();
    const [fix, setFix] = useState<Fix | null>(null);
    const icon = useMemo(() => createYouAreHereIcon(), []);
    // Read when the fix arrives, not when the request was made.
    const latest = useRef({ auto, cardOpen });
    useEffect(() => {
        latest.current = { auto, cardOpen };
    });

    useEffect(() => {
        if (!("geolocation" in navigator)) return;
        const { geolocation } = navigator;

        geolocation.getCurrentPosition(
            (position) => {
                const next = toFix(position);
                setFix(next);
                const wanted = latest.current.auto && !latest.current.cardOpen && !camera.userMoved();
                if (!wanted || !insideExtent(next.position)) return;
                const size = map.getSize();
                const zoom = Math.max(map.getZoom(), FIRST_FIX_MIN_ZOOM);
                const target = showTarget({
                    pin: next.position,
                    card: null,
                    center: map.getCenter(),
                    zoom,
                    size,
                    insets: mapInsets(size.x),
                    mode: "center",
                });
                camera.move(target, { duration: FLIGHT_DURATION });
            },
            ignoreLocationError,
            POSITION_OPTIONS,
        );
        const watchId = geolocation.watchPosition(
            (position) => setFix(toFix(position)),
            ignoreLocationError,
            POSITION_OPTIONS,
        );

        return () => geolocation.clearWatch(watchId);
    }, [map, camera]);

    if (!fix) return null;

    return (
        <>
            {fix.accuracy > 0 && (
                <Circle
                    center={fix.position}
                    radius={Math.min(fix.accuracy, MAX_ACCURACY_RADIUS_M)}
                    pathOptions={{ className: "pm-you-accuracy" }}
                />
            )}
            <Marker position={fix.position} icon={icon} interactive={false} keyboard={false} />
        </>
    );
}
