import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { EVENT_TYPES, type EventType } from "@/api/types";
import { BROWSE_RADIUS_OPTIONS_KM } from "@/lib/constants";

/** The browse filters, as the URL carries them (`?search=&kind=&tag=&genre=&radius=&sort=`). */
export interface BrowseParams {
    search: string;
    kind: EventType | null;
    tag: string;
    genre: string;
    /** One of BROWSE_RADIUS_OPTIONS_KM, or null for any distance. */
    radius: number | null;
    sort: string;
}

/** A change to apply: null or "" removes the parameter. */
export type BrowseParamsPatch = { [K in keyof BrowseParams]?: BrowseParams[K] | null };

const KINDS: readonly string[] = EVENT_TYPES;
const RADII: readonly number[] = BROWSE_RADIUS_OPTIONS_KM;

/** Unknown kinds and radii read as unset, so a hand-edited URL never sends an invalid filter. */
export function readBrowseParams(params: URLSearchParams): BrowseParams {
    const kind = params.get("kind") ?? "";
    const radius = Number(params.get("radius"));
    return {
        search: params.get("search") ?? "",
        kind: KINDS.includes(kind) ? (kind as EventType) : null,
        tag: params.get("tag") ?? "",
        genre: params.get("genre") ?? "",
        radius: RADII.includes(radius) ? radius : null,
        sort: params.get("sort") ?? "",
    };
}

/** The filters in the URL and a setter that merges a patch into them (replacing the history entry). */
export function useBrowseParams(): [BrowseParams, (patch: BrowseParamsPatch) => void] {
    const [searchParams, setSearchParams] = useSearchParams();
    const params = useMemo(() => readBrowseParams(searchParams), [searchParams]);
    const set = useCallback(
        (patch: BrowseParamsPatch) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    for (const [key, value] of Object.entries(patch)) {
                        if (value === null || value === "") next.delete(key);
                        else next.set(key, String(value));
                    }
                    return next;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );
    return [params, set];
}
