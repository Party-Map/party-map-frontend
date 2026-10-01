// Fails when the built CSS still has a `:hover` rule outside `@media (hover: hover)`: the hover-media PostCSS plugin
// (scripts/hoverMedia.ts, applied in rsbuild.config.ts) must have run over every stylesheet, so touch devices never
// get hover styles. Run by Node directly (`pnpm lint:hover`; Node 24 strips the types).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import postcss from "postcss";

import { insideHoverMedia } from "./hoverMedia.ts";

const dir = path.resolve("dist/static/css");
const files = readdirSync(dir).filter((file) => file.endsWith(".css"));
if (files.length === 0) {
    console.error("check-hover-media: no CSS in dist/static/css; run the build first");
    process.exit(1);
}
let failures = 0;
let hovers = 0;
for (const file of files) {
    const root = postcss.parse(readFileSync(path.join(dir, file), "utf8"));
    root.walkRules((rule) => {
        if (!rule.selector.includes(":hover")) return;
        hovers += 1;
        if (!insideHoverMedia(rule)) {
            failures += 1;
            console.error(`${file}: hover rule outside @media (hover: hover): ${rule.selector}`);
        }
    });
}
if (failures > 0) process.exit(1);
console.log(`check-hover-media: ${hovers} hover rules in ${files.length} files, all gated`);
