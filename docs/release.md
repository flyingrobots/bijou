# Release

_Bijou's official release process_

Bijou adopts the spirit of the older "Universal Release Pre-Flight"
prompt, but this file is now the repo-native source of truth.

When this document and a generic release prompt disagree, this document
wins.

## Scope

Bijou is currently:

- an npm workspace monorepo
- lock-step versioned across all workspace packages
- tag-driven for release automation
- GitHub Actions driven for publish, release notes, and GitHub Release
  creation

## Operator Flow

The older generic release prompt mixed together two different kinds of
checks:

- repo guards that must pass **before** any release mutation happens
- validation gates that run **after** versions and release docs are
  updated

Bijou keeps that distinction explicit.

Phase 1 is an operator preflight. It proves that the repository is in a
safe starting state.

`release:readiness` belongs later. By the time it runs, the worktree is
supposed to contain the version bump, changelog edit, and README update.
That is why `release:readiness` is the validation gauntlet, not the
"clean worktree" guard.

## Non-Negotiable Rules

1. Run release phases in order.
2. Abort on the first hard failure.
3. Never claim a release succeeded unless the tag, workflows, and npm
   registry state were directly verified.
4. Never release from a dirty worktree.
5. Never release from a branch other than `main`.
6. Never release from a `main` that is ahead of or behind `origin/main`.
7. Use repo-native tooling:
   - version bump: `npm run version X.Y.Z`
   - metadata check: `npm run release:preflight`
   - local gauntlet: `npm run release:readiness`
   - CI dry-run: `.github/workflows/release-dry-run.yml`
   - tag publish: `.github/workflows/publish.yml`
8. Respect lock-step versioning across the workspace.

## Current Version And Publish Surface

### Current Shaped Target

The currently shaped next release target is **`4.1.0`**.

A later DOGFOOD shaping cycle reopened cycle-shaped `4.1.0` blockers.

Do **not** start release execution until the active lane in
[`docs/BACKLOG/v4.1.0/`](./BACKLOG/v4.1.0/README.md) is closed again.

The current blockers are:

