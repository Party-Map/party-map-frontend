import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";

// The dev server proxies /api to the backend. The backend mounts every route under /api itself, so the
// prefix is kept (no pathRewrite). Keycloak stays on its own origin: the browser follows its redirects.
const API = process.env.API_URL || "http://localhost:8080";

// Public build-time configuration, read from the environment or .env / .env.local (PUBLIC_* only).
const publicEnv = {
    PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || "/api",
    PUBLIC_KEYCLOAK_URL: process.env.PUBLIC_KEYCLOAK_URL,
    PUBLIC_KEYCLOAK_REALM: process.env.PUBLIC_KEYCLOAK_REALM || "party-map",
    PUBLIC_KEYCLOAK_CLIENT_ID: process.env.PUBLIC_KEYCLOAK_CLIENT_ID || "partymap-web",
};

export default defineConfig({
    plugins: [pluginReact(), pluginSass()],
    html: {
        // index.html carries the meta tags, the fonts and the pre-paint theme script.
        template: "./index.html",
        favicon: "./public/favicon.svg",
    },
    source: {
        entry: { index: "./src/main.tsx" },
        define: Object.fromEntries(
            Object.entries(publicEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
        ),
    },
    server: {
        // Port 3000: the Keycloak client's redirect URIs, the backend's CORS origin and Playwright expect it.
        port: 3000,
        strictPort: true,
        proxy: {
            // xfwd: the API sees the browser's origin (X-Forwarded-Host), as behind a reverse proxy.
            "/api": { target: API, changeOrigin: true, xfwd: true },
        },
    },
    output: {
        assetPrefix: "/",
        // Kebab-case classes in the stylesheets, camelCase keys in TS.
        cssModules: { exportLocalsConvention: "camelCaseOnly" },
    },
    dev: { lazyCompilation: false },
    tools: {
        // WATCH_POLL=true when file events do not reach the process (Docker bind mounts).
        rspack: { watchOptions: { poll: process.env.WATCH_POLL === "true" ? 500 : false } },
    },
});
