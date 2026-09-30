import { resolve } from "node:path";

import { createConfig, recommended } from "eslint-plugin-boundaries/config";

// The layering of src/: each element type lists what it may import. A new directory under src/ is declared here first.
const allow = (from, to) => ({
    from: { element: { type: from } },
    allow: { to: { element: { types: { anyOf: to } } } },
});

const config = [
    createConfig({
        settings: {
            ...recommended.settings,
            "boundaries/root-path": resolve(import.meta.dirname, "src"),
            // The @/ alias comes from tsconfig.json paths through the TypeScript resolver.
            "import/resolver": { typescript: { project: resolve(import.meta.dirname, "tsconfig.json") } },
            "boundaries/elements": [
                { type: "styles", pattern: "**/*.scss", partialMatch: false },
                { type: "lib", pattern: "lib/*", partialMatch: false },
                { type: "api", pattern: "api/*", partialMatch: false },
                { type: "auth", pattern: "auth/*", partialMatch: false },
                { type: "components", pattern: "components/*", partialMatch: false },
                { type: "layout", pattern: "layout/*", partialMatch: false },
                { type: "map", pattern: "map/*", partialMatch: false },
                { type: "pages-common", pattern: "pages/common/*", partialMatch: false },
                { type: "pages", pattern: "pages/*", partialMatch: false },
                { type: "root", pattern: ["*.ts", "*.tsx", "test/*"], partialMatch: false },
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
                        // Every part may import its stylesheets.
                        allow("*", ["styles"]),
                        allow("lib", ["lib"]),
                        allow("api", ["api", "auth", "lib"]),
                        allow("auth", ["auth", "api", "lib"]),
                        allow("components", ["components", "lib"]),
                        allow("layout", ["layout", "api", "auth", "components", "lib"]),
                        allow("map", ["map", "layout", "api", "auth", "components", "lib"]),
                        allow("pages-common", ["pages-common", "api", "auth", "components", "lib"]),
                        allow("pages", ["pages", "pages-common", "map", "layout", "api", "auth", "components", "lib"]),
                        { from: { element: { type: "root" } }, allow: { to: { element: { type: "*" } } } },
                    ],
                },
            ],
        },
    }),
];
export default config;
