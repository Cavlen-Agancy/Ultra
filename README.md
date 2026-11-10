# Ultra

Full-stack Nuxt 4 storefront and admin panel backed by PostgreSQL and Prisma.

This repository is a fresh Ultra project. It intentionally contains no legacy
brand data, catalog, uploaded media, backups, secrets, or migration history.

## Requirements

- Node.js 22+
- npm
- PostgreSQL 16 (or Docker)

## Local setup

```bash
npm ci --legacy-peer-deps
cp .env.example .env
```

Fill the required values in `.env`:

- `DATABASE_URL`
- `NUXT_SESSION_PASSWORD` (at least 32 characters)
- `ENCRYPTION_KEY` (exactly 64 hex characters)
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` for the first seed only

The template `DATABASE_URL` points at the local Docker database
(`localhost:5434`). For `docker-compose.prod.yml`, change the host to `db` and
use the production database password.

Start the development database:

```bash
docker compose up -d ultra-db
```

Create the fresh database schema and seed the first super admin:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

Start the app:

```bash
npm run dev
# http://localhost:3000
```

The local database is `ultra_db` on port `5434` (`ultra-db` service).

## Fresh database initialization

`prisma/migrations/` contains one clean initial migration generated from the
current `prisma/schema.prisma`. There is no legacy migration history.

```bash
npx prisma migrate deploy   # apply the initial migration
npx prisma db seed          # create the super admin + neutral SiteSettings
```

Do not use `prisma migrate reset` against a database that contains data you
need to keep. For a throwaway local database only, `npx prisma migrate reset`
will recreate the schema and rerun the seed.

## Build and production

```bash
npm run build
```

Docker production files:

- `Dockerfile`
- `docker-compose.yml` (local)
- `docker-compose.prod.yml` (VPS)
- `deploy.sh`

The production image is `ultra-app:prod`, containers are `ultra_app`,
`ultra_migrate`, and `ultra_postgres`, and the named volumes are `ultra_*`.

## Checks

```bash
npm run typecheck
npm run test:payment
npm run build
```

`npm run test:payment` covers the payment hash helper. There is no broader
automated test suite yet.

## Notes

- Defaults for store name, logo, colors, currency, tax, contact details, and
  integrations are neutral placeholders. Configure real values from the admin
  panel after the first login.
- `storage/` and `backups/` are gitignored local data directories. Do not copy
  them from another project.
