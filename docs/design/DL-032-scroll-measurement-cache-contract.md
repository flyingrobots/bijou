---
title: DL-032 Scroll-Measurement Cache Key and Invalidation Contract
lane: bad-code
priority: medium
github_issue: 587
status: decided
keywords:
  - app-frame
  - focus-area
  - scroll
  - cache
  - invalidation
---

# Scroll-Measurement Cache Key and Invalidation Contract

## Linked Work

- Container: [#485](https://github.com/flyingrobots/bijou/issues/485)
- This decision: [#587](https://github.com/flyingrobots/bijou/issues/587)
- Implementation: [#589](https://github.com/flyingrobots/bijou/issues/589)
- Evidence: [#591](https://github.com/flyingrobots/bijou/issues/591)
- Origin: PR [#484](https://github.com/flyingrobots/bijou/pull/484), which
  rejected a cache keyed by `(pageId, focusedPaneId, columns, rows)`.

## Decision Summary

The framed-app runtime owns one **frame input revision**: a monotonic integer
that it increments for every message entering `updateFrameApp` unless that
message resolved to a scroll action and nothing else. A cached focused-pane
measurement is valid only while the revision, the active page, the focused
pane and the terminal size it was stored under are all unchanged. The cache
holds one entry per framed-app runtime, is never process-global, and stores
only the numbers a scroll action reads.

This is the **mixed** option from #587, weighted heavily towards a revision:
one runtime-owned revision stands in for every input that has no owner, and
cheap value fields guard the inputs that do.

## Current Path

`scrollFocusedPane` in
`packages/bijou-tui/src/app-frame-actions-scroll.ts` does this for each
scroll action:

1. `page.layout(pageModel)` builds the layout tree.
2. `renderFrameNode(...)` resolves the whole tree. It paints every visible
   pane, so every visible pane's `render` runs once.
3. `paneNode.render(width, height)` runs the focused pane a second time.
4. `renderPaneSurfaceForMeasurement(...)` converts the output to a Surface.
5. `createFocusAreaStateForSurface(...)` reads only `surface.width` and
   `surface.height`, plus the pane rectangle and `overflowX`.

All of that work produces six numbers. The result of the action depends on
those numbers and on the prior scroll offset. The offset is already in
`model.scrollByPage` and must never be cached.

## Input Inventory

Each row is an input that can change the focused-pane rectangle or the
measured content extents, with the identity this contract assigns to it.

| Input | Where it is read | Identity |
| --- | --- | --- |
| Active page | `model.activePageId` | value field `pageId` |
| Focused pane | `model.focusedPaneByPage[pageId]` | value field `paneId` |
| Terminal size | `model.columns`, `model.rows` | value fields |
| Body insets | `options.bodyTopRows`, `options.bodyBottomRows` | fixed for the runtime; no key needed |
| Page model | `model.pageModels[pageId]` | frame input revision |
| Layout tree | `page.layout(pageModel)` | frame input revision (derived from page model) |
| Pane render behaviour | `paneNode.render` closure | frame input revision |
| Pane `overflowX` | layout node | frame input revision |
| Minimised panes | `model.minimizedByPage` | frame input revision |
| Dock state | `model.dockStateByPage` | frame input revision |
| Maximised pane | `model.maximizedPaneByPage` | frame input revision (see Consequences) |
| Shell theme and mode | `activeShellThemeId`, theme runtime | frame input revision |
| Page transition | `transitionProgress`, `activePageId` | frame input revision |
| Pulse-driven content | `PulseMsg` into page update | frame input revision |
| Scroll offset | `model.scrollByPage` | not a key; read fresh each action |

The scroll offset is not a key because no measured value depends on it:
`paneNode.render(width, height)` does not receive it, and the pane rectangle
does not depend on it. If a later change makes either one depend on scroll,
this contract must be reopened.

## Revision Rule

- The revision starts at `0` when the runtime is created.
- `updateFrameApp` increments it after handling any message, unless the
  message was handled only by `scrollFocusedPane`. That covers key, mouse,
  resize, pulse, page-scoped and frame-scoped messages, including theme,
  mode, visibility, dock, maximise, focus and page changes.
- A scroll action that returns without measuring (no focused pane, empty
  rectangle) still does not increment the revision.
- A new runtime, including a restored session, starts empty.
- Each `init()` on an existing framed app invalidates its prior measurement
  before creating fresh page models, even when page, pane and size are unchanged.

Between two scroll actions with no other message in between, nothing in the
model can have changed except scroll offsets. That is the key-repeat path, so
the cache hits exactly where it pays.

The rule relies on one stated contract: a page's `layout` and `render` are a
function of the page model and the frame model. A render that reads outside
state that changes without a message is already outside the framed-app
contract. Because every message increments the revision, such a render goes
stale for at most a run of consecutive scroll actions.

## Key and Entry

```ts
interface FocusedPaneMeasurementKey {
  readonly revision: number;
  readonly pageId: string;
  readonly paneId: string;
  readonly columns: number;
  readonly rows: number;
}

interface FocusedPaneMeasurement {
  readonly key: FocusedPaneMeasurementKey;
  readonly paneWidth: number;
  readonly paneHeight: number;
  readonly overflowX: OverflowX;
  readonly contentWidth: number;
  readonly contentHeight: number;
}
```

A lookup hits only if every key field is equal. The value fields `pageId`,
`paneId`, `columns` and `rows` are redundant with the revision on the real
message path. They stay because tests and hosts can supply a model directly,
and comparing them costs nothing.

## Scope, Lifetime and Memory Bound

- **Owner:** one framed-app runtime. The cache is created in the
  `createFramedApp` closure and passed to `scrollFocusedPane` as a
  dependency, in the same way as the theme and notification services.
- **Capacity:** one entry. A miss replaces it. Only the focused pane scrolls,
  so a larger cache would only hold entries that the next non-scroll message
  makes invalid.
- **Memory:** a fixed record of five numbers and two strings. No Surface,
  no `ViewOutput` and no layout tree is kept.
- **Module state:** `focusedPaneMeasureScratch` in
  `app-frame-actions-measure.ts` is process-global today. #589 moves it into
  the same runtime-owned object, so two runtimes in one process share no
  state.

## Alternatives Considered

### Per-input revisions

Give the page model, layout, visibility, dock, maximise state and theme their
own revision fields, bumped by each owner. This was rejected. The page model
and pane `render` closures belong to application code, so Bijou cannot bump
them without changing the public `FramePage` API, which #587 puts out of
scope. A single missed bump admits stale geometry, which is the risk #485 was
opened to prevent.

### Deterministic digests

Hash the page model, the layout tree and the rendered output on each action.
This was rejected. Render closures cannot be hashed, so the digest must cover
the render output. Rendering to get a digest is the work the cache exists to
skip. Hashing an arbitrary page model costs time in proportion to its size
and fails on functions, cycles and class instances.

### Identity of the immutable frame model

Store the model object that the last scroll returned, and hit only when the
next scroll receives that same object. This is nearly sound and costs
nothing, but it depends on object identity. A page update that mutates its
model in place and returns it would keep the identity and serve stale
extents. #587 rules out invalidation based on mutable object identity, and
the explicit revision covers the same cases without this hole.

### Route, pane and terminal size only

The key proposed in PR #484. It is unsound because it ignores every inventory input other
than the active page, the focused pane and the terminal size.

## Consequences

- The key-repeat path skips `page.layout`, `renderFrameNode` and both pane
  renders. Each scroll after the first in a run is constant-time.
- The first scroll after any other message costs the same as today.
- Animated pages that receive pulse messages during a key repeat will miss
  most of the time. That is correct, because their content may be changing.
- **Maximised panes:** the current scroll path resolves the split layout and
  ignores `maximizedPaneByPage`, while the view (`app-frame-view-body.ts`)
  paints a maximised pane at the full body size. Scroll limits for a
  maximised pane can therefore differ from what is painted. The cache
  neither fixes nor worsens this. It needs its own follow-up issue and must
  not be bundled into #589.
- The contract is internal and can be reversed: deleting the cache restores
  today's behaviour.

## Contract for #589 (Implementation)

- **New file** `packages/bijou-tui/src/app-frame-scroll-measure-cache.ts`:
  - `createFocusedPaneMeasureCache(): FocusedPaneMeasureCache`
  - `FocusedPaneMeasureCache` has `revision(): number`,
    `invalidate(): void` (increments the revision), `lookup(key)` returning
    `FocusedPaneMeasurement | undefined`, `store(measurement)`, and
    `scratch` (the measurement Surface that replaces the module-global
    scratch).
  - The module exports nothing to the public package index.
- **`app-frame-create.ts`:** create one cache per runtime and add it to the
  update dependencies.
- **`app-frame-app-update.ts`:** call `invalidate()` after every handled
  message unless the scroll path reported that it handled the message. Use an
  explicit return flag from the frame-action dispatch, not a mutable global.
- **`app-frame-actions-scroll.ts`:** build the key from the model and the
  revision. On a hit, call `createFocusAreaStateForSurface` with the cached
  extents (a `{ width, height }` view is enough). On a miss, run today's path
  and store the result.
- **`app-frame-actions-measure.ts`:** take the scratch Surface from the cache
  instead of module state.
- **Tests:** follow #589's test plan. Hold `pageId`, `paneId`, `columns` and
  `rows` fixed and change each inventory row through a real message: page
  message, theme change, mode change, minimise, dock, maximise, pulse, focus
  move and back, page switch and back. Each must cause a fresh render. Count
  calls with a pane `render` spy.

## Contract for #591 (Evidence)

- **Fixture:** a synthetic framed app with one page, two panes side by side,
  a focused pane of 10,000 lines by 200 columns, and a 120 by 40 terminal.
- **Probe:** send 1,000 `scroll-down` actions through `updateFrameApp`. Count
  calls to `page.layout`, the focused pane `render` and the other pane
  `render`. Report the median wall time per action as a secondary figure.
- **Revisions:** run the same probe on the parent of the #589 merge and on
  the #589 merge.
- **Accept (keep the cache):** with the cache, `page.layout` and the focused
  pane `render` each run exactly once for the 1,000 actions, and the other
  pane `render` runs at most once. Without the cache, the baseline shows
  about 1,000 layout calls and 2,000 focused renders. Median time per cached
  action is at least 10 times lower than the baseline.
- **Second probe:** interleave a pulse message after every scroll. The cache
  must miss on every action, and call counts must match the baseline. This
  shows that invalidation still works under load.
- **Revisit:** if call counts do not fall as stated, or the time ratio is
  below 2 times, record that under Evidence and reopen the decision in #485.
- Record the command, the commit SHAs and the raw counts in #591.
