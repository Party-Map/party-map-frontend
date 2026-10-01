import { readFileSync } from "node:fs";
import path from "node:path";

import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

import { TILE_ATTRIBUTION } from "@/lib/constants";

import { PALETTES } from "./palette";
import {
    basemapStyle,
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
            if (layer.type === "background" || layer.id === "sky") continue;
            expect(layer.source).toBe("osm");
            expect(SOURCE_LAYERS).toContain(layer["source-layer"]);
        }
    });

    it("covers everything beyond the border with a starry sky", () => {
        const source = light.sources.sky as { type: string; data: GeoJSON.Feature<GeoJSON.Polygon> };
        expect(source.type).toBe("geojson");
        const [world, hole] = source.data.geometry.coordinates;
        expect(world).toHaveLength(5);
        expect(hole?.length).toBeGreaterThan(1000);
        // GeoJSON winding: the outline arrives counter-clockwise and is reversed into a clockwise hole.
        const area = (ring: number[][]) =>
            ring.reduce((sum, [x1 = 0, y1 = 0], i) => {
                const [x2 = 0, y2 = 0] = ring[(i + 1) % ring.length] ?? [];
                return sum + (x2 - x1) * (y2 + y1);
            }, 0);
        expect(area(world ?? [])).toBeLessThan(0);
        expect(area(hole ?? [])).toBeGreaterThan(0);
        const sky = light.layers.find((layer) => layer.id === "sky");
        expect(sky).toMatchObject({ type: "fill", source: "sky", paint: { "fill-pattern": "stars-light" } });
        expect(dark.layers.find((layer) => layer.id === "sky")).toMatchObject({
            paint: { "fill-pattern": "stars-dark" },
        });
        const ids = light.layers.map((layer) => layer.id);
        expect(ids.indexOf("sky")).toBeGreaterThan(ids.indexOf("road-motorway"));
        expect(ids.indexOf("sky")).toBeLessThan(ids.indexOf("boundary-country"));
        expect(light.layers[0]).toMatchObject({
            type: "background",
            paint: { "background-color": PALETTES.light.land },
        });
    });

    it("stacks the sky, land, water, roads, the border and labels in that order", () => {
        expect(light.layers.map((layer) => layer.id)).toMatchInlineSnapshot(`
          [
            "background",
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
            "sky",
            "boundary-country",
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

    it("keeps the map background token in step with the palettes", () => {
        const base = readFileSync(path.resolve(process.cwd(), "src/styles/base.scss"), "utf8");
        const tokens = [...base.matchAll(/--map-bg: (#[0-9a-f]{6});/g)].map((match) => match[1]);
        expect(tokens).toEqual([PALETTES.light.sky, PALETTES.dark.sky]);
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
