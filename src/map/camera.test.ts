// The camera maths against real Leaflet: no mocks here, the CRS and a headless map (its size stubbed, jsdom has no
// layout) are the oracle for what Leaflet itself would do.
import L, { type LatLngExpression, type Map as LeafletMap } from "leaflet";

import { MAP_MAX_ZOOM } from "@/lib/constants";

import {
    type AnchoredRect,
    BAND_MARGIN,
    cardFit,
    clampCenter,
    FIT_MAX_ZOOM,
    fitsBand,
    fitTarget,
    floorZoom,
    freeBand,
    HUNGARY_BOUNDS,
    HUNGARY_EXTENT,
    insideExtent,
    PIN_RECT,
    project,
    SHOW_MAX_ZOOM,
    showTarget,
    type Size,
    unproject,
    wall,
} from "./camera";
import { BOTTOM_INSET, type MapInsets, TOP_INSET } from "./insets";

const PHONE: Size = { x: 412, y: 839 };
const LANDSCAPE: Size = { x: 839, y: 412 };
const TABLET: Size = { x: 712, y: 1138 };
const DESKTOP: Size = { x: 1440, y: 900 };
const BARS: MapInsets = { top: TOP_INSET, bottom: BOTTOM_INSET };
const TOP_BAR: MapInsets = { top: TOP_INSET, bottom: 0 };
const DEVICES: [string, Size, MapInsets][] = [
    ["phone", PHONE, BARS],
    ["landscape phone", LANDSCAPE, BARS],
    ["tablet", TABLET, BARS],
    ["desktop", DESKTOP, TOP_BAR],
];
const PINS: [string, LatLngExpression][] = [
    ["Budapest", [47.4979, 19.0402]],
    ["Felsőszölnök (west border)", [46.87, 16.13]],
    ["Beremend (south border)", [45.77, 18.43]],
    ["Garbolc (east border)", [47.94, 22.87]],
    ["Hollóháza (north border)", [48.54, 21.45]],
    ["the north edge", [HUNGARY_EXTENT.north, 19]],
];
/** A 322 x 220 px card whose bottom sits 68 px above the anchor (48 px popup offset + Leaflet's 20 px margin). */
const CARD: AnchoredRect = { left: -161, top: -288, right: 161, bottom: -68 };

const maps: LeafletMap[] = [];

/** A real Leaflet map in jsdom: the container's size is stubbed because jsdom lays nothing out. */
function realMap(size: Size): LeafletMap {
    const div = document.createElement("div");
    Object.defineProperty(div, "clientWidth", { value: size.x });
    Object.defineProperty(div, "clientHeight", { value: size.y });
    document.body.appendChild(div);
    const map = L.map(div, {
        center: [47.5, 19.05],
        zoom: 13,
        zoomSnap: 0,
        zoomAnimation: false,
        fadeAnimation: false,
    });
    maps.push(map);
    return map;
}

interface LimitCenter {
    _limitCenter(center: L.LatLng, zoom: number, bounds: L.LatLngBounds): L.LatLng;
}

afterEach(() => {
    maps.splice(0).forEach((map) => map.remove());
});

/** The pin's container point at a view. */
function pinAt(pin: LatLngExpression, center: LatLngExpression, zoom: number, size: Size): L.Point {
    return L.point(size.x, size.y)
        .divideBy(2)
        .add(project(pin, zoom).subtract(project(center, zoom)));
}

describe("project / unproject", () => {
    it("is the map's own projection", () => {
        const map = realMap(PHONE);
        const point = project([47.4979, 19.0402], 13);
        expect(point.equals(map.project([47.4979, 19.0402], 13))).toBe(true);
        expect(unproject(point, 13).equals(L.latLng(47.4979, 19.0402))).toBe(true);
        expect(project([47.4979, 19.0402], 13.5).x).toBeCloseTo(point.x * Math.SQRT2, 6);
    });
});

