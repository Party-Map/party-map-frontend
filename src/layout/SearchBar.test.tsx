import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useLocation } from "react-router";

import type { SearchHit } from "@/api/types";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { event, performer, place, place2 } from "@/test/fixtures";
import { type ApiMock, mockApi, renderWithProviders } from "@/test/helpers";

import { useHighlight } from "./HighlightProvider";
import { hrefForHit, placeIdsOf, SearchBar } from "./SearchBar";

const placeHit: SearchHit = {
    id: place.id,
    type: "PLACE",
    title: place.name,
    subtitle: place.city,
    image: place.image,
    nextEventStart: event.start,
    placeId: null,
};
const eventHit: SearchHit = {
    id: event.id,
    type: "EVENT",
    title: event.title,
    subtitle: place2.name,
    image: event.image,
    nextEventStart: event.start,
    placeId: place2.id,
};
const performerHit: SearchHit = {
    id: performer.id,
    type: "PERFORMER",
    title: performer.name,
    subtitle: performer.genre,
    image: null,
    nextEventStart: null,
    placeId: null,
};
const hits = [placeHit, eventHit, performerHit];

const response = (query: string, found: SearchHit[] = hits) => ({ query, hits: found });
const DEFAULT_ROUTES = { "GET /api/search?q=techno": response("techno") };

interface Globals {
    jest?: unknown;
}

function Probe() {
    const { highlightIds, focus, generation } = useHighlight();
    const { pathname, search } = useLocation();
    return (
        <>
            <p data-testid="highlight">{highlightIds.join(",")}</p>
            <p data-testid="focus">{focus?.id ?? ""}</p>
            <p data-testid="generation">{generation}</p>
            <p data-testid="location">{`${pathname}${search}`}</p>
        </>
    );
}

function Harness({ initialQuery }: { initialQuery?: string }) {
    const [mounted, setMounted] = useState(true);
    const [expanded, setExpanded] = useState(false);
    return (
        <>
            {mounted && <SearchBar initialQuery={initialQuery} onExpandedChange={setExpanded} />}
            <p data-testid="expanded">{String(expanded)}</p>
            <button type="button" onClick={() => setMounted(false)}>
                unmount search
            </button>
            <Probe />
        </>
    );
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(new Date(2030, 5, 15, 12, 0));
    // testing-library only drives a fake clock it recognises as Jest's; expose the same surface for vitest.
    const globals = globalThis as Globals;
    globals.jest = { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) };
});

afterEach(() => {
    delete (globalThis as Globals).jest;
    vi.useRealTimers();
});

async function settle(ms = SEARCH_DEBOUNCE_MS) {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });
}

interface SetupOptions {
    route?: string;
    /** Entries behind the route: the page then counts as reached through the history (Back, reload). */
    history?: string[];
    initialQuery?: string;
    routes?: Record<string, unknown>;
}

async function setup({ route = "/", history, initialQuery, routes = DEFAULT_ROUTES }: SetupOptions = {}) {
    const fetchMock = mockApi(routes);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<Harness initialQuery={initialQuery} />, history ? { route, history } : { route });
    await settle(0);
    return { fetchMock, user, input: screen.getByRole("combobox", { name: "Search" }) };
}

const highlight = () => screen.getByTestId("highlight").textContent;
const generation = () => Number(screen.getByTestId("generation").textContent);
const expanded = () => screen.getByTestId("expanded").textContent;
const location = () => screen.getByTestId("location").textContent;
const focused = () => screen.getByTestId("focus").textContent;
const requestedUrls = (fetchMock: ApiMock) => fetchMock.requests.map((request) => request.url);
const listbox = () => screen.queryByRole("listbox", { name: "Search results" });

async function typeAndWait(user: ReturnType<typeof userEvent.setup>, input: HTMLElement, text = "techno") {
    await user.type(input, text);
    await settle();
    return screen.findByRole("listbox", { name: "Search results" });
}

function first<T>(items: T[]): T {
    const [item] = items;
    if (item === undefined) throw new Error("expected at least one item");
    return item;
}

describe("placeIdsOf", () => {
    it("collects the place of each hit once", () => {
        expect(placeIdsOf(hits)).toEqual(["place-1", "place-2"]);
        expect(placeIdsOf([placeHit, { ...eventHit, placeId: place.id }])).toEqual(["place-1"]);
        expect(placeIdsOf([performerHit])).toEqual([]);
        expect(placeIdsOf([])).toEqual([]);
    });
});

describe("hrefForHit", () => {
    it("routes each hit type to its page", () => {
        expect(hrefForHit(placeHit)).toBe("/places/place-1");
        expect(hrefForHit(eventHit)).toBe("/events/event-1");
        expect(hrefForHit(performerHit)).toBe("/performers/performer-1");
    });
});

