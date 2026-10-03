vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));
vi.mock("@maplibre/maplibre-gl-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.maplibreLeafletMock));

import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import L from "leaflet";

import type { ID, Place } from "@/api/types";
import { useHighlight } from "@/layout/HighlightProvider";
import { type CameraTarget, fitTarget, showTarget } from "@/map/camera";
import { SEARCH_ZOOM } from "@/map/CameraDirector";
import { toLatLngTuple } from "@/map/geo";
import { mapInsets } from "@/map/insets";
import { forgetMap, recallMap, rememberMap } from "@/map/mapMemory";
import { place, place2, upcoming } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";
import { fakeGlLayer, fakeMap, reactLeafletMock } from "@/test/mocks/leaflet";

import { MapPage } from "./MapPage";

const ROUTES = {
    "GET /api/places": [place, place2],
    "GET /api/events/upcoming-events": [upcoming],
};
/** The open card's box as the fake popup reports it (test/mocks/leaflet.tsx fakeCardBox). */
const CARD = { left: -161, top: -288, right: 161, bottom: -68 };

/** Test-only way to change the highlights the way the search bar would. */
function HighlightSetter({ ids }: { ids: ID[] }) {
    const { setHighlightIds, focusPlace } = useHighlight();
    return (
        <>
            <button type="button" onClick={() => setHighlightIds(ids)}>
                set highlights
            </button>
            <button type="button" onClick={() => focusPlace(place2.id)}>
                focus place
            </button>
        </>
    );
}

function pin(index: number): HTMLElement {
    const el = screen.getAllByTestId("marker")[index];
    if (!el) throw new Error(`no marker at ${index}`);
    return el;
}

async function renderLoaded(route = "/", history?: string[]) {
    mockApi(ROUTES);
    const view = renderWithProviders(
        <>
            <MapPage />
            <HighlightSetter ids={[place2.id]} />
        </>,
        history ? { route, history } : { route },
    );
    await screen.findAllByTestId("marker");
    return view;
}

/** Where a search flies for one place: centred between the bars at the search zoom, with its card if it opens. */
function searchFlight(of: Place, card: typeof CARD | null): CameraTarget {
    const size = fakeMap.getSize();
    return showTarget({
        pin: toLatLngTuple(of.location),
        card,
        center: fakeMap.getCenter(),
        zoom: SEARCH_ZOOM,
        size,
        insets: mapInsets(size.x),
        mode: "center",
    });
}

function expectFlight(target: CameraTarget, duration: number) {
    expect(fakeMap.flyTo).toHaveBeenCalledTimes(1);
    const [center, zoom, options] = fakeMap.flyTo.mock.calls[0] as [L.LatLng, number, object];
    expect(center.equals(target.center)).toBe(true);
    expect(zoom).toBe(target.zoom);
    expect(options).toEqual({ duration });
}

beforeEach(() => {
    fakeMap.reset();
    forgetMap();
});
afterEach(() => {
    fakeMap.getCenter.mockReturnValue(L.latLng(47.5, 19.05));
    fakeMap.getZoom.mockReturnValue(13);
    fakeMap.getBounds.mockReturnValue({
        getWest: () => 19.0,
        getSouth: () => 47.45,
        getEast: () => 19.1,
        getNorth: () => 47.55,
    });
});

describe("MapPage", () => {
    it("starts from Budapest and remembers the view and the open card for the next visit", async () => {
        await renderLoaded();
        expect(screen.getByTestId("map")).toHaveAttribute("data-center", "[47.4979,19.0402]");
        expect(screen.getByTestId("map")).toHaveAttribute("data-zoom", "13");
        expect(recallMap()).toEqual({ center: [47.5, 19.05], zoom: 13, popupId: null });

        fireEvent.click(pin(0));
        await waitFor(() => expect(recallMap()?.popupId).toBe(place.id));

        fakeMap.getCenter.mockReturnValue(L.latLng(46.2, 20.1));
        fakeMap.getZoom.mockReturnValue(11);
        act(() => {
            reactLeafletMock.fireMapEvent("moveend");
        });
        await waitFor(() => expect(recallMap()).toEqual({ center: [46.2, 20.1], zoom: 11, popupId: place.id }));
    });

    it("comes back to the remembered view with the remembered card open, without moving the map", async () => {
        rememberMap({ center: [47.6, 19.2], zoom: 15, popupId: place2.id });
        await renderLoaded();
        expect(screen.getByTestId("map")).toHaveAttribute("data-center", "[47.6,19.2]");
        expect(screen.getByTestId("map")).toHaveAttribute("data-zoom", "15");
        expect(await screen.findByTestId("popup")).toHaveTextContent(place2.name);
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(fakeMap.panTo).not.toHaveBeenCalled();
    });

    it("lets the remembered map win over ?focus when coming back through the history", async () => {
        rememberMap({ center: [47.6, 19.2], zoom: 15, popupId: place2.id });
        await renderLoaded(`/?focus=${place.id}`, ["/places/somewhere"]);
        expect(await screen.findByTestId("popup")).toHaveTextContent(place2.name);
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
        expect(fakeMap.panTo).not.toHaveBeenCalled();
    });

    it("shows a loading state over an empty map", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() => new Promise<Response>(() => {})),
        );
        renderWithProviders(<MapPage />);
        expect(await screen.findByRole("status")).toHaveTextContent("Loading map…");
        expect(screen.getByTestId("map")).toBeInTheDocument();
        expect(screen.queryAllByTestId("marker")).toHaveLength(0);
    });

    it("shows an error with retry when loading fails, then renders the map", async () => {
        let attempts = 0;
        mockApi({
            ...ROUTES,
            "GET /api/places": () => {
                attempts += 1;
                return attempts === 1 ? new Response("nope", { status: 500 }) : [place, place2];
            },
        });
        renderWithProviders(<MapPage />);

        expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the map.");
        expect(screen.queryAllByTestId("marker")).toHaveLength(0);

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findAllByTestId("marker")).toHaveLength(2);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("renders the basemap and a pin and a label per place", async () => {
        await renderLoaded();
        expect(screen.getAllByTestId("marker")).toHaveLength(2);
        await waitFor(() => expect(fakeGlLayer.addTo).toHaveBeenCalledWith(fakeMap));
        expect(screen.getByText(upcoming.title)).toBeInTheDocument();
        expect(screen.getByText(place2.name)).toBeInTheDocument();
        expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it("toggles the popup from its pin and closes it from the card or the map", async () => {
        await renderLoaded();
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();

        fireEvent.click(pin(0));
        expect(screen.getByTestId("popup")).toHaveTextContent(upcoming.title);
        fireEvent.click(pin(0));
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();

        fireEvent.click(pin(1));
        expect(screen.getByTestId("popup")).toHaveTextContent(place2.name);
        fireEvent.click(pin(0));
        expect(screen.getByTestId("popup")).toHaveTextContent(upcoming.title);

        fireEvent.click(screen.getByRole("button", { name: "Close popup" }));
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();

        fireEvent.click(pin(0));
        act(() => {
            reactLeafletMock.fireMapEvent("click");
        });
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
    });

    it("keeps the open card's place loaded when it leaves the viewport", async () => {
        let loads = 0;
        mockApi({
            ...ROUTES,
            "GET /api/places": () => {
                loads += 1;
                return loads === 1 ? [place, place2] : [];
            },
            [`GET /api/places/${place.id}`]: place,
        });
        renderWithProviders(<MapPage />);
        await screen.findAllByTestId("marker");
        fireEvent.click(pin(0));
        expect(screen.getByTestId("popup")).toHaveTextContent(upcoming.title);

        fakeMap.getBounds.mockReturnValue({
            getWest: () => 20.1,
            getSouth: () => 46.2,
            getEast: () => 20.2,
            getNorth: () => 46.3,
        });
        act(() => {
            reactLeafletMock.fireMapEvent("moveend");
        });
        await waitFor(() => expect(loads).toBe(2));
        await waitFor(() => expect(screen.getAllByTestId("marker")).toHaveLength(1));
        expect(screen.getByTestId("popup")).toHaveTextContent(upcoming.title);
        expect(fakeMap.panTo).not.toHaveBeenCalled();
    });

    it("closes the popup when the highlights change and flies to the new ones", async () => {
        await renderLoaded();
        fireEvent.click(pin(0));
        expect(screen.getByTestId("popup")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "set highlights" }));
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
        expectFlight(searchFlight(place2, null), 0.6);

        // Popups open again under the new highlights.
        fireEvent.click(pin(0));
        expect(screen.getByTestId("popup")).toBeInTheDocument();
    });

    it("highlights the place from ?focus, opens its card and flies to both in one move", async () => {
        await renderLoaded(`/?focus=${place.id}`);
        expect(screen.getByTestId("popup")).toHaveTextContent(upcoming.title);
        await waitFor(() => expect(fakeMap.flyTo).toHaveBeenCalled());
        expectFlight(searchFlight(place, CARD), 0.6);
        expect(fakeMap.panTo).not.toHaveBeenCalled();
    });

    it("opens the card of a focused place, and again when it is picked after closing", async () => {
        await renderLoaded();
        fireEvent.click(pin(0));
        expect(screen.getByTestId("popup")).toHaveTextContent(upcoming.title);

        fireEvent.click(screen.getByRole("button", { name: "focus place" }));
        expect(screen.getByTestId("popup")).toHaveTextContent(place2.name);

        fireEvent.click(screen.getByRole("button", { name: "Close popup" }));
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
        fireEvent.click(pin(0));
        expect(screen.getByTestId("popup")).toHaveTextContent(upcoming.title);

        fireEvent.click(screen.getByRole("button", { name: "focus place" }));
        expect(screen.getByTestId("popup")).toHaveTextContent(place2.name);

        // Plain highlights (typing a search) never open a card on their own.
        fireEvent.click(screen.getByRole("button", { name: "set highlights" }));
        expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
    });

    it("opens the card of a focused place outside the viewport once it has loaded", async () => {
        const faraway = {
            ...place2,
            id: "place-far",
            name: "Far Club",
            location: { latitude: 46.25, longitude: 20.15 },
        };
        mockApi({ ...ROUTES, "GET /api/places": [place], [`GET /api/places/${faraway.id}`]: faraway });
        renderWithProviders(<MapPage />, { route: `/?focus=${faraway.id}` });

        expect(await screen.findByTestId("popup")).toHaveTextContent("Far Club");
    });

    it("loads the places around the viewport and reloads them after a move", async () => {
        const fetchMock = mockApi(ROUTES);
        renderWithProviders(<MapPage />);
        await screen.findAllByTestId("marker");
        const placeUrls = () =>
            fetchMock.requests.map((r) => new URL(r.url)).filter((u) => u.pathname === "/api/places");
        expect(placeUrls().map((u) => u.searchParams.get("bbox"))).toEqual(["18.95,47.4,19.15,47.6"]);

        fakeMap.getBounds.mockReturnValue({
            getWest: () => 20.1,
            getSouth: () => 46.2,
            getEast: () => 20.2,
            getNorth: () => 46.3,
        });
        act(() => {
            reactLeafletMock.fireMapEvent("moveend");
        });
        // The pins of the previous viewport stay while the next one loads.
        expect(screen.getAllByTestId("marker")).toHaveLength(2);
        await waitFor(() => expect(placeUrls()).toHaveLength(2));
        expect(placeUrls()[1]?.searchParams.get("bbox")).toBe("20.05,46.15,20.25,46.35");
    });

    it("loads a highlighted place outside the viewport and flies to it with its card", async () => {
        const faraway = { ...place2, id: "place-far", location: { latitude: 46.25, longitude: 20.15 } };
        mockApi({ ...ROUTES, "GET /api/places": [place], [`GET /api/places/${faraway.id}`]: faraway });
        renderWithProviders(<MapPage />, { route: `/?focus=${faraway.id}` });

        await waitFor(() => expect(screen.getAllByTestId("marker")).toHaveLength(2));
        await waitFor(() => expect(fakeMap.flyTo).toHaveBeenCalled());
        expectFlight(searchFlight(faraway, CARD), 0.6);
    });

    it("fits the view around several highlighted places once all of them have loaded", async () => {
        const far1 = { ...place2, id: "place-far-1", location: { latitude: 46.25, longitude: 20.15 } };
        const far2 = { ...place2, id: "place-far-2", location: { latitude: 46.9, longitude: 17.9 } };
        let releaseSecond: (value: Response) => void = () => {};
        mockApi({
            ...ROUTES,
            "GET /api/places": [place],
            [`GET /api/places/${far1.id}`]: far1,
            [`GET /api/places/${far2.id}`]: () =>
                new Promise<Response>((resolve) => {
                    releaseSecond = resolve;
                }),
        });
        renderWithProviders(
            <>
                <MapPage />
                <HighlightSetter ids={[far1.id, far2.id]} />
            </>,
        );
        await screen.findAllByTestId("marker");

        fireEvent.click(screen.getByRole("button", { name: "set highlights" }));
        await waitFor(() => expect(screen.getAllByTestId("marker")).toHaveLength(2));
        expect(fakeMap.flyTo).not.toHaveBeenCalled();

        releaseSecond(Response.json(far2));
        await waitFor(() => expect(fakeMap.flyTo).toHaveBeenCalledTimes(1));
        expect(screen.getAllByTestId("marker")).toHaveLength(3);
        const size = fakeMap.getSize();
        const wanted = fitTarget([toLatLngTuple(far1.location), toLatLngTuple(far2.location)], size, mapInsets(size.x));
        expectFlight(wanted, 0.8);
    });
});
