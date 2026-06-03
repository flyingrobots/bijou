---
title: DX-040 V7 post-merge review regression fixes
legend: DX
lane: bad-code
priority: medium
issue: https://github.com/flyingrobots/bijou/issues/283
keywords:
  - dogfood
  - release-title
  - table-surface
  - wrapping
  - review-follow-up
---

# DX-040 V7 Post-Merge Review Regression Fixes

## Framing

PR #282 merged the V7 Product Truth closeout. Codex review comments arrived
after the admin merge and identified two P2 regressions that should be fixed
before v7 is cut:

| Source | File | Problem |
| :--- | :--- | :--- |
| [PR #282 thread](https://github.com/flyingrobots/bijou/pull/282#discussion_r3348547178) | `examples/docs/release-title.ts` | Interactive release-title output can exceed the caller's requested width for widths from 42 through 59 columns. |
| [PR #282 thread](https://github.com/flyingrobots/bijou/pull/282#discussion_r3348547191) | `packages/bijou/src/core/components/table-v3.ts` | Fitted `tableSurface()` string cells hard-wrap at column boundaries instead of honoring default word wrapping. |

This follow-up keeps the scope intentionally narrow: fix exactly the two review
comments, preserve the v7 closeout behavior, and leave broader table or title
treatment redesigns for later cycles.

## Sponsored Users

- A DOGFOOD reader on a medium-width terminal needs the release-title guide to
  fit the actual viewport instead of drawing a wider box.
- A TUI author using `tableSurface()` expects readable fitted text by default,
  matching the word-wrap posture already established by `table()`.
- A review agent needs the reported regressions captured as deterministic tests
  so the branch proves the fix instead of relying on prose.

## Hill

A maintainer can run deterministic tests that reproduce both post-merge review
comments, then see the title renderer stay within requested widths and
`tableSurface()` preserve word boundaries when fitting string cells.

## Current Truth

- `renderDogfoodReleaseTitleText({ mode: 'interactive', width: 42 })` selects
  the wide renderer even though wide output is 60 columns.
- The new fitted `tableSurface()` path wraps shrunk string cells through
  `wrapSurfaceToWidth()`, which chunks at hard cell boundaries and can split
  words such as `surface` and `evidence`.
- PR #282 is already merged, so the fix must be a new branch and PR.

## Product Shape

### Release Title Width

```text
width 42:
+ BIJOU DOGFOOD ----+
| V7 Product Truth  |
| Blocks prove UX.  |
| lanes: table, io  |
| gate: closeout    |
+-------------------+
```

Every emitted line must be `<= width`.

### Table Surface Word Wrapping

```text
| Release proof     |
| canonical docs    |
| surface carries   |
| release title     |
```

Default fitted string cells should break at word boundaries when possible.
Explicit hard wrapping and truncation remain separate behaviors.

## Runtime And API Contract

- Release-title text rendering must honor the supplied `width` for interactive
  mode.
- `tableSurface()` must preserve existing `overflow: 'truncate'` behavior.
- Default fitted string cells should use word-aware wrapping.
- Surface cells that are already structured `Surface` values may continue to
  use the existing surface wrapping behavior because the original word
  boundaries are not recoverable from arbitrary surfaces.

## Lower Modes

No lower-mode contract changes are intended. Existing static, pipe, and
accessible release-title output should remain unchanged.

## Tests To Write First

- Extend `tests/cycles/DF-060/v7-dogfood-release-title-screen.test.ts` with a
  width-42 regression that asserts every interactive line is at most 42
  characters.
- Extend `tests/cycles/DX-037/table-surface-width-parity.test.ts` with a
  default word-wrap regression that asserts fitted output does not split
  `surface` or `evidence` across lines.

## Acceptance Criteria

- Issue #283 is closed by the follow-up PR.
- The exact Codex review cases are represented by tests that fail before the
  fix and pass after it.
- `npm run lint`, focused tests, and relevant DOGFOOD checks pass.
- No broad redesign of release-title art, `table()`, or `tableSurface()` is
  included.

## Risks And Guardrails

- Do not change the public `tableSurface()` signature unless the tests prove it
  is necessary.
- Do not make title rendering depend on terminal state outside the supplied
  width.
- Do not remove Storybook compatibility aliases while fixing BlockLab-adjacent
  follow-up behavior.
