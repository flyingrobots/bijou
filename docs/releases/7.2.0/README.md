# Bijou 7.2.0 Release Evidence

Bijou 7.2.0 is a narrow stabilization and demo-integrity release after the
7.1.0 release-video rehearsal exposed user-facing seams in framework input,
DOGFOOD localization and themes, Blocks documentation, release-story surfaces,
dependency posture, and release bookkeeping.

This packet was started on the release-gate branch, finalized on the
release-prep branch, and closed from the verified `origin/main` release commit.
The public `v7.2.0` tag was created from
`123f4a6150963932118cbf763a8a6ec03487e227` on 2026-07-05 after final-main
validation passed. Tag Guard, Release workflow, tag CI, GitHub Release
verification, and npm registry verification all passed after the tag was
pushed.

## Release Summary

- Version: `7.2.0`
- Tag: [`v7.2.0`](https://github.com/flyingrobots/bijou/releases/tag/v7.2.0)
- Previous public tag: `v7.1.0`
- Release commit: `123f4a6150963932118cbf763a8a6ec03487e227`
- Release type: stable minor
- npm dist-tag after publish: `latest`
- Release-prep branch: `cycle/v72-release-prep`
- Release-gate lineage branch: `cycle/v72-release-gate-354`
- Release date: 2026-07-05
- Publish surface: npm workspace packages only
- Release workflow:
  <https://github.com/flyingrobots/bijou/actions/runs/28736930944>

## Tracker And Goalpost Map

Each goalpost records the release-law evidence required by
[`docs/release.md`](../../release.md): tracker, design, PRs, completed slices,
deterministic proof or fixture, replay command, witness, and residual-risk
disposition.

### V7.2 Stabilization Goalpost

- Tracker: [#354](https://github.com/flyingrobots/bijou/issues/354).
- Design lineage:
  [`RE-041`](../../design/RE-041-v72-framework-input-stabilization.md),
  [`DX-047`](../../design/DX-047-blocks-app-binding-snippets.md),
  [`DL-017`](../../design/DL-017-dogfood-light-theme-readiness.md),
  [`DL-018`](../../design/DL-018-first-party-theme-variant-coverage.md),
  [`LX-020`](../../design/LX-020-dogfood-locale-demo-readiness.md), and
  [`DF-078`](../../design/DF-078-dogfood-release-story-surfaces.md).
- Landed PRs: [#355](https://github.com/flyingrobots/bijou/pull/355),
  [#359](https://github.com/flyingrobots/bijou/pull/359),
  [#360](https://github.com/flyingrobots/bijou/pull/360),
  [#361](https://github.com/flyingrobots/bijou/pull/361),
  [#362](https://github.com/flyingrobots/bijou/pull/362),
  [#453](https://github.com/flyingrobots/bijou/pull/453),
  [#452](https://github.com/flyingrobots/bijou/pull/452), and
  [#460](https://github.com/flyingrobots/bijou/pull/460).
- Completed slices: framework input fallthrough and helper exports, DOGFOOD
  locale fallback honesty, DOGFOOD light-theme readability, first-party theme
  variant coverage, Blocks app-binding snippets, mouse hover tracking, and
  in-app release-story surfaces.
- Canonical proof inputs: the tests and DOGFOOD fixtures named in the
  per-slice sections below.
- Replay: run `npm run release:readiness` from the release-prep branch, then
  run `npm run release:readiness -- --milestone v7.2.0` again from the exact
  merged final-main release commit before tagging.
- Witness: local release-gate validation on 2026-07-04 passed
  `npm run release:preflight`, `npm run docs:inventory`,
  `npm audit --audit-level=high`,
  `npm audit --omit=dev --audit-level=high`, and
  `npm run release:readiness` without `--milestone`. Release-prep validation
  on 2026-07-05 passed
  `npm run release:readiness -- --milestone v7.2.0` after the lock-step
  version bump and dated changelog boundary. Final-main validation on
  2026-07-05 passed `npm run release:preflight`, `npm run docs:inventory`,
  `npm audit --omit=dev --audit-level=high`, and the milestone-aware
  readiness gate from commit `123f4a61`; the Release Dry Run, Tag Guard,
  Release workflow, tag CI, GitHub Release, and npm registry checks all passed.
- Residual risk: no accepted release risk.

### Framework Input Stabilization

- Trackers:
  [#344](https://github.com/flyingrobots/bijou/issues/344),
  [#345](https://github.com/flyingrobots/bijou/issues/345), and
  [#353](https://github.com/flyingrobots/bijou/issues/353).
- Design: [`RE-041`](../../design/RE-041-v72-framework-input-stabilization.md).
- Landed PRs: [#355](https://github.com/flyingrobots/bijou/pull/355).
- Completed slices: workspace mouse movement, release, and non-left press
  events fall through to the active page; page-scoped frame helpers are exported
  from the `@flyingrobots/bijou-tui` root; scripted driver helpers can generate
  deterministic move, press, release, wheel, and raw SGR mouse sequences.
- Canonical proof inputs:
  `packages/bijou-tui/src/driver.part02.test.ts`,
  `packages/bijou-tui/src/driver.part03.test.ts`,
  `packages/bijou-tui/src/index.test.ts`,
  `packages/bijou-tui/src/app-frame-core.part02.test.ts`,
  `packages/bijou-tui/src/app-frame-routing.part06.test.ts`, and WF-130
  roadmap tests.
- Replay: `npx vitest run --config vitest.config.ts packages/bijou-tui/src/driver.part02.test.ts packages/bijou-tui/src/driver.part03.test.ts packages/bijou-tui/src/index.test.ts packages/bijou-tui/src/app-frame-core.part02.test.ts packages/bijou-tui/src/app-frame-routing.part06.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part02.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part03.test.ts`.
- Witness: PR #355 closed all three trackers and merged on 2026-06-15 at
  `94db990f`.
- Residual risk: no accepted release risk.

### Mouse Hover Tracking

- Tracker: release-video mouse input follow-up.
- Design lineage: framework input stabilization plus the runtime/worker mouse
  tests added in PR #453.
- Landed PRs: [#453](https://github.com/flyingrobots/bijou/pull/453).
- Completed slices: `RunOptions.mouseMode` supports `press`, `drag`, and
  any-event `any` SGR tracking; the event bus splits bundled SGR mouse packets;
  the Node worker host preserves mouse parsing while terminal control stays in
  the main thread.
- Canonical proof inputs: runtime, event-bus, and worker mouse tests touched by
  PR #453.
- Replay: `npm run code-dojo:ci`.
- Witness: PR #453 merged on 2026-07-03 at `e15e771d` after full Code Dojo CI
  and pre-push verification.
- Residual risk: no accepted release risk.

### DOGFOOD Locale Demo Readiness

- Tracker: [#340](https://github.com/flyingrobots/bijou/issues/340).
- Design: [`LX-020`](../../design/LX-020-dogfood-locale-demo-readiness.md).
- Landed PRs: [#359](https://github.com/flyingrobots/bijou/pull/359).
- Completed slices: non-English DOGFOOD release-demo paths avoid missing
  localization marker text by falling back to source copy, while English-source
  Markdown remains explicitly labeled and maintainer i18n gates remain intact.
- Canonical proof inputs: DOGFOOD i18n completeness, build, and debt gates.
- Replay: `npm run dogfood:i18n:complete && npm run dogfood:i18n:check && npm run dogfood:i18n:debt`.
- Witness: PR #359 closed #340 and merged on 2026-06-15 at `65fb3969`.
- Residual risk: full translation workbench remains future scope.

### DOGFOOD Light Theme Readiness

- Tracker: [#341](https://github.com/flyingrobots/bijou/issues/341).
- Design: [`DL-017`](../../design/DL-017-dogfood-light-theme-readiness.md).
- Landed PRs: [#360](https://github.com/flyingrobots/bijou/pull/360).
- Completed slices: modal and drawer chrome paint panel backgrounds behind
  border cells, light/dark subtle chrome clears the same diagnostic floor, and
  DOGFOOD theme diagnostics cover chrome tokens used by borders, scrollbars,
  focus gutters, and modal surfaces.
- Canonical proof inputs:
  `tests/cycles/DL-017/dogfood-light-theme-readiness.part01.test.ts`,
  `tests/cycles/DL-017/dogfood-light-theme-readiness.part02.test.ts`,
  `tests/cycles/DL-017/dogfood-light-theme-readiness.part03.test.ts`,
  `tests/cycles/DL-017/dogfood-light-theme-readiness.part04.test.ts`,
  `tests/cycles/DL-017/dogfood-light-theme-readiness.part05.test.ts`,
  `tests/cycles/RE-017/frame-shell-theme-dogfood-demo.test.ts`,
  `packages/bijou-tui/src/app-frame-overlays.test.ts`,
  `packages/bijou-tui/src/app-frame-render.part01.test.ts`,
  `packages/bijou-tui/src/app-frame-render.part02.test.ts`,
  `packages/bijou-tui/src/app-frame-input-overlays.part03.test.ts`,
  `packages/bijou-tui/src/app-frame-settings.part02.test.ts`,
  `packages/bijou/src/core/theme/presets.test.ts`, and
  `packages/bijou/src/core/theme/doctor.test.ts`.
- Replay: `npx vitest run --config vitest.config.ts tests/cycles/DL-017/dogfood-light-theme-readiness.part01.test.ts tests/cycles/DL-017/dogfood-light-theme-readiness.part02.test.ts tests/cycles/DL-017/dogfood-light-theme-readiness.part03.test.ts tests/cycles/DL-017/dogfood-light-theme-readiness.part04.test.ts tests/cycles/DL-017/dogfood-light-theme-readiness.part05.test.ts tests/cycles/RE-017/frame-shell-theme-dogfood-demo.test.ts packages/bijou-tui/src/app-frame-overlays.test.ts packages/bijou-tui/src/app-frame-render.part01.test.ts packages/bijou-tui/src/app-frame-render.part02.test.ts packages/bijou-tui/src/app-frame-input-overlays.part03.test.ts packages/bijou-tui/src/app-frame-settings.part02.test.ts packages/bijou/src/core/theme/presets.test.ts packages/bijou/src/core/theme/doctor.test.ts`.
- Witness: PR #360 closed #341 and merged on 2026-06-16 at `d06f8cd4`.
- Residual risk: no accepted release risk.

### First-Party Theme Variant Coverage

- Tracker: [#343](https://github.com/flyingrobots/bijou/issues/343).
- Design: [`DL-018`](../../design/DL-018-first-party-theme-variant-coverage.md).
- Landed PRs: [#362](https://github.com/flyingrobots/bijou/pull/362).
- Completed slices: DOGFOOD theme family exposes dark and light modes; other
  first-party shell themes are classified as concrete single-mode themes; `Ctrl+T`
  and command-palette switching give explicit feedback when no alternate mode
  exists.
- Canonical proof inputs:
  `tests/cycles/DL-018/first-party-theme-variant-coverage.test.ts`,
  `packages/bijou-tui/src/app-frame-notifications.part05.test.ts`,
  `packages/bijou-tui/src/app-frame-modal-routing.part01.test.ts`, and
  `scripts/docs-preview-landing.part04.test.ts`.
- Replay: `npx vitest run --config vitest.config.ts tests/cycles/DL-018/first-party-theme-variant-coverage.test.ts packages/bijou-tui/src/app-frame-notifications.part05.test.ts packages/bijou-tui/src/app-frame-modal-routing.part01.test.ts scripts/docs-preview-landing.part04.test.ts`.
- Witness: #343 was revalidated and closed on 2026-07-03 after PR #362 merged
  at `6c78d196`.
- Residual risk: product-grade Theme Lab work remains V9-plus scope.

### Blocks App-Binding Snippets

- Tracker: [#342](https://github.com/flyingrobots/bijou/issues/342).
- Design: [`DX-047`](../../design/DX-047-blocks-app-binding-snippets.md).
- Landed PRs: [#361](https://github.com/flyingrobots/bijou/pull/361).
- Completed slices: DOGFOOD Blocks docs now show how `CounterDemoBlock` becomes
  application-owned state, key-to-command-intent routing, update handling,
  render-time config, and pipe/accessibility lower-mode output.
- Canonical proof inputs:
  `tests/cycles/DX-047/blocks-app-binding-snippets.test.ts` and
  `tests/cycles/DX-031/dogfood-blocks-section.part01.test.ts`,
  `tests/cycles/DX-031/dogfood-blocks-section.part02.test.ts`,
  `tests/cycles/DX-031/dogfood-blocks-section.part03.test.ts`, and
  `tests/cycles/DX-031/dogfood-blocks-section.part04.test.ts`.
- Replay: `npx vitest run --config vitest.config.ts tests/cycles/DX-047/blocks-app-binding-snippets.test.ts tests/cycles/DX-031/dogfood-blocks-section.part01.test.ts tests/cycles/DX-031/dogfood-blocks-section.part02.test.ts tests/cycles/DX-031/dogfood-blocks-section.part03.test.ts tests/cycles/DX-031/dogfood-blocks-section.part04.test.ts`.
- Witness: PR #361 closed #342 and merged on 2026-07-02 at `6b56a97a`.
- Residual risk: no accepted release risk.

### DOGFOOD Release-Story Surfaces

- Tracker: [#335](https://github.com/flyingrobots/bijou/issues/335).
- Design: [`DF-078`](../../design/DF-078-dogfood-release-story-surfaces.md).
- Landed PRs: [#452](https://github.com/flyingrobots/bijou/pull/452) and
  [#460](https://github.com/flyingrobots/bijou/pull/460).
- Completed slices: DOGFOOD Release includes Current Release Story, GraphQL
  Proof Walkthrough, and CHANGELOG History in the main reader flow; localized
  Markdown mirrors load at runtime; release-story guide chrome is cataloged;
  CHANGELOG boundaries are derived from `docs/CHANGELOG.md`.
- Canonical proof inputs:
  `tests/cycles/DF-023/publish-repo-package-and-release-guides-in-dogfood.test.ts`
  and `tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts`.
- Replay: `npm test -- --run tests/cycles/DF-023/publish-repo-package-and-release-guides-in-dogfood.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts`.
- Witness: PR #460 closed #335 and merged on 2026-07-04 at `b8b4eb2` after all
  review threads were resolved and GitHub Actions were green.
- Residual risk: structured multilingual changelog source is tracked separately
  as future work in #454.

### Code Dojo And Standards Ratchets

- Trackers:
  [#364](https://github.com/flyingrobots/bijou/issues/364) and
  [#366](https://github.com/flyingrobots/bijou/issues/366).
- Design: [`WF-134`](../../design/WF-134-code-dojo-eslint-ratchet-1.md) plus
  the Code Dojo exception ledger.
- Landed PRs: [#362](https://github.com/flyingrobots/bijou/pull/362) and
  [#365](https://github.com/flyingrobots/bijou/pull/365), followed by later
  ratchet slices recorded in `docs/CHANGELOG.md`.
- Completed slices: installed the TypeScript Code Standards artifact, wired
  Code Dojo hooks and CI lanes, made standards debt visible through ratcheting
  baselines, and reduced live ESLint debt below the first ratchet target.
- Canonical proof inputs:
  `docs/typescript-code-standards.editors-edition.md`,
  `docs/code-dojo-exceptions.md`, Code Dojo scripts, and WF-130 roadmap tests.
- Replay: `npm run code-dojo:verify`.
- Witness: current release-gate validation passed `npm run release:readiness`,
  whose gauntlet includes build, lint, code size, typecheck, DOGFOOD gates,
  workflow shell preflight, release metadata preflight, frame tests, examples,
  canaries, DOGFOOD smoke, and the full chunked Vitest suite.
- Residual risk: standards debt is ratcheted, not zero. The exception ledger
  remains binding after release.

### Dependency Security

- Trackers:
  [#357](https://github.com/flyingrobots/bijou/issues/357) and
  [#370](https://github.com/flyingrobots/bijou/issues/370).
- Designs and PRs:
  [`WF-133`](../../design/WF-133-esbuild-security-patch.md) through
  [#358](https://github.com/flyingrobots/bijou/pull/358), plus the Hono
  Dependabot security update in
  [#363](https://github.com/flyingrobots/bijou/pull/363).
- Completed slices: `esbuild` resolves to `0.28.1`; `hono` resolves to
  `4.12.25`; `package-lock.json` records `node_modules/esbuild` as a dev
  dependency; default-branch audit and Dependabot alert checks were verified
  before #370 closed.
- Canonical proof inputs: npm lockfile, dev-inclusive `npm audit`, runtime-only
  `npm audit --omit=dev`, and Dependabot alert API.
- Replay: run `npm audit --audit-level=high` for the full dependency graph,
  then `npm audit --omit=dev --audit-level=high` for the runtime-only release
  boundary.
- Witness: release-gate validation on 2026-07-04 reported
  `found 0 vulnerabilities` for the dev-inclusive audit and the runtime-only
  audit.
- Residual risk: no accepted release risk.

## Automated Evidence Matrix

| Gate | Command or source | Expected result | Status |
| :--- | :--- | :--- | :--- |
| Release metadata preflight | `npm run release:preflight` | Lock-step workspace metadata is valid. | Passed on release-prep branch and final-main release commit. |
| Docs inventory | `npm run docs:inventory` | Documentation manifest remains valid. | Passed on release-prep branch and final-main release commit. |
| Dev-tooling dependency audit | `npm audit --audit-level=high` | Zero high or critical vulnerabilities across production and development dependencies, including dev-tooling packages such as `esbuild`. | Passed: `found 0 vulnerabilities`. |
| Runtime dependency audit | `npm audit --omit=dev --audit-level=high` | Zero high or critical runtime vulnerabilities. | Passed on release-prep branch and final-main release commit: `found 0 vulnerabilities`. |
| Focused roadmap proof | `npx vitest run --config vitest.config.ts tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part02.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part03.test.ts` | Roadmap snapshot, release posture, Beyond count, and Markdown policy are self-consistent. | Passed on release-prep branch. |
| Release gauntlet | `npm run release:readiness` | Local release-readiness gauntlet passes without live milestone checks. | Passed on release-gate and release-prep lineage. |
| Milestone-aware readiness | `npm run release:readiness -- --milestone v7.2.0` | Blocks until the target milestone has zero open tracker items, including issues or pull requests, and no WIP labels. | Passed on release-prep branch and final-main release commit on 2026-07-05. |
| Release Dry Run | GitHub Actions run `28736681371` | Packed files, publish dry-runs, DOGFOOD smokes, and release evidence stay green from `main`. | Passed before tag creation. |
| Tag Guard | GitHub Actions run `28736930947` | The pushed tag resolves to the intended release commit and metadata is valid. | Passed after `v7.2.0` tag push. |
| Publish workflow | GitHub Actions run `28736930944` | Automated npm publishing succeeds for every workspace package. | Publish workflow passed on 2026-07-05. |
| Tag CI | GitHub Actions run `28736930919` | The tag build/test lane succeeds. | Passed after `v7.2.0` tag push. |
| GitHub Release | <https://github.com/flyingrobots/bijou/releases/tag/v7.2.0> | Release notes are published for the public tag. | Published on 2026-07-05. |
| npm registry verification | `npm view <package> version dist-tags --json` | Every automated package reports version `7.2.0` with `latest`. | npm registry verification passed for every automated package. |

## Human Review Matrix

| Surface | Review disposition |
| :--- | :--- |
| `docs/CHANGELOG.md` | v7.2 framework input, mouse tracking, DOGFOOD demo integrity, Code Dojo, and security changes now live under the dated `7.2.0` boundary. |
| `README.md` | Front-door What's New now describes v7.2.0 and links to the v7.2 release docs. |
| `docs/ROADMAP.md` | Updated on 2026-07-05 from GitHub milestone state: v7.2 has zero open and seventeen closed milestone items, Beyond has 39 open items, and v8 is staged separately. |
| `docs/BEARING.md` | Updated after release so the next target is #457 and the next feature horizon is V8. |
| `docs/releases/7.2.0/README.md` | This packet records release-prep, final-main, tag, publish, GitHub Release, and npm registry evidence. |
| `docs/releases/7.2.0/whats-new.md` | Versioned v7.2 release overview is ready for DOGFOOD and public release docs. |
| `docs/releases/7.2.0/migration-guide.md` | Versioned v7.2 migration guidance is ready for DOGFOOD and public release docs. |
| Package READMEs | No package front-door API positioning was changed by this release-gate branch. |
| `ARCHITECTURE.md` | No port, adapter, package boundary, storage, or rendering-contract update is required by this release-gate branch. |

## Package And Registry Verification Plan

The release-prep PR performed the package metadata mutation and validated the
resulting branch before it merged:

```bash
npm run version 7.2.0
npm install --package-lock-only --ignore-scripts
npm run release:preflight
npm run docs:inventory
npm audit --audit-level=high
npm run release:readiness -- --milestone v7.2.0
```

The **Release Dry Run** workflow ran against release-prep before merge and
again from final `main` before tag creation. The final-main run
<https://github.com/flyingrobots/bijou/actions/runs/28736681371> is the
authoritative packed-file and npm publish dry-run evidence for the automated
publish matrix.

After the release-prep PR merged and local `main` exactly matched
`origin/main`, final tag preparation replayed the metadata and docs checks from
the merged commit:

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

After the `v7.2.0` tag was pushed and the publish workflow passed, registry
verification confirmed every published package resolves to version `7.2.0`
with the stable `latest` dist-tag:

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

## Release-Time Registry Snapshot

The table below is the immutable release evidence. It records the registry
state observed during post-publish verification on 2026-07-05 after Release
workflow run `28736930944` completed at `2026-07-05T10:03:04Z` from release
commit `123f4a6150963932118cbf763a8a6ec03487e227`. The `npm view` commands
above are operational replay aids and may report a later `latest` value after a
future release; this table is the historical `v7.2.0` snapshot.

| Package | Observed version | Observed `latest` dist-tag |
| :--- | :--- | :--- |
| `@flyingrobots/bijou` | `7.2.0` | `7.2.0` |
| `@flyingrobots/bijou-node` | `7.2.0` | `7.2.0` |
| `@flyingrobots/bijou-tui` | `7.2.0` | `7.2.0` |
| `@flyingrobots/bijou-tui-app` | `7.2.0` | `7.2.0` |
| `create-bijou-tui-app` | `7.2.0` | `7.2.0` |
| `@flyingrobots/bijou-i18n` | `7.2.0` | `7.2.0` |
| `@flyingrobots/bijou-i18n-tools` | `7.2.0` | `7.2.0` |
| `@flyingrobots/bijou-i18n-tools-node` | `7.2.0` | `7.2.0` |
| `@flyingrobots/bijou-i18n-tools-xlsx` | `7.2.0` | `7.2.0` |
| `@flyingrobots/bijou-mcp` | `7.2.0` | `7.2.0` |

Tag creation, publish automation, npm registry verification, and GitHub Release
verification all ran from the merged release commit after the release-prep
branch landed. The public release is
<https://github.com/flyingrobots/bijou/releases/tag/v7.2.0>.

## Deterministic Reproducibility

All historical release-prep claims above are replayable from the release-prep
branch tip with:

```bash
npm run release:preflight
npm run docs:inventory
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
npx vitest run --config vitest.config.ts tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part02.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part03.test.ts
npm run release:readiness
```

The public tag was created only after the final merged `main` checks passed:

```bash
npm run release:preflight
npm run docs:inventory
npm run release:readiness -- --milestone v7.2.0
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
```

The final tag was created after #354 closed, the release-prep PR merged, the
local checkout was clean, `main` exactly matched `origin/main`, and CI /
Release Dry Run evidence was green.

## Residual Risk

- Code Dojo debt remains tracked by ratcheting baselines. This release improves
  enforcement and lowers debt, but does not claim zero standards debt.
