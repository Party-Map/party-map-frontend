vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));
vi.mock("@maplibre/maplibre-gl-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.maplibreLeafletMock));

import { act, render } from "@testing-library/react";
import { getWorkerUrl } from "maplibre-gl";

import { setThemeChoice } from "@/lib/theme";
import { fakeGlLayer, fakeGlMap, fakeMap, maplibreLeafletMock } from "@/test/mocks/leaflet";

import { Basemap } from "./Basemap";
import { STAR_SKY_PIXEL_RATIO } from "./basemap/stars";
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
    it("adds a non-interactive MapLibre layer with the themed style to the map", () => {
        render(<Basemap />);
        expect(maplibreLeafletMock.maplibreGL).toHaveBeenCalledWith(expect.objectContaining({ interactive: false }));
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

    it("hands MapLibre both star skies as soon as the style is parsed, and a missing one when it asks", () => {
        render(<Basemap />);
        expect(fakeGlMap.on).toHaveBeenCalledWith("style.load", expect.any(Function));
        expect(fakeGlMap.on).toHaveBeenCalledWith("styleimagemissing", expect.any(Function));
        fakeGlMap.fire("style.load");
        expect(fakeGlMap.addImage).toHaveBeenCalledTimes(2);
        expect(fakeGlMap.addImage).toHaveBeenCalledWith(
            "stars-dark",
            expect.objectContaining({ width: 512, height: 512 }),
            { pixelRatio: STAR_SKY_PIXEL_RATIO },
        );
        fakeGlMap.fire("styleimagemissing", { id: "pin" });
        fakeGlMap.hasImage.mockReturnValueOnce(true);
        fakeGlMap.fire("styleimagemissing", { id: "stars-light" });
        expect(fakeGlMap.addImage).toHaveBeenCalledTimes(2);
        fakeGlMap.fire("styleimagemissing", { id: "stars-light" });
        expect(fakeGlMap.addImage).toHaveBeenCalledTimes(3);
    });

    it("removes the layer on unmount", () => {
        const { unmount } = render(<Basemap />);
        unmount();
        expect(fakeGlLayer.remove).toHaveBeenCalledTimes(1);
    });
});
