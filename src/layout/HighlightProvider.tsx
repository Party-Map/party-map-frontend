import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import type { ID } from "@/api/types";

/** A request to show one place's card; a new object per request, so picking the same place again reopens it. */
export interface PlaceFocus {
    id: ID;
}

interface HighlightContextValue {
    highlightIds: ID[];
    /** The place picked from the search, whose card the map opens; null for plain highlights. */
    focus: PlaceFocus | null;
    setHighlightIds: (ids: ID[]) => void;
    focusPlace: (id: ID) => void;
}

interface HighlightState {
    ids: ID[];
    focus: PlaceFocus | null;
}

const HighlightContext = createContext<HighlightContextValue | null>(null);

function sameIds(a: ID[], b: ID[]): boolean {
    return a.length === b.length && a.every((id, i) => id === b[i]);
}

/** Which places the map should emphasise (search results or a focused place). */
export function HighlightProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<HighlightState>({ ids: [], focus: null });

    // Keep the same array reference when nothing changed so map effects do not re-fly.
    const setHighlightIds = useCallback((next: ID[]) => {
        setState((prev) =>
            sameIds(prev.ids, next) && prev.focus === null
                ? prev
                : { ids: sameIds(prev.ids, next) ? prev.ids : next, focus: null },
        );
    }, []);

    const focusPlace = useCallback((id: ID) => {
        setState((prev) => ({ ids: sameIds(prev.ids, [id]) ? prev.ids : [id], focus: { id } }));
    }, []);

    const value = useMemo(
        () => ({ highlightIds: state.ids, focus: state.focus, setHighlightIds, focusPlace }),
        [state, setHighlightIds, focusPlace],
    );
    return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>;
}

export function useHighlight(): HighlightContextValue {
    const ctx = useContext(HighlightContext);
    if (!ctx) throw new Error("useHighlight must be used inside HighlightProvider");
    return ctx;
}
