/**
 * The night sky behind the country: near-black with a teal tint, the same in both themes, so the map's surroundings
 * never change with the theme. Also `--map-bg` in styles/base.scss.
 */
export const SKY_COLOR = "#0e171b";
/** The stars' tints: mint, powder blue and cream, so the field is not uniform. */
export const STAR_TINTS = ["#cfe9df", "#c7dcf0", "#f6ecd2"] as const;
/** The star field repeats every this many CSS pixels. */
export const STAR_SKY_SIZE = 512;
const STAR_COUNT = 140;
/** A star's glow fades out over this many radii. */
const GLOW = 1.8;

interface Star {
    cx: number;
    cy: number;
    radius: number;
    opacity: number;
    tint: number;
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

/** The stars of the sky: a few are big and bright, most are specks; their tint varies. */
export function stars(size = STAR_SKY_SIZE): Star[] {
    const next = random(0x5eed);
    const result: Star[] = [];
    for (let n = 0; n < STAR_COUNT; n += 1) {
        result.push({
            cx: next() * size,
            cy: next() * size,
            radius: 0.7 + next() * next() * 2.8,
            opacity: 0.5 + next() * 0.5,
            tint: Math.floor(next() * STAR_TINTS.length),
        });
    }
    return result;
}

const round = (value: number, digits: number) => value.toFixed(digits).replace(/\.?0+$/, "");

/**
 * The star field as SVG markup: each star is a circle filled with a radial glow in one of the tints on a transparent
 * ground (the sky colour comes from `--map-bg`). A star near an edge is drawn again on the opposite
 * side, so the tile repeats seamlessly.
 */
export function starSkySvg(size = STAR_SKY_SIZE): string {
    const gradients = STAR_TINTS.map(
        (tint, i) =>
            `<radialGradient id='s${i}'><stop offset='0' stop-color='${tint}'/>` +
            `<stop offset='0.3' stop-color='${tint}' stop-opacity='0.85'/>` +
            `<stop offset='1' stop-color='${tint}' stop-opacity='0'/></radialGradient>`,
    ).join("");
    const circles: string[] = [];
    for (const star of stars(size)) {
        const r = star.radius * GLOW;
        const xs = [star.cx, star.cx - r < 0 ? star.cx + size : null, star.cx + r > size ? star.cx - size : null];
        const ys = [star.cy, star.cy - r < 0 ? star.cy + size : null, star.cy + r > size ? star.cy - size : null];
        for (const cx of xs) {
            for (const cy of ys) {
                if (cx === null || cy === null) continue;
                circles.push(
                    `<circle cx='${round(cx, 1)}' cy='${round(cy, 1)}' r='${round(r, 2)}' ` +
                        `opacity='${round(star.opacity, 2)}' fill='url(#s${star.tint})'/>`,
                );
            }
        }
    }
    return (
        `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>` +
        `<defs>${gradients}</defs>${circles.join("")}</svg>`
    );
}

/** The star field as a CSS `background-image` value (a data URL; only the characters CSS and URLs mind are escaped). */
export function starSkyImage(): string {
    const encoded = starSkySvg().replace(/[#<>"% ]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
    return `url("data:image/svg+xml,${encoded}")`;
}
