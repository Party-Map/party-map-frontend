import { toBbox, toLatLngTuple } from "./geo";

const bounds = (west: number, south: number, east: number, north: number) => ({
    getWest: () => west,
    getSouth: () => south,
    getEast: () => east,
    getNorth: () => north,
});

describe("toLatLngTuple", () => {
    it("orders latitude before longitude", () => {
        expect(toLatLngTuple({ latitude: 47.5, longitude: 19.05 })).toEqual([47.5, 19.05]);
    });
});

describe("toBbox", () => {
    it("pads the viewport by half its size each way, as minLon,minLat,maxLon,maxLat", () => {
        expect(toBbox(bounds(19.0, 47.45, 19.1, 47.55))).toBe("18.95,47.4,19.15,47.6");
    });

    it("snaps the edges outward to 0.01 degrees so small pans give the same value", () => {
        expect(toBbox(bounds(19.0012, 47.4507, 19.1012, 47.5507))).toBe("18.95,47.4,19.16,47.61");
        expect(toBbox(bounds(19.0033, 47.4534, 19.1033, 47.5534))).toBe("18.95,47.4,19.16,47.61");
    });

    it("stays inside valid coordinates when zoomed far out", () => {
        expect(toBbox(bounds(-170, -80, 170, 80))).toBe("-180,-90,180,90");
    });
});
