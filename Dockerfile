# Multi-stage Dockerfile for a Next.js application using pnpm
FROM node:lts-alpine AS base

# Install corepack to manage pnpm
RUN apk --no-cache add curl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

# Install production dependencies only
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Build the application
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# Final stage: production image
FROM base

WORKDIR /app

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

# Copy production dependencies from the prod-deps stage
COPY --from=prod-deps /app/node_modules /app/node_modules

# Copy only the necessary files for running the Next.js application
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone /app/
COPY --from=build --chown=nextjs:nodejs /app/.next/static /app/.next/static

# Add public static files
ADD --chown=nextjs:nodejs public /app/public

ENV NODE_ENV=production

EXPOSE 3000

ENV PORT=3000

HEALTHCHECK --interval=5s --timeout=3s --retries=3  CMD curl -f http://localhost:3000/health || exit 1

CMD HOSTNAME="0.0.0.0" node server.js