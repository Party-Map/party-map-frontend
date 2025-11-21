'use client'

import {HighlightContextType} from "@/lib/types";
import {createContext, useContext, useState} from "react";

const HighlightContext = createContext<HighlightContextType | null>(null);

export function HighlightProvider({children}: { children: React.ReactNode }) {
    const [highlightIds, setHighlightIds] = useState<string[]>([]);

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