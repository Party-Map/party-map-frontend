# Party Map frontend

Map-based event browser with an admin area for venue managers, performer managers and event organizers. A
client-rendered React 19 single-page app built with Rsbuild, styled with hand-written SCSS CSS Modules, signed in
through Keycloak (public client, PKCE) and talking to the Party Map REST API under `/api`.

## Stack

| Concern            | Choice                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Build              | Rsbuild 2 (Rspack), static SPA, no SSR                                                                                         |
| UI                 | React 19, React Router 8 in library mode (`createBrowserRouter` + `RouterProvider`)                                            |
| Styles             | SCSS CSS Modules per part, design tokens in `src/styles/base.scss`, no Tailwind, no component kit                              |
| Headless behaviour | Base UI (dialogs, tabs), cmdk (search results), sonner (toasts)                                                                |
| Server state       | TanStack Query over openapi-fetch, types generated from the backend's OpenAPI document                                         |
| Forms              | react-hook-form + zod                                                                                                          |
| Auth               | keycloak-js (public client `partymap-web`, PKCE), tokens in memory                                                             |
| Map                | Leaflet + react-leaflet; the basemap is MapLibre GL over self-hosted Hungary vector tiles ([tiles/README.md](tiles/README.md)) |
| Tests              | Vitest + Testing Library (90 % coverage gate), Playwright e2e and visual baselines                                             |
| Tooling            | pnpm 12, ESLint 10 (type-checked, import boundaries), Stylelint, Prettier, syncpack, husky, commitlint                         |

## Run locally

The backend and Keycloak come from the backend repo: `docker compose up` in `../party-map-backend` starts both
(API on 8080, Keycloak on 8081) with the dev realm and users (`e2e@partymap.local` / `e2e-password`).

```bash
corepack enable                 # Node 24 (.nvmrc), pnpm 12 from package.json
pnpm install
cp .env.example .env.local      # Keycloak URL, realm and client
docker compose --profile build run --rm tiles-build   # once: builds the Hungary tiles (tiles/README.md)
docker compose up -d tiles      # the tile server on :3001
pnpm dev                        # http://localhost:3000, /api is proxied to http://localhost:8080 (API_URL),
                                # /tiles to http://localhost:3001 (TILES_URL)
```

Or in Docker without Node on the host: `docker compose up` (same ports, hot reload).

## Commands

```bash
pnpm check           # every gate below, then the build
pnpm lint:deps       # syncpack: dependency ranges and package.json format
pnpm lint:code       # eslint (type-checked, import boundaries between src/ layers)
pnpm lint:styles     # stylelint: kebab-case classes, tokens instead of literal colours and sizes
pnpm lint:tsc        # tsc --noEmit
pnpm lint:classes    # every CSS Module class is read somewhere
pnpm test:react      # vitest (add --run --coverage for the coverage gate: 90/90/90, 80 branches)
pnpm e2e             # Playwright against the running stack; pnpm e2e:visual / e2e:update for baselines
pnpm api:types       # regenerate src/api/schema.d.ts from openapi.json
pnpm build && pnpm preview
```

## API types

`openapi.json` is the backend's springdoc document. After an API change:

```bash
(cd ../party-map-backend && ./gradlew test --tests '*OpenApiExportTest*')
cp ../party-map-backend/build/openapi.json openapi.json
pnpm api:types      # then fix what tsc reports
```

## Layout

```
src/
  main.tsx, app.tsx, routes.tsx   entry, providers, route table
  api/        typed client, generated schema, fetchers per controller, Query keys and hooks
  auth/       keycloak-js wrapper, provider (useAuth), roles, session and the session-ended dialog
  components/ shared UI (Button, Card, Field, States, primitives on Base UI, ConfirmDialog) and shared modules
  layout/     app chrome: top and bottom bars, search, page shell, admin layout, sign-in gates, toaster
  map/        the Leaflet map, its pins and labels; basemap/ holds the MapLibre style (palette, layers)
  pages/      one folder per area (places, events, performers, profile, map, admin/*)
  lib/        env, theme, toast, format (date-fns), geocode (Nominatim), constants, utils (cn)
  styles/     base.scss (the only global sheet), _mixins.scss
  test/       setup, render helpers, API mock, fixtures, Leaflet and MapLibre mocks
```

Coding agents and contributors: the rules are in [AGENTS.md](AGENTS.md).

## Build and deploy

```bash
docker build --build-arg PUBLIC_API_BASE=https://api.terkep.party/api \
  --build-arg PUBLIC_KEYCLOAK_URL=https://auth.terkep.party -t party-map-frontend .
docker run -p 3000:8080 party-map-frontend     # nginx (unprivileged) on 8080, /healthz
```

The image proxies the detail-page shells and the sitemap to `BACKEND_UPSTREAM` (default `backend:8080`) and `/tiles/`
to the Martin tile server at `TILES_UPSTREAM` (default `tiles:3000`), cached on disk; see
[tiles/README.md](tiles/README.md) for the production rollout of the tile service.

GitHub Actions runs `pnpm check` on every push and pull request, fails when the committed CSS Module
declarations are stale, and publishes `ghcr.io/party-map/party-map-frontend:latest` from `main`.
