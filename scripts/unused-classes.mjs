// Reports CSS Module classes nothing reads. For every src/**/*.module.scss it takes the keys from the committed
// X.module.scss.d.ts, finds the .ts/.tsx files that import the module, and collects their `alias.key` and
// `alias["key"]` reads. A class chosen from data must therefore come from a lookup map of literal keys
// (`{ ok: styles.toneOk }`), never from a template string. Plain Node, no dependencies.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = join(root, "src");

function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
    });
}

const files = walk(src);
const modules = files.filter((f) => f.endsWith(".module.scss"));
const sources = files.filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".d.ts"));

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const camel = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** The module's class keys: the declaration's keys minus its keyframe names (exported too, but not classes). */
function keysOf(module) {
    const declaration = readFileSync(`${module}.d.ts`, "utf8");
    const keyframes = new Set(
        [...readFileSync(module, "utf8").matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => camel(m[1])),
    );
    return [...declaration.matchAll(/^\s*'?([A-Za-z_][\w-]*)'?: string;/gm)]
        .map((m) => m[1])
        .filter((key) => !keyframes.has(key));
}

/** Resolve an import specifier from `file` to an absolute path, for relative and \@/ imports. */
function resolveSpecifier(file, specifier) {
    if (specifier.startsWith("@/")) return join(src, specifier.slice(2));
    if (specifier.startsWith(".")) return resolve(dirname(file), specifier);
    return null;
}

const importRe = /import\s+(\w+)\s+from\s+["']([^"']+\.module\.scss)["']/g;
const reads = new Map(modules.map((m) => [m, new Set()]));

for (const file of sources) {
    const text = readFileSync(file, "utf8");
    for (const [, alias, specifier] of text.matchAll(importRe)) {
        const module = resolveSpecifier(file, specifier);
        if (!module || !reads.has(module)) continue;
        const used = reads.get(module);
        const a = escape(alias);
        for (const m of text.matchAll(new RegExp(`\\b${a}\\.([A-Za-z_]\\w*)`, "g"))) used.add(m[1]);
        for (const m of text.matchAll(new RegExp(`\\b${a}\\[["']([\\w-]+)["']\\]`, "g"))) used.add(m[1]);
    }
}

let unused = 0;
for (const module of modules) {
    const used = reads.get(module);
    const missing = keysOf(module).filter((key) => !used.has(key));
    if (missing.length > 0) {
        unused += missing.length;
        console.log(`${relative(root, module)}: ${missing.join(", ")}`);
    }
}

if (unused > 0) {
    console.log(`\n${unused} class(es) are never read.`);
    process.exit(1);
}
console.log(`Every class in ${modules.length} modules is read.`);
