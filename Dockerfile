FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── Install all workspace dependencies ───────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/db/package.json              lib/db/
COPY lib/api-zod/package.json         lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-spec/package.json        lib/api-spec/
COPY artifacts/api-server/package.json    artifacts/api-server/
COPY artifacts/kingston-energy/package.json artifacts/kingston-energy/
COPY artifacts/mockup-sandbox/package.json  artifacts/mockup-sandbox/
COPY scripts/package.json             scripts/
RUN pnpm install --no-frozen-lockfile

# ── Build frontend ────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm --filter @workspace/kingston-energy build:prod

# ── Production runner (tsx + full source — no esbuild bundle) ─────────────
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy pnpm and node_modules from deps stage
COPY --from=deps /pnpm /pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/lib/db/node_modules          ./lib/db/node_modules
COPY --from=deps /app/lib/api-zod/node_modules     ./lib/api-zod/node_modules
COPY --from=deps /app/lib/api-client-react/node_modules ./lib/api-client-react/node_modules
COPY --from=deps /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules

# Copy source files needed to run
COPY pnpm-workspace.yaml package.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Copy built frontend
COPY --from=build /app/artifacts/kingston-energy/dist ./artifacts/kingston-energy/dist

EXPOSE 8080
CMD ["node_modules/.bin/tsx", "artifacts/api-server/src/index.ts"]
