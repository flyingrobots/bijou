#!/usr/bin/env sh
# Preserve pre-push ref records on stdin for the existing path-sensitive gates.
set -eu
node scripts/docker-seal/require-docker.mjs
npm run build
printf '%s\n' 'Code Dojo: pre-push full verification'
npm run -s code-dojo:prepush
printf '%s\n' 'Bijou: pre-push full verification'
scripts/hooks/pre-push
