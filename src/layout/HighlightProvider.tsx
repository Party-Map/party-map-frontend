// Which places the map should emphasise (search results or a focused place), above the router so they survive
// navigation. A `generation` counts the user-driven changes (typing, picking, clearing): the map fits the highlights
// and closes an open card once per generation, while a republication of the same state (a search box mounting again
// on a history navigation) leaves it alone, so a restored view stays put.
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import type { ID } from "@/api/types";

/** A request to show one place's card; a new object per request, so picking the same place again reopens it. */
export interface PlaceFocus {
    id: ID;
}

export interface HighlightOptions {
    /** False for a republication (a mount on Back or reload); the generation is left alone. Default true. */
    userAction?: boolean;
}

interface HighlightContextValue {
    highlightIds: ID[];
    /** The place picked from the search, whose card the map opens; null for plain highlights. */
    focus: PlaceFocus | null;
    /** Counts the user-driven changes; starts at 0. */
    generation: number;
    setHighlightIds: (ids: ID[], options?: HighlightOptions) => void;
    focusPlace: (id: ID) => void;
}

interface HighlightState {
    ids: ID[];
    focus: PlaceFocus | null;
    generation: number;
}

const HighlightContext = createContext<HighlightContextValue | null>(null);

function sameIds(a: ID[], b: ID[]): boolean {
    return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function HighlightProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<HighlightState>({ ids: [], focus: null, generation: 0 });

    // Keep the same array reference when nothing changed so map effects do not re-fly; the generation counts
    // changes, so publishing what is already there (the search box mounting) is no change at all.
    const setHighlightIds = useCallback((next: ID[], { userAction = true }: HighlightOptions = {}) => {
        setState((prev) => {
            const ids = sameIds(prev.ids, next) ? prev.ids : next;
            if (ids === prev.ids && prev.focus === null) return prev;
            return { ids, focus: null, generation: userAction ? prev.generation + 1 : prev.generation };
        });
    }, []);

    const focusPlace = useCallback((id: ID) => {
        setState((prev) => ({
            ids: sameIds(prev.ids, [id]) ? prev.ids : [id],
            focus: { id },
            generation: prev.generation + 1,
        }));
    }, []);

    const value = useMemo(
        () => ({
            highlightIds: state.ids,
            focus: state.focus,
            generation: state.generation,
            setHighlightIds,
            focusPlace,
        }),
        [state, setHighlightIds, focusPlace],
    );
    return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>;
}

export function useHighlight(): HighlightContextValue {
    const ctx = useContext(HighlightContext);
    if (!ctx) throw new Error("useHighlight must be used inside HighlightProvider");
    return ctx;
}
