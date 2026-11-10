# ─── deps: full dependency install (dev deps are needed by `nuxt build`) ───
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# ─── build: generate Prisma client + build the Nitro output ───
# No .env is present in the build context (.dockerignore): nothing secret is
# baked at build time. All NUXT_* / NUXT_PUBLIC_* overrides happen at runtime.
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY . .
RUN npx prisma generate && npm run build

# ─── runner: non-root runtime image ───
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Create the non-root user FIRST so COPY --chown can stamp ownership in one
# step (no recursive chown -R over node_modules, which is very slow).
RUN addgroup -S appuser && adduser -S appuser -G appuser

# .output: built server + public assets
COPY --from=build --chown=appuser:appuser /app/.output ./.output
# prisma/: schema + all migrations (schema.prisma + housekeeping)
COPY --from=build --chown=appuser:appuser /app/prisma ./prisma
COPY --from=build --chown=appuser:appuser /app/package.json ./package.json
# node_modules from BUILD (not deps): includes Prisma CLI + engines AND the
# generated client (prisma generate writes into build-stage node_modules).
# Kept in the image because the one-shot `migrate` service runs
# `npx prisma migrate deploy` from this same image in docker-compose.prod.yml.
COPY --from=build --chown=appuser:appuser /app/node_modules ./node_modules

# Writable data dirs (named volumes adopt this ownership on first mount).
RUN mkdir -p /app/storage /app/public/uploads \
  && chown appuser:appuser /app/storage /app/public/uploads

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=40s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

# CMD ONLY starts the server. Migrations run in the dedicated one-shot
# `migrate` service (docker-compose.prod.yml), never on app container start.
CMD ["node", ".output/server/index.mjs"]
