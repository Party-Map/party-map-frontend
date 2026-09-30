import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import type { ID } from "@/lib/types";

interface HighlightContextValue {
    highlightIds: ID[];
    setHighlightIds: (ids: ID[]) => void;
}

const HighlightContext = createContext<HighlightContextValue | null>(null);

function sameIds(a: ID[], b: ID[]): boolean {
    return a.length === b.length && a.every((id, i) => id === b[i]);
}

/** Which places the map should emphasise (search results or a focused place). */
export function HighlightProvider({ children }: { children: ReactNode }) {
    const [highlightIds, setIds] = useState<ID[]>([]);

    // Keep the same array reference when nothing changed so map effects do not re-fly.
    const setHighlightIds = useCallback((next: ID[]) => {
        setIds((prev) => (sameIds(prev, next) ? prev : next));
    }, []);

    const value = useMemo(() => ({ highlightIds, setHighlightIds }), [highlightIds, setHighlightIds]);
    return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>;
}

export function useHighlight(): HighlightContextValue {
    const ctx = useContext(HighlightContext);
    if (!ctx) throw new Error("useHighlight must be used inside HighlightProvider");
    return ctx;
}
