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
/** The OpenMapTiles layers the style draws (no POIs, house numbers or peaks). */
export const SOURCE_LAYERS = [
    "landcover",
    "landuse",
    "park",
    "water",
    "waterway",
    "aeroway",
    "boundary",
    "transportation",
    "building",
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
const notTunnel = expr(["!=", get("brunnel"), "tunnel"]);
const all = (...conditions: ExpressionSpecification[]) => expr(["all", ...conditions]);
/** A value per feature class (the zoom interpolation has to stay the outermost expression). */
const byClass = (cls: string, matching: number, other: number) => expr(["match", get("class"), cls, matching, other]);
/** Widths grow exponentially with the zoom, as the ground shrinks; a stop's value may depend on the feature. */
const widthByZoom = (stops: [zoom: number, value: Output][]) =>
    expr(["interpolate", ["exponential", 1.4], ["zoom"], ...stops.flat()]);
const linearByZoom = (stops: Stops) => expr(["interpolate", ["linear"], ["zoom"], ...stops.flat()]);
/** Link roads (ramps) at six tenths of their class's width. */
const rampAware = (width: number) => expr(["case", ["==", get("ramp"), 1], width * 0.6, width]);
const roadWidth = (stops: Stops) => widthByZoom(stops.map(([zoom, width]) => [zoom, rampAware(width)]));
const casingWidth = (stops: Stops) => widthByZoom(stops.map(([zoom, width]) => [zoom, rampAware(width * 1.2 + 1)]));
/** Hungarian names, as OpenStreetMap stores them; Latin transliterations for the rest. */
const NAME = expr(["coalesce", get("name"), get("name:latin")]);
const ROUND = { "line-cap": "round", "line-join": "round" } as const;

interface Road {
    cls: RoadClass;
    /** The OpenMapTiles transportation classes drawn in this road's colours. */
    classes: readonly string[];
    minzoom: number;
    width: Stops;
}

const ROADS: readonly Road[] = [
    {
        cls: "service",
        classes: ["service"],
        minzoom: 14,
        width: [
            [14, 0.8],
            [18, 6],
        ],
    },
    {
        cls: "minor",
        classes: ["minor"],
        minzoom: 12,
        width: [
            [12, 0.6],
            [14, 2],
            [18, 12],
        ],
    },
    {
        cls: "tertiary",
        classes: ["tertiary"],
        minzoom: 10,
        width: [
            [10, 0.7],
            [14, 2.6],
            [18, 14],
        ],
    },
    {
        cls: "secondary",
        classes: ["secondary"],
        minzoom: 9,
        width: [
            [9, 0.8],
            [14, 3],
            [18, 16],
        ],
    },
    {
        cls: "primary",
        classes: ["primary"],
        minzoom: 7,
        width: [
            [7, 1],
            [14, 4],
            [18, 20],
        ],
    },
    {
        cls: "trunk",
        classes: ["trunk"],
        minzoom: 6,
        width: [
            [6, 1],
            [14, 4],
            [18, 20],
        ],
    },
    {
        cls: "motorway",
        classes: ["motorway"],
        minzoom: 5,
        width: [
            [5, 1],
            [14, 4.5],
            [18, 22],
        ],
    },
];
const ROAD_CLASSES = ROADS.flatMap((road) => road.classes);

function roadLayers(p: Palette, road: Road): LayerSpecification[] {
    const colors = p.roads[road.cls];
    const filter = all(classIn(road.classes), notTunnel);
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

function textPaint(color: string, halo: string, haloWidth = 1) {
    return { "text-color": color, "text-halo-color": halo, "text-halo-width": haloWidth } as const;
}

/** Districts (suburbs) from zoom 11, their quarters and neighbourhoods from zoom 13: small, spaced capitals. */
function districtLayers(p: Palette): LayerSpecification[] {
    const district = (id: string, classes: string[], minzoom: number): LayerSpecification => ({
        id,
        type: "symbol",
        source: SOURCE,
        "source-layer": "place",
        minzoom,
        maxzoom: 16,
        filter: classIn(classes),
        layout: {
            "text-field": NAME,
            "text-font": FONT_MEDIUM,
            "text-size": linearByZoom([
                [11, 10],
                [15, 12],
            ]),
            "text-transform": "uppercase",
            "text-letter-spacing": 0.1,
            "text-max-width": 7,
            "text-padding": 20,
            "symbol-sort-key": get("rank"),
        },
        paint: { ...textPaint(p.placeText, p.textHalo), "text-opacity": 0.75 },
    });
    return [
        district("place-suburb", ["suburb"], 11),
        district("place-neighbourhood", ["quarter", "neighbourhood"], 13),
    ];
}

/** The layers, bottom to top. Light and dark share everything but the colours they take from the palette. */
function layers(p: Palette): LayerSpecification[] {
    return [
        { id: "background", type: "background", paint: { "background-color": p.background } },
        {
            id: "landcover-wood",
            type: "fill",
            source: SOURCE,
            "source-layer": "landcover",
            filter: classIn(["wood"]),
            paint: {
                "fill-color": p.wood,
                "fill-opacity": linearByZoom([
                    [8, 0.6],
                    [14, 1],
                ]),
            },
        },
        {
            id: "landcover-grass",
            type: "fill",
            source: SOURCE,
            "source-layer": "landcover",
            filter: classIn(["grass", "wetland"]),
            paint: { "fill-color": p.grass },
        },
        {
            id: "landcover-farmland",
            type: "fill",
            source: SOURCE,
            "source-layer": "landcover",
            minzoom: 9,
            filter: classIn(["farmland"]),
            paint: { "fill-color": p.farmland },
        },
        {
            id: "landuse-residential",
            type: "fill",
            source: SOURCE,
            "source-layer": "landuse",
            minzoom: 10,
            filter: classIn(["residential", "suburb", "neighbourhood"]),
            paint: {
                "fill-color": p.residential,
                "fill-opacity": linearByZoom([
                    [10, 0.4],
                    [14, 0.7],
                ]),
            },
        },
        {
            id: "park",
            type: "fill",
            source: SOURCE,
            "source-layer": "park",
            paint: {
                "fill-color": p.park,
                "fill-opacity": linearByZoom([
                    [6, 0.25],
                    [12, 0.45],
                ]),
            },
        },
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
            filter: classIn(["river", "canal", "stream"]),
            layout: ROUND,
            paint: {
                "line-color": p.waterLine,
                "line-width": widthByZoom([
                    [9, byClass("river", 0.8, 0.3)],
                    [14, byClass("river", 2, 1)],
                    [18, byClass("river", 6, 3)],
                ]),
            },
        },
        {
            id: "aeroway",
            type: "line",
            source: SOURCE,
            "source-layer": "aeroway",
            minzoom: 11,
            filter: classIn(["runway", "taxiway"]),
            paint: {
                "line-color": p.aeroway,
                "line-width": widthByZoom([
                    [11, byClass("runway", 3, 1)],
                    [16, byClass("runway", 24, 6)],
                ]),
            },
        },
        {
            id: "building",
            type: "fill",
            source: SOURCE,
            "source-layer": "building",
            minzoom: 13,
            paint: {
                "fill-color": p.building,
                "fill-outline-color": p.buildingOutline,
                "fill-opacity": linearByZoom([
                    [13, 0],
                    [14.5, 1],
                ]),
            },
        },
        {
            id: "road-tunnel",
            type: "line",
            source: SOURCE,
            "source-layer": "transportation",
            minzoom: 12,
            filter: all(classIn(ROAD_CLASSES), expr(["==", get("brunnel"), "tunnel"])),
            paint: {
                "line-color": p.roads.minor.casing,
                "line-width": widthByZoom([
                    [12, 0.8],
                    [14, 2],
                    [18, 12],
                ]),
                "line-dasharray": [2, 2],
                "line-opacity": 0.6,
            },
        },
        {
            id: "road-path",
            type: "line",
            source: SOURCE,
            "source-layer": "transportation",
            minzoom: 15,
            filter: all(classIn(["path", "track"]), notTunnel),
            paint: {
                "line-color": p.roads.path.fill,
                "line-width": widthByZoom([
                    [15, 0.8],
                    [18, 2.5],
                ]),
                "line-dasharray": [2, 1.5],
            },
        },
        ...ROADS.flatMap((road) => roadLayers(p, road)),
        {
            id: "rail",
            type: "line",
            source: SOURCE,
            "source-layer": "transportation",
            minzoom: 10,
            filter: all(classIn(["rail"]), expr(["match", get("subclass"), ["rail", "narrow_gauge"], true, false])),
            paint: {
                "line-color": p.rail,
                "line-width": widthByZoom([
                    [10, 0.6],
                    [14, 1.2],
                    [18, 3],
                ]),
                "line-dasharray": [4, 3],
            },
        },
        {
            id: "boundary-region",
            type: "line",
            source: SOURCE,
            "source-layer": "boundary",
            minzoom: 7,
            filter: all(expr(["match", get("admin_level"), [4, 6], true, false]), expr(["==", get("maritime"), 0])),
            paint: { "line-color": p.boundary, "line-width": 0.8, "line-dasharray": [3, 2], "line-opacity": 0.6 },
        },
        {
            id: "boundary-country",
            type: "line",
            source: SOURCE,
            "source-layer": "boundary",
            filter: all(expr(["==", get("admin_level"), 2]), expr(["==", get("maritime"), 0])),
            paint: {
                "line-color": p.boundary,
                "line-width": linearByZoom([
                    [4, 1],
                    [12, 2],
                ]),
                "line-opacity": 0.8,
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
                "text-font": FONT_REGULAR,
                "text-size": 12,
                "text-max-width": 6,
                "text-letter-spacing": 0.05,
            },
            paint: textPaint(p.waterText, p.water, 0.5),
        },
        {
            id: "waterway-name",
            type: "symbol",
            source: SOURCE,
            "source-layer": "waterway",
            minzoom: 12,
            filter: classIn(["river", "canal"]),
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": 400,
                "text-field": NAME,
                "text-font": FONT_REGULAR,
                "text-size": 11,
                "text-max-angle": 30,
                "text-letter-spacing": 0.05,
            },
            paint: textPaint(p.waterText, p.water, 0.5),
        },
        {
            id: "road-name",
            type: "symbol",
            source: SOURCE,
            "source-layer": "transportation_name",
            minzoom: 14,
            filter: classIn(ROAD_CLASSES),
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": 300,
                "text-field": NAME,
                "text-font": FONT_REGULAR,
                "text-size": expr([
                    "match",
                    get("class"),
                    ["motorway", "trunk", "primary"],
                    12,
                    ["secondary", "tertiary"],
                    11,
                    10,
                ]),
                "text-max-angle": 30,
                "text-padding": 4,
            },
            paint: textPaint(p.text, p.textHalo, 1.2),
        },
        ...districtLayers(p),
        {
            id: "place-village",
            type: "symbol",
            source: SOURCE,
            "source-layer": "place",
            minzoom: 10,
            filter: classIn(["village", "hamlet"]),
            layout: {
                "text-field": NAME,
                "text-font": FONT_MEDIUM,
                "text-size": linearByZoom([
                    [10, 10],
                    [14, 13],
                ]),
                "text-max-width": 7,
                "text-padding": 6,
                "symbol-sort-key": get("rank"),
            },
            paint: textPaint(p.placeText, p.textHalo),
        },
        {
            id: "place-town",
            type: "symbol",
            source: SOURCE,
            "source-layer": "place",
            minzoom: 8,
            filter: classIn(["town"]),
            layout: {
                "text-field": NAME,
                "text-font": FONT_MEDIUM,
                "text-size": linearByZoom([
                    [8, 11],
                    [14, 15],
                ]),
                "text-max-width": 8,
                "text-padding": 8,
                "symbol-sort-key": get("rank"),
            },
            paint: textPaint(p.placeText, p.textHalo),
        },
        {
            id: "place-city",
            type: "symbol",
            source: SOURCE,
            "source-layer": "place",
            minzoom: 5,
            filter: classIn(["city"]),
            layout: {
                "text-field": NAME,
                "text-font": FONT_SEMIBOLD,
                "text-size": expr([
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    5,
                    ["case", ["<=", get("rank"), 3], 13, 11],
                    12,
                    ["case", ["<=", get("rank"), 3], 20, 16],
                ]),
                "text-max-width": 8,
                "text-padding": 10,
                "symbol-sort-key": get("rank"),
            },
            paint: textPaint(p.placeText, p.textHalo),
        },
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
