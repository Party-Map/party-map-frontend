import { Eraser, Minimize2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { search as searchApi } from "@/api/search";
import type { ID, SearchHit } from "@/api/types";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

import { useHighlight } from "./HighlightProvider";
import styles from "./SearchBar.module.scss";
import { SearchResultItem } from "./SearchResultItem";

interface Results {
    query: string;
    hits: SearchHit[];
    failed?: boolean;
}

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
 * Search box with a debounced dropdown. Results highlight the matching places on the map; Enter
 * commits the query to the URL (`?q=`), and picking a result focuses its place (`?focus=`).
 */
export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const { setHighlightIds } = useHighlight();

    const hasFocusParam = searchParams.has("focus");
    const [query, setQuery] = useState(initialQuery);
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<Results | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
    const items = results?.query === debounced ? results.hits : [];
    const showDropdown = open && debounced.length > 0 && results?.query === debounced;

    // Fetch when the debounced query changes; highlight matching places unless a focus is pinned.
    useEffect(() => {
        if (!debounced) {
            if (!hasFocusParam) setHighlightIds([]);
            return;
        }
        let cancelled = false;
        searchApi(debounced).then(
            (hits) => {
                if (cancelled) return;
                setResults({ query: debounced, hits });
                if (!hasFocusParam) {
                    setHighlightIds(placeIdsOf(hits));
                    setOpen(true);
                }
            },
            (error: unknown) => {
                if (cancelled) return;
                console.error("Search failed", error);
                setResults({ query: debounced, hits: [], failed: true });
                setOpen(true);
            },
        );
        return () => {
            cancelled = true;
        };
    }, [debounced, hasFocusParam, setHighlightIds]);

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
        inputRef.current?.blur();
    };

    const clearAll = () => {
        setQuery("");
        setResults(null);
        setOpen(false);
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
            setHighlightIds([placeId]);
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
        const placeIds = placeIdsOf(items);
        if (placeIds.length) {
            setHighlightIds(placeIds);
            goToMapWith({ q });
        }
        dismiss();
    };

    const hasQuery = query.trim().length > 0;

    return (
        <div ref={rootRef} className={styles.root}>
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

                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        clearFocusParam();
                    }}
                    onFocus={() => {
                        if (items.length && !hasFocusParam) setOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
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
                <div className={styles.dropdown} role="listbox" aria-label="Search results">
                    {results.failed ? (
                        <p className={styles.noResults} role="alert">
                            Search is unavailable right now. Please try again.
                        </p>
                    ) : items.length === 0 ? (
                        <p className={styles.noResults}>No results for “{debounced}”</p>
                    ) : (
                        <ul className={styles.list}>
                            {items.map((hit) => (
                                <SearchResultItem
                                    key={`${hit.type}-${hit.id}`}
                                    hit={hit}
                                    onPick={() => pickHit(hit)}
                                    onView={() => {
                                        void navigate(hrefForHit(hit));
                                        dismiss();
                                    }}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
