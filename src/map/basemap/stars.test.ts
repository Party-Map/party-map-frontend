import { readFileSync } from "node:fs";
import path from "node:path";

import { SKY_COLOR, STAR_SKY_SIZE, STAR_TINTS, stars, starSkyImage, starSkySvg } from "./stars";

const circles = (svg: string) =>
    [
        ...svg.matchAll(/<circle cx='([\d.]+)' cy='([\d.]+)' r='([\d.]+)' opacity='([\d.]+)' fill='url\(#s(\d)\)'\/>/g),
    ].map(([, cx = "", cy = "", r = "", opacity = "", tint = ""]) => ({
        cx: Number(cx),
        cy: Number(cy),
        r: Number(r),
        opacity: Number(opacity),
        tint: Number(tint),
    }));

describe("stars", () => {
    it("scatters the same stars every time, a few big and bright among many specks", () => {
        const field = stars();
        expect(field).toHaveLength(140);
        expect(stars()).toEqual(field);
        for (const star of field) {
            expect(star.cx).toBeGreaterThanOrEqual(0);
            expect(star.cx).toBeLessThan(STAR_SKY_SIZE);
            expect(star.cy).toBeGreaterThanOrEqual(0);
            expect(star.cy).toBeLessThan(STAR_SKY_SIZE);
            expect(star.radius).toBeGreaterThanOrEqual(0.7);
            expect(star.radius).toBeLessThanOrEqual(3.5);
            expect(star.opacity).toBeGreaterThanOrEqual(0.5);
            expect(star.opacity).toBeLessThanOrEqual(1);
            expect([0, 1, 2]).toContain(star.tint);
        }
        expect(field.filter((star) => star.radius > 2.5).length).toBeLessThan(field.length / 4);
        expect(new Set(field.map((star) => star.tint)).size).toBe(3);
    });
});

describe("starSkySvg", () => {
    it("draws every star as a glowing circle in one of the tints on a transparent ground", () => {
        const svg = starSkySvg();
        expect(
            svg.startsWith(`<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>`),
        ).toBe(true);
        expect(svg).not.toContain("<rect");
        for (const [i, tint] of STAR_TINTS.entries()) {
            expect(svg).toContain(`<radialGradient id='s${i}'><stop offset='0' stop-color='${tint}'/>`);
        }
        const drawn = circles(svg);
        expect(drawn.length).toBeGreaterThanOrEqual(140);
        const field = stars();
        for (const star of field) {
            expect(drawn).toContainEqual(
                expect.objectContaining({ cx: Number(star.cx.toFixed(1)), cy: Number(star.cy.toFixed(1)) }),
            );
        }
    });

    it("repeats seamlessly: a star over an edge is drawn again on the opposite side", () => {
        const svg = starSkySvg(64);
        const drawn = circles(svg);
        const field = stars(64);
        const wrapped = drawn.length - field.length;
        expect(wrapped).toBeGreaterThan(0);
        for (const star of drawn) {
            expect(star.cx + star.r).toBeGreaterThan(0);
            expect(star.cx - star.r).toBeLessThan(64);
            expect(star.cy + star.r).toBeGreaterThan(0);
            expect(star.cy - star.r).toBeLessThan(64);
        }
        // Every wrapped copy sits exactly one tile away from an original (give or take the rounding).
        const tilesApart = (a: number, b: number) => {
            const rest = Math.abs(a - b) % 64;
            return rest < 0.1 || rest > 63.9;
        };
        for (const star of drawn) {
            expect(field.find((s) => tilesApart(s.cx, star.cx) && tilesApart(s.cy, star.cy))).toBeDefined();
        }
    });
});

describe("starSkyImage", () => {
    it("is a CSS url() of the SVG with only the characters CSS and URLs mind escaped", () => {
        const image = starSkyImage();
        expect(image.startsWith(`url("data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'`)).toBe(true);
        expect(image.endsWith(`%3c/svg%3e")`)).toBe(true);
        const payload = image.slice(`url("data:image/svg+xml,`.length, -2);
        expect(payload).not.toMatch(/[#<>" ]/);
        expect(decodeURIComponent(payload)).toBe(starSkySvg());
    });

    it("repeats at the size the stylesheet lays it out with, over the one sky colour of both themes", () => {
        const base = readFileSync(path.resolve(process.cwd(), "src/styles/base.scss"), "utf8");
        expect(base).toContain(`--map-sky-size: ${STAR_SKY_SIZE}px;`);
        const tokens = [...base.matchAll(/--map-bg: (#[0-9a-f]{6});/g)].map((match) => match[1]);
        expect(tokens).toEqual([SKY_COLOR]);
    });
});
