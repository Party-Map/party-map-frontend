import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from "maplibre-gl";

import { TILE_ATTRIBUTION } from "@/lib/constants";
import type { Theme } from "@/lib/theme";

import { type Palette, PALETTES, type RoadClass } from "./palette";

/** Martin's source id: the file stem of tiles/data/hungary.pmtiles. */
export const TILES_SOURCE = "hungary";
/** Planetiler's --maxzoom; MapLibre overzooms the zoom 14 tiles above it. */
export const SOURCE_MAXZOOM = 14;
/** The font names Martin lists in /tiles/catalog for tiles/fonts (family + style from the TTF). */
export const FONT_REGULAR = ["Inter Regular"];
export const FONT_MEDIUM = ["Inter Medium"];
export const FONT_SEMIBOLD = ["Inter SemiBold"];
/** The OpenMapTiles layers the style draws: water, roads, the border and names; no landcover, buildings, POIs or rail. */
export const SOURCE_LAYERS = [
    "water",
    "waterway",
    "boundary",
    "transportation",
    "transportation_name",
    "place",
    "water_name",
] as const;

const SOURCE = "osm";
type Stops = [zoom: number, value: number][];
type Output = number | ExpressionSpecification;

/** The MapLibre expression DSL has no useful literal types; every expression is built through this. */
const expr = (parts: unknown[]): ExpressionSpecification => parts as ExpressionSpecification;
const get = (field: string) => expr(["get", field]);
const classIn = (classes: readonly string[]) => expr(["match", get("class"), [...classes], true, false]);
const all = (...conditions: ExpressionSpecification[]) => expr(["all", ...conditions]);
/** Widths grow exponentially with the zoom, as the ground shrinks; a stop's value may depend on the feature. */
const widthByZoom = (stops: [zoom: number, value: Output][]) =>
    expr(["interpolate", ["exponential", 1.4], ["zoom"], ...stops.flat()]);
const linearByZoom = (stops: Stops) => expr(["interpolate", ["linear"], ["zoom"], ...stops.flat()]);
/** Link roads (ramps) at six tenths of their class's width. */
const rampAware = (width: number) => expr(["case", ["==", get("ramp"), 1], width * 0.6, width]);
const roadWidth = (stops: Stops) => widthByZoom(stops.map(([zoom, width]) => [zoom, rampAware(width)]));
/** Thick outlines are the cartoon look. */
const casingWidth = (stops: Stops) => widthByZoom(stops.map(([zoom, width]) => [zoom, rampAware(width * 1.3 + 1.5)]));
/** Hungarian names, as OpenStreetMap stores them; Latin transliterations for the rest. */
const NAME = expr(["coalesce", get("name"), get("name:latin")]);
const ROUND = { "line-cap": "round", "line-join": "round" } as const;

interface Road {
    cls: RoadClass;
    minzoom: number;
    width: Stops;
}

/** Tunnels are drawn like any road: one less thing to read. */
const ROADS: readonly Road[] = [
    {
        cls: "minor",
        minzoom: 13,
        width: [
            [13, 1],
            [14, 2.5],
            [18, 14],
        ],
    },
    {
        cls: "tertiary",
        minzoom: 11,
        width: [
            [11, 1],
            [14, 3.5],
            [18, 16],
        ],
    },
    {
        cls: "secondary",
        minzoom: 9,
        width: [
            [9, 1],
            [14, 4],
            [18, 18],
        ],
    },
    {
        cls: "primary",
        minzoom: 7,
        width: [
            [7, 1.2],
            [14, 5],
            [18, 22],
        ],
    },
    {
        cls: "trunk",
        minzoom: 6,
        width: [
            [6, 1.2],
            [14, 5],
            [18, 22],
        ],
    },
    {
        cls: "motorway",
        minzoom: 5,
        width: [
            [5, 1.5],
            [14, 6],
            [18, 24],
        ],
    },
];
const ROAD_CLASSES = ROADS.map((road) => road.cls);

function roadLayers(p: Palette, road: Road): LayerSpecification[] {
    const colors = p.roads[road.cls];
    const filter = classIn([road.cls]);
    return [
        {
            id: `road-${road.cls}-casing`,
            type: "line",
            source: SOURCE,
            "source-layer": "transportation",
            minzoom: road.minzoom,
            filter,
            layout: ROUND,
            paint: { "line-color": colors.casing, "line-width": casingWidth(road.width) },
        },
        {
            id: `road-${road.cls}`,
            type: "line",
            source: SOURCE,
            "source-layer": "transportation",
            minzoom: road.minzoom,
            filter,
            layout: ROUND,
            paint: { "line-color": colors.fill, "line-width": roadWidth(road.width) },
        },
    ];
}

function textPaint(color: string, halo: string, haloWidth = 2) {
    return { "text-color": color, "text-halo-color": halo, "text-halo-width": haloWidth } as const;
}

/** Settlement names: bold, generously spaced, the bigger the place the earlier and larger. */
function placeLayer(
    p: Palette,
    id: string,
    classes: string[],
    zooms: [minzoom: number, maxzoom: number],
    size: Output,
    font: string[],
): LayerSpecification {
    return {
        id,
        type: "symbol",
        source: SOURCE,
        "source-layer": "place",
        minzoom: zooms[0],
        maxzoom: zooms[1],
        filter: classIn(classes),
        layout: {
            "text-field": NAME,
            "text-font": font,
            "text-size": size,
            "text-max-width": 8,
            "text-padding": 12,
            "symbol-sort-key": get("rank"),
        },
        paint: textPaint(p.placeText, p.textHalo),
    };
}

