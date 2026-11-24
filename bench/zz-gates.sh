F="bench/src/soak-app.ts bench/src/soak-scenarios.ts bench/src/soak-update.ts bench/src/soak-ports.ts bench/src/soak-node.ts bench/src/soak-host.test.ts bench/src/soak-scenario-context.test.ts tests/web-gpu/soak-host-reach.test.ts bench/src/scenarios/component-app.ts bench/src/scenarios/types.ts bench/src/harnesses/wall-time/child.ts"
run() { n=$1; shift; "$@" > /tmp/g-$n.log 2>&1; echo "GATE $n exit $?"; sed 's/\x1b\[[0-9;]*m//g' /tmp/g-$n.log | grep -v "node_modules/" | tail -n 25 | cut -c1-200; }
run build npm run build
run typecheck npm run typecheck
run typechecktest npm run typecheck:test
run eslint npx eslint $F
run size npm run code:size
run strict npm run code-dojo:strict
run vitest npx vitest run bench tests/web-gpu
