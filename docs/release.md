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
- npm-only for registry publishing; JSR is not part of the current release
  surface

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
4. Never create a release tag from a dirty worktree.
5. Never create a release tag from a branch other than `main`.
6. Never create a release tag from a `main` that is ahead of or behind
   `origin/main`.
7. Use repo-native tooling:
   - version bump: `npm run version X.Y.Z`
   - metadata check: `npm run release:preflight`
   - local gauntlet: `npm run release:readiness`
   - CI dry-run: `.github/workflows/release-dry-run.yml`
   - tag publish: `.github/workflows/publish.yml`
8. Respect lock-step versioning across the workspace.
9. Prepare releases on a branch, merge through a PR, and tag only the exact
   merged `origin/main` commit.

## Registry Setup

Bijou publishes public packages to npm through GitHub Actions and npm trusted
publishing. Do not store npm automation tokens in GitHub secrets.

For a new public workspace package, first publish one version manually from the
package directory so npm has a package record:

```bash
npm login
NPM_CONFIG_PROVENANCE=false npm publish --access public
```

The seed publish is deliberately non-provenance because it runs outside the
trusted GitHub Actions OIDC environment. After the trusted publisher is
configured, automated releases should publish with provenance through
`publish.yml`.

Then configure the npm package trusted publisher:

- Organization/user: `flyingrobots`
- Repository: `bijou`
- Workflow filename: `publish.yml`
- GitHub environment: `npm`

The GitHub `npm` environment does not need registry secrets for trusted
publishing. Keep the package manifest `publishConfig.provenance` setting aligned
with the publish workflow so npm records provenance for automated releases.

JSR setup from other projects does not apply to Bijou today. If Bijou later
adds `jsr.json`, JSR package records, and a JSR publish workflow, update this
runbook and the automation in the same PR.

## Release Law

No public release tag may be created unless all automated and human evidence
gates below are satisfied. A failed automated gate blocks the release. A human
review gate blocks the release until the release evidence packet records either
the required update or an explicit "reviewed, no change" disposition.

### Automated Evidence Gates

The current executable gates are `npm run release:preflight`,
`npm run release:readiness`, `.github/workflows/release-dry-run.yml`,
`.github/workflows/tag-guard.yml`, and `.github/workflows/publish.yml`.

The release policy requires these checks, even where the current implementation
still relies on operator verification:

| Gate | Rule | Current enforcement |
| --- | --- | --- |
| `REL-TOOL-NODE` | Node.js is available for metadata and validation commands. | `release:readiness` |
| `REL-TOOL-NPM` | npm is available for workspace, pack, audit, and registry checks. | `release:readiness`, workflows |
| `REL-TOOL-GIT` | Git is available for tag, ancestry, and clean-tree checks. | operator, workflows |
| `REL-TOOL-GH` | GitHub CLI can read the repository before live issue gates run. | operator |
| `REL-TAG-FORMAT` | Release tags use leading-`v` SemVer with optional `alpha`, `beta`, or `rc` prerelease suffix. | `tag-guard.yml`, `release:preflight` |
| `REL-GH-ACCESS` | `gh` can read `flyingrobots/bijou` before final issue gates run. | operator |
| `REL-GH-PRIORITY-HIGH-ZERO` | There are zero open release-blocking issues labeled `priority:high`, unless the evidence packet names the accepted risk and owner. | operator |
| `REL-GH-TARGET-MILESTONE-ZERO` | The target GitHub milestone exists and has zero open issues or PRs. | operator |
| `REL-GH-PRIOR-RELEASE-ZERO` | Lower `v*` milestones have zero open issues or PRs. | operator |
| `REL-META-VERSION-LOCKSTEP` | Every workspace package version and internal Bijou dependency version matches `X.Y.Z`. | `release:preflight` |
| `REL-GIT-CLEAN` | The worktree is clean before release prep starts, before the release PR is opened, and before final tagging. | operator |
| `REL-GIT-ORIGIN-MAIN` | The final tag commit is exactly `origin/main`. | operator |
| `REL-DOC-CHANGELOG-DATED` | `docs/CHANGELOG.md` has a dated `[X.Y.Z] - YYYY-MM-DD` entry. | operator |
| `REL-DOC-EVIDENCE` | `docs/releases/X.Y.Z/README.md` records release evidence, review disposition, replay commands, and residual risk. | operator |
| `REL-DOC-DOGFOOD-I18N` | DOGFOOD markdown and visible strings satisfy supported-locale checks and the i18n debt ratchet. | `release:readiness` |
| `REL-DOC-INVENTORY` | Documentation inventory is valid after release docs are moved from `next/` to `X.Y.Z/`. | operator |
| `REL-PACK-DRY-RUN` | Release dry-run workflow verifies packed files and npm publish dry-runs for the automated publish matrix. | `release-dry-run.yml` |
| `REL-NPM-AUDIT` | Runtime npm dependencies have no high or critical vulnerabilities. | operator |

