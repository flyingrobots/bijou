# WF-005 — Close 4.1.0 i18n Publish-Surface Gap

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor human

A maintainer preparing the `4.1.0` release and needing the release
automation, release docs, and public package story to agree.

## Sponsor agent

An agent that must answer, from repo artifacts alone:

- which packages `4.1.0` will actually publish
- whether the i18n packages are release artifacts or just workspace code
- which workflows prove that answer

## Hill

The `4.1.0` i18n package story is no longer ambiguous.

The publish workflow, release dry-run workflow, release docs, and
workflow signposts all agree that the four i18n packages are part of
the automated `4.1.0` release surface.

## Why this cycle exists

[WF-004](./WF-004-shape-the-next-release.md) made `4.1.0` an explicit,
inspectable release decision, but it also surfaced a real contradiction:

- the workspace and long-form release docs already treated the i18n
  packages as part of the `4.1.0` story
- the automated publish workflows still only packed and published the
  older five-package surface

That meant the repo could not honestly answer a simple question:

Are the i18n packages part of the public `4.1.0` release or not?

This cycle exists to close that gap in code, docs, and tests.

## Human users

### Primary human user

A maintainer executing or reviewing the `4.1.0` release.

### Human hill

A maintainer can inspect the workflows and release docs and see the same
nine-package public release surface everywhere.

## Agent users

### Primary agent user

A coding or release agent preparing release notes, running dry-runs, or
answering publication questions.

### Agent hill

An agent can recover the intended `4.1.0` npm publish surface from repo
artifacts alone without guessing which workspace packages are "really"
part of the release.

## Playback questions

1. Do the publish and release-dry-run workflows both include the four
   i18n packages in their pack verification and npm publish matrices?
2. Can a maintainer point to repo evidence that the i18n packages pass
   local `npm pack --dry-run` and `npm publish --dry-run` checks?
3. Do the release docs and signposts stop describing the i18n
   publish-surface decision as unresolved?
4. Is `WF-005` no longer sitting in the `v4.1.0/` blocker lane once the
   workflow and docs truth are aligned?

## Accessibility / assistive reading posture

This cycle is documentation and workflow shaped. The decision must stay
legible in plain markdown and raw YAML without depending on a GitHub UI
view.

## Localization / directionality posture

This cycle directly affects the localization story. The repo must not
claim first-class i18n packages while quietly excluding them from the
release path.

## Agent inspectability / explainability posture

The public `4.1.0` package surface must be discoverable through:

- `.github/workflows/publish.yml`
- `.github/workflows/release-dry-run.yml`
- `docs/release.md`
- `docs/releases/4.1.0/`
- `docs/PLAN.md`
- `docs/BEARING.md`
- cycle tests

## Non-goals

- cutting the `4.1.0` tag
- choosing the exact changelog wording for the final release cut
- changing package versions before release execution
- solving the remaining `4.1.0` blocker captured in
  [WF-006](./WF-006-cut-clean-4-1-0-release-boundary.md)

## Evidence

### Before this cycle

The release workflows only packed and published:

- `@flyingrobots/bijou`
- `@flyingrobots/bijou-node`
- `@flyingrobots/bijou-tui`
- `@flyingrobots/bijou-tui-app`
- `create-bijou-tui-app`

But the workspace also contained these public packages:

- `@flyingrobots/bijou-i18n`
- `@flyingrobots/bijou-i18n-tools`
- `@flyingrobots/bijou-i18n-tools-node`
- `@flyingrobots/bijou-i18n-tools-xlsx`

### Local validation witness

These commands all passed locally during this cycle:

```bash
cd packages/bijou-i18n && npm pack --dry-run
cd packages/bijou-i18n-tools && npm pack --dry-run
cd packages/bijou-i18n-tools-node && npm pack --dry-run
cd packages/bijou-i18n-tools-xlsx && npm pack --dry-run

cd packages/bijou-i18n && npm publish --dry-run --access public --tag dry-run
cd packages/bijou-i18n-tools && npm publish --dry-run --access public --tag dry-run
cd packages/bijou-i18n-tools-node && npm publish --dry-run --access public --tag dry-run
cd packages/bijou-i18n-tools-xlsx && npm publish --dry-run --access public --tag dry-run
```

That includes the XLSX adapter package, which means the blocker was a
workflow/docs mismatch rather than a packaging failure.

## Decision

The four i18n packages are part of the planned public `4.1.0` release.

Bijou should therefore:

- pack them in the tag publish verification workflow
- dry-run publish them in the release dry-run workflow
- publish them from the real tag-driven npm workflow
- describe them as real `4.1.0` release artifacts in repo docs

## Implementation outline

1. Expand `.github/workflows/publish.yml` pack verification and npm
   publish matrices to include all four i18n packages.
2. Expand `.github/workflows/release-dry-run.yml` pack verification and
   npm publish dry-run matrices to include the same packages.
3. Update release docs and signposts so they stop describing the i18n
   publish surface as unresolved.
4. Promote this backlog item into `docs/design/` and narrow the
   `docs/BACKLOG/v4.1.0/` lane to the remaining blocker.
5. Add tests that lock the workflow matrices and cycle placement to the
   chosen answer.

## Tests to write first

- a cycle test proving the `WF-005` design doc exists
- a cycle test proving both release workflows include the i18n packages
- a cycle test proving `WF-005` no longer remains in the `v4.1.0/`
  blocker lane

## Retrospective

### What landed

- the tag publish workflow now packs and publishes the i18n packages
- the release dry-run workflow now packs and dry-runs the i18n packages
- release docs and signposts now describe one consistent nine-package
  `4.1.0` release surface
- the `v4.1.0/` blocker lane is narrower and more honest

### Drift from ideal

- `WF-006` still has to cut the final `4.1.0` release boundary in
  `CHANGELOG.md` and release-facing summaries
- local release readiness still relies on the GitHub dry-run workflow as
  the authoritative packaging gate

### Debt spawned

- no new follow-on debt beyond the already-shaped
  [WF-006](./WF-006-cut-clean-4-1-0-release-boundary.md)
