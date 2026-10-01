import { Command } from "cmdk";
import { Eraser, Minimize2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { useSearch } from "@/api/hooks";
import type { ID, SearchHit } from "@/api/types";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

import { useHighlight } from "./HighlightProvider";
import styles from "./SearchBar.module.scss";
import { SearchResultItem } from "./SearchResultItem";

const NO_HITS: SearchHit[] = [];

export function placeIdsOf(hits: SearchHit[]): ID[] {
    const ids = hits.map((h) => h.placeId ?? (h.type === "PLACE" ? h.id : null)).filter((id): id is ID => Boolean(id));
    return Array.from(new Set(ids));
}

export function hrefForHit(hit: SearchHit): string {
    switch (hit.type) {
        case "PLACE":
            return `/places/${hit.id}`;
        case "EVENT":
            return `/events/${hit.id}`;
        case "PERFORMER":
            return `/performers/${hit.id}`;
    }
}

/**
 * Search box with a debounced dropdown (cmdk: arrow keys move through the hits, Enter picks one). Results highlight
 * the matching places on the map; Enter without a chosen hit commits the query to the URL (`?q=`), and picking a
 * hit focuses its place and opens its card (`?focus=` from other pages).
 */
export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const { setHighlightIds, focusPlace } = useHighlight();

    const hasFocusParam = searchParams.has("focus");
    const [query, setQuery] = useState(initialQuery);
    // A query arriving with the page (?q=) shows its results unless a place is pinned (?focus=).
    const [open, setOpen] = useState(() => initialQuery.trim() !== "" && !hasFocusParam);
    // cmdk highlights the first hit by itself; it only counts as chosen once the user moves through the list.
    const [choosing, setChoosing] = useState(false);
    // A picked hit owns the map until the user types again, even if a search typed before the pick finishes later.
    const [picked, setPicked] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
    const results = useSearch(debounced);
    const hits = debounced ? (results.data ?? NO_HITS) : NO_HITS;
    const settled = debounced.length > 0 && (results.data !== undefined || results.isError);
    const showDropdown = open && settled;

    // The hits highlight their places on the map, unless a focus is pinned or a hit was picked.
    useEffect(() => {
        if (hasFocusParam || picked) return;
        if (!debounced) setHighlightIds([]);
        else if (results.data) setHighlightIds(placeIdsOf(results.data));
    }, [debounced, results.data, hasFocusParam, picked, setHighlightIds]);

    // Close on outside click and Escape.
    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, true);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    // Leaving the page drops the highlights.
    useEffect(() => () => setHighlightIds([]), [setHighlightIds]);

    const dismiss = () => {
        setOpen(false);
        setChoosing(false);
        inputRef.current?.blur();
    };

    const clearAll = () => {
        setQuery("");
        setOpen(false);
        setChoosing(false);
        setHighlightIds([]);
        void navigate(pathname, { replace: true });
    };

    const clearFocusParam = () => {
        if (!hasFocusParam) return;
        const next = new URLSearchParams(searchParams);
        next.delete("focus");
        const qs = next.toString();
        void navigate(qs ? `${pathname}?${qs}` : pathname, { replace: true });
        setHighlightIds([]);
    };

    const goToMapWith = (params: Record<string, string>) => {
        const next = new URLSearchParams(params);
        void navigate(`/?${next.toString()}`);
    };

    const pickHit = (hit: SearchHit) => {
        const placeId = hit.placeId ?? (hit.type === "PLACE" ? hit.id : null);
        if (!placeId) {
            void navigate(hrefForHit(hit));
        } else if (pathname !== "/") {
            goToMapWith(query.trim() ? { focus: placeId, q: query.trim() } : { focus: placeId });
        } else {
            focusPlace(placeId);
            setPicked(true);
        }
        dismiss();
    };

    const submit = () => {
        const q = query.trim();
        if (!q) {
            clearAll();
            return;
        }
        clearFocusParam();
        const placeIds = placeIdsOf(hits);
        if (placeIds.length) {
            setHighlightIds(placeIds);
            goToMapWith({ q });
        }
        dismiss();
    };

    const hasQuery = query.trim().length > 0;

    return (
        <Command ref={rootRef} shouldFilter={false} loop label="Search" className={styles.root}>
            <div className={styles.box}>
                <button
                    type="button"
                    onClick={submit}
                    disabled={!hasQuery}
                    aria-label="Search"
                    className={cn(styles.iconButton, !hasQuery && styles.disabled)}
                >
                    <Search size={16} aria-hidden />
                </button>

                <Command.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={(value) => {
                        setQuery(value);
                        setPicked(false);
                        setOpen(true);
                        setChoosing(false);
                        clearFocusParam();
                    }}
                    onFocus={() => {
                        if (hits.length && !hasFocusParam) setOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                            // The first ArrowDown reveals cmdk's highlighted first hit instead of moving past it.
                            if (e.key === "ArrowDown" && !choosing) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            setOpen(true);
                            setChoosing(true);
                        } else if (e.key === "Enter" && !(choosing && showDropdown && hits.length)) {
                            // Nothing chosen: Enter searches. Keep cmdk from picking its default first hit.
                            e.preventDefault();
                            e.stopPropagation();
                            submit();
                        }
                    }}
                    placeholder="Search places, events, performers, tags"
                    aria-label="Search"
                    className={styles.input}
                />

                {hasQuery && (
                    <button
                        type="button"
                        onClick={dismiss}
                        disabled={!showDropdown}
                        aria-label={showDropdown ? "Hide results" : "Results hidden"}
                        className={cn(styles.roundButton, showDropdown ? styles.roundActive : styles.roundMuted)}
                    >
                        <Minimize2 size={16} aria-hidden />
                    </button>
                )}

                <button type="button" onClick={clearAll} aria-label="Clear search" className={styles.roundButton}>
                    <Eraser size={16} aria-hidden />
                </button>
            </div>

            {showDropdown && (
                <Command.List
                    label="Search results"
                    className={styles.dropdown}
                    data-choosing={choosing || undefined}
                    onPointerMove={() => setChoosing(true)}
                >
                    {results.isError ? (
                        <p className={styles.noResults} role="alert">
                            Search is unavailable right now. Please try again.
                        </p>
                    ) : hits.length === 0 ? (
                        <p className={styles.noResults}>No results for “{debounced}”</p>
                    ) : (
                        hits.map((hit) => (
                            <SearchResultItem
                                key={`${hit.type}-${hit.id}`}
                                hit={hit}
                                onPick={() => pickHit(hit)}
                                onView={() => {
                                    void navigate(hrefForHit(hit));
                                    dismiss();
                                }}
                            />
                        ))
                    )}
                </Command.List>
            )}
        </Command>
    );
}