describe("insideExtent", () => {
    it("tells the country's box from the rest", () => {
        expect(insideExtent([47.5, 19.05])).toBe(true);
        // The extent is the country's bounding box: Vienna is inside it, Graz and Kraków are not.
        expect(insideExtent([48.2, 16.4])).toBe(true);
        expect(insideExtent([47.07, 15.44])).toBe(false);
        expect(insideExtent([50.07, 19.94])).toBe(false);
    });
});

describe("wall", () => {
    it.each([6.4, 10, 13, 19])(
        "at zoom %s grows the extent by the bars' cover in pixels, north and south only",
        (zoom) => {
            const bounds = wall(zoom, BARS);
            const nw = project(bounds.getNorthWest(), zoom);
            const se = project(bounds.getSouthEast(), zoom);
            const { north, west, south, east } = HUNGARY_EXTENT;
            expect(nw.x).toBeCloseTo(project([north, west], zoom).x, 6);
            expect(nw.y).toBeCloseTo(project([north, west], zoom).y - TOP_INSET, 6);
            expect(se.x).toBeCloseTo(project([south, east], zoom).x, 6);
            expect(se.y).toBeCloseTo(project([south, east], zoom).y + BOTTOM_INSET, 6);
        },
    );
});

describe("clampCenter", () => {
    const centers: LatLngExpression[] = [
        [47.5, 19.05],
        [50, 19],
        [47, 10],
        [44, 25],
        [HUNGARY_EXTENT.north, HUNGARY_EXTENT.east],
        [HUNGARY_EXTENT.south, HUNGARY_EXTENT.west],
    ];

    it.each(DEVICES)("on a %s settles where Leaflet's own _limitCenter would", (_name, size, insets) => {
        const map = realMap(size) as unknown as LimitCenter;
        for (const zoom of [floorZoom(size, insets), 8, 10, 13, 16, 19]) {
            const bounds = wall(zoom, insets);
            for (const center of centers) {
                const ours = clampCenter(center, zoom, size, bounds);
                const leaflet = map._limitCenter(L.latLng(center), zoom, bounds);
                expect(ours.equals(leaflet)).toBe(true);
            }
        }
    });

    it("keeps a centre that is already inside, and centres the view when the wall is smaller than it", () => {
        const inside = clampCenter([47.5, 19.05], 13, PHONE, wall(13, BARS));
        expect(inside.equals(L.latLng(47.5, 19.05))).toBe(true);

        // At the portrait floor the wall is shorter than the viewport: the country sits centred between the bars.
        const floor = floorZoom(PHONE, BARS);
        const centred = clampCenter([47.5, 19.05], floor, PHONE, wall(floor, BARS));
        const wallBounds = wall(floor, BARS);
        const wallCentre = project(wallBounds.getNorthWest(), floor)
            .add(project(wallBounds.getSouthEast(), floor))
            .divideBy(2);
        expect(project(centred, floor).y).toBeCloseTo(wallCentre.y, 0);
        expect(project(centred, floor).x).toBeCloseTo(wallCentre.x, 0);
    });
});

describe("floorZoom", () => {
    it.each(DEVICES)(
        "on a %s is the zoom at which the country exactly fills the area between the bars",
        (_name, size, insets) => {
            const floor = floorZoom(size, insets);
            const extentAt = (zoom: number) =>
                L.bounds(
                    project([HUNGARY_EXTENT.north, HUNGARY_EXTENT.west], zoom),
                    project([HUNGARY_EXTENT.south, HUNGARY_EXTENT.east], zoom),
                ).getSize();
            const free = { x: size.x, y: size.y - insets.top - insets.bottom };
            expect(extentAt(floor).x).toBeLessThanOrEqual(free.x + 1e-6);
            expect(extentAt(floor).y).toBeLessThanOrEqual(free.y + 1e-6);
            const tight = extentAt(floor + 0.001);
            expect(tight.x > free.x || tight.y > free.y).toBe(true);
            expect(Number.isInteger(floor)).toBe(false);

            // Leaflet's getBoundsZoom agrees (it floors to whole levels in jsdom, where no 3D transforms exist).
            const map = realMap(size);
            expect(Math.floor(floor)).toBe(
                map.getBoundsZoom(HUNGARY_BOUNDS, false, L.point(0, insets.top + insets.bottom)),
            );
        },
    );

    it("never goes below zero or above the ceiling", () => {
        expect(floorZoom({ x: 10, y: 10 }, BARS)).toBe(0);
        expect(floorZoom({ x: 1e9, y: 1e9 }, TOP_BAR)).toBe(MAP_MAX_ZOOM);
    });
});

