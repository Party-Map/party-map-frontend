import { readFileSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { createRequire } from "node:module";

import { defineConfig, type RsbuildPlugin } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginTypedCSSModules } from "@rsbuild/plugin-typed-css-modules";

// The dev server proxies /api to the backend. The backend mounts every route under /api itself, so the
// prefix is kept (no pathRewrite). Keycloak stays on its own origin: the browser follows its redirects.
const API = process.env.API_URL || "http://localhost:8080";
// The basemap's vector tiles and glyphs come from the Martin tile server (`docker compose up tiles`), which serves
// everything under /tiles itself, so the prefix is kept here too. Without the container the proxy answers 502 and the
// map shows its plain background.
const TILES = process.env.TILES_URL || "http://localhost:3001";

// HTML navigations to a detail page (and the sitemap) go to the backend too, which answers this very app's
// index.html with the page's metadata and data spliced in (its "shell" routes). Script and API requests under the
// same paths stay with the dev server. SHELL_PROXY=off keeps everything local for frontend-only work.
const SHELL_ROUTE = /^\/(events|places|performers)\/[0-9a-f-]{36}$/;
const wantsHtml = (req: IncomingMessage) => (req.headers.accept ?? "").includes("text/html");
const shellProxy =
    process.env.SHELL_PROXY === "off"
        ? []
        : [
              {
                  pathFilter: (pathname: string, req: IncomingMessage) =>
                      pathname === "/sitemap.xml" || (SHELL_ROUTE.test(pathname) && wantsHtml(req)),
                  target: API,
                  changeOrigin: true,
                  xfwd: true,
              },
          ];

// MapLibre GL runs its tile parsing in a web worker that it loads as a separate module next to its own URL, which no
// bundle can provide: the worker and the module it shares with the main bundle are emitted as they are into a
// versioned folder (in dev and in the build), and src/map/basemap/worker.ts points MapLibre at it (same path).
const require = createRequire(import.meta.url);
const maplibreVersion = (require("maplibre-gl/package.json") as { version: string }).version;
const maplibreWorkerPlugin: RsbuildPlugin = {
    name: "maplibre-worker",
    setup(api) {
        api.processAssets({ stage: "additional" }, ({ compilation, sources }) => {
            for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
                const name = `static/maplibre-${maplibreVersion}/${file}`;
                if (compilation.getAsset(name)) continue;
                compilation.emitAsset(
                    name,
                    new sources.RawSource(readFileSync(require.resolve(`maplibre-gl/dist/${file}`))),
                );
            }
        });
    },
};

// Public build-time configuration, read from the environment or .env / .env.local (PUBLIC_* only).
const publicEnv = {
    PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || "/api",
    PUBLIC_TILES_BASE: process.env.PUBLIC_TILES_BASE || "/tiles",
    PUBLIC_KEYCLOAK_URL: process.env.PUBLIC_KEYCLOAK_URL,
    PUBLIC_KEYCLOAK_REALM: process.env.PUBLIC_KEYCLOAK_REALM || "party-map",
    PUBLIC_KEYCLOAK_CLIENT_ID: process.env.PUBLIC_KEYCLOAK_CLIENT_ID || "partymap-web",
};

export default defineConfig({
    // Sass compiles each part's module (src/**/*.module.scss) beside its component; the typed plugin writes the
    // X.module.scss.d.ts next to it (committed, so tsc works without a build).
    plugins: [pluginReact(), pluginSass(), pluginTypedCSSModules(), maplibreWorkerPlugin],
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
        // IPv4 loopback: the backend fetches index.html from here with a client that resolves "localhost" to
        // 127.0.0.1 first; browsers and curl fall back from ::1 on their own.
        host: "127.0.0.1",
        port: 3000,
        strictPort: true,
        proxy: [
            // xfwd: the API sees the browser's origin (X-Forwarded-Host), as behind a reverse proxy.
            { pathFilter: ["/api"], target: API, changeOrigin: true, xfwd: true },
            { pathFilter: ["/tiles"], target: TILES, changeOrigin: true },
            ...shellProxy,
        ],
    },
    output: {
        assetPrefix: "/",
        // Kebab-case classes in the stylesheets, camelCase keys in TS.
        cssModules: { exportLocalsConvention: "camelCaseOnly" },
    },
    dev: { lazyCompilation: false },
    tools: {
        rspack: {
            // WATCH_POLL=true when file events do not reach the process (Docker bind mounts).
            watchOptions: { poll: process.env.WATCH_POLL === "true" ? 500 : false },
            // maplibre-gl resolves its worker's URL at runtime (new URL(variable, import.meta.url)), which the
            // bundler reports as a dynamic dependency; the worker is bundled inline, nothing is missing.
            ignoreWarnings: [{ module: /maplibre-gl/, message: /Critical dependency/ }],
        },
    },
});
