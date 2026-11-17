#!/usr/bin/env sh
# Execute the existing commit gates only after sealed-container admission.
set -eu
node scripts/docker-seal/require-docker.mjs
npm run build
printf '%s\n' 'Code Dojo: pre-commit gate'
npm run -s code-dojo:precommit
printf '%s\n' 'Bijou: pre-commit gate'
scripts/hooks/pre-commit