describe("cardFit", () => {
    const band = freeBand(PHONE, BARS);

    it("leaves a pin and card that already sit inside the band alone", () => {
        expect(band).toEqual({
            left: BAND_MARGIN,
            top: TOP_INSET + BAND_MARGIN,
            right: PHONE.x - BAND_MARGIN,
            bottom: PHONE.y - BOTTOM_INSET - BAND_MARGIN,
        });
        expect(cardFit(L.point(206, 500), CARD, band)).toEqual(L.point(0, 0));
        expect(fitsBand(L.point(206, 500), CARD, band)).toBe(true);
    });

    it("shifts by the smallest amount that brings the pin and card inside", () => {
        // Card cut off under the top bar: content moves down by the overhang.
        expect(cardFit(L.point(206, 300), CARD, band)).toEqual(L.point(0, band.top - (300 + CARD.top)));
        // Pin under the bottom bar: content moves up.
        expect(cardFit(L.point(206, 800), CARD, band)).toEqual(L.point(0, band.bottom - (800 + PIN_RECT.bottom)));
        // Card beyond the left or right edge.
        expect(cardFit(L.point(100, 500), CARD, band)).toEqual(L.point(band.left - (100 + CARD.left), 0));
        expect(cardFit(L.point(350, 500), CARD, band)).toEqual(L.point(band.right - (350 + CARD.right), 0));
        // A bare pin only needs its own box inside.
        expect(cardFit(L.point(206, 300), null, band)).toEqual(L.point(0, 0));
        expect(cardFit(L.point(206, 60), null, band)).toEqual(L.point(0, band.top - (60 + PIN_RECT.top)));
    });

    it("centres the pin and card when asked, or when they are taller than the band", () => {
        const centred = cardFit(L.point(206, 300), CARD, band, "center");
        expect(300 + CARD.top + centred.y + (300 + PIN_RECT.bottom + centred.y)).toBeCloseTo(band.top + band.bottom, 6);
        expect(206 + centred.x).toBeCloseTo((band.left + band.right) / 2, 6);

        const short = freeBand({ x: 412, y: 400 }, BARS);
        const squeezed = cardFit(L.point(206, 100), CARD, short);
        expect(100 + CARD.top + squeezed.y + (100 + PIN_RECT.bottom + squeezed.y)).toBeCloseTo(
            short.top + short.bottom,
            6,
        );
    });
});

