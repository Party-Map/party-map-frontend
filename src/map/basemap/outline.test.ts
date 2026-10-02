import { HUNGARY_OUTLINE, HUNGARY_RING, insideHungary, WORLD_RING } from "./outline";

describe("the outline", () => {
    it("is a closed ring of more than a thousand points, wrapped as a polygon feature", () => {
        expect(HUNGARY_RING.length).toBeGreaterThan(1000);
        expect(HUNGARY_RING[0]).toEqual(HUNGARY_RING.at(-1));
        expect(HUNGARY_OUTLINE.geometry.coordinates).toEqual([HUNGARY_RING]);
        expect(WORLD_RING).toHaveLength(5);
    });
});

describe("insideHungary", () => {
    it.each([
        ["Budapest", 19.0402, 47.4979],
        ["Szeged", 20.1414, 46.253],
        ["Sopron", 16.5845, 47.6817],
        ["Záhony", 22.178, 48.407],
        ["Mohács", 18.683, 45.993],
    ])("%s is inside", (_name, lon, lat) => {
        expect(insideHungary([lon, lat])).toBe(true);
    });

    it.each([
        ["Kraków", 19.9362, 50.0678],
        ["Vienna", 16.3738, 48.2082],
        ["Bratislava", 17.1077, 48.1486],
        ["Komárno, across the Danube", 18.128, 47.763],
        ["Subotica", 19.665, 46.1],
        ["Oradea", 21.9189, 47.0465],
        ["the equator", 0, 0],
    ])("%s is outside", (_name, lon, lat) => {
        expect(insideHungary([lon, lat])).toBe(false);
    });
});
