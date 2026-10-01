# Build the static bundle. Public configuration is baked in at build time (Rsbuild inlines PUBLIC_* values).
FROM node:24-bookworm-slim AS build
RUN corepack enable
WORKDIR /frontend
# No git hooks in the image (package.json's prepare script installs husky's).
ENV HUSKY=0

ARG PUBLIC_API_BASE=/api
ARG PUBLIC_KEYCLOAK_URL
ARG PUBLIC_KEYCLOAK_REALM=party-map
ARG PUBLIC_KEYCLOAK_CLIENT_ID=partymap-web
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE \
    PUBLIC_KEYCLOAK_URL=$PUBLIC_KEYCLOAK_URL \
    PUBLIC_KEYCLOAK_REALM=$PUBLIC_KEYCLOAK_REALM \
    PUBLIC_KEYCLOAK_CLIENT_ID=$PUBLIC_KEYCLOAK_CLIENT_ID

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . ./
RUN pnpm build

# The official nginx image running as a non-root user, listening on 8080. Its entrypoint renders the template in
# nginx/templates with the environment: BACKEND_UPSTREAM is the backend the detail-page HTML routes and the sitemap
# are proxied to (the compose service name), NGINX_RESOLVER the DNS that resolves it (Docker's embedded DNS).
FROM nginxinc/nginx-unprivileged:stable-alpine
ENV BACKEND_UPSTREAM=backend:8080 \
    NGINX_RESOLVER=127.0.0.11
COPY nginx/templates/ /etc/nginx/templates/
COPY --from=build /frontend/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