describe("showTarget", () => {
    it("does not move when the pin and its card are already in view", () => {
        const target = showTarget({
            pin: [47.4979, 19.0402],
            card: CARD,
            center: [47.4979, 19.0402],
            zoom: 13,
            size: PHONE,
            insets: BARS,
        });
        expect(target.moved).toBe(false);
        expect(target.zoom).toBe(13);
    });

    it("pans just far enough for a card cut off under the top bar", () => {
        const pin: LatLngExpression = [47.4979, 19.0402];
        // The centre lies south of the pin, so the pin sits near the top of the screen.
        const center = unproject(project(pin, 13).add(L.point(0, 200)), 13);
        const target = showTarget({ pin, card: CARD, center, zoom: 13, size: PHONE, insets: BARS });
        expect(target.moved).toBe(true);
        expect(target.zoom).toBe(13);
        const after = pinAt(pin, target.center, 13, PHONE);
        expect(after.y + CARD.top).toBeCloseTo(freeBand(PHONE, BARS).top, 0);
        expect(after.x).toBeCloseTo(PHONE.x / 2, 0);
    });

    it("zooms in a step around a border pin when the wall keeps its card out of the band", () => {
        // Two kilometres south of the northern edge: at zoom 13 the wall's 72 px beyond the border are not enough.
        const pin: LatLngExpression = [HUNGARY_EXTENT.north - 0.018, 21.45];
        const target = showTarget({ pin, card: CARD, center: pin, zoom: 13, size: PHONE, insets: BARS });
        expect(target.zoom).toBe(14);
        expect(fitsBand(pinAt(pin, target.center, target.zoom, PHONE), CARD, freeBand(PHONE, BARS))).toBe(true);
        // One level less would not have done: the wall allows only the top bar's cover beyond the border.
        const oneLess = showTarget({
            pin,
            card: CARD,
            center: pin,
            zoom: 13,
            size: PHONE,
            insets: BARS,
            maxZoom: 13,
        });
        expect(oneLess.zoom).toBe(13);
        expect(fitsBand(pinAt(pin, oneLess.center, 13, PHONE), CARD, freeBand(PHONE, BARS))).toBe(false);
    });

    it.each(DEVICES)(
        "on a %s lands inside the wall for every pin at every zoom, and fits whenever it can",
        (_name, size, insets) => {
            const floor = floorZoom(size, insets);
            for (const [, pin] of PINS) {
                for (const zoom of [floor, 10, 13, 16, 19]) {
                    const target = showTarget({ pin, card: CARD, center: pin, zoom, size, insets });
                    const legal = clampCenter(target.center, target.zoom, size, wall(target.zoom, insets));
                    expect(legal.equals(target.center)).toBe(true);
                    expect(target.zoom).toBeGreaterThanOrEqual(zoom);
                    expect(target.zoom).toBeLessThanOrEqual(Math.max(zoom, SHOW_MAX_ZOOM));
                    const band = freeBand(size, insets);
                    const fits = fitsBand(pinAt(pin, target.center, target.zoom, size), CARD, band);
                    const canFit = PIN_RECT.bottom - CARD.top <= band.bottom - band.top;
                    // A card taller than the band stays at the zoom; otherwise only a pin on the border line itself
                    // can stay out, and then only at the ceiling.
                    if (!canFit) expect(target.zoom).toBe(zoom);
                    else if (!fits) expect(target.zoom).toBe(Math.max(zoom, SHOW_MAX_ZOOM));
                }
            }
        },
    );

    it("zooms in level by level from the portrait floor, where the country cannot move, until the card fits", () => {
        const floor = floorZoom(PHONE, BARS);
        const pin: LatLngExpression = [48.54, 21.45];
        const show = (maxZoom?: number) =>
            showTarget({ pin, card: CARD, center: [47.2, 19.5], zoom: floor, size: PHONE, insets: BARS, maxZoom });
        const target = show();
        expect(target.zoom).toBeGreaterThan(floor + 5);
        expect(target.zoom).toBeLessThanOrEqual(SHOW_MAX_ZOOM);
        expect(target.zoom - floor).toBe(Math.round(target.zoom - floor));
        expect(fitsBand(pinAt(pin, target.center, target.zoom, PHONE), CARD, freeBand(PHONE, BARS))).toBe(true);
        // The level before was still short.
        const before = show(target.zoom - 1);
        expect(fitsBand(pinAt(pin, before.center, before.zoom, PHONE), CARD, freeBand(PHONE, BARS))).toBe(false);
        // A pin in the middle of the country fits within a couple of levels.
        const budapest = showTarget({
            pin: [47.4979, 19.0402],
            card: CARD,
            center: [47.2, 19.5],
            zoom: floor,
            size: PHONE,
            insets: BARS,
        });
        expect(budapest.zoom).toBeLessThanOrEqual(floor + 2);
    });

    it("stays at the zoom and centres a card that is taller than the band, instead of zooming in for nothing", () => {
        // A phone held sideways: 360 px tall, the bars leave fewer pixels than the card needs.
        const sideways: Size = { x: 863, y: 360 };
        const pin: LatLngExpression = [47.4979, 19.0402];
        const target = showTarget({ pin, card: CARD, center: pin, zoom: 14, size: sideways, insets: BARS });
        expect(target.zoom).toBe(14);
        const band = freeBand(sideways, BARS);
        const after = pinAt(pin, target.center, 14, sideways);
        expect(after.y + CARD.top + (after.y + PIN_RECT.bottom)).toBeCloseTo(band.top + band.bottom, 0);
    });

    it("centres the pin and card between the bars when asked", () => {
        const pin: LatLngExpression = [47.4979, 19.0402];
        const target = showTarget({
            pin,
            card: CARD,
            center: pin,
            zoom: 13,
            size: DESKTOP,
            insets: TOP_BAR,
            mode: "center",
        });
        const band = freeBand(DESKTOP, TOP_BAR);
        const after = pinAt(pin, target.center, 13, DESKTOP);
        expect(after.y + CARD.top + (after.y + PIN_RECT.bottom)).toBeCloseTo(band.top + band.bottom, 0);
        expect(after.x).toBeCloseTo(DESKTOP.x / 2, 0);
    });

    it("keeps an open card above an overlay reported at the bottom", () => {
        const pin: LatLngExpression = [47.4979, 19.0402];
        const center = unproject(project(pin, 13).subtract(L.point(0, 300)), 13);
        const plain = showTarget({ pin, card: CARD, center, zoom: 13, size: PHONE, insets: BARS });
        const withOverlay = showTarget({
            pin,
            card: CARD,
            center,
            zoom: 13,
            size: PHONE,
            insets: BARS,
            extraBottom: 200,
        });
        expect(plain.moved).toBe(false);
        expect(withOverlay.moved).toBe(true);
        expect(pinAt(pin, withOverlay.center, 13, PHONE).y + PIN_RECT.bottom).toBeCloseTo(
            freeBand(PHONE, BARS, 200).bottom,
            0,
        );
    });
});