The stage model is:

| Stage | Caller | Git posture | Issue gates |
| --- | --- | --- | --- |
| `operator-preflight` | maintainer before release prep | Clean local `main` exactly matches `origin/main`. | Optional visibility check. |
| `prep-pr` | release-prep branch | Branch-local validation after version/docs changes; does not require `HEAD == origin/main`. | Report target milestone state in the PR. |
| `final-local` | maintainer after merge | Local `main` exactly matches `origin/main`; final tag target is fixed. | Enforced live. |
| `tag-workflow` | tag push workflow | Tag commit must be the release commit on `origin/main`. | Policy target; current workflows do not enforce ancestry. |
| `rerun-workflow` | manual workflow dispatch for an existing tag | Existing tag must remain reachable from `origin/main`. | Skipped for registry recovery; do not move the tag. |

### Human Review Gates

Automation proves structure and repeatability. It does not prove release prose
is truthful. The release evidence packet must record human review for:

- `docs/CHANGELOG.md` accurately reflects the diff since the previous public
  tag.
- `README.md` changed if front-door positioning, install commands, examples, or
  current release status changed.
- `ARCHITECTURE.md` changed if ports, adapters, package boundaries, storage,
  rendering contracts, or runtime posture changed.
- `docs/VISION.md`, `docs/METHOD.md`, `docs/ROADMAP.md`, and
  `docs/BEARING.md` match the release posture.
- `docs/DOGFOOD.md` and DOGFOOD-facing markdown changed if the docs app,
  release title, navigation model, localization posture, or proof surface
  changed.
- Package READMEs, API references, migration docs, design-system docs, and MCP
  docs changed when their public surfaces changed.
- Every landed release goalpost contributing to this version is named with its
  issue, design doc, landed PRs, completed slice count, deterministic proof,
  canonical fixtures or immutable inputs, witnesses, replay commands, and
  residual-risk disposition.
- Any accepted residual risk is named with rationale, owner, and a follow-up
  issue. Hidden accepted failures are not allowed.

### Deterministic Reproducibility

Evidence is complete only when another operator can replay it from the tag
commit, committed release packet, and named immutable inputs.

Every release evidence packet must record:

- the exact command, script, workflow, or DOGFOOD route that produced each
  witness
- the canonical fixture or immutable input used by that command, when the
  claim depends on more than repository state at the tag commit
- the expected stable result, normalized output, digest, or screenshot
  assertion that replay must reproduce
- any normalization applied for host-specific noise such as temp paths, clocks,
  terminal size, color mode, process IDs, registry timestamps, ordering, or
  environment-specific absolute paths

Place release-specific fixtures under `docs/releases/X.Y.Z/fixtures/` unless an
existing committed fixture is already canonical. DOGFOOD terminal witnesses
should record the route, command, terminal dimensions, shell theme or renderer
mode, and stable assertion. A screenshot or recording is useful, but it is not a
substitute for the command and immutable input that produced it.

## Current Release And Publish Surface

### Latest Shipped Release

The latest shipped release is **`7.0.0`**.

- `7.0.0` - DOGFOOD release identity, BlockLab naming, release-facing proof,
  theme/token work, image-to-glyph tooling, and V7 title-screen polish
- `5.0.0` - frame-owned hosted runner, Node-host theme selection,
  crash-mode auto-exit, scoped Node I/O symlink hardening, deterministic
  scripted-example smoke, markdown pipe tables, and browsable-list marquee
- `4.4.1` - framed-shell background-fill fixes, stock shell theme cycling,
  uppercase quit-confirm input
- `4.4.0` - data-viz toolkit, zero-alloc framed app render, new bench
  scenarios
- `4.3.0` - RE-008 byte-packed surface, RE-015 braille fix, `setRGB` API
- `4.2.0` - RE-007 framed shell, `@flyingrobots/bijou-mcp`, METHOD migration
- `4.1.0` - runtime engine through RE-006, DOGFOOD maturation (DF-021
  through DF-026, including DF-023, DF-024, WF-003), i18n packages

