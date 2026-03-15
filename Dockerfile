FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── Install all workspace dependencies ───────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/db/package.json           lib/db/
COPY lib/api-zod/package.json      lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-spec/package.json          lib/api-spec/
COPY artifacts/api-server/package.json  artifacts/api-server/
COPY artifacts/kingston-energy/package.json artifacts/kingston-energy/
COPY artifacts/mockup-sandbox/package.json  artifacts/mockup-sandbox/
COPY scripts/package.json               scripts/
RUN pnpm install --no-frozen-lockfile

# ── Build frontend ────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm --filter @workspace/kingston-energy build:prod

# ── Build API server (bundles pg and all deps via esbuild) ────────────────
RUN pnpm --filter @workspace/api-server build

# ── Lean production image ─────────────────────────────────────────────────
FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# The esbuild bundle is self-contained; only need the dist files
COPY --from=build /app/artifacts/api-server/dist       ./artifacts/api-server/dist
COPY --from=build /app/artifacts/kingston-energy/dist  ./artifacts/kingston-energy/dist

EXPOSE 8080
CMD ["node", "artifacts/api-server/dist/index.cjs"]
