#!/usr/bin/env bash
set -euo pipefail

report="$(mktemp)"
trap 'rm -f "$report"' EXIT

status=0
./node_modules/.bin/prettier --list-different . >"$report" || status=$?
if (( status > 1 )); then
  echo "Prettier failed before producing a usable baseline report." >&2
  exit "$status"
fi

files="$(awk 'NF { count++ } END { print count + 0 }' "$report")"
if (( files > 70 )); then
  echo "Legacy format baseline regressed: ${files} files; maximum 70." >&2
  exit 1
fi

echo "Legacy format baseline accepted: ${files} unformatted files. Changed files must pass Prettier."
