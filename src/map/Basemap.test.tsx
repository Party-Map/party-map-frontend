vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));
vi.mock("@maplibre/maplibre-gl-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.maplibreLeafletMock));

import { act, render } from "@testing-library/react";
import { getWorkerUrl } from "maplibre-gl";

import { setThemeChoice } from "@/lib/theme";
import { fakeGlLayer, fakeGlMap, fakeMap, maplibreLeafletMock } from "@/test/mocks/leaflet";

import { Basemap } from "./Basemap";
import { CUTOUT_LAYER_ID } from "./basemap/cutout";
import type { basemapStyle } from "./basemap/style";
import { MAPLIBRE_WORKER_URL } from "./basemap/worker";

type Style = ReturnType<typeof basemapStyle>;

const createdStyle = (): Style => {
    const options = maplibreLeafletMock.maplibreGL.mock.calls[0]?.[0];
    return (options as { style: Style }).style;
};

beforeEach(() => {
    fakeMap.reset();
    setThemeChoice("light");
});

afterEach(() => setThemeChoice("system"));

describe("Basemap", () => {
    it("adds a non-interactive, antialiased, single-world MapLibre layer with the themed style to the map", () => {
        render(<Basemap />);
        expect(maplibreLeafletMock.maplibreGL).toHaveBeenCalledWith(
            expect.objectContaining({
                interactive: false,
                renderWorldCopies: false,
                canvasContextAttributes: { antialias: true },
            }),
        );
        expect(fakeGlLayer.addTo).toHaveBeenCalledWith(fakeMap);
        expect(getWorkerUrl()).toBe(MAPLIBRE_WORKER_URL);
        const style = createdStyle();
        expect(style.name).toBe("partymap-light");
        expect(style.sources.osm).toMatchObject({ tiles: [`${window.location.origin}/tiles/hungary/{z}/{x}/{y}`] });
        expect(fakeGlMap.setStyle).not.toHaveBeenCalled();
    });

    it("swaps the style in place when the theme changes", () => {
        render(<Basemap />);
        act(() => setThemeChoice("dark"));
        expect(fakeGlMap.setStyle).toHaveBeenCalledTimes(1);
        expect(fakeGlMap.setStyle).toHaveBeenCalledWith(expect.objectContaining({ name: "partymap-dark" }), {
            diff: true,
        });
        expect(maplibreLeafletMock.maplibreGL).toHaveBeenCalledTimes(1);
    });

    it("slips the cutout layer in under the names once the style is parsed, never twice", () => {
        render(<Basemap />);
        expect(fakeGlMap.on).toHaveBeenCalledTimes(1);
        expect(fakeGlMap.on).toHaveBeenCalledWith("style.load", expect.any(Function));
        expect(fakeGlMap.addLayer).not.toHaveBeenCalled();
        fakeGlMap.fire("style.load");
        expect(fakeGlMap.addLayer).toHaveBeenCalledTimes(1);
        expect(fakeGlMap.addLayer).toHaveBeenCalledWith(
            expect.objectContaining({ id: CUTOUT_LAYER_ID, type: "custom", render: expect.any(Function) }),
            "water-name",
        );
        fakeGlMap.getLayer.mockReturnValueOnce({ id: CUTOUT_LAYER_ID });
        fakeGlMap.fire("style.load");
        expect(fakeGlMap.getLayer).toHaveBeenCalledWith(CUTOUT_LAYER_ID);
        expect(fakeGlMap.addLayer).toHaveBeenCalledTimes(1);
    });

    it("removes the layer on unmount", () => {
        const { unmount } = render(<Basemap />);
        unmount();
        expect(fakeGlLayer.remove).toHaveBeenCalledTimes(1);
    });
});
