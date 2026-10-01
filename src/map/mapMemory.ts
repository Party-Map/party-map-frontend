// The map as the user left it (viewport and open card), restored on the next visit: going back from a detail page
// lands where the user was, with the same card open. Kept in memory and in sessionStorage, so a reload keeps it too.
import type { LatLngTuple } from "leaflet";

import type { ID } from "@/api/types";
import { MAP_MEMORY_STORAGE_KEY } from "@/lib/constants";

export interface MapViewState {
    center: LatLngTuple;
    zoom: number;
}

export interface MapMemory extends MapViewState {
    popupId: ID | null;
}

let memory: MapMemory | null = null;

function isMemory(value: unknown): value is MapMemory {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    const center = candidate.center;
    return (
        Array.isArray(center) &&
        center.length === 2 &&
        center.every((part) => typeof part === "number" && Number.isFinite(part)) &&
        typeof candidate.zoom === "number" &&
        Number.isFinite(candidate.zoom) &&
        (candidate.popupId === null || typeof candidate.popupId === "string")
    );
}

export function rememberMap(next: MapMemory): void {
    memory = next;
    try {
        sessionStorage.setItem(MAP_MEMORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Storage may be unavailable (private mode, quota); the in-memory copy still serves this page load.
    }
}

/** The remembered map, from this page load or from the session's storage; null on a first visit. */
export function recallMap(): MapMemory | null {
    if (memory) return memory;
    try {
        const raw = sessionStorage.getItem(MAP_MEMORY_STORAGE_KEY);
        const parsed: unknown = raw === null ? null : JSON.parse(raw);
        if (isMemory(parsed)) memory = parsed;
    } catch {
        // A corrupt or unreadable entry is the same as none.
    }
    return memory;
}

export function forgetMap(): void {
    memory = null;
    try {
        sessionStorage.removeItem(MAP_MEMORY_STORAGE_KEY);
    } catch {
        // Nothing stored, nothing to forget.
    }
}
