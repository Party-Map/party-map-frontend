import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { GeoPoint } from "@/api/types";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";

export type LocationStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

export interface UserLocationValue {
    status: LocationStatus;
    /** The device position once granted. */
    position: GeoPoint | null;
    /** Where distances are measured from: the position, or Budapest while there is none. */
    origin: GeoPoint;
    isFallback: boolean;
    /** Ask the browser for the position (prompting the first time); a no-op while locating or once granted. */
    request: () => void;
}

interface LocationState {
    status: LocationStatus;
    position: GeoPoint | null;
}

/** GeolocationPositionError.PERMISSION_DENIED */
const PERMISSION_DENIED = 1;
/** A rough fix is enough to sort by distance; a recent one is reused instead of prompting the hardware again. */
const POSITION_OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 6000, maximumAge: 300_000 };

const LocationContext = createContext<UserLocationValue | null>(null);

/** The device position for the pages that sort by distance; one lookup shared by every consumer. */
export function LocationProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<LocationState>({ status: "idle", position: null });
    const statusRef = useRef<LocationStatus>("idle");
    const inFlight = useRef(false);

    useEffect(() => {
        statusRef.current = state.status;
    }, [state.status]);

    const request = useCallback(() => {
        if (inFlight.current || statusRef.current === "granted") return;
        const geolocation = "geolocation" in navigator ? navigator.geolocation : undefined;
        if (!geolocation) {
            setState({ status: "unavailable", position: null });
            return;
        }
        inFlight.current = true;
        setState((prev) => ({ ...prev, status: "locating" }));
        geolocation.getCurrentPosition(
            (fix) => {
                inFlight.current = false;
                setState({
                    status: "granted",
                    position: { latitude: fix.coords.latitude, longitude: fix.coords.longitude },
                });
            },
            (error) => {
                inFlight.current = false;
                setState({ status: error.code === PERMISSION_DENIED ? "denied" : "unavailable", position: null });
            },
            POSITION_OPTIONS,
        );
    }, []);

    const value = useMemo<UserLocationValue>(
        () => ({
            status: state.status,
            position: state.position,
            origin: state.position ?? DEFAULT_MAP_CENTER,
            isFallback: state.position === null,
            request,
        }),
        [state, request],
    );
    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

/** Named apart from react-router's useLocation. */
export function useUserLocation(): UserLocationValue {
    const ctx = useContext(LocationContext);
    if (!ctx) throw new Error("useUserLocation must be used inside LocationProvider");
    return ctx;
}
