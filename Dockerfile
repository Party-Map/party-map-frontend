# Build the static bundle. Public config is baked in at build time (Rsbuild inlines PUBLIC_* values).
FROM node:24-alpine AS build
WORKDIR /app

ARG PUBLIC_API_BASE=/api
ARG PUBLIC_KEYCLOAK_URL
ARG PUBLIC_KEYCLOAK_REALM=party-map
ARG PUBLIC_KEYCLOAK_CLIENT_ID=partymap-web
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE \
    PUBLIC_KEYCLOAK_URL=$PUBLIC_KEYCLOAK_URL \
    PUBLIC_KEYCLOAK_REALM=$PUBLIC_KEYCLOAK_REALM \
    PUBLIC_KEYCLOAK_CLIENT_ID=$PUBLIC_KEYCLOAK_CLIENT_ID

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Serve it with nginx: static files, SPA fallback, /health for the orchestrator.
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/health || exit 1
