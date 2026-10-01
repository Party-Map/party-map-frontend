import type { IncomingMessage } from "node:http";

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginTypedCSSModules } from "@rsbuild/plugin-typed-css-modules";

// The dev server proxies /api to the backend. The backend mounts every route under /api itself, so the
// prefix is kept (no pathRewrite). Keycloak stays on its own origin: the browser follows its redirects.
const API = process.env.API_URL || "http://localhost:8080";

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

// Public build-time configuration, read from the environment or .env / .env.local (PUBLIC_* only).
const publicEnv = {
    PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || "/api",
    PUBLIC_KEYCLOAK_URL: process.env.PUBLIC_KEYCLOAK_URL,
    PUBLIC_KEYCLOAK_REALM: process.env.PUBLIC_KEYCLOAK_REALM || "party-map",
    PUBLIC_KEYCLOAK_CLIENT_ID: process.env.PUBLIC_KEYCLOAK_CLIENT_ID || "partymap-web",
};

export default defineConfig({
    // Sass compiles each part's module (src/**/*.module.scss) beside its component; the typed plugin writes the
    // X.module.scss.d.ts next to it (committed, so tsc works without a build).
    plugins: [pluginReact(), pluginSass(), pluginTypedCSSModules()],
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
        // WATCH_POLL=true when file events do not reach the process (Docker bind mounts).
        rspack: { watchOptions: { poll: process.env.WATCH_POLL === "true" ? 500 : false } },
    },
});
