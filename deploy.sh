#!/usr/bin/env bash
# Production deploy for Ultra on the shared VPS.
# GitHub Actions only SSHes in and runs this script; the image is built ON the
# server. All compose calls target docker-compose.prod.yml. Concurrency is
# guarded by flock so two overlapping deploys cannot interleave commands.
set -euo pipefail

# Repo root = script dir (script lives at the repo root).
cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"
IMAGE="ultra-app:prod"
APP_CONTAINER="ultra_app"
MIGRATE_CONTAINER="ultra_migrate"
LOCK="/var/lock/ultra-deploy-build.lock"
WAIT_SECONDS=150
LOGS_LINES=40

# Serialized: wait until any previous deploy finishes.
exec 9>"$LOCK"
flock 9

step() { echo -e "\n==> $1"; }

step "git pull --ff-only origin main"
git pull --ff-only origin main

step "build $IMAGE (nice -n 10 / ionice -c2 -n7)"
nice -n 10 ionice -c2 -n7 docker compose -f "$COMPOSE_FILE" build app

step "ensure external network 'proxy' exists"
docker network inspect proxy >/dev/null 2>&1 || docker network create proxy

step "apply migrations (one-shot migrate service)"
docker compose -f "$COMPOSE_FILE" up -d migrate
MIG_ERR="$(docker inspect -f '{{.State.Error}}' "$MIGRATE_CONTAINER" 2>/dev/null || true)"
if [ -n "$MIG_ERR" ] && [ "$MIG_ERR" != "<nil>" ]; then
  echo "Migration container failed to start: $MIG_ERR"
fi
MIGRATE_RC="$(docker wait "$MIGRATE_CONTAINER" 2>/dev/null || echo 1)"
if [ "$MIGRATE_RC" != "0" ]; then
  echo "Migration FAILED (exit code $MIGRATE_RC). Last logs:"
  docker compose -f "$COMPOSE_FILE" logs --tail="$LOGS_LINES" migrate || docker logs --tail="$LOGS_LINES" "$MIGRATE_CONTAINER" 2>/dev/null || true
  exit 1
fi

step "recreate app container ($APP_CONTAINER)"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate app

step "wait up to ${WAIT_SECONDS}s for $APP_CONTAINER to become healthy"
HEALTHY=""
for i in $(seq 1 "$WAIT_SECONDS"); do
  STATUS="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-health{{end}}' "$APP_CONTAINER" 2>/dev/null || echo missing)"
  if [ "$STATUS" = "healthy" ]; then HEALTHY=1; break; fi
  sleep 1
done

step "prune dangling images (dangling only — never other projects' images)"
docker image prune -f

step "last $LOGS_LINES log lines of $APP_CONTAINER"
docker compose -f "$COMPOSE_FILE" logs --tail="$LOGS_LINES" app

if [ -z "$HEALTHY" ]; then
  echo ""
  echo "FAILED: $APP_CONTAINER did not become healthy within ${WAIT_SECONDS}s (last health status: ${STATUS:-unknown})."
  exit 1
fi

echo ""
echo "Deploy OK: migration completed, $APP_CONTAINER is healthy."
