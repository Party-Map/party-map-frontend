import { Command } from "cmdk";
import { ArrowLeft, Eraser, Minimize2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { useSearch } from "@/api/hooks";
import type { ID, SearchHit } from "@/api/types";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useFromHistory } from "@/lib/hooks/useFromHistory";
import { cn } from "@/lib/utils";

import { useHighlight } from "./HighlightProvider";
import styles from "./SearchBar.module.scss";
import { SearchResultItem } from "./SearchResultItem";

const NO_HITS: SearchHit[] = [];
/** A press that closed the results is followed by its click within this time; a later click is someone else's. */
const SWALLOW_CLICK_MS = 700;

/** Keeps the click of the press that just happened from reaching anything (the map, in particular). */
function swallowNextClick(): void {
    const armedAt = Date.now();
    const swallow = (e: MouseEvent) => {
        if (Date.now() - armedAt > SWALLOW_CLICK_MS) return;
        e.stopPropagation();
        e.preventDefault();
    };
    document.addEventListener("click", swallow, { capture: true, once: true });
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

interface SearchBarProps {
    initialQuery?: string;
    /** Reports whether the box is in use (focused or showing results); the phone top bar makes room for it. */
    onExpandedChange?: (expanded: boolean) => void;
}

/**
 * Search box with a debounced dropdown (cmdk: arrow keys move through the hits, Enter picks one). Results highlight
 * the matching places on the map; Enter without a chosen hit commits the query to the URL (`?q=`), and picking a
 * hit focuses its place and opens its card (`?focus=` from other pages). While it is in use ("expanded") the
 * phone layout hides the brand and shows a back button in place of the search icon. Mounting on a history
 * navigation (Back, Forward, a reload) is quiet: the results stay closed and the highlights are republished without
 * counting as a new search, so the map keeps the view and card the user had.
 */
export function SearchBar({ initialQuery = "", onExpandedChange }: SearchBarProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const { setHighlightIds, focusPlace } = useHighlight();
    // How the box was reached is settled at mount: a later replace of the URL (clearing it) changes nothing here.
    const [fromHistory] = useState(useFromHistory());

    const hasFocusParam = searchParams.has("focus");
    const [query, setQuery] = useState(initialQuery);
    const [focused, setFocused] = useState(false);
    // A query arriving with the page (?q=) shows its results unless a place is pinned (?focus=) or the page came
    // back from the history.
    const [open, setOpen] = useState(() => initialQuery.trim() !== "" && !hasFocusParam && !fromHistory);
    // Whether the user has typed here: until then, the hits of a query that came with the page are republished.
    const typed = useRef(false);
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
    const expanded = focused || showDropdown;

    useEffect(() => {
        onExpandedChange?.(expanded);
        return () => onExpandedChange?.(false);
    }, [expanded, onExpandedChange]);

    // The hits highlight their places on the map, unless a focus is pinned or a hit was picked. A query that came
    // with a history navigation republishes its hits without counting as a new search.
    useEffect(() => {
        if (hasFocusParam || picked) return;
        const userAction = typed.current || !fromHistory;
        if (!debounced) setHighlightIds([], { userAction });
        else if (results.data) setHighlightIds(placeIdsOf(results.data), { userAction });
    }, [debounced, results.data, hasFocusParam, picked, fromHistory, setHighlightIds]);

    // Escape closes the results.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    // A press outside closes the results. On the map's background that press means "hide the results", nothing
    // more: the click it becomes is kept from the map, which would otherwise close the open card as well. A press
    // on a pin or on the card is what it is.
    useEffect(() => {
        if (!showDropdown) return;
        const onPointerDown = (e: PointerEvent) => {
            const target = e.target instanceof Node ? e.target : null;
            if (!target || rootRef.current?.contains(target)) return;
            setOpen(false);
            if (!(target instanceof Element) || !target.closest(".leaflet-container")) return;
            if (!target.closest(".leaflet-marker-icon, .leaflet-popup")) swallowNextClick();
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [showDropdown]);

    // Leaving the page drops the highlights (not a search of the user's: the map does not react).
    useEffect(() => () => setHighlightIds([], { userAction: false }), [setHighlightIds]);

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
        <Command
            ref={rootRef}
            shouldFilter={false}
            loop
            label="Search"
            className={styles.root}
            data-expanded={expanded || undefined}
        >
            <div className={styles.box}>
                {expanded && (
                    <button
                        type="button"
                        onClick={dismiss}
                        // Keep the input focused through the press, or the button would vanish before its click.
                        onMouseDown={(e) => e.preventDefault()}
                        aria-label="Close search"
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} aria-hidden />
                    </button>
                )}
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
                        typed.current = true;
                        setQuery(value);
                        setPicked(false);
                        setOpen(true);
                        setChoosing(false);
                        clearFocusParam();
                    }}
                    onFocus={() => {
                        setFocused(true);
                        if (hits.length && !hasFocusParam) setOpen(true);
                    }}
                    onBlur={() => setFocused(false)}
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
                        className={cn(
                            styles.roundButton,
                            styles.hideResults,
                            showDropdown ? styles.roundActive : styles.roundMuted,
                        )}
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
