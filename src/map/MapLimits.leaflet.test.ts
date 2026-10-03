// The zoom-aware wall against real Leaflet: a `setView` to another zoom is clamped with that zoom's wall.
import L, { type Map as LeafletMap } from "leaflet";

import { clampCenter, HUNGARY_EXTENT, project, wall } from "./camera";
import { BOTTOM_INSET, TOP_INSET } from "./insets";
import { installZoomAwareWall } from "./MapLimits";

const SIZE = { x: 412, y: 839 };
const INSETS = { top: TOP_INSET, bottom: BOTTOM_INSET };

let map: LeafletMap;

beforeEach(() => {
    const div = document.createElement("div");
    Object.defineProperty(div, "clientWidth", { value: SIZE.x });
    Object.defineProperty(div, "clientHeight", { value: SIZE.y });
    document.body.appendChild(div);
    map = L.map(div, { center: [47.5, 19.05], zoom: 13, zoomSnap: 0, zoomAnimation: false, fadeAnimation: false });
    map.setMaxBounds(wall(13, INSETS));
});

afterEach(() => map.remove());

describe("installZoomAwareWall", () => {
    it("clamps a view at another zoom against that zoom's wall, not the current one's", () => {
        // A centre on the northern border: at zoom 16 the view would reach 420 px beyond it, the wall allows 72.
        const target = L.latLng(HUNGARY_EXTENT.north, 21.45);
        const uninstall = installZoomAwareWall(map, () => INSETS);
        map.setView(target, 16, { animate: false });
        expect(map.getZoom()).toBe(16);
        const expected = clampCenter(target, 16, SIZE, wall(16, INSETS));
        expect(map.getCenter().equals(expected, 1e-7)).toBe(true);
        // The zoom-13 wall, 576 px wide at zoom 16, would have let the view stay put.
        expect(clampCenter(target, 16, SIZE, wall(13, INSETS)).equals(target)).toBe(true);
        uninstall();

        // Same zoom now, so this is a pan, which Leaflet truncates to whole pixels.
        map.setView(target, 16, { animate: false });
        expect(project(map.getCenter(), 16).distanceTo(project(target, 16))).toBeLessThan(1);
    });

    it("keeps Leaflet's own enforcement on moveend working with the current wall", () => {
        installZoomAwareWall(map, () => INSETS);
        map.panTo([HUNGARY_EXTENT.north + 1, 19], { animate: false });
        const expected = clampCenter([HUNGARY_EXTENT.north + 1, 19], 13, SIZE, wall(13, INSETS));
        expect(map.getCenter().equals(expected, 1e-7)).toBe(true);
    });
});