- [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](./BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

The shell-foundation work was closed in
[DF-022](./design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md).
The repo/package/release corpus publication was closed in
[DF-023](./design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md).
The philosophy/architecture corpus publication was closed in
[DF-024](./design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md).
The example-demotion posture was closed in
[DF-026](./design/DF-026-demote-examples-to-secondary-reference-status.md).
The remaining blocker is now the release smoke contract:
`smoke:examples:*` still needs to move onto DOGFOOD.

Its long-form release docs live in:

- [`docs/releases/4.1.0/whats-new.md`](./releases/4.1.0/whats-new.md)
- [`docs/releases/4.1.0/migration-guide.md`](./releases/4.1.0/migration-guide.md)

### Lock-step Versioned Units

These packages move together:

- `@flyingrobots/bijou`
- `@flyingrobots/bijou-node`
- `@flyingrobots/bijou-tui`
- `@flyingrobots/bijou-tui-app`
- `create-bijou-tui-app`
- `@flyingrobots/bijou-i18n`
- `@flyingrobots/bijou-i18n-tools`
- `@flyingrobots/bijou-i18n-tools-node`
- `@flyingrobots/bijou-i18n-tools-xlsx`

### Current Automated npm Publish Matrix

As of now, the publish workflows automatically publish:

- `@flyingrobots/bijou`
- `@flyingrobots/bijou-node`
- `@flyingrobots/bijou-tui`
- `@flyingrobots/bijou-tui-app`
- `create-bijou-tui-app`
- `@flyingrobots/bijou-i18n`
- `@flyingrobots/bijou-i18n-tools`
- `@flyingrobots/bijou-i18n-tools-node`
- `@flyingrobots/bijou-i18n-tools-xlsx`

## Phase 1: Repo Guards

Run these checks before changing versions or docs.

### 1. Clean worktree

```bash
git status --porcelain=v1
```

Abort if any output exists.

### 2. Branch guard

```bash
git rev-parse --abbrev-ref HEAD
```

Abort unless the result is `main`.

### 3. Sync with origin

```bash
git fetch origin main --tags --prune
git rev-parse HEAD origin/main
```

Abort unless both SHAs are identical.

### 4. Latest release tag

```bash
git tag --merged HEAD --list 'v*' --sort=-version:refname | head -n 1
```

Abort if no valid release tag exists and there is no explicit
first-release policy.

## Phase 2: Choose Version And Update Release Docs

Bijou does **not** currently auto-compute the semver bump from commit
history. The maintainer chooses the target version deliberately.

### 1. Pick the target version

Allowed tag formats are:

- `vX.Y.Z`
- `vX.Y.Z-rc.N`
- `vX.Y.Z-beta.N`
- `vX.Y.Z-alpha.N`

Stable releases should be the default unless there is a clear reason for
a prerelease.

### 2. Bump all workspace manifests

```bash
npm run version X.Y.Z
```

This updates all workspace package versions and pins internal dependency
references to the exact same version.

### 3. Update `CHANGELOG.md`

- move `[Unreleased]` into a real version header
- use UTC date format `YYYY-MM-DD`
- keep the existing changelog style intact
- do not release with an empty `[Unreleased]` section

### 4. Update `README.md`

- add or replace `## What's New in vX.Y.Z`
- keep it concise and user-facing
- keep a visible link to [`CHANGELOG.md`](./CHANGELOG.md)

### 5. Draft long-form release docs

Before the version is chosen, draft these in `docs/releases/next/`:

- `whats-new.md`
- `migration-guide.md`

When the version is chosen, move that directory to
`docs/releases/X.Y.Z/` and update any version placeholders inside the
docs.

For the currently shaped release, that work has already happened under
`docs/releases/4.1.0/`.

## Phase 3: Local Validation

Run:

```bash
npm run release:preflight
npm run release:readiness
```

`release:readiness` is the repo-native local gauntlet. It currently runs
these gates in order:

1. `build`
2. `lint`
3. `typecheck:test`
4. `docs:design-system:preflight`
5. `dogfood:coverage:gate`
6. `workflow:shell:preflight`
7. `release:preflight`
8. `test:frames`
9. `smoke:canaries -- --skip-build`
10. `smoke:examples:all -- --skip-build`
11. `npm test`

Abort on any failure.

This still reflects the current repo tooling, not the intended end
state. [WF-003](./BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
is a release blocker specifically because this phase must move to a
DOGFOOD-centered smoke contract before `4.1.0` is cut.

## Phase 4: CI Dry Run

Before tagging a real release, run the **Release Dry Run** workflow in
GitHub Actions.

This is currently the authoritative place where Bijou checks:

- packed file verification
- npm publish dry-runs for the automated publish matrix
- release notes preview generation

Until equivalent local tooling exists, treat the dry-run workflow as a
required release gate for real releases.

## Phase 5: Commit And Tag

After docs and validation are green:

```bash
git add -A
git commit -m "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "release: vX.Y.Z"
```

For prereleases:

```bash
git commit -m "chore(release): vX.Y.Z-rc.N"
git tag -a vX.Y.Z-rc.N -m "release: vX.Y.Z-rc.N"
```

Bijou currently enforces tag **format** through
[tag-guard.yml](../.github/workflows/tag-guard.yml), not signed tags.
Do not pretend signed-tag policy exists unless the automation is updated
to require it.

## Phase 6: Push And Let Automation Publish

Push in two steps:

```bash
git push origin main
git push origin vX.Y.Z
```

The publish workflow then owns:

- metadata verification
- build, lint, typecheck, test, smoke, and packed-file verification
- npm publication for the automated publish matrix
- GitHub Release creation or update

Do not manually create a GitHub Release unless the automation fails and
the process is being explicitly repaired.

## Phase 7: Verify The Result

Do not stop at "workflow started."

Verify all of the following:

- the tag-guard workflow passed
- the publish workflow passed
- npm shows the new version for each package in the automated publish
  matrix
- npm dist-tags match the release type
  - stable -> `latest`
  - `rc` -> `next`
  - `beta` -> `beta`
  - `alpha` -> `alpha`
- the GitHub Release exists with the expected notes

Representative checks:

```bash
npm view @flyingrobots/bijou version dist-tags --json
npm view @flyingrobots/bijou-node version dist-tags --json
npm view @flyingrobots/bijou-tui version dist-tags --json
npm view @flyingrobots/bijou-tui-app version dist-tags --json
npm view create-bijou-tui-app version dist-tags --json
npm view @flyingrobots/bijou-i18n version dist-tags --json
npm view @flyingrobots/bijou-i18n-tools version dist-tags --json
npm view @flyingrobots/bijou-i18n-tools-node version dist-tags --json
npm view @flyingrobots/bijou-i18n-tools-xlsx version dist-tags --json
```

## Abort Conditions

Abort immediately if any of these are true:

- dirty worktree
- not on `main`
- `main` not exactly synced to `origin/main`
- version bump not reflected cleanly across the workspace
- `CHANGELOG.md` still has no real release section
- `release:preflight` fails
- `release:readiness` fails
- release dry-run fails
- tag push fails
- publish workflow fails
- npm does not show the new version and expected dist-tag mapping

## Known Current Gaps

- clean-worktree is an operator preflight check, not a
  `release:readiness` concern, because Phase 2 intentionally dirties the
  worktree
- branch-sync, latest-tag, and tag-collision checks are documented
  here, but they do not yet have a dedicated repo-native script
- signed tags are not currently a repo policy

If any of those policies change, update this doc and the automation
together.
