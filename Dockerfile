# Docs site crt-ui.ritsuki.dev: adapter-static, served by nginx.
# Built and deployed by the `image` and `deploy` jobs in .github/workflows/ci.yml.

# ── Build ───────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
# pnpm version comes from `packageManager` in package.json
RUN corepack enable

# Manifests first so the install layer is cached until dependencies change.
# The SSR test app's manifest is needed because it is part of the workspace,
# but `--filter` skips installing its dependencies (Playwright and friends).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tests/ssr-app/package.json tests/ssr-app/
RUN pnpm install --frozen-lockfile --filter @ritsuki.kagerou/crt-ui

COPY . .
RUN pnpm build

# ── Run ─────────────────────────────────────────────────────
# Unprivileged variant: runs as uid 101 on port 8080.
FROM nginxinc/nginx-unprivileged:1.30-alpine AS run

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
	CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
