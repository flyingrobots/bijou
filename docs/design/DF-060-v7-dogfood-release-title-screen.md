---
title: DF-060 V7 DOGFOOD release title screen and closeout six-pack
legend: DF
lane: release
priority: medium
keywords:
  - blocklab
  - dogfood
  - release
  - table-surface
  - workflow
---

# DF-060 V7 DOGFOOD Release Title Screen And Closeout Six-Pack

## Framing

This cycle pulls the remaining v7 product-truth work into one closeout pass and
adds a release-specific DOGFOOD title surface before v7 is considered ready to
cut. The title screen should make the release feel intentional, but it must
remain a useful terminal documentation entry point rather than a decorative
splash screen.

This cycle carries six issues:

| Issue | Lane | Role |
| :--- | :--- | :--- |
| [#245](https://github.com/flyingrobots/bijou/issues/245) | `lane:release` | Bring `tableSurface()` to responsive-width parity with `table()`. |
| [#246](https://github.com/flyingrobots/bijou/issues/246) | `lane:up-next` | Document `scopedNodeIO()` realpath and symlink semantics. |
| [#266](https://github.com/flyingrobots/bijou/issues/266) | `lane:bad-code` | Keep `BEARING.md` synced with the live tracker after rapid-fire merges. |
| [#267](https://github.com/flyingrobots/bijou/issues/267) | `lane:bad-code` | Replace CI workflow string-scan tests with parsed YAML assertions. |
| [#271](https://github.com/flyingrobots/bijou/issues/271) | `lane:bad-code` | Rename the Storybook-labeled workstation to BlockLab. |
| [#281](https://github.com/flyingrobots/bijou/issues/281) | `lane:release` | Add a v7 DOGFOOD release title screen. |

The design follows a Design Thinking loop:

- observe the remaining release gaps through the live GitHub tracker instead of
  stale roadmap prose
- frame the work around user-visible release truth and agent-inspectable
  release proof
- prototype the title screen, BlockLab labels, table parity, lower modes, and
  workflow guards before treating the cycle as landed
- prove the result with rendered DOGFOOD tests, package/API tests, docs tests,
  localization gates, and parsed workflow assertions

## Sponsored Users

- A maintainer preparing v7 needs the issue tracker, roadmap, BEARING, title
  surface, and release proof to agree without manual reconciliation.
- A TUI builder needs `tableSurface()` to obey the same width constraints and
  lower-mode semantics already proven by `table()`.
- A component author needs the preview workstation to use a project-owned name,
  BlockLab, while legacy commands remain available during migration.
- A review agent needs structured workflow assertions, stable release-title
  facts, and lower-mode output instead of brittle prose or raw string scans.

## Hills

1. A DOGFOOD reader can open the docs app and see a v7 title surface that names
   the release identity, proof lanes, and navigation options at wide and narrow
   terminal widths.
2. A TUI author can use `tableSurface()` with explicit width constraints and get
   output that fits like `table()` while preserving row, column, value, and
   selected-cell facts in lower modes.
3. A maintainer can close the v7 issue lane with GitHub, BEARING, ROADMAP,
   CHANGELOG, workflow tests, BlockLab names, and docs all pointing to the same
   release truth.

## Playback Questions

- Does DOGFOOD show release identity without blocking normal documentation
  navigation?
- Does the title screen lower to static, pipe, and accessible output with
  release id, release title, proof lane, and navigation facts?
- Does `tableSurface()` fit constrained widths instead of retaining old
  intrinsic sizing assumptions?
- Do `scopedNodeIO()` docs explain realpath-normalized paths and symlink escape
  rejection with enough precision for callers?
- Can workflow policy tests prove the checkout depth and i18n base behavior by
  parsing CI YAML instead of searching raw text?
- Do humans see BlockLab, while existing `storybook` npm scripts continue to
  work for one migration window?
- Do BEARING and ROADMAP match the live GitHub tracker after this cycle?

## Product Shape

### DOGFOOD V7 Title, Wide

```text
+ BIJOU DOGFOOD -------------------------------------------+
| V7 Product Truth                                         |
| Blocks prove product surfaces. DOGFOOD proves Blocks.    |
|                                                          |
| Proof lanes: table parity | scoped Node I/O | BlockLab   |
| Release gate: v6 issue-complete, v7 closeout in flight   |
|                                                          |
| [Docs] [Blocks] [BlockLab] [Release Notes]               |
+----------------------------------------------------------+
```

### DOGFOOD V7 Title, Narrow

```text
+ BIJOU DOGFOOD ----+
| V7 Product Truth  |
| Blocks prove UX.  |
| lanes: table, io  |
| gate: closeout    |
+-------------------+
```

### `tableSurface()` Width Parity

```text
+ ResponsiveTableSurface -----------------------------+
| Package     Status   Tests                           |
| bijou       ready    1820                            |
| bijou-tui   ready    640                             |
| Layout: fitted to 48 columns                         |
+------------------------------------------------------+
```

### BlockLab Workbench

```text
Bijou BlockLab                         story: notification-system
Stories 12  Families 6  Modes interactive/static/pipe/accessible

+ Preview ------------------------------------------------+
| Notification stack                                      |
| Variant: live                                           |
+---------------------------------------------------------+
```

## Lower Modes

The title surface should be backed by release metadata so every mode lowers
from the same truth.

Static mode:

```text
Bijou DOGFOOD release title. Release V7 Product Truth. Proof lanes: table parity, scoped Node I/O, BlockLab, release title.
```

Pipe mode:

```text
release_id	v7
release_title	V7 Product Truth
proof_lane	table parity
proof_lane	scoped Node I/O
proof_lane	BlockLab
proof_lane	release title
navigation_available	true
```

Accessible mode:

```text
DOGFOOD title screen for V7 Product Truth. Current release proof lanes are table parity, scoped Node I/O, BlockLab, and release title. Navigation remains available after the title.
```

`tableSurface()` lower modes must preserve the same semantic table facts:

```text
row-id	bijou
column-id	status
cell-value	ready
layout-variant	fitted
selected-cell	bijou/status
```

## Runtime And API Contracts

- DOGFOOD release title metadata should be a typed local data structure, not
  scattered strings in the renderer.
- DOGFOOD visible title strings must go through the DOGFOOD localization
  catalog.
- `tableSurface()` should share, reuse, or faithfully mirror the fitted table
  model already used by `table()` instead of growing a second width algorithm.
- `scopedNodeIO()` docs must state that returned paths can be realpath
  normalized and that symlink escapes are rejected even when lexical prefixes
  appear valid.
- Workflow tests should parse `.github/workflows/ci.yml` as YAML and inspect
  `jobs.test.steps` structurally.
- BlockLab should become the canonical human-facing name and `blocklab.*` the
  canonical agent-facing token family, while old `storybook` scripts remain as
  compatibility aliases during this migration window.

## Accessibility, Localization, And Inspectability

- The title screen must expose release title and proof lanes as text, not only
  border art or color.
- New DOGFOOD strings require `en`, `fr`, `es`, and `de` catalog values.
- `npm run dogfood:i18n:complete` and `npm run dogfood:i18n:check` are part of
  the merge gate.
- Agent-facing facts should include release id, release title, proof lane ids,
  navigation availability, table row ids, table column ids, and selected cell
  identity.
- No title-screen behavior should depend on wall-clock time, network state, or
  live GitHub API data.

## Implementation Slices

1. Shape the cycle: create issue #281, write this design doc, push the branch,
   and open the early PR.
2. Write RED tests for release-title rendering/lower modes, tableSurface width
   parity, scopedNodeIO docs, parsed workflow assertions, BlockLab labels, and
   tracker sync.
3. Implement `tableSurface()` width parity and lower-mode facts.
4. Document `scopedNodeIO()` realpath and symlink semantics.
5. Rename visible Storybook workstation language to BlockLab while keeping
   compatibility script aliases.
6. Add the v7 DOGFOOD release title metadata, route/guide integration,
   localization strings, and lower-mode proof.
7. Sync BEARING, ROADMAP, CHANGELOG, and issue metadata with GitHub.
8. Run focused tests, DOGFOOD i18n gates, docs inventory, lint, typecheck, full
   test suite, self-review, and PR readiness.

## Tests To Write First

- `tests/cycles/DF-060/v7-dogfood-release-title-screen.test.ts`
- `tests/cycles/DX-037/table-surface-width-parity.test.ts`
- `tests/cycles/DX-029/scoped-node-io-docs.test.ts`
- `tests/cycles/WF-126/v7-closeout-tracker-sync.test.ts`
- `scripts/hooks.test.ts` structured CI workflow assertions
- Existing DF-027/DF-069 BlockLab rename tests updated from Storybook labels

## Acceptance Criteria

- PR closes #245, #246, #266, #267, #271, and #281.
- v7 has no open tracker issues after the PR merges, unless new issue triage
  explicitly says otherwise.
- DOGFOOD has a v7 release title screen with wide, narrow, static, pipe, and
  accessible proof.
- `tableSurface()` width behavior is deterministic under constrained terminal
  widths and preserves semantic facts.
- `scopedNodeIO()` realpath/symlink semantics are documented in package docs.
- CI workflow guard tests parse YAML and validate the actual test job checkout
  and i18n base paths.
- BlockLab is the canonical visible name, with compatibility aliases for old
  `storybook` npm scripts.
- All new or changed DOGFOOD localization strings are translated in every
  supported locale.

## Risks And Guardrails

- Do not turn the title screen into a blocking splash page. It is a docs entry
  surface.
- Do not rename legacy `storybook` script aliases without a migration window.
- Do not use live GitHub data inside deterministic tests.
- Do not broaden table work into a full table redesign; target
  `tableSurface()` parity only.
- Do not make BEARING/ROADMAP the source of truth. They mirror GitHub Issues.