describe("fitTarget", () => {
    const balaton: LatLngExpression[] = [
        [46.9606, 17.871],
        [46.768, 17.243],
    ];

    it("shows all the places between the bars with room for their pins and labels", () => {
        const target = fitTarget(balaton, DESKTOP, TOP_BAR);
        const band = freeBand(DESKTOP, TOP_BAR);
        for (const point of balaton) {
            const at = pinAt(point, target.center, target.zoom, DESKTOP);
            expect(at.x).toBeGreaterThan(band.left + 40);
            expect(at.x).toBeLessThan(band.right - 40);
            expect(at.y).toBeGreaterThan(band.top + 100);
            expect(at.y).toBeLessThan(band.bottom - 40);
        }
        expect(target.zoom).toBeGreaterThan(floorZoom(DESKTOP, TOP_BAR));
        expect(target.zoom).toBeLessThanOrEqual(FIT_MAX_ZOOM);
        expect(Number.isInteger(target.zoom)).toBe(false);
    });

    it("never zooms in further than the fit ceiling, even for one spot", () => {
        const target = fitTarget([[47.5, 19.05]], PHONE, BARS);
        expect(target.zoom).toBe(FIT_MAX_ZOOM);
        expect(target.center.equals(L.latLng(47.5, 19.05), 1e-6)).toBe(false);
        expect(pinAt([47.5, 19.05], target.center, target.zoom, PHONE).x).toBeCloseTo(PHONE.x / 2, 0);
    });

    it("stays inside the wall for places along the border", () => {
        const target = fitTarget(
            [
                [48.54, 21.45],
                [48.5, 20.9],
            ],
            PHONE,
            BARS,
        );
        expect(clampCenter(target.center, target.zoom, PHONE, wall(target.zoom, BARS)).equals(target.center)).toBe(
            true,
        );
    });
});
