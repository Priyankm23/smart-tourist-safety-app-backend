#!/bin/sh
# docker-entrypoint.sh
# Usage:
# - Mount or provide an env file at /run/secrets/app_env or /env/.env or pass path via APP_ENV_PATH env var

set -e

APP_ENV_PATH=${APP_ENV_PATH:-/run/secrets/app_env}

if [ -f "$APP_ENV_PATH" ]; then
  echo "Using env file from $APP_ENV_PATH"
  cp "$APP_ENV_PATH" /usr/src/app/.env
elif [ -f /env/.env ]; then
  echo "Using env file from /env/.env"
  cp /env/.env /usr/src/app/.env
else
  echo "No external env file found; relying on container environment variables or existing .env"
fi

exec "$@"
