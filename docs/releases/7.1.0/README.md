# Bijou 7.1.0 Release Evidence

Bijou 7.1.0 is the post-V7 minor release that turns the accumulated V8-facing
proof work into a clean public package boundary without expanding the release
train. It ships the Runtime Graph and Scene IR seed work, the first
GraphQL-authored DOGFOOD block fixture, theme/token polish, raster-to-glyph
tooling, terminal-rendering fixes, and release-prep guardrails that make the
next release checklist auditable.

This packet is intentionally prepared before the public tag exists. The release
tag and tag push are excluded from this prep pass by operator instruction.

## Release Summary

- Version: `7.1.0`
- Planned tag: `v7.1.0`
- Previous public tag: `v7.0.0`
- Release type: stable minor
- npm dist-tag after publish: `latest`
- Release-prep branch: `release/v7.1.0`
- Release date: 2026-06-13
- Publish surface: npm workspace packages only

## Tracker And Goalpost Map

| Goalpost | Issue / PR evidence | Status | Release role |
| :--- | :--- | :--- | :--- |
| Runtime Graph and Scene IR seed | #302, PR #323 | Landed | Adds `ui-scene-ir/1`, structural receipts, terminal lowering proof, source maps, and lower modes. |
| GraphQL-authored Bijou block proof | #302, PR #324 | Landed | Adds GraphQL SDL compilation to `bijou-block/1` and lowering into `ui-scene-ir/1`. |
| GraphQL block groups and debug facts | #302, PR #325 | Landed | Adds grouped block authoring and deterministic `graphql-bijou-block-debug/1` facts. |
| DOGFOOD GraphQL navigation fixture | #329, PR #330 | Landed | Proves a real DOGFOOD NavigationListBlock fixture through GraphQL, block artifact, IR, terminal surface, and debug facts. |
| DOGFOOD rendering and navigation fixes | PR #331 | Landed | Fixes ANSI reset leakage, Blocks guide navigation, and terminal resize repaint recovery found during DOGFOOD review. |
| Release readiness guardrail | #270, PR #332 | Landed | Adds milestone-aware `release:readiness -- --milestone vX.Y.Z` reporting and blocking checks. |
| DOGFOOD i18n debt guardrail | #312, PR #332 | Landed | Makes DOGFOOD i18n debt source discovery cover `examples/docs/**/*.ts` by default. |

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
| Target milestone PR gate | `gh pr list --repo flyingrobots/bijou --state open --search 'milestone:v7.1.0'` | Empty list. | Passed before release prep. |
| High-priority issue gate | `gh issue list --repo flyingrobots/bijou --state open --label priority:high` | Empty list, or packeted risk. | Passed before release prep. |
| Version lock-step | `npm run version 7.1.0` and `npm run release:preflight` | All workspace manifests and internal dependencies agree on `7.1.0`. | Passed in release prep. |
| Release readiness | `npm run release:readiness -- --milestone v7.1.0` | Milestone report passes, then local gauntlet passes. | Passed in release prep: 346 test files and 3844 tests. |
| Documentation inventory | `npm run docs:inventory` | Inventory passes with `docs/releases/7.1.0/`. | Passed in release prep. |
| Runtime audit | `npm audit --omit=dev --audit-level=high` | No high or critical runtime vulnerability. | Passed in release prep: 0 vulnerabilities. |
| Release dry run | `.github/workflows/release-dry-run.yml` on `release/v7.1.0` | Build, lint, tests, DOGFOOD smoke, pack checks, npm publish dry-runs, and notes preview pass. | Pending after branch push. |

## Human Review Matrix

| Surface | Review disposition |
| :--- | :--- |
| `docs/CHANGELOG.md` | Updated from `Unreleased` into `[7.1.0] - 2026-06-13`; content reflects the diff since `v7.0.0`. |
| `README.md` | Updated with a concise `v7.1.0` user-facing What's New section and links to release docs. |
| `ARCHITECTURE.md` | Reviewed; no change required for this minor release because package boundaries and port ownership remain unchanged. |
| `docs/VISION.md` and `docs/METHOD.md` | Reviewed; no change required because project identity and work doctrine did not change. |
| `docs/ROADMAP.md` and `docs/BEARING.md` | Already aligned by the roadmap and release-readiness guardrail work; `v7.0.0` remains the latest shipped release until the tag is created. |
| `docs/DOGFOOD.md` | Updated by release-readiness guardrail work to reflect DOGFOOD i18n/source posture. |
| Package READMEs and API references | Reviewed; no targeted README change required beyond the root release summary because APIs are additive or internal-proof oriented. |
| Release docs | Added this evidence packet plus long-form What's New and migration guide. |