The release smoke contract is DOGFOOD-centered through
`smoke:dogfood`, `smoke:dogfood:landing`, and `smoke:dogfood:docs`.

Long-form release docs live under `docs/releases/<version>/`.

### Next Release Posture

No next public release version is selected in this file.

`v6.0.0` and `v7.0.0` are both issue-complete GitHub milestone lanes. The next
release target should be selected from the live tracker and reflected in
[`docs/ROADMAP.md`](./ROADMAP.md), [`docs/BEARING.md`](./BEARING.md), and the
versioned release packet before release prep begins.

### Lock-step Versioned Units

These workspaces move together:

- `@flyingrobots/bijou`
- `@flyingrobots/bijou-node`
- `@flyingrobots/bijou-tui`
- `@flyingrobots/bijou-tui-app`
- `create-bijou-tui-app`
- `@flyingrobots/bijou-i18n`
- `@flyingrobots/bijou-i18n-tools`
- `@flyingrobots/bijou-i18n-tools-node`
- `@flyingrobots/bijou-i18n-tools-xlsx`
- `@flyingrobots/bijou-mcp`
- `@flyingrobots/bijou-bench` (private benchmark workspace)

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
- `@flyingrobots/bijou-mcp`

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

### 0. Slice release-boundary work before the final PR

Before bumping versions, make sure feature and documentation work has already
landed through reviewable precursor PRs.

Hard stop before opening a release-boundary PR:

- more than 140 changed files

Caution threshold:

- more than 10 commits
- unrelated legends or cycle families on one branch
- generated snapshots or docs mixed with unrelated runtime changes
- more than one release-lane blocker implemented at once

When a threshold is hit, split the branch by cycle or product surface. The
final release PR should primarily contain the version bump, changelog, long-form
release docs, release-readiness proof, and final metadata updates.

### 1. Pick the target version

Allowed tag formats are:

- `vX.Y.Z`
- `vX.Y.Z-rc.N`
- `vX.Y.Z-beta.N`
- `vX.Y.Z-alpha.N`

Stable releases should be the default unless there is a clear reason for
a prerelease.

### 2. Create the release-prep branch

Create the branch after the target version is known and before mutating files:

```bash
git switch -c release/vX.Y.Z
```

For prereleases:

```bash
git switch -c release/vX.Y.Z-rc.N
```

### 3. Bump all workspace manifests

```bash
npm run version X.Y.Z
```

This updates all workspace package versions and pins internal dependency
references to the exact same version.

### 4. Update `CHANGELOG.md`

- move `[Unreleased]` into a real version header
- use UTC date format `YYYY-MM-DD`
- keep the existing changelog style intact
- do not release with an empty `[Unreleased]` section

### 5. Update `README.md`

- add or replace `## What's New in vX.Y.Z`
- keep it concise and user-facing
- keep a visible link to [`CHANGELOG.md`](./CHANGELOG.md)

### 6. Draft long-form release docs

Before the version is chosen, draft these in `docs/releases/next/`:

- `README.md`
- `whats-new.md`
- `migration-guide.md`

When the version is chosen, move that directory to
`docs/releases/X.Y.Z/` and update any version placeholders inside the
docs.

The versioned `README.md` is the release evidence packet. It must include:

- release summary
- tracker and goalpost map
- automated evidence matrix
- human review matrix
- deterministic reproducibility record
- package and registry verification plan
- residual-risk disposition

Historical releases before this policy may only have `whats-new.md` and
`migration-guide.md`. Future releases must carry the evidence packet.

## Phase 3: Local Validation

Run:

```bash
npm run release:preflight
npm run release:readiness
npm run docs:inventory
npm audit --omit=dev --audit-level=high
```

`release:readiness` is the repo-native local gauntlet. It currently runs
these gates in order:

1. `build`
2. `lint`
3. `typecheck:test`
4. `docs:design-system:preflight`
5. `dogfood:coverage:gate`
6. `dogfood:i18n:check`
7. `dogfood:i18n:debt`
8. `workflow:shell:preflight`
9. `release:preflight`
10. `test:frames`
11. `verify:interactive-examples`
12. `smoke:canaries -- --skip-build`
13. `smoke:dogfood -- --skip-build`
14. `npm test`

Abort on any failure.

