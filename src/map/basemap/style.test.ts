import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

import { TILE_ATTRIBUTION } from "@/lib/constants";

import { HUNGARY_OUTLINE } from "./outline";
import { PALETTES } from "./palette";
import {
    basemapStyle,
    FIRST_LABEL_LAYER_ID,
    FONT_MEDIUM,
    FONT_REGULAR,
    FONT_SEMIBOLD,
    resolveTilesBase,
    SOURCE_LAYERS,
    SOURCE_MAXZOOM,
} from "./style";

const BASE = "http://tiles.test/tiles";
const light = basemapStyle("light", BASE);
const dark = basemapStyle("dark", BASE);
const FONTS = [FONT_REGULAR, FONT_MEDIUM, FONT_SEMIBOLD];

describe("basemapStyle", () => {
    it.each(["light", "dark"] as const)("is a valid MapLibre style in %s", (theme) => {
        expect(validateStyleMin(basemapStyle(theme, BASE))).toEqual([]);
    });

    it("reads the tiles and the glyphs from the tile server base", () => {
        expect(light.glyphs).toBe(`${BASE}/font/{fontstack}/{range}`);
        expect(light.sources.osm).toEqual({
            type: "vector",
            tiles: [`${BASE}/hungary/{z}/{x}/{y}`],
            minzoom: 0,
            maxzoom: SOURCE_MAXZOOM,
            attribution: TILE_ATTRIBUTION,
        });
    });

    it("draws only known OpenMapTiles layers from the tile source, each layer once", () => {
        const ids = light.layers.map((layer) => layer.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const layer of light.layers) {
            if (layer.type === "background" || layer.id === "land") continue;
            expect(layer.source).toBe("osm");
            expect(SOURCE_LAYERS).toContain(layer["source-layer"]);
        }
    });

    it("paints the country's land on an otherwise transparent canvas", () => {
        expect(light.sources.country).toEqual({ type: "geojson", data: HUNGARY_OUTLINE });
        const [ring] = HUNGARY_OUTLINE.geometry.coordinates;
        expect(ring?.length).toBeGreaterThan(1000);
        expect(ring?.[0]).toEqual(ring?.at(-1));
        expect(light.layers[0]).toEqual({
            id: "land",
            type: "fill",
            source: "country",
            paint: { "fill-color": PALETTES.light.land },
        });
        expect(dark.layers[0]).toMatchObject({ paint: { "fill-color": PALETTES.dark.land } });
        expect(light.layers.some((layer) => layer.type === "background")).toBe(false);
        expect(JSON.stringify(light)).not.toContain("fill-pattern");
        // The border is the land's own edge: no boundary line. The cutout (map/basemap/cutout.ts) goes in under the
        // first name layer at run time.
        expect(light.layers.some((layer) => layer.id.startsWith("boundary"))).toBe(false);
        expect(light.layers.find((layer) => layer.id === FIRST_LABEL_LAYER_ID)).toMatchObject({ type: "symbol" });
        const ids = light.layers.map((layer) => layer.id);
        expect(ids.indexOf(FIRST_LABEL_LAYER_ID)).toBe(ids.indexOf("road-motorway") + 1);
    });

    it("stacks the land, water, roads and labels in that order", () => {
        expect(light.layers.map((layer) => layer.id)).toMatchInlineSnapshot(`
          [
            "land",
            "water",
            "waterway",
            "road-minor-casing",
            "road-minor",
            "road-tertiary-casing",
            "road-tertiary",
            "road-secondary-casing",
            "road-secondary",
            "road-primary-casing",
            "road-primary",
            "road-trunk-casing",
            "road-trunk",
            "road-motorway-casing",
            "road-motorway",
            "water-name",
            "waterway-name",
            "road-name",
            "place-suburb",
            "place-village",
            "place-town",
            "place-city",
          ]
        `);
    });

    it("differs between light and dark only in the paint", () => {
        const strip = (layer: (typeof light.layers)[number]) => {
            const { paint: _paint, ...rest } = layer;
            return rest;
        };
        expect(dark.layers.map(strip)).toEqual(light.layers.map(strip));
        expect(dark.layers.map((layer) => layer.paint)).not.toEqual(light.layers.map((layer) => layer.paint));
        expect(dark.name).toBe("partymap-dark");
    });

    it("labels with the fonts Martin serves, in the local name", () => {
        const symbols = light.layers.filter((layer) => layer.type === "symbol");
        expect(symbols.length).toBeGreaterThan(0);
        for (const layer of symbols) {
            expect(FONTS).toContainEqual(layer.layout?.["text-font"]);
            expect(layer.layout?.["text-field"]).toEqual(["coalesce", ["get", "name"], ["get", "name:latin"]]);
        }
    });
});

describe("resolveTilesBase", () => {
    it("makes a path absolute on the given origin", () => {
        expect(resolveTilesBase("/tiles", "https://terkep.party")).toBe("https://terkep.party/tiles");
    });

    it("keeps an absolute base and trims trailing slashes", () => {
        expect(resolveTilesBase("https://tiles.test/tiles/", "https://terkep.party")).toBe("https://tiles.test/tiles");
    });

    it("defaults to the page's origin", () => {
        expect(resolveTilesBase("/tiles")).toBe(`${window.location.origin}/tiles`);
    });
});
