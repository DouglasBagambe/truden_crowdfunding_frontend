#!/usr/bin/env bash
set -euo pipefail

base="${QUALITY_BASE_SHA:-e0af69b8d7d89c8f97dee5e37d4ea5786e019262}"
mapfile -t changed < <(
  {
    git diff --name-only --diff-filter=ACMR "$base" --
    git ls-files --others --exclude-standard
  } | sort -u | grep -v '^package-lock\.json$' || true
)

lintable=()
formattable=()
for file in "${changed[@]}"; do
  [[ "$file" =~ \.(cjs|mjs|js|ts|tsx)$ ]] && lintable+=("$file")
  [[ "$file" =~ \.(cjs|mjs|js|ts|tsx|json|yaml|yml|css|md)$ ]] && formattable+=("$file")
done

if (( ${#lintable[@]} > 0 )); then
  ./node_modules/.bin/eslint --max-warnings=0 "${lintable[@]}"
fi
if (( ${#formattable[@]} > 0 )); then
  ./node_modules/.bin/prettier --check "${formattable[@]}"
fi

echo "Changed-file quality checks passed for ${#changed[@]} file(s)."
