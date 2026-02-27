#!/usr/bin/env bash
# Thin wrapper — the real script is TypeScript + bijou.
exec npx tsx "$(dirname "$0")/record-gifs.ts" "$@"
