import postcss from "postcss";

import { HOVER_MEDIA, hoverMedia } from "./hoverMedia";

/** The transformed CSS with its whitespace normalised (PostCSS keeps the raws it finds). */
const run = async (css: string) =>
    (await postcss([hoverMedia()]).process(css, { from: undefined })).css.replace(/\s*([{}])\s*/g, " $1 ").trim();
const tidy = (css: string) => css.replace(/\s*([{}])\s*/g, " $1 ").trim();

describe("hoverMedia", () => {
    it("moves a hover rule into the hover media query", async () => {
        expect(await run(".button:hover:not(:disabled) { filter: brightness(1.1); }")).toBe(
            tidy(`@media ${HOVER_MEDIA} { .button:hover:not(:disabled) { filter: brightness(1.1); } }`),
        );
    });

    it("splits a rule that mixes hover with other selectors, keeping the others where they were", async () => {
        const css = ".row:hover, .row:focus-within { background: var(--surface-hover); }";
        expect(await run(css)).toBe(
            tidy(
                ".row:focus-within { background: var(--surface-hover); }" +
                    `@media ${HOVER_MEDIA} { .row:hover { background: var(--surface-hover); } }`,
            ),
        );
    });

    it("covers descendant hovers and keeps the surrounding layer", async () => {
        const css = "@layer parts { .item:hover .tooltip { opacity: 1; } .item { color: red; } }";
        expect(await run(css)).toBe(
            tidy(
                `@layer parts { @media ${HOVER_MEDIA} { .item:hover .tooltip { opacity: 1; } } .item { color: red; } }`,
            ),
        );
    });

    it("leaves rules already inside a hover media query and rules without hover alone", async () => {
        const css = `@media (hover: none) { .a:hover { color: red; } } .b:focus-visible { color: blue; }`;
        expect(await run(css)).toBe(tidy(css));
    });
});