This reflects the current repo tooling after
[WF-003](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
moved the release smoke gate onto the DOGFOOD contract used for
`4.1.0` and later releases.

## Phase 4: CI Dry Run

Before tagging a real release, run the **Release Dry Run** workflow in GitHub
Actions against the release-prep branch or PR commit.

This is currently the authoritative place where Bijou checks:

- packed file verification
- npm publish dry-runs for the automated publish matrix
- release notes preview generation

Until equivalent local tooling exists, treat the dry-run workflow as a
required release gate for real releases.

## Phase 5: Commit, Push, And Open The Release PR

After docs and validation are green:

```bash
git add -A
git commit -m "chore(release): vX.Y.Z"
git push -u origin release/vX.Y.Z
```

For prereleases:

```bash
git commit -m "chore(release): vX.Y.Z-rc.N"
git push -u origin release/vX.Y.Z-rc.N
```

Open a normal PR to `main`. Do not open a draft PR. The PR body must link the
release evidence packet, target milestone, changelog entry, release dry-run,
and validation commands.

Merge the release PR only after review and green CI. Do not tag the branch
commit before it is merged.

## Phase 6: Final Main Preflight And Tag

After the release PR is merged, fast-forward local `main` to the exact release
commit:

```bash
git fetch origin main --tags --prune
git switch main
git merge --ff-only origin/main
git status --porcelain=v1
git rev-parse HEAD origin/main
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
npm run release:preflight
npm run docs:inventory
```

Abort if the worktree is dirty, if the two printed SHAs differ, or if the
`test` command fails. Local `main` must exactly match `origin/main`; being ahead
of `origin/main` is also release-blocking.

Create the tag from that exact commit:

```bash
git tag -a vX.Y.Z -m "release: vX.Y.Z"
```

For prereleases:

```bash
git tag -a vX.Y.Z-rc.N -m "release: vX.Y.Z-rc.N"
```

Bijou currently enforces tag **format** through
[tag-guard.yml](../.github/workflows/tag-guard.yml), not signed tags. Do not
pretend signed-tag policy exists unless the automation is updated to require it.

## Phase 7: Push The Tag And Let Automation Publish

Push only the tag:

```bash
git push origin vX.Y.Z
```

The publish workflow then owns:

- metadata verification
- build, lint, typecheck, test, smoke, and packed-file verification
- npm publication for the automated publish matrix
- GitHub Release creation or update

If a tag has already been pushed and the publish workflow itself needs a
repair, fix `.github/workflows/publish.yml` on `main` and then rerun the
same release through the workflow's `workflow_dispatch` entrypoint using
the existing tag and release ref. Do not delete or move the release tag
just to recover from workflow drift.

Do not manually create a GitHub Release unless the automation fails and
the process is being explicitly repaired.

## Phase 8: Verify The Result

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
npm view @flyingrobots/bijou-mcp version dist-tags --json
```

## Abort Conditions

Abort immediately if any of these are true:

- release prep starts from a dirty worktree
- release prep starts from a branch other than `main`
- final tag prep is not on `main`
- final tag prep is not exactly synced to `origin/main`
- version bump not reflected cleanly across the workspace
- `CHANGELOG.md` still has no real release section
- `docs/releases/X.Y.Z/README.md` release evidence packet is missing
- target GitHub milestone does not exist
- target GitHub milestone has open issues or PRs
- lower `v*` GitHub milestones have open issues or PRs
- open `priority:high` issues lack an explicit release-risk disposition
- `release:preflight` fails
- `release:readiness` fails
- `docs:inventory` fails
- `npm audit --omit=dev --audit-level=high` fails
- release dry-run fails
- tag push fails
- publish workflow fails
- npm does not show the new version and expected dist-tag mapping

## Known Current Gaps

- Bijou does not yet have a stage-aware `release:prep` or `release:guard`
  script. The policy names those gates, but `release:preflight` and
  `release:readiness` are the current repo-native commands.
- clean-worktree is an operator preflight check, not a `release:readiness`
  concern, because Phase 2 intentionally dirties the worktree
- branch-sync, latest-tag, tag-collision, live GitHub issue gates, changelog
  dating, release tag ancestry, release evidence shape, and human review
  disposition are documented here, but they do not yet have a single dedicated
  repo-native guard
- `docs:inventory` and runtime `npm audit` are release policy gates but are not
  currently part of `release:readiness`
- JSR publishing is not currently part of Bijou's release surface
- signed tags are not currently a repo policy

If any of those policies change, update this doc and the automation
together.
