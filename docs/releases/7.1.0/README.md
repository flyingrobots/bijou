# Bijou 7.1.0 Release Evidence

Bijou 7.1.0 is the post-V7 minor release that turns the accumulated V8-facing
proof work into a clean public package boundary without expanding the release
train. It ships the Runtime Graph and Scene IR seed work, the first
GraphQL-authored DOGFOOD block fixture, theme/token polish, raster-to-glyph
tooling, terminal-rendering fixes, and release-prep guardrails that make the
next release checklist auditable.

This packet was prepared on the release branch before the public tag existed.
The release tag and tag push are final-main steps and are excluded from this
prep branch by operator instruction.

## Release Summary

- Version: `7.1.0`
- Tag: `v7.1.0` (created only from the merged `origin/main` release commit)
- Previous public tag: `v7.0.0`
- Release type: stable minor
- npm dist-tag after publish: `latest`
- Release-prep branch: `release/v7.1.0`
- Release date: 2026-06-14
- Publish surface: npm workspace packages only

## Tracker And Goalpost Map

Each goalpost records the release-law evidence required by
[`docs/release.md`](../../release.md): tracker, design, PRs, completed slices,
deterministic proof or fixture, replay command, witness, and residual-risk
disposition.

### Runtime Graph And Scene IR Seed

