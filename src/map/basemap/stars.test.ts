import { PALETTES } from "./palette";
import { starImageId, starSky, themeOfStarImage } from "./stars";

const hex = (c: string): [number, number, number] => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
];

describe("starSky", () => {
    it("paints the sky colour with a sprinkling of brighter stars, the same every time", () => {
        const sky = starSky("dark", 256);
        expect(sky.width).toBe(256);
        expect(sky.height).toBe(256);
        expect(sky.data).toHaveLength(256 * 256 * 4);
        const [r, g, b] = hex(PALETTES.dark.sky);
        let skyPixels = 0;
        let brighter = 0;
        for (let i = 0; i < sky.data.length; i += 4) {
            expect(sky.data[i + 3]).toBe(255);
            if (sky.data[i] === r && sky.data[i + 1] === g && sky.data[i + 2] === b) skyPixels += 1;
            else if ((sky.data[i] ?? 0) > r && (sky.data[i + 1] ?? 0) > g) brighter += 1;
        }
        expect(skyPixels).toBeGreaterThan(256 * 256 * 0.85);
        expect(brighter).toBeGreaterThan(200);
        expect(starSky("dark", 256).data).toEqual(sky.data);
    });

    it("differs between the themes", () => {
        expect(starSky("light", 32).data).not.toEqual(starSky("dark", 32).data);
    });
});

describe("star image ids", () => {
    it("round-trip through the theme", () => {
        expect(themeOfStarImage(starImageId("light"))).toBe("light");
        expect(themeOfStarImage(starImageId("dark"))).toBe("dark");
        expect(themeOfStarImage("pin")).toBeNull();
    });
});
