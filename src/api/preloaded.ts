// A server-rendered detail page carries its data in <script id="pm-data" type="application/json">: the same shape
// the page's hook would fetch, so the first render needs no request. The element is read once and removed.
import type { QueryClient } from "@tanstack/react-query";

import { eventKeys, performerKeys, placeKeys } from "./keys";
import type { ID } from "./types";

export type PreloadedKind = "event" | "place" | "performer";

export interface PreloadedPage {
    kind: PreloadedKind;
    id: ID;
    data: unknown;
}

/** Bumped together with the backend when the inlined data's shape changes; other versions are ignored. */
const VERSION = 1;
/** Seeded data counts as fresh this long, so the page does not refetch what it just received. */
const STALE_MS = 60_000;
const KINDS: readonly string[] = ["event", "place", "performer"];

function isPreloaded(value: unknown): value is { v: number; kind: PreloadedKind; id: string; data: object } {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
        candidate.v === VERSION &&
        typeof candidate.kind === "string" &&
        KINDS.includes(candidate.kind) &&
        typeof candidate.id === "string" &&
        typeof candidate.data === "object" &&
        candidate.data !== null
    );
}

/** The page data inlined by the backend, or null when there is none (or it is not understood). */
export function readPreloaded(doc: Document): PreloadedPage | null {
    const element = doc.getElementById("pm-data");
    if (!element) return null;
    element.remove();
    try {
        const parsed: unknown = JSON.parse(element.textContent);
        return isPreloaded(parsed) ? { kind: parsed.kind, id: parsed.id, data: parsed.data } : null;
    } catch {
        return null;
    }
}

const KEY_FOR: Record<PreloadedKind, (id: ID) => readonly unknown[]> = {
    event: eventKeys.page,
    place: placeKeys.page,
    performer: performerKeys.page,
};

/** Puts the preloaded data where the page's hook looks for it, fresh enough to skip the first fetch. */
export function seedQueryClient(client: QueryClient, preloaded: PreloadedPage | null): void {
    if (!preloaded) return;
    const key = KEY_FOR[preloaded.kind](preloaded.id);
    client.setQueryDefaults(key, { staleTime: STALE_MS });
    client.setQueryData(key, preloaded.data);
}