/** The layers, bottom to top. Light and dark share everything but the colours they take from the palette. */
function layers(p: Palette): LayerSpecification[] {
    return [
        { id: "background", type: "background", paint: { "background-color": p.background } },
        {
            id: "water",
            type: "fill",
            source: SOURCE,
            "source-layer": "water",
            paint: { "fill-color": p.water },
        },
        {
            id: "waterway",
            type: "line",
            source: SOURCE,
            "source-layer": "waterway",
            minzoom: 9,
            filter: classIn(["river", "canal"]),
            layout: ROUND,
            paint: {
                "line-color": p.waterLine,
                "line-width": widthByZoom([
                    [9, 1.5],
                    [14, 4],
                    [18, 10],
                ]),
            },
        },
        ...ROADS.flatMap((road) => roadLayers(p, road)),
        {
            id: "boundary-country",
            type: "line",
            source: SOURCE,
            "source-layer": "boundary",
            filter: all(expr(["==", get("admin_level"), 2]), expr(["==", get("maritime"), 0])),
            paint: {
                "line-color": p.boundary,
                "line-width": linearByZoom([
                    [4, 1.5],
                    [12, 3],
                ]),
                "line-dasharray": [3, 2],
            },
        },
        {
            id: "water-name",
            type: "symbol",
            source: SOURCE,
            "source-layer": "water_name",
            minzoom: 8,
            filter: classIn(["lake", "sea", "ocean"]),
            layout: {
                "text-field": NAME,
                "text-font": FONT_SEMIBOLD,
                "text-size": 13,
                "text-max-width": 6,
                "text-letter-spacing": 0.05,
            },
            paint: textPaint(p.waterText, p.water, 1),
        },
        {
            id: "waterway-name",
            type: "symbol",
            source: SOURCE,
            "source-layer": "waterway",
            minzoom: 12,
            filter: classIn(["river"]),
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": 500,
                "text-field": NAME,
                "text-font": FONT_SEMIBOLD,
                "text-size": 12,
                "text-max-angle": 30,
            },
            paint: textPaint(p.waterText, p.water, 1),
        },
        {
            id: "road-name",
            type: "symbol",
            source: SOURCE,
            "source-layer": "transportation_name",
            minzoom: 15,
            filter: classIn(ROAD_CLASSES),
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": 400,
                "text-field": NAME,
                "text-font": FONT_MEDIUM,
                "text-size": 12,
                "text-max-angle": 30,
                "text-padding": 6,
            },
            paint: textPaint(p.text, p.textHalo),
        },
        {
            id: "place-suburb",
            type: "symbol",
            source: SOURCE,
            "source-layer": "place",
            minzoom: 12,
            maxzoom: 15,
            filter: classIn(["suburb"]),
            layout: {
                "text-field": NAME,
                "text-font": FONT_SEMIBOLD,
                "text-size": 11,
                "text-transform": "uppercase",
                "text-letter-spacing": 0.12,
                "text-max-width": 7,
                "text-padding": 40,
                "symbol-sort-key": get("rank"),
            },
            paint: { ...textPaint(p.placeText, p.textHalo), "text-opacity": 0.7 },
        },
        // Settlement names make way for street names once the viewer is inside the settlement.
        placeLayer(
            p,
            "place-village",
            ["village"],
            [11, 17],
            linearByZoom([
                [11, 11],
                [14, 13],
            ]),
            FONT_MEDIUM,
        ),
        placeLayer(
            p,
            "place-town",
            ["town"],
            [8, 16],
            linearByZoom([
                [8, 12],
                [14, 16],
            ]),
            FONT_SEMIBOLD,
        ),
        placeLayer(
            p,
            "place-city",
            ["city"],
            [5, 15],
            expr([
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                ["case", ["<=", get("rank"), 3], 14, 12],
                12,
                ["case", ["<=", get("rank"), 3], 22, 17],
            ]),
            FONT_SEMIBOLD,
        ),
    ];
}

/** Turns the configured base ("/tiles" or a URL) into the absolute URL MapLibre needs, without a trailing slash. */
export function resolveTilesBase(base: string, origin: string = window.location.origin): string {
    return new URL(base, origin).href.replace(/\/+$/, "");
}

/** The MapLibre style of the basemap in the given theme, reading tiles and glyphs from the tile server. */
export function basemapStyle(theme: Theme, tilesBase: string): StyleSpecification {
    return {
        version: 8,
        name: `partymap-${theme}`,
        glyphs: `${tilesBase}/font/{fontstack}/{range}`,
        sources: {
            [SOURCE]: {
                type: "vector",
                tiles: [`${tilesBase}/${TILES_SOURCE}/{z}/{x}/{y}`],
                minzoom: 0,
                maxzoom: SOURCE_MAXZOOM,
                attribution: TILE_ATTRIBUTION,
            },
        },
        layers: layers(PALETTES[theme]),
    };
}
