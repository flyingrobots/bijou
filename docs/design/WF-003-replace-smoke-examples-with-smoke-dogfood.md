# WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor human

A maintainer preparing `4.1.0` and needing the repo's release smoke
contract to match the repo's stated DOGFOOD-first docs posture.

## Sponsor agent

An agent that must answer, from repo artifacts alone:

- what release smoke actually runs before `4.1.0`
- whether DOGFOOD or the broad `examples/` tree is the public proving
  surface
- which scripts and workflows witness that answer

## Hill

The public `4.1.0` smoke contract now belongs to DOGFOOD.

The workspace scripts, release-readiness gauntlet, CI workflow,
release-dry-run workflow, publish workflow, and release docs all agree
that DOGFOOD is the release-facing smoke surface.

## Why this cycle exists

[DF-025](./DF-025-make-dogfood-the-only-human-facing-docs-surface.md)
made the repo posture sharp: DOGFOOD, not `examples/`, is the only
human-facing docs surface for `4.1.0`.

But the release contract was still lying:

- `package.json` still exposed `smoke:examples:*` as the main smoke
  family
- `release:readiness` still ran `smoke:examples:all`
- CI, release dry-runs, and publish verification still fanned out the
  old examples lanes
- repo docs still talked about moving smoke to DOGFOOD as future work

That meant the repo could teach one surface while releasing against
another.

## Human users

### Primary human user

A maintainer or reviewer checking whether `4.1.0` is ready to release.

### Human hill

A human can inspect the package scripts, workflows, and release docs and
see one coherent answer: DOGFOOD is the release-facing smoke surface.

## Agent users

### Primary agent user

A coding or release agent that needs to run or explain pre-release
validation without chat-memory folklore.

### Agent hill

An agent can recover the DOGFOOD smoke contract from repo artifacts
alone without guessing whether examples are still canonical.

## Playback questions

1. Does the workspace expose `smoke:dogfood`,
   `smoke:dogfood:landing`, and `smoke:dogfood:docs`?
2. Does `release:readiness` now run `smoke:dogfood -- --skip-build`
   instead of `smoke:examples:all`?
3. Do CI, release dry-runs, and publish verification all fan out the
   DOGFOOD smoke lanes instead of the examples lanes?
4. Does the repo explicitly say that examples are secondary while
   DOGFOOD owns the release smoke contract?
5. Is `WF-003` promoted into `docs/design/`, with the temporary
   `v4.1.0/` blocker lane pruned again because no cycle-shaped blockers
   remain?

## Accessibility / assistive reading posture

This cycle is terminal-output shaped. The smoke harness must prove the
landing and docs shell through stable, plain-text witnesses after ANSI
noise is stripped.

## Localization / directionality posture

DOGFOOD is the localized, docs-bearing product surface. Release smoke
should exercise that route rather than a grab bag of legacy examples.

## Agent inspectability / explainability posture

The release smoke decision must be discoverable through:

- `package.json`
- `scripts/smoke-dogfood-lib.ts`
- `scripts/release-readiness.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/release-dry-run.yml`
- `.github/workflows/publish.yml`
- `docs/release.md`
- `docs/EXAMPLES.md`
- cycle tests

## Non-goals

- deleting every example-specific smoke helper immediately
- removing reference or migration examples that still carry isolated API
  value
- cutting the `4.1.0` tag
- changing the already-shaped `4.1.0` release scope

## Evidence

### Before this cycle

- `package.json` exposed `smoke:examples:*`
- `scripts/release-readiness.ts` still ran `smoke:examples:all`
- CI and release workflows still used `smoke:examples:pipe`,
  `smoke:examples:static`, and `smoke:examples:interactive`
- `docs/release.md` still described moving smoke to DOGFOOD as an open
  blocker

### Local validation witness

These commands passed locally during this cycle:

```bash
npm test -- scripts/smoke-dogfood.test.ts scripts/release-readiness.test.ts
npm run smoke:dogfood -- --skip-build
```

The DOGFOOD smoke harness now drives the existing deterministic capture
entrypoint in `examples/docs/capture-main.ts` through two scripted
journeys:

- `landing`
- `docs`

## Decision

`4.1.0` release smoke belongs to DOGFOOD, not the broad `examples/`
tree.

Bijou should therefore:

1. expose DOGFOOD smoke as the public smoke family
2. run DOGFOOD smoke in local release readiness
3. fan DOGFOOD smoke out in CI and release workflows
4. describe example smoke as secondary/internal rather than release
   canonical

## Implementation outline

1. Add a DOGFOOD smoke harness around `examples/docs/capture-main.ts`
   with stable `landing` and `docs` journeys.
2. Replace the public `smoke:examples:*` package scripts with
   `smoke:dogfood`, `smoke:dogfood:landing`, and `smoke:dogfood:docs`.
3. Switch `release:readiness` and the GitHub workflows to the new
   DOGFOOD smoke commands.
4. Update release docs, backlog/signpost docs, and examples posture docs
   so they stop describing DOGFOOD smoke as future work.
5. Promote `WF-003` into `docs/design/` and prune the now-empty
   `docs/BACKLOG/v4.1.0/` lane again.

## Tests to write first

- a unit test for the DOGFOOD smoke runner's option parsing and launch
  plans
- a release-readiness test proving the gauntlet now runs
  `smoke:dogfood`
- a cycle test proving `WF-003` moved into `docs/design/` and the
  temporary blocker lane was pruned again

## Retrospective

### What landed

- the repo now exposes DOGFOOD-centered smoke scripts
- release readiness and GitHub workflows now run DOGFOOD smoke instead
  of examples smoke
- release/docs signposts no longer describe DOGFOOD smoke as unresolved
- the temporary `v4.1.0/` blocker lane is pruned again because the
  cycle-shaped blockers are cleared

### Drift from ideal

- the older example smoke harness still exists as internal tooling until
  a later cycle decides exactly which example-only proofs to keep or
  retire
- release execution itself is still outstanding

### Debt spawned

- no new cycle-shaped blocker; the next work is operational release
  execution or post-`4.1.0` follow-on backlog
