#!/usr/bin/env bash
set -euo pipefail

report="$(mktemp)"
trap 'rm -f "$report"' EXIT

status=0
./node_modules/.bin/eslint . --format json >"$report" || status=$?
if (( status > 1 )); then
  echo "ESLint failed before producing a usable baseline report." >&2
  exit "$status"
fi

read -r errors warnings files < <(
  node -e '
    const fs = require("fs");
    const results = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const errors = results.reduce((n, result) => n + result.errorCount, 0);
    const warnings = results.reduce((n, result) => n + result.warningCount, 0);
    process.stdout.write(`${errors} ${warnings} ${results.length}\n`);
  ' "$report"
)

if (( files == 0 )); then
  echo "ESLint produced an empty baseline report." >&2
  exit 1
fi
if (( errors > 137 || warnings > 89 )); then
  echo "Legacy lint baseline regressed: ${errors} errors/${warnings} warnings; maximum 137/89." >&2
  exit 1
fi

echo "Legacy lint baseline accepted: ${errors} errors and ${warnings} warnings. Changed files must pass current rules."
