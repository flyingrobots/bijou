# WF-004 — Shape The Next Release

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor human

A maintainer preparing the next public Bijou release.

## Sponsor agent

An agent that must answer, from repo artifacts alone:

- what the next release is
- why it has that version number
- what is in it
- what is deferred
- what must be true before tagging

## Hill

The next Bijou release is a deliberate, inspectable decision rather than
an accretion of unreleased work.

## Why this cycle exists

Since `v4.0.0`, Bijou has accumulated a large and mixed wave of work:

- runtime engine architecture and implementation slices
- humane shell behavior and shell introspection
- DOGFOOD growth into a real proving surface
- new localization packages and workflow tooling
- design-language doctrine and reusable review surfaces
- release, workflow, and repo-signpost hardening

That progress is real, but it created release ambiguity:

- `[Unreleased]` in `CHANGELOG.md` is not yet a clean `v4.0.0..HEAD`
  release boundary
- the repo had long-form release docs, but they still lived under
  `docs/releases/next/`
- the workspace contains new i18n packages, but the automated npm
  publish matrix still only covers the older five published packages
- [RE-007](../BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  is important follow-on architecture work, but the repo had not yet
  answered whether it is a release blocker

This cycle exists to make those choices explicit.

## Human users

### Primary human user

A maintainer who needs to explain the release to users and execute it
without hand-waving.

### Human hill

A maintainer can point to repo files and answer:

- why the next release is `4.1.0`
- what is included
- what is explicitly deferred
- what exact evidence makes the release ready

## Agent users

### Primary agent user

A coding or release agent preparing docs, release notes, workflow
changes, or migration guidance.

### Agent hill

An agent can recover the next release boundary, version, and readiness
criteria from the repo itself without relying on chat memory or vague
interpretation of `[Unreleased]`.

## Playback questions

1. After reading this cycle and the release docs, can a maintainer
   explain why the next release is `4.1.0` instead of a patch or a new
   major?
2. Can a maintainer see that `RE-007` is explicitly deferred rather
   than silently assumed to be a blocker?
3. Can an agent find versioned long-form release docs in
   `docs/releases/4.1.0/`?
4. Can a release operator name the unresolved blockers before tagging?

## Accessibility / assistive reading posture

This cycle is documentation-first. The important requirement is that the
release shape remains legible in plain markdown and does not depend on
tables, screenshots, or GitHub-specific UI to understand the decision.

## Localization / directionality posture

The release includes localization work, so the docs must not pretend
that the repo is still English-only by design. The prose remains English
for now, but the release shape must explicitly acknowledge the new i18n
packages and the publish-matrix gap around them.

## Agent inspectability / explainability posture

Version choice, scope, deferrals, and readiness criteria must live in
repo artifacts:

- this cycle doc
- `docs/releases/4.1.0/`
- [docs/release.md](../release.md)
- [docs/PLAN.md](../PLAN.md)
- [docs/BEARING.md](../BEARING.md)

## Non-goals

- actually tagging or publishing `4.1.0`
- implementing `RE-007`
- fully rewriting changelog history before `v4.0.0`
- pretending the release is ready before its blocking gaps are closed

## Evidence

### Release boundary facts

- latest release tag: `v4.0.0`
- current workspace version: still `4.0.0`
- current branch is `main`
- local `HEAD` can be synced to `origin/main`

### Public-surface facts

- the post-`v4.0.0` work is dominated by additive `feat:` style changes
  across runtime, shell, DOGFOOD, and localization
- there is no single clear public API break that obviously demands
  `5.0.0`
- the current publish workflows only publish:
  - `@flyingrobots/bijou`
  - `@flyingrobots/bijou-node`
  - `@flyingrobots/bijou-tui`
  - `@flyingrobots/bijou-tui-app`
  - `create-bijou-tui-app`
- the workspace also now contains:
  - `@flyingrobots/bijou-i18n`
  - `@flyingrobots/bijou-i18n-tools`
  - `@flyingrobots/bijou-i18n-tools-node`
  - `@flyingrobots/bijou-i18n-tools-xlsx`

## Decision

### Target version

The next release should be **`4.1.0`**, stable.

### Why `4.1.0`

- the release has a strong additive feature story across multiple public
  surfaces
- it is much larger than a patch release
- it does not present a clear enough breaking boundary to justify
  `5.0.0`
- it is the first release after `v4.0.0` that turns Bijou from "surface
  toolkit with a framed shell" into a more coherent application/runtime
  platform

### In scope for `4.1.0`

#### Headline themes

- runtime engine work through
  [RE-006](./RE-006-formalize-component-layout-and-interaction-contracts.md)
- humane shell work through
  [HT-004](./HT-004-promote-explicit-layer-objects-and-richer-shell-introspection.md)
- typed framed-shell and cleanup-capable command improvements through
  [DX-001](./DX-001-type-framed-app-messages-and-updates-end-to-end.md)
  and
  [DX-002](./DX-002-reconcile-cmd-typing-with-cleanup-and-effect-patterns.md)
- DOGFOOD completion through
  [DF-019](./DF-019-raise-dogfood-coverage-floor-to-100-percent.md)
- localization packages and localized shell/docs work through
  [LX-008](./LX-008-localize-shell-chrome-and-dogfood.md)

#### Supporting but not headline

- release, workflow, and repo-signpost hardening
- System-Style JavaScript doctrine and derived invariants
- long-form release documentation

### Explicitly deferred from `4.1.0`

- [RE-007](../BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
- [WF-003](../BACKLOG/up-next/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
- [DF-020](../BACKLOG/up-next/DF-020-deepen-dogfood-story-depth-and-variant-quality.md)
- [DL-009](../BACKLOG/up-next/DL-009-formalize-layout-and-viewport-rules.md)
- the remaining localization follow-ons in
  [LX-007](../BACKLOG/LX-007-service-oriented-localization-adapters.md)
  and
  [LX-009](../BACKLOG/LX-009-localize-shell-help-notification-and-directional-surfaces.md)

### `RE-007` decision

`RE-007` is **not** a blocker for `4.1.0`.

It remains an important architectural follow-on, but waiting for it
would blur a coherent and already substantial release behind one more
runtime slice. `4.1.0` should ship the runtime-engine story through
`RE-006` and then let `RE-007` become follow-on work for the next line.

## Ready when

`4.1.0` is ready to tag only when all of the following are true:

1. `CHANGELOG.md` is reconciled to the actual `v4.0.0..HEAD` boundary
   and can become a clean `4.1.0` release section.
2. Long-form release docs exist under `docs/releases/4.1.0/`.
3. `README.md` has a concise "What's New in v4.1.0" section.
4. The i18n publish-surface gap is resolved one of two ways:
   - preferred: expand the publish and dry-run matrices to include the
     new public i18n packages
   - fallback: narrow the public `4.1.0` release promise explicitly and
     stop presenting those packages as released artifacts
5. `npm run release:preflight` passes.
6. `npm run release:readiness` passes.
7. The GitHub **Release Dry Run** workflow passes.
8. The repo is on a clean `main` exactly synced with `origin/main` at
   the moment release execution begins.

## Deliverables landed in this cycle

- a chosen target version: `4.1.0`
- explicit deferral of `RE-007`
- versioned long-form release docs under `docs/releases/4.1.0/`
- repo signposts updated to carry the release-shaping decision

## Tests to write first

- a cycle test that proves `docs/design/WF-004-shape-the-next-release.md`
  exists
- a cycle test that proves the versioned `docs/releases/4.1.0/`
  release-doc directory exists
- a cycle test that proves `RE-007` is explicitly treated as follow-on
  rather than silent blocker

## Risks

- treating the i18n publish-matrix mismatch as a docs footnote instead
  of a real release blocker
- letting `[Unreleased]` remain semantically muddy even after shaping
  the release
- accidentally advertising `RE-007` as if it were already part of the
  target release

## Retrospective

### What landed

- the next release now has a chosen public target: `4.1.0`
- the repo has versioned long-form release docs for that target
- `RE-007` is explicitly deferred instead of silently looming over the
  release
- release readiness is now a concrete checklist rather than a vibe

### Drift from ideal

- `CHANGELOG.md` still needs its final `4.1.0` cut during actual release
  execution
- the i18n publish matrix is still a real blocker until resolved in code
  or narrowed in release promise

### Debt spawned

- [WF-005 — Close 4.1.0 i18n Publish-Surface Gap](../BACKLOG/v4.1.0/WF-005-close-4-1-0-i18n-publish-surface-gap.md)
- [WF-006 — Cut Clean 4.1.0 Release Boundary](../BACKLOG/v4.1.0/WF-006-cut-clean-4-1-0-release-boundary.md)
