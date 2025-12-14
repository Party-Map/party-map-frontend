'use client'

import {HighlightContextType} from "@/lib/types";
import {createContext, useCallback, useContext, useState} from "react";

const HighlightContext = createContext<HighlightContextType | null>(null);

export function HighlightContextProvider({children}: { children: React.ReactNode }) {
    const [highlightIds, _setHighlightIds] = useState<string[]>([]);
    // prevent unnecessary map fly on highlight changes
    const setHighlightIds = useCallback((next: string[]) => {
        _setHighlightIds(prev => {

            const same =
                prev.length === next.length &&
                prev.every((id, i) => id === next[i])

            return same ? prev : next
        })
    }, [])

    return (
        <HighlightContext.Provider value={{highlightIds, setHighlightIds}}>
            {children}
        </HighlightContext.Provider>
    )
}

export function useHighlight() {
    const context = useContext(HighlightContext);
    if (!context) throw new Error("useHighlight must be used inside a HighlightProvider");
    return context;
}