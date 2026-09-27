# Party Map frontend

Map-based event browser with an admin area for venue managers, performer managers and event
organizers. A React 19 single-page application built with Vite, styled with plain CSS Modules,
authenticated against Keycloak (public client, PKCE) and talking to the Party Map REST backend.

## Run locally

The backend and Keycloak come from the backend repo: `docker compose up` in `../party-map-backend`
starts both (ports 8080 and 8081) with the dev realm and users.

With Docker (no Node on the host needed):

```bash
docker compose up               # http://localhost:3000, hot reload, node_modules kept in a volume
```

With Node on the host (Node 22.12+, pnpm via corepack):

```bash
corepack enable
pnpm install
cp .env.example .env.local      # adjust if your backend/Keycloak run elsewhere
pnpm dev                        # http://localhost:3000
```

The Keycloak realm needs a public client `partymap-web` with PKCE (S256), redirect URI
`http://localhost:3000/*`, web origin `http://localhost:3000` and post-logout redirect
`http://localhost:3000/*`. The infra repo's database dump contains it.

## Quality gates

```bash
pnpm check          # eslint + tsc + vitest with coverage thresholds (90 % lines/statements/functions, 80 % branches)
pnpm test           # vitest in watch mode
pnpm e2e            # Playwright flows against a running stack (E2E_USER / E2E_PASSWORD for a Keycloak user)
pnpm e2e:visual     # visual regression snapshots
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the project layout and conventions.

## Build and deploy

```bash
pnpm build && pnpm preview
docker build --build-arg VITE_API_BASE_URL=https://api.terkep.party --build-arg VITE_KEYCLOAK_URL=https://auth.terkep.party -t party-map-frontend .
docker run -p 3000:80 party-map-frontend
```

The image serves the static bundle with nginx (SPA fallback, `/health`). GitHub Actions runs
`pnpm check` on every push and pull request and publishes `ghcr.io/party-map/party-map-frontend:latest`
from `main`.