## Deterministic Reproducibility Record

| Claim | Replay command / fixture | Stable assertion |
| :--- | :--- | :--- |
| DOGFOOD GraphQL NavigationListBlock fixture compiles through the proof chain. | `npm test -- --run packages/bijou/src/core/graphql-bijou-block.test.ts` with `examples/docs/fixtures/graphql/navigation-list.graphql`. | Tests assert `bijou-block/1`, `ui-scene-ir/1`, terminal proof, debug facts, source maps, i18n keys, token refs, actions, bindings, lower modes, and hashes. |
| Terminal resize recovery repaints blank cells after geometry changes. | `npm test -- --run packages/bijou-tui/src/runtime.test.ts packages/bijou-tui/src/screen.test.ts`. | Post-resize frame assertions include trailing blank-cell repaint data and no NUL bytes. |
| DOGFOOD Blocks guide navigation can focus the Block Preview parent row. | `npm test -- --run tests/cycles/DX-031-blocks-standardization.test.ts tests/cycles/DF-068-dogfood-block-preview.test.ts`. | Focus moves Up from `AppShell` to the `Block Preview` parent while selection stays on the preview group. |
| ANSI scoped foreground/background resets do not leak into DOGFOOD navigation labels. | `npm test -- --run packages/bijou/src/core/render/differ.test.ts tests/cycles/DF-068-dogfood-block-preview.test.ts`. | Scoped SGR `39` and `49` reset only the intended color channel. |
| DOGFOOD i18n debt source discovery covers new docs modules by default. | `npm run dogfood:i18n:debt` and `npm test -- --run scripts/dogfood-i18n-debt.test.ts`. | Source-surface counts include discovered `examples/docs/**/*.ts` modules unless explicitly excluded as tooling-only. |
| Milestone-aware release readiness blocks incomplete release prep. | `npm run release:readiness -- --milestone v7.1.0` and `npm test -- --run scripts/release-readiness.test.ts`. | The report rejects open tracker issues, lingering `work-in-progress`, missing release evidence packets, stale docs posture, and missing package-smoke coverage. |
| Current release docs render through DOGFOOD. | `npm run smoke:dogfood:docs -- --skip-build`. | DOGFOOD docs smoke can navigate release docs for the current package version. |

## Package And Registry Verification Plan

After the release PR is merged and only after explicit operator approval to tag:

1. Fast-forward local `main` to the exact `origin/main` release commit.
2. Re-run `npm run release:preflight` and `npm run docs:inventory`.
3. Create the annotated `v7.1.0` tag from clean synced `main`.
4. Push only `v7.1.0`.
5. Verify tag guard and publish workflows pass.
6. Verify npm reports `7.1.0` and `latest` for each automated publish package:
   `@flyingrobots/bijou`, `@flyingrobots/bijou-node`,
   `@flyingrobots/bijou-tui`, `@flyingrobots/bijou-tui-app`,
   `create-bijou-tui-app`, `@flyingrobots/bijou-i18n`,
   `@flyingrobots/bijou-i18n-tools`,
   `@flyingrobots/bijou-i18n-tools-node`,
   `@flyingrobots/bijou-i18n-tools-xlsx`, and
   `@flyingrobots/bijou-mcp`.
7. Verify the GitHub Release exists with generated notes.

## Residual Risk

- The release dry-run workflow can only be completed after this branch is
  pushed. Until that workflow passes, the release is not tag-ready.
- The actual npm registry and GitHub Release verification cannot occur in this
  prep pass because the operator explicitly prohibited tag creation and tag
  pushes.
- The broad Runtime Graph and Scene IR product contract remains V8 work. The
  7.1.0 release intentionally ships proof slices and guardrails only.

No accepted unresolved high-priority issue is recorded for this release packet.
