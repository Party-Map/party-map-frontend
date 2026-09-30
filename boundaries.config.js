import { resolve } from "node:path";

import { createConfig, recommended } from "eslint-plugin-boundaries/config";

// The layering of src/: each element type lists what it may import. A new directory under src/ is declared here first.
// Elements are folders under src/; stylesheets and the root files (main.tsx, app.tsx, routes.tsx) are file categories.
const allow = (from, to) => ({
    from: { element: { type: from } },
    allow: { to: { element: { types: { anyOf: to } } } },
});

const config = [
    // The @/ alias comes from tsconfig.json paths through the TypeScript resolver (boundaries reads import/resolver).
    { settings: { "import/resolver": { typescript: { project: resolve(import.meta.dirname, "tsconfig.json") } } } },
    createConfig({
        settings: {
            ...recommended.settings,
            "boundaries/root-path": resolve(import.meta.dirname, "src"),
            "boundaries/elements": [
                { type: "lib", pattern: "lib" },
                { type: "api", pattern: "api" },
                { type: "auth", pattern: "auth" },
                { type: "components", pattern: "components" },
                { type: "layout", pattern: "layout" },
                { type: "map", pattern: "map" },
                { type: "pages-common", pattern: "pages/common" },
                { type: "pages", pattern: "pages" },
                { type: "test", pattern: "test" },
            ],
            "boundaries/files": [
                { category: "styles", pattern: "**/*.scss" },
                { category: "root", pattern: "*.{ts,tsx}" },
            ],
        },
        rules: {
            ...recommended.rules,
            "boundaries/dependencies": [
                "error",
                {
                    // Switched to "disallow" once src/ has the layered layout.
                    default: "allow",
                    policies: [
                        // Every part may import stylesheets.
                        { allow: { to: { file: { categories: "styles" } } } },
                        allow("lib", ["lib"]),
                        allow("api", ["api", "auth", "lib"]),
                        allow("auth", ["auth", "api", "lib"]),
                        allow("components", ["components", "lib"]),
                        allow("layout", ["layout", "api", "auth", "components", "lib"]),
                        allow("map", ["map", "layout", "api", "auth", "components", "lib"]),
                        allow("pages-common", ["pages-common", "api", "auth", "components", "lib"]),
                        allow("pages", ["pages", "pages-common", "map", "layout", "api", "auth", "components", "lib"]),
                        // The root files and the test helpers wire everything together.
                        { from: { file: { categories: "root" } }, allow: { to: { element: { type: "*" } } } },
                        allow("test", ["*"]),
                    ],
                },
            ],
        },
    }),
];
export default config;
