import type { Theme } from "@/lib/theme";

import { PALETTES } from "./palette";

/** An RGBA bitmap in the shape MapLibre's `addImage` accepts. */
export interface StarSky {
    width: number;
    height: number;
    data: Uint8ClampedArray;
}

const PREFIX = "stars-";
/** The repeated tile is drawn pixel for pixel; the stars are a few pixels wide, like the painting's. */
export const STAR_SKY_PIXEL_RATIO = 1;
const STAR_COUNT = 140;

/** The style's background pattern id for a theme. */
export const starImageId = (theme: Theme) => `${PREFIX}${theme}`;

/** The theme a star image id belongs to; null for any other image. */
export function themeOfStarImage(id: string): Theme | null {
    if (id === starImageId("light")) return "light";
    if (id === starImageId("dark")) return "dark";
    return null;
}

/** mulberry32: a tiny seeded generator, so the sky is the same on every visit and in every test. */
function random(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Moves one channel towards the star colour by the star's alpha at that pixel. */
function blend(data: Uint8ClampedArray, index: number, target: number, alpha: number): void {
    const current = data[index] ?? 0;
    data[index] = current + (target - current) * alpha;
}

function hex(color: string): [number, number, number] {
    const n = parseInt(color.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * A night sky: the theme's sky colour sprinkled with soft white stars of varying size and brightness, drawn with
 * plain arithmetic (no canvas, so it also runs in tests). The pattern repeats seamlessly: stars near an edge wrap
 * around to the other side.
 */
export function starSky(theme: Theme, size = 512): StarSky {
    const [skyR, skyG, skyB] = hex(PALETTES[theme].sky);
    const [starR, starG, starB] = hex(PALETTES[theme].star);
    const data = new Uint8ClampedArray(size * size * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = skyR;
        data[i + 1] = skyG;
        data[i + 2] = skyB;
        data[i + 3] = 255;
    }
    const next = random(theme === "dark" ? 0x5eed : 0x1ee7);
    for (let n = 0; n < STAR_COUNT; n += 1) {
        const cx = next() * size;
        const cy = next() * size;
        const radius = 0.7 + next() * next() * 2.8;
        const brightness = 0.5 + next() * 0.5;
        const reach = Math.ceil(radius) + 1;
        for (let dy = -reach; dy <= reach; dy += 1) {
            for (let dx = -reach; dx <= reach; dx += 1) {
                const distance = Math.hypot(dx, dy);
                if (distance > radius + 0.5) continue;
                const alpha = brightness * Math.min(1, (radius + 0.5 - distance) / radius) ** 1.4;
                const x = (((Math.round(cx) + dx) % size) + size) % size;
                const y = (((Math.round(cy) + dy) % size) + size) % size;
                const i = (y * size + x) * 4;
                blend(data, i, starR, alpha);
                blend(data, i + 1, starG, alpha);
                blend(data, i + 2, starB, alpha);
            }
        }
    }
    return { width: size, height: size, data };
}
