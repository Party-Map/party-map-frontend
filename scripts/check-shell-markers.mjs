// The backend splices a page's metadata and data into the built index.html at three HTML-comment regions. A build
// that dropped them (a minifier stripping comments, say) would silently serve pages without their SEO head, so the
// gate fails when any marker is missing from dist/index.html.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(import.meta.dirname, "..", "dist", "index.html");
const html = readFileSync(file, "utf8");
const missing = ["pm:head", "pm:body", "pm:data"].flatMap((name) =>
    [`<!--${name}-->`, `<!--/${name}-->`].filter((marker) => !html.includes(marker)),
);

if (missing.length > 0) {
    console.error(`dist/index.html lacks the shell markers: ${missing.join(", ")}`);
    process.exit(1);
}
console.log("shell markers present in dist/index.html");
