#!/bin/sh
set -eu

RUNTIME_FILE="/app/public/runtime-env.js"
TMP_FILE="$(mktemp)"

{
  echo "window.__RUNTIME_CONFIG__ = {"
  FIRST=1
  for VAR_NAME in $(env | cut -d= -f1 | grep '^NEXT_PUBLIC_' | sort); do
    VAR_VALUE="$(printenv "$VAR_NAME" || true)"
    ESCAPED_VALUE="$(printf '%s' "$VAR_VALUE" | sed 's/\\/\\\\/g; s/\"/\\"/g')"
    if [ "$FIRST" -eq 1 ]; then
      FIRST=0
    else
      echo ","
    fi
    printf '  "%s": "%s"' "$VAR_NAME" "$ESCAPED_VALUE"
  done
  echo
  echo "};"
} >"$TMP_FILE"

mv "$TMP_FILE" "$RUNTIME_FILE"

exec node server.js