- Tracker: broad V8 parent #302.
- Design: [`DX-043`](../../design/DX-043-portable-bijou-blocks-and-multi-endpoint-ir.md).
- Landed PRs: [#323](https://github.com/flyingrobots/bijou/pull/323).
- Completed slices: 2 planned proof slices (`ui-scene-ir/1` seed and terminal
  receipt proof) plus 8 review-hardening fixes.
- Canonical proof input: synthetic scenes in
  `packages/bijou/src/core/ui-scene-ir.test.ts`.
- Replay: `npm test -- --run packages/bijou/src/core/ui-scene-ir.test.ts`.
- Witness: tests assert SHA-256 scene hashes, structural receipts, source maps,
  terminal lowering receipts, lower modes, unsupported-node rejection, negative
  clipping, top-level JSON guards, and inline dependency receipts.
- Residual risk: V8 product contract is explicitly not shipped here; this is
  the seed proof only.

### GraphQL-Authored Bijou Block Proof

- Tracker: broad V8 parent #302.
- Design: [`DX-044`](../../design/DX-044-graphql-authored-bijou-block-ir-proof.md).
- Landed PRs: [#324](https://github.com/flyingrobots/bijou/pull/324).
- Completed slices: 1 planned compiler/lowering proof slice plus 5 review,
  parser-hardening, and documentation fixes.
- Canonical proof input: SDL fixtures embedded in
  `packages/bijou/src/core/graphql-bijou-block.test.ts`.
- Replay: `npm test -- --run packages/bijou/src/core/graphql-bijou-block.test.ts`.
- Witness: tests assert `bijou-block/1` artifact creation, lowering into
  `ui-scene-ir/1`, duplicate identity rejection, parse hardening, source
  anchors, token refs, i18n facts, actions, bindings, and lower-mode hashes.
- Residual risk: GraphQL authoring remains a proof path toward V8, not the full
  product authoring contract.

### GraphQL Block Groups And Debug Facts

- Tracker: broad V8 parent #302.
- Design: [`DX-045`](../../design/DX-045-graphql-block-groups-and-debug-facts.md).
- Landed PRs: [#325](https://github.com/flyingrobots/bijou/pull/325).
- Completed slices: 1 grouped-authoring and debug-facts proof slice.
- Canonical proof input: grouped SDL cases in
  `packages/bijou/src/core/graphql-bijou-block.test.ts`.
- Replay: `npm test -- --run packages/bijou/src/core/graphql-bijou-block.test.ts`.
- Witness: tests assert group directives, grouped field membership, deterministic
  `graphql-bijou-block-debug/1` summaries, and lower-mode/debug hash stability.
- Residual risk: group semantics are enough for the release proof; broad product
  taxonomy remains V8 work.

### DOGFOOD GraphQL Navigation Fixture

- Tracker: #329, child of broad V8 parent #302.
- Design: [`DX-046`](../../design/DX-046-graphql-authored-dogfood-block-fixture.md).
- Landed PRs: [#330](https://github.com/flyingrobots/bijou/pull/330).
- Completed slices: 1 DOGFOOD fixture slice plus 1 review-discovered ANSI reset
  fix.
- Canonical fixture:
  `examples/docs/fixtures/graphql/navigation-list.graphql`.
- Replay: `npm test -- --run packages/bijou/src/core/graphql-bijou-block.test.ts`.
- Witness: tests compile the DOGFOOD `NavigationListBlock` fixture into
  `bijou-block/1`, lower it into `ui-scene-ir/1`, prove terminal output, and
  assert debug facts for groups, fields, source maps, i18n keys, token refs,
  actions, bindings, lower modes, and hashes.
- Residual risk: only one real DOGFOOD fixture is shipped; additional product
  fixtures belong to V8.

### DOGFOOD Rendering And Navigation Fixes

- Tracker: review-discovered regression repairs in the v7.1 release window.
- Design lineage:
  [`DX-031`](../../design/DX-031-standard-bijou-blocks.md) for Blocks navigation
  behavior and [`DX-046`](../../design/DX-046-graphql-authored-dogfood-block-fixture.md)
  for the DOGFOOD fixture proof surface.
- Landed PRs: [#330](https://github.com/flyingrobots/bijou/pull/330) for ANSI
  scoped reset repair and [#331](https://github.com/flyingrobots/bijou/pull/331)
  for Blocks parent focus and resize repaint recovery.
- Completed slices: 3 regression-fix slices: scoped ANSI resets, Blocks preview
  parent focus, and terminal resize repaint.
- Canonical proof inputs:
  `tests/cycles/DX-031/dogfood-blocks-section.test.ts`,
  `tests/cycles/DF-068/dogfood-block-preview-regressions.test.ts`,
  `packages/bijou/src/core/render/differ.test.ts`, and
  `packages/bijou-tui/src/runtime.test.ts`.
- Replay: `npm test -- --run packages/bijou/src/core/render/differ.test.ts tests/cycles/DX-031/dogfood-blocks-section.test.ts tests/cycles/DF-068/dogfood-block-preview-regressions.test.ts packages/bijou-tui/src/runtime.test.ts packages/bijou-tui/src/screen.test.ts`.
- Witness: tests assert scoped SGR `39` / `49` color resets, Up navigation from
  `AppShell` back to the `Block Preview` parent row, resize repaint of blank
  cells, and reusable invalidated resize buffers with no NUL bytes.
- Residual risk: no accepted release risk; these are closed regressions.

### Release Readiness Guardrail

- Tracker: #270.
- Design: [`WF-132`](../../design/WF-132-release-readiness-and-dogfood-i18n-gates.md).
- Landed PRs: [#332](https://github.com/flyingrobots/bijou/pull/332).
- Completed slices: 1 milestone-aware release-readiness guardrail slice plus 1
  roadmap/test alignment slice.
- Canonical proof input: mocked milestone/docs snapshots in
  `scripts/release-readiness.test.ts`.
- Replay: `npm test -- --run scripts/release-readiness.test.ts`.
- Witness: tests assert milestone report formatting, open tracker issue
  rejection, lingering `work-in-progress` rejection, stale docs rejection,
  release-packet presence, package-smoke coverage, and CLI argument parsing.
- Residual risk: no accepted release risk; future work may move operator-only
  checks into a dedicated `release:prep` script.

### DOGFOOD I18n Debt Guardrail

- Tracker: #312.
- Design: [`WF-132`](../../design/WF-132-release-readiness-and-dogfood-i18n-gates.md).
- Landed PRs: [#332](https://github.com/flyingrobots/bijou/pull/332).
- Completed slices: 1 source-discovery guardrail slice.
- Canonical proof input: source-discovery fixtures in
  `scripts/dogfood-i18n-debt.test.ts`.
- Replay: `npm run dogfood:i18n:debt` and
  `npm test -- --run scripts/dogfood-i18n-debt.test.ts`.
- Witness: tests assert `examples/docs/**/*.ts` discovery, explicit tooling-only
  exclusions, source-surface counts, supported-locale reporting, and raw-string
  debt ratchet behavior.
- Residual risk: no accepted release risk; the scanner remains a guardrail, not
  a localization runtime rewrite.

The broad #302 tracker remains future-facing for V8. Bijou 7.1.0 ships the
first proof slices and fixture evidence, not the full Runtime Graph product.

## Automated Evidence Matrix

| Gate | Command or source | Expected result | Status |
| :--- | :--- | :--- | :--- |
| Phase 1 clean tree | `git status --porcelain=v1` | No output before release prep. | Passed before branching. |
| Phase 1 branch guard | `git rev-parse --abbrev-ref HEAD` | `main` before release branch creation. | Passed before branching. |
| Phase 1 origin parity | `git rev-parse HEAD origin/main` | Both SHAs equal. | Passed at `c950d257d248e1b45ffbc3bf7fb741749af7caf9`. |
| Latest public release | `git tag --merged HEAD --list 'v*' --sort=-version:refname \| head -n 1` | `v7.0.0`. | Passed. |
| Target milestone issue gate | `gh issue list --repo flyingrobots/bijou --milestone v7.1.0 --state open` | Empty list. | Passed before release prep. |
| Target milestone PR gate | `gh pr list --repo flyingrobots/bijou --state open --search 'milestone:v7.1.0'` | Empty list before the release PR opens; the release PR itself is closed by the tag commit. | Passed before release prep. |
| High-priority issue gate | `gh issue list --repo flyingrobots/bijou --state open --label priority:high` | Empty list, or packeted risk. | Passed before release prep. |
| Version lock-step | `npm run version 7.1.0` and `npm run release:preflight` | All workspace manifests and internal dependencies agree on `7.1.0`. | Passed in release prep. |
| Release readiness | `npm run release:readiness -- --milestone v7.1.0` | Milestone report passes, then local gauntlet passes. | Passed in release prep: 346 test files and 3844 tests. |
| Documentation inventory | `npm run docs:inventory` | Inventory passes with `docs/releases/7.1.0/`. | Passed in release prep. |
| Runtime audit | `npm audit --omit=dev --audit-level=high` | No high or critical runtime vulnerability. | Passed in release prep: 0 vulnerabilities. |
| Release dry run | [Release Dry Run run 27477234620](https://github.com/flyingrobots/bijou/actions/runs/27477234620) on `release/v7.1.0` at `12003411e75be5b2cb3dff95e549af8b1fa19bf4` | Build, lint, tests, DOGFOOD smoke, pack checks, npm publish dry-runs, and notes preview pass. | Passed. |

## Human Review Matrix

| Surface | Review disposition |
| :--- | :--- |
| `docs/CHANGELOG.md` | Updated from `Unreleased` into `[7.1.0] - 2026-06-14`; content reflects the diff since `v7.0.0`. |
| `README.md` | Updated with a concise `v7.1.0` user-facing What's New section and links to release docs. |
| `ARCHITECTURE.md` | Reviewed; no change required for this minor release because package boundaries and port ownership remain unchanged. |
| `docs/VISION.md` and `docs/METHOD.md` | Reviewed; no change required because project identity and work doctrine did not change. |
| `docs/ROADMAP.md` and `docs/BEARING.md` | Updated for the tag commit: `v7.1.0` is the latest shipped release boundary, `v7.1.0` is closed lineage, and `v8.0.0` is the next feature horizon. |
| `docs/DOGFOOD.md` | Updated by release-readiness guardrail work to reflect DOGFOOD i18n/source posture. |
| Package READMEs and API references | Reviewed; no targeted README change required beyond the root release summary because APIs are additive or internal-proof oriented. |
| Release docs | Added this evidence packet plus long-form What's New and migration guide. |

## Deterministic Reproducibility Record

| Claim | Replay command / fixture | Stable assertion |
| :--- | :--- | :--- |
| DOGFOOD GraphQL NavigationListBlock fixture compiles through the proof chain. | `npm test -- --run packages/bijou/src/core/graphql-bijou-block.test.ts` with `examples/docs/fixtures/graphql/navigation-list.graphql`. | Tests assert `bijou-block/1`, `ui-scene-ir/1`, terminal proof, debug facts, source maps, i18n keys, token refs, actions, bindings, lower modes, and hashes. |
| Terminal resize recovery repaints blank cells after geometry changes. | `npm test -- --run packages/bijou-tui/src/runtime.test.ts packages/bijou-tui/src/screen.test.ts`. | Post-resize frame assertions include trailing blank-cell repaint data and no NUL bytes. |
| DOGFOOD Blocks guide navigation can focus the Block Preview parent row. | `npm test -- --run tests/cycles/DX-031/dogfood-blocks-section.test.ts tests/cycles/DF-068/dogfood-block-preview-regressions.test.ts`. | Focus moves Up from `AppShell` to the `Block Preview` parent while selection stays on the preview group. |
| ANSI scoped foreground/background resets do not leak into DOGFOOD navigation labels. | `npm test -- --run packages/bijou/src/core/render/differ.test.ts tests/cycles/DF-068/dogfood-block-preview-regressions.test.ts`. | Scoped SGR `39` and `49` reset only the intended color channel. |
| DOGFOOD i18n debt source discovery covers new docs modules by default. | `npm run dogfood:i18n:debt` and `npm test -- --run scripts/dogfood-i18n-debt.test.ts`. | Source-surface counts include discovered `examples/docs/**/*.ts` modules unless explicitly excluded as tooling-only. |
| Milestone-aware release readiness blocks incomplete release prep. | `npm run release:readiness -- --milestone v7.1.0` and `npm test -- --run scripts/release-readiness.test.ts`. | The report rejects open tracker issues, lingering `work-in-progress`, missing release evidence packets, stale docs posture, and missing package-smoke coverage. |
| Current release docs render through DOGFOOD. | `npm run smoke:dogfood:docs -- --skip-build`. | DOGFOOD docs smoke can navigate release docs for the current package version. |

## Package And Registry Verification Plan

After the release PR is merged and only after explicit operator approval to tag:

1. Fast-forward local `main` to the exact `origin/main` release commit.
2. Re-run the live tracker gates:
   `gh issue list --repo flyingrobots/bijou --milestone v7.1.0 --state open`,
   `gh pr list --repo flyingrobots/bijou --state open --search 'milestone:v7.1.0'`,
   and
   `gh issue list --repo flyingrobots/bijou --state open --label priority:high`.
   Abort before tagging if any release-blocking item appears without an explicit
   packeted risk disposition.
3. Re-run `npm run release:preflight` and `npm run docs:inventory`.
4. Create the annotated `v7.1.0` tag from clean synced `main`.
5. Push only `v7.1.0`.
6. Verify tag guard and publish workflows pass.
7. Verify npm reports `7.1.0` and `latest` for each automated publish package:
   `@flyingrobots/bijou`, `@flyingrobots/bijou-node`,
   `@flyingrobots/bijou-tui`, `@flyingrobots/bijou-tui-app`,
   `create-bijou-tui-app`, `@flyingrobots/bijou-i18n`,
   `@flyingrobots/bijou-i18n-tools`,
   `@flyingrobots/bijou-i18n-tools-node`,
   `@flyingrobots/bijou-i18n-tools-xlsx`, and
   `@flyingrobots/bijou-mcp`.
8. Verify the GitHub Release exists with generated notes.

## Residual Risk

- The release dry-run workflow has passed for this branch. The final tag guard,
  publish workflow, npm registry verification, and GitHub Release verification
  still cannot occur in this prep pass because the operator explicitly
  prohibited tag creation and tag pushes.
- The broad Runtime Graph and Scene IR product contract remains V8 work. The
  7.1.0 release intentionally ships proof slices and guardrails only.

No accepted unresolved high-priority issue is recorded for this release packet.
