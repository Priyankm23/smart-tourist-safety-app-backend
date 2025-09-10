#!/bin/sh
# docker-entrypoint.sh
# Usage:
# - Mount or provide an env file at /run/secrets/app_env or /env/.env or pass path via APP_ENV_PATH env var

set -e

APP_ENV_PATH=${APP_ENV_PATH:-/run/secrets/app_env}

copy_env_if_needed() {
  src="$1"
  dst="/usr/src/app/.env"
  echo "Using env file from $src"
  if [ -f "$dst" ]; then
    # If files are identical or the same file, skip copying to avoid noisy cp messages
    if cmp -s "$src" "$dst"; then
      echo "Destination $dst already identical to $src — skipping copy"
      return
    fi
  fi
  cp "$src" "$dst"
}

if [ -f "$APP_ENV_PATH" ]; then
  copy_env_if_needed "$APP_ENV_PATH"
elif [ -f /env/.env ]; then
  copy_env_if_needed /env/.env
else
  echo "No external env file found; relying on container environment variables or existing .env"
fi

exec "$@"
