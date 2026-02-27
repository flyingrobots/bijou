#!/usr/bin/env bash
set -euo pipefail

# Record all VHS demo tapes in parallel.
# Usage:
#   ./scripts/record-gifs.sh          # record all
#   ./scripts/record-gifs.sh dag box  # record specific examples
#   JOBS=4 ./scripts/record-gifs.sh   # limit parallelism

JOBS="${JOBS:-8}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT"

# Pre-build so VHS sessions don't each pay the tsc cost
echo "Building packages..."
npx tsc -b 2>/dev/null

# Collect tapes
tapes=()
if [[ $# -gt 0 ]]; then
  for name in "$@"; do
    tape="examples/$name/demo.tape"
    if [[ -f "$tape" ]]; then
      tapes+=("$tape")
    else
      echo "Warning: $tape not found, skipping" >&2
    fi
  done
else
  for tape in examples/*/demo.tape; do
    tapes+=("$tape")
  done
fi

if [[ ${#tapes[@]} -eq 0 ]]; then
  echo "No tapes found." >&2
  exit 1
fi

echo "Recording ${#tapes[@]} GIFs with $JOBS parallel jobs..."

record_one() {
  local tape="$1"
  local name
  name="$(basename "$(dirname "$tape")")"
  local gif="examples/$name/demo.gif"
  if vhs "$tape" > /dev/null 2>&1; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name (failed)" >&2
  fi
}
export -f record_one

printf '%s\n' "${tapes[@]}" | xargs -P "$JOBS" -I {} bash -c 'record_one "$@"' _ {}

echo "Done."
