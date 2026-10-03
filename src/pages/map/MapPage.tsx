import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { usePlaces, usePlacesById, useUpcomingEvents } from "@/api/hooks";
import type { ID, Place, UpcomingEventByPlace } from "@/api/types";
import { ErrorState, LoadingState } from "@/components/States";
import { BottomBar } from "@/layout/BottomBar";
import { useHighlight } from "@/layout/HighlightProvider";
import { TopBar } from "@/layout/TopBar";
import { useFromHistory } from "@/lib/hooks/useFromHistory";
import { type MapViewState, recallMap, rememberMap } from "@/map/mapMemory";
import { MapView } from "@/map/MapView";

import styles from "./MapPage.module.scss";

const NO_PLACES: Place[] = [];

/**
 * Which popup the user opened or closed (null), remembered with the search generation it happened under: a new
 * search closes it and a newly focused place opens its own, without an effect.
 */
interface PopupState {
    id: ID | null;
    generation: number;
}

/**
 * Home route: the full-screen map with the places around the viewport and their next events. Highlighted places
 * outside the viewport (search results, a focus link) and the open card's place are loaded one by one, so the map
 * can fly to them and the card never disappears. The view and the open card are remembered, so coming back (from a
 * detail page, say) lands where the user left off.
 */
export function MapPage() {
    const [searchParams] = useSearchParams();
    const focus = searchParams.get("focus");
    const fromHistory = useFromHistory();
    const { highlightIds, focus: focused, focusPlace, generation } = useHighlight();
    const [remembered] = useState(recallMap);

    const [bbox, setBbox] = useState<string | null>(null);
    const [view, setView] = useState<MapViewState | null>(remembered);
    const placesQuery = usePlaces(bbox);
    const upcomingQuery = useUpcomingEvents();
    const inView = placesQuery.data;
    const [popup, setPopup] = useState<PopupState | null>(() =>
        remembered?.popupId ? { id: remembered.popupId, generation } : null,
    );
    // What the map restored, as found at mount: the camera leaves it alone until the user asks for something new.
    const [restored] = useState(() => (remembered ? { popupId: remembered.popupId, generation } : null));
    const openPopupId = popup !== null && popup.generation === generation ? popup.id : (focused?.id ?? null);

    const missing = useMemo(() => {
        if (!inView) return [];
        const wanted = openPopupId === null ? highlightIds : [...highlightIds, openPopupId];
        return Array.from(new Set(wanted.filter((id) => !inView.some((p) => p.id === id))));
    }, [inView, highlightIds, openPopupId]);
    const elsewhere = usePlacesById(missing);
    // Fitting the view waits until every highlighted place is known, or it would fly to the first one to arrive.
    const highlightsSettled = inView !== undefined && !elsewhere.pending;

    // Arriving with ?focus=<placeId> (from search on another page) highlights that place and opens its card. Coming
    // back through the history with a remembered map, the memory wins: the user left the map somewhere else.
    useEffect(() => {
        if (focus && !(fromHistory && remembered)) focusPlace(focus);
    }, [focus, focusPlace, fromHistory, remembered]);

    const upcomingMap = useMemo(
        () => new Map<ID, UpcomingEventByPlace>((upcomingQuery.data ?? []).map((u) => [u.placeId, u])),
        [upcomingQuery.data],
    );

    const error = placesQuery.error ?? upcomingQuery.error;
    const loading = placesQuery.isPending || upcomingQuery.isPending;
    const places = useMemo(
        () => (!error && inView && upcomingQuery.data ? [...inView, ...elsewhere.places] : NO_PLACES),
        [error, inView, upcomingQuery.data, elsewhere.places],
    );

    useEffect(() => {
        if (view) rememberMap({ ...view, popupId: openPopupId });
    }, [view, openPopupId]);

    // Stable handlers (every pin re-binds its click on a change): they read the latest state from a ref.
    const latest = useRef({ openPopupId, generation });
    useEffect(() => {
        latest.current = { openPopupId, generation };
    });
    const togglePopup = useCallback((id: ID) => {
        const current = latest.current;
        setPopup({ id: current.openPopupId === id ? null : id, generation: current.generation });
    }, []);
    const closePopup = useCallback(() => setPopup({ id: null, generation: latest.current.generation }), []);

    const reload = () => {
        void placesQuery.refetch();
        void upcomingQuery.refetch();
    };

    return (
        <>
            <TopBar />
            <BottomBar />
            <main className={styles.main}>
                <MapView
                    places={places}
                    upcomingMap={upcomingMap}
                    highlightIds={highlightIds}
                    generation={generation}
                    openPopupId={openPopupId}
                    onOpenPlace={togglePopup}
                    onClosePopup={closePopup}
                    onViewportChange={setBbox}
                    onViewChange={setView}
                    initialView={remembered}
                    restored={restored}
                    highlightsSettled={highlightsSettled}
                />
                {(loading || error) && (
                    <div className={styles.overlay}>
                        <div className={styles.overlayCard}>
                            {error ? (
                                <ErrorState message="Could not load the map." onRetry={reload} />
                            ) : (
                                <LoadingState label="Loading map…" />
                            )}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
