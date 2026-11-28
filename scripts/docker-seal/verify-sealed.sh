#!/usr/bin/env sh
# The release gate (npm run verify:sealed): the former commit and push gates, run in the seal.
set -eu
sh scripts/docker-seal/precommit.sh
sh scripts/docker-seal/prepush.sh < /dev/null
