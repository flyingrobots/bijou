# WF-122 - Day Zero Audit Fixes

Linked issues: #122, #123, #124, #125, #127, #129, #130, #131, #132, #135,
#136, #142, #143, #144, #150, #151, #152, #153, #154, #155, #165, #166

## Summary

This pass closes the remaining actionable Bijou deep-dive PDF findings that
were not already satisfied on `origin/main`.

The work landed in five clusters:

- Issues-first Method intake and historical backlog de-emphasis.
- Day 0 README/GUIDE/docs-map onboarding bridge.
- DOGFOOD terminal takeover and non-TTY guardrails.
- Node bootstrap diagnostics with a structured `BijouBootstrapError` contract.
- Runtime guardrails for command backpressure and async render middleware.
- Cross-platform contributor scripts and focused non-Linux CI.

## Design Evidence

- [WF-122 cross-platform contributor path](../../design/WF-122-cross-platform-contributor-path.md)
- [WF-123 issues-first Method intake](../../design/WF-123-issues-first-method-intake.md)
- [DX-125 day zero onboarding bridge](../../design/DX-125-day-zero-onboarding-bridge.md)
- [DF-150 DOGFOOD terminal guardrails](../../design/DF-150-dogfood-terminal-guardrails.md)
- [RE-142 Node bootstrap failure contract](../../design/RE-142-node-bootstrap-failure-contract.md)
- [RE-127 command and render runtime guardrails](../../design/RE-127-command-and-render-runtime-guardrails.md)

## Witness

Local validation completed on June 1, 2026:

- `node --check scripts/clean.mjs` passed.
- `node --check scripts/version.mjs` passed.
- `npm run clean` passed and removed 20 build artifacts.
- `npm run build` passed.
- `/usr/bin/time -p npm run hello --silent` rendered the hello example in
  `real 0.93` seconds on this workstation.
- `npm run workflow:shell:preflight` passed.
- Focused runtime/docs suite passed 5 files and 132 tests:

  ```bash
  npm test -- --run scripts/docs-preview.test.ts packages/bijou-node/src/index.test.ts packages/bijou-tui/src/pipeline/pipeline.test.ts packages/bijou-tui/src/eventbus.test.ts scripts/check-node-version.test.ts
  ```
- `npm run typecheck:test` passed.
- `npm run lint` passed across all workspaces.
- `npm run smoke:dogfood:landing` passed.
- `npm run smoke:dogfood:docs` passed.
- `npm run docs:inventory` passed.
- `git diff --check` passed.
- `npm test` passed 315 files and 3581 tests.
- `npm run verify:interactive-examples` passed.
- `npm run smoke:canaries -- --skip-build` passed all pack/install/build/run
  canaries.

The `tsx` runtime emitted Node's existing `DEP0205` deprecation warning during
some commands. It did not fail validation and is not introduced by this cycle.

## Outcome By Issue

| Issue | Outcome |
| :--- | :--- |
| #122 | Added cross-platform docs, portable root scripts, and macOS/Windows Node 22 CI lane. |
| #123 | Documented GitHub Issues as the live Method tracker. |
| #124 | Reframed backlog, retro, and graveyard docs as evidence/history rather than live queue. |
| #125 | Added `npm run app-frame` and a framed app tutorial. |
| #127 | Added EventBus command diagnostics and configurable backpressure warning. |
| #129 | Added async render middleware diagnostics and late-continuation guard tests. |
| #130 | Staged Surface, App, Msg, Cmd, and framed-shell concepts in README. |
| #131 | Documented full-model render cost and sync-pipeline tradeoff. |
| #132 | Explained package boundaries in README and PACKAGE_DEVELOPMENT. |
| #135 | Replaced root `clean` and `version` shell scripts with Node scripts. |
| #136 | Added focused macOS and Windows unit-test CI coverage. |
| #142 | Documented `initDefaultContext()` failure modes in node package docs. |
| #143 | Improved bootstrap failure framing through reason/hint/cause docs. |
| #144 | Added tests for `BijouBootstrapError` contract fields. |
| #150 | DOGFOOD now prints a full-screen launch notice before running. |
| #151 | DOGFOOD launch notice names quit confirmation and hard-exit controls. |
| #152 | DOGFOOD now rejects non-TTY stdin/stdout with a scripted-smoke hint. |
| #153 | CONTRIBUTING and METHOD now explain Method lane/state labels. |
| #154 | README fast path now measures to visible hello output before deeper docs. |
| #155 | README explains first-app package imports immediately after the example. |
| #165 | README narrative now starts with purpose, prerequisites, first commands, and next docs. |
| #166 | README and docs map expose GUIDE/docs/DOGFOOD navigation earlier. |

## Deferred Debt

GitHub-hosted macOS and Windows jobs need remote CI execution after push for
runner-specific proof. Locally, the new workflow syntax and focused test command
are covered by `workflow:shell:preflight`, build, typecheck, lint, and full
test/canary validation.
