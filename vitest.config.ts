import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
        env: {
            PUBLIC_API_BASE: "http://api.test/api",
            PUBLIC_KEYCLOAK_URL: "http://kc.test",
            PUBLIC_KEYCLOAK_REALM: "party-map",
            PUBLIC_KEYCLOAK_CLIENT_ID: "partymap-web",
        },
        // A component test sees the module's class names as written (kebab-case), so the modules are compiled.
        css: { include: [/\.module\.scss$/], modules: { classNameStrategy: "non-scoped" } },
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/**/*.test.{ts,tsx}",
                "src/test/**",
                "src/main.tsx",
                "src/env.d.ts",
                "src/api/schema.d.ts",
                "src/**/*.module.scss.d.ts",
            ],
            reporter: ["text", "html", "lcov"],
            reportsDirectory: "./coverage",
            thresholds: { lines: 90, statements: 90, functions: 90, branches: 80 },
        },
    },
    css: { modules: { localsConvention: "camelCaseOnly" } },
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
});