describe("SearchBar", () => {
    it("fetches after the debounce and lists the hits with type pills and dates", async () => {
        const { user, input, fetchMock } = await setup();
        await user.type(input, "techno");
        expect(fetchMock).not.toHaveBeenCalled();
        expect(listbox()).toBeNull();

        await settle();
        expect(requestedUrls(fetchMock)).toEqual(["http://api.test/api/search?q=techno"]);
        const list = await screen.findByRole("listbox", { name: "Search results" });
        const items = within(list).getAllByRole("option");
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent("A38 Hajó");
        expect(items[0]).toHaveTextContent("Place");
        expect(items[0]).toHaveTextContent("Budapest");
        expect(items[0]).toHaveTextContent("1 Jun");
        expect(items[1]).toHaveTextContent("Techno Night");
        expect(items[1]).toHaveTextContent("Event");
        expect(items[2]).toHaveTextContent("DJ Test");
        expect(items[2]).toHaveTextContent("Performer");
        expect(items[2]).not.toHaveTextContent("Jun");
        expect(highlight()).toBe("place-1,place-2");
    });

    it("shows a message when nothing matches", async () => {
        const { user, input } = await setup({ routes: { "GET /api/search?q=zzz": response("zzz", []) } });
        await user.type(input, "zzz");
        await settle();
        expect(await screen.findByText("No results for “zzz”")).toBeInTheDocument();
        expect(highlight()).toBe("");
    });

    it("says so when the search fails and highlights nothing", async () => {
        const { user, input } = await setup({ routes: {} });
        await user.type(input, "techno");
        await settle();
        await settle(0);
        expect(listbox()).toHaveTextContent("Search is unavailable right now.");
        expect(highlight()).toBe("");
    });

    it("commits the query to the map URL on Enter", async () => {
        const { user, input } = await setup();
        await typeAndWait(user, input);
        await user.keyboard("{Enter}");
        expect(location()).toBe("/?q=techno");
        expect(highlight()).toBe("place-1,place-2");
        expect(listbox()).toBeNull();
    });

    it("stays on the page when the hits have no place", async () => {
        const { user, input } = await setup({
            route: "/events/1",
            routes: { "GET /api/search?q=dj": response("dj", [performerHit]) },
        });
        await typeAndWait(user, input, "dj");
        await user.click(screen.getByRole("button", { name: "Search" }));
        expect(location()).toBe("/events/1");
        expect(listbox()).toBeNull();
    });

    it("clears the URL query when submitting an empty box", async () => {
        const { user, input } = await setup({ route: "/?q=old" });
        expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
        expect(screen.queryByRole("button", { name: /results/i })).toBeNull();
        await user.click(input);
        await user.keyboard("{Enter}");
        expect(location()).toBe("/");
    });

    it("highlights the initial query's hits, shows them on focus, and clears everything with the eraser", async () => {
        const { user, input } = await setup({ route: "/?q=techno", initialQuery: "techno" });
        await settle();
        expect(highlight()).toBe("place-1,place-2");
        // The page came with the query (no link was followed): the list waits until the box is used.
        expect(listbox()).toBeNull();
        await user.click(input);
        expect(await screen.findByRole("listbox", { name: "Search results" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Clear search" }));
        expect(input).toHaveValue("");
        expect(listbox()).toBeNull();
        expect(highlight()).toBe("");
        expect(location()).toBe("/");
        await settle();
        expect(highlight()).toBe("");
    });

    it("sends a picked hit to the map with focus and query when not on the map", async () => {
        const { user, input } = await setup({ route: "/events/1" });
        const list = await typeAndWait(user, input);
        await user.click(within(list).getByRole("option", { name: /Techno Night/ }));
        await settle(0);
        expect(location()).toBe("/?focus=place-2&q=techno");
        expect(listbox()).toBeNull();
    });

    it("focuses the place (its card opens) when picking on the map", async () => {
        const { user, input } = await setup();
        const list = await typeAndWait(user, input);
        expect(focused()).toBe("");
        await user.click(within(list).getByRole("option", { name: /Techno Night/ }));
        expect(highlight()).toBe("place-2");
        expect(focused()).toBe("place-2");
        expect(location()).toBe("/");
        expect(listbox()).toBeNull();
    });

    it("keeps a picked place focused when the search typed before the pick finishes afterwards", async () => {
        const { user, input } = await setup({
            routes: {
                ...DEFAULT_ROUTES,
                "GET /api/search?q=techno%20club": response("techno club", [performerHit]),
                "GET /api/search?q=techno%20clubs": response("techno clubs", [placeHit]),
            },
        });
        const list = await typeAndWait(user, input);
        await user.type(input, " club");
        await user.click(within(list).getByRole("option", { name: /Techno Night/ }));
        await settle();
        await settle(0);
        expect(highlight()).toBe("place-2");
        expect(focused()).toBe("place-2");

        // Typing again hands the map back to the search results.
        await user.type(input, "s");
        await settle();
        await settle(0);
        expect(focused()).toBe("");
        expect(highlight()).toBe("place-1");
    });

    it("moves through the hits with the arrow keys and picks the chosen one on Enter", async () => {
        const { user, input } = await setup();
        const list = await typeAndWait(user, input);
        expect(list).not.toHaveAttribute("data-choosing");

        await user.keyboard("{ArrowDown}{ArrowDown}");
        expect(list).toHaveAttribute("data-choosing");
        expect(screen.getByRole("option", { name: /Techno Night/ })).toHaveAttribute("aria-selected", "true");

        await user.keyboard("{Enter}");
        expect(highlight()).toBe("place-2");
        expect(location()).toBe("/");
        expect(listbox()).toBeNull();
    });

    it("counts pointing at a hit as choosing, and typing again as not", async () => {
        const { user, input } = await setup();
        const list = await typeAndWait(user, input);
        fireEvent.pointerMove(list);
        expect(list).toHaveAttribute("data-choosing");

        await user.type(input, "x");
        expect(screen.queryByRole("listbox", { name: "Search results" })).not.toHaveAttribute("data-choosing");
    });

    it("opens the page of a hit without a place", async () => {
        const { user, input } = await setup();
        const list = await typeAndWait(user, input);
        await user.click(within(list).getByRole("option", { name: /DJ Test/ }));
        expect(location()).toBe("/performers/performer-1");
        expect(listbox()).toBeNull();
    });

    it("omits the query when the box was emptied before picking", async () => {
        const { user, input } = await setup({ route: "/events/1" });
        const list = await typeAndWait(user, input);
        await user.clear(input);
        expect(list).toBeInTheDocument();
        await user.click(within(list).getByRole("option", { name: /A38/ }));
        await settle(0);
        expect(location()).toBe("/?focus=place-1");
    });

    it("opens the entity page from the View button", async () => {
        const { user, input } = await setup();
        const list = await typeAndWait(user, input);
        await user.click(first(within(list).getAllByRole("button", { name: "View" })));
        expect(location()).toBe("/places/place-1");
        expect(listbox()).toBeNull();
    });

    it("closes on outside click and Escape and reopens on focus", async () => {
        const { user, input } = await setup();
        await typeAndWait(user, input);

        await user.click(document.body);
        expect(listbox()).toBeNull();

        await user.click(input);
        expect(listbox()).toBeInTheDocument();

        await user.keyboard("{Escape}");
        expect(listbox()).toBeNull();
    });

    it("counts as expanded while focused or showing results, with a back button that steps out", async () => {
        const { user, input } = await setup();
        expect(expanded()).toBe("false");
        expect(screen.queryByRole("button", { name: "Close search" })).toBeNull();
        expect(screen.getByRole("combobox", { name: "Search" }).closest(".root")).not.toHaveAttribute("data-expanded");

        await user.click(input);
        expect(expanded()).toBe("true");
        expect(input.closest(".root")).toHaveAttribute("data-expanded", "true");

        await typeAndWait(user, input);
        // A pointer press on the back button must not blur the input and unmount the button under the pointer.
        const back = screen.getByRole("button", { name: "Close search" });
        const press = fireEvent.mouseDown(back);
        expect(press).toBe(false);
        await user.click(back);
        expect(listbox()).toBeNull();
        expect(input).toHaveValue("techno");
        expect(input).not.toHaveFocus();
        expect(expanded()).toBe("false");
        expect(screen.queryByRole("button", { name: "Close search" })).toBeNull();
    });

    it("stays expanded while the results show even after the input loses focus", async () => {
        const { user, input } = await setup();
        await typeAndWait(user, input);
        act(() => input.blur());
        expect(listbox()).toBeInTheDocument();
        expect(expanded()).toBe("true");
    });

    it("reports a collapsed search when unmounted", async () => {
        const { user, input } = await setup();
        await user.click(input);
        expect(expanded()).toBe("true");
        await user.click(screen.getByRole("button", { name: "unmount search" }));
        expect(expanded()).toBe("false");
    });

    it("can hide the results without clearing the query", async () => {
        const { user, input } = await setup();
        await typeAndWait(user, input);
        const hide = screen.getByRole("button", { name: "Hide results" });
        expect(hide).toHaveClass("round-active", "hide-results");

        await user.click(hide);
        expect(listbox()).toBeNull();
        expect(input).toHaveValue("techno");
        const hidden = screen.getByRole("button", { name: "Results hidden" });
        expect(hidden).toBeDisabled();
        expect(hidden).toHaveClass("round-muted");
    });

    it("stays quiet while a place is focused and resumes after typing", async () => {
        const routes = { ...DEFAULT_ROUTES, "GET /api/search?q=technox": response("technox") };
        const { user, input, fetchMock } = await setup({
            route: "/?focus=place-1&q=techno",
            initialQuery: "techno",
            routes,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(listbox()).toBeNull();
        expect(highlight()).toBe("");

        await user.type(input, "x");
        expect(location()).toBe("/?q=techno");
        await settle();
        expect(requestedUrls(fetchMock)).toContain("http://api.test/api/search?q=technox");
        expect(await screen.findByRole("listbox", { name: "Search results" })).toBeInTheDocument();
        expect(highlight()).toBe("place-1,place-2");
    });

    it("drops the focus parameter but keeps the query on Enter", async () => {
        const { user, input } = await setup({ route: "/?focus=place-1", initialQuery: "techno" });
        await user.click(input);
        await user.keyboard("{Enter}");
        await settle(0);
        expect(location()).toBe("/?q=techno");
        expect(highlight()).toBe("place-1,place-2");
    });

    it("drops the highlights when unmounted, without counting as a search", async () => {
        const { user, input } = await setup();
        await typeAndWait(user, input);
        expect(highlight()).toBe("place-1,place-2");
        const before = generation();
        await user.click(screen.getByRole("button", { name: "unmount search" }));
        expect(screen.queryByRole("combobox")).toBeNull();
        expect(highlight()).toBe("");
        expect(generation()).toBe(before);
    });

    it("comes back from the history quietly: results closed, hits republished without counting as a search", async () => {
        const routes = { ...DEFAULT_ROUTES, "GET /api/search?q=technox": response("technox", [eventHit]) };
        const { user, input } = await setup({
            route: "/?q=techno",
            history: ["/places/x"],
            initialQuery: "techno",
            routes,
        });
        await settle();
        expect(listbox()).toBeNull();
        expect(highlight()).toBe("place-1,place-2");
        expect(generation()).toBe(0);
        expect(expanded()).toBe("false");

        // Typing is the user's search again.
        await user.type(input, "x");
        await settle();
        expect(await screen.findByRole("listbox", { name: "Search results" })).toBeInTheDocument();
        expect(highlight()).toBe("place-2");
        expect(generation()).toBeGreaterThan(0);
    });

    it("counts a query reached through a link as the user's search and shows its results", async () => {
        const { user, input } = await setup({ route: "/browse" });
        await typeAndWait(user, input);
        await user.keyboard("{Enter}");
        await settle(0);
        expect(location()).toBe("/?q=techno");
        expect(generation()).toBeGreaterThan(0);
    });

    it("hides the results on a press on the map and keeps that click from the map", async () => {
        const { user, input } = await setup();
        await typeAndWait(user, input);
        const mapEl = document.createElement("div");
        mapEl.className = "leaflet-container";
        document.body.appendChild(mapEl);
        const onMapClick = vi.fn();
        mapEl.addEventListener("click", onMapClick);
        try {
            fireEvent.pointerDown(mapEl);
            expect(listbox()).toBeNull();
            fireEvent.click(mapEl);
            expect(onMapClick).not.toHaveBeenCalled();
            // Only the press that closed the results is kept from the map.
            fireEvent.click(mapEl);
            expect(onMapClick).toHaveBeenCalledTimes(1);

            // A press elsewhere lets the map have its clicks.
            act(() => input.blur());
            await user.click(input);
            expect(listbox()).not.toBeNull();
            fireEvent.pointerDown(document.body);
            expect(listbox()).toBeNull();
            fireEvent.click(mapEl);
            expect(onMapClick).toHaveBeenCalledTimes(2);

            // A press on a pin is a tap on the pin: it closes the results and still reaches the pin.
            const pin = document.createElement("div");
            pin.className = "leaflet-marker-icon";
            mapEl.appendChild(pin);
            act(() => input.blur());
            await user.click(input);
            expect(listbox()).not.toBeNull();
            fireEvent.pointerDown(pin);
            expect(listbox()).toBeNull();
            fireEvent.click(pin);
            expect(onMapClick).toHaveBeenCalledTimes(3);
        } finally {
            mapEl.remove();
        }
    });
});
