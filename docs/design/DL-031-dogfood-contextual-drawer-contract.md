---
title: DL-031 DOGFOOD Contextual Drawer Contract
lane: cool-ideas
priority: medium
github_issue: 623
status: accepted
keywords:
  - dogfood
  - drawer
  - focus
  - frame-layers
  - help-projection
  - v9.0.0
---

# DOGFOOD Contextual Drawer Contract

## Linked Work

- Decision task: [#623](https://github.com/flyingrobots/bijou/issues/623)
- Container: [#455](https://github.com/flyingrobots/bijou/issues/455)
  (mockups, jedit evidence and triage history)
- Dependents: [#627](https://github.com/flyingrobots/bijou/issues/627) drawer
  state, [#628](https://github.com/flyingrobots/bijou/issues/628) footer and help
  projection, [#630](https://github.com/flyingrobots/bijou/issues/630) pane
  migration, [#631](https://github.com/flyingrobots/bijou/issues/631) focus rail
- Sibling, not blocked by this record:
  [#624](https://github.com/flyingrobots/bijou/issues/624) inline variant and
  profile; [#633](https://github.com/flyingrobots/bijou/issues/633) lowering of
  variant and proof facts

## Decision Summary

DOGFOOD adopts **drawer-led context** (Alternative 2 in #455). Side context that
today lives in the wide-only `story-variants` and `guide-meta` panes moves into
one docs-shell **contextual drawer**: a page-owned Surface that the user opens on
demand, that takes focus while open, and that becomes the source of footer hints
and `?` help while it has focus.

The contextual drawer is a **layout participant, not an Overlay**. It takes a
track in the workspace grid and the content pane reflows beside it. It never
enters `collectFrameOverlays(...)`. This matters because
`renderFrameApp(...)` in `packages/bijou-tui/src/app-frame-app-view.ts`
composites with `{ dim: overlays.length > 0 }`: any Overlay dims the whole
frame. A contextual drawer exists so that the reader can look at the context and
the content together. Dimming the content would defeat that.

Required facts never live only in the drawer. The active variant, the active
profile and the variant count stay inline in the main reading path (#624). The
drawer adds depth: the full variant list, descriptions and guide metadata.
Closing it removes no required fact.

## Contract

### What the drawer holds

- Exactly one contextual drawer per docs page at a time. Its content is a
  discriminated union keyed by the page:
  - Components page: `story-variants` content (variant list, active-variant
    Inspector panel, profile selector).
  - Guide pages: `guide-meta` content (guide metadata, posture, provenance).
  - Future: release proof details, through the same union. A new content kind
    is an additive union member, not a new drawer.
- The drawer renders through the Inspector panels family (`inspector()`): one
  obvious current selection, then compact supporting sections. It does not get
  its own nested navigation model beyond list selection.
- The drawer does not hold shell controls (settings, theme, notifications).
  Those stay frame layers. The Theme Inspector drawer in
  `examples/docs/app-theme-inspector-render.ts` stays a root Overlay because it
  inspects the shell itself; it is out of scope and is not migrated.

### State shape

Page model state, owned by the docs shell (not by `bijou-tui`):

```ts
type ContextDrawerKind = 'story-variants' | 'guide-meta';

interface ContextDrawerState {
  readonly open: boolean;
  readonly kind: ContextDrawerKind;   // derived from the active page on open
  readonly restorePaneId: string;     // pane that had focus when it opened
}
```

- `open: false` is the default on every page, in every layout variant,
  including `wide`. The wide layout stops showing a permanent right column.
- `kind` is set on open from the active page. Changing page closes the drawer.
- `restorePaneId` is captured on open. It is never a drawer pane id.

### When it opens

- Explicit user action only: a page key (`i`, "inspect") toggles it, and a
  command palette entry opens it. Selecting a story or a guide does not open it.
- `Enter` on a variant chip in the inline reading path (#624) opens the drawer
  with that variant selected.
- No automatic open on resize, on page entry or on first run.

### Frame-layer placement

- The drawer contributes one layer descriptor, kind `context-drawer`, placed
  directly above `workspace` and below every other frame layer (`page-modal`,
  `help`, `settings`, `notification-center`, `search`, `command-palette`,
  `quit-confirm`).
- Descriptor fields: `owner: 'page'`, `dismissible: true`,
  `blocksUnderlyingInput: false`, its own `inputMapId`, `hintSource` and
  `helpSource`.
- It is in the layer stack only while the drawer is open **and** focused. If
  the user moves focus back to a content pane with the drawer still open, the
  descriptor drops out of the stack and the workspace hints apply again.
- Frame layers above it (help, settings, palette, quit confirm) keep their
  existing Overlay behaviour, including dimming. Those layers then dim the
  drawer with the rest of the frame, which is correct: they take the task.

### Key routing

In order: quit and hard globals; frame Overlay layers; the `context-drawer`
layer when focused; frame globals; the focused pane. This mirrors the jedit
routing recorded in #455.

### Focus and restore

- Open: focus moves into the drawer pane in the same update.
- `Esc` with the drawer focused closes it. `Esc` is consumed; it does not also
  reach the frame.
- The toggle key with the drawer focused closes it.
- Pane switch (`Tab`/`Shift+Tab`) with the drawer open cycles through the
  visible panes including the drawer. It does not close it.
- Close: focus returns to `restorePaneId` if that pane is visible in the
  current layout variant; otherwise to the page's primary content pane
  (`story-content` or the guide reader pane). Focus never lands on a hidden
  pane.
- Resize while open: the drawer stays open and focused. If the new layout
  variant can no longer show `restorePaneId`, the restore target is recomputed
  at close time by the rule above, not at resize time.

### Layout and dimming

- `wide`: the drawer takes the right track (`DOCS_SIDEBAR_WIDTH`) that
  `story-variants` uses today. The content pane narrows. No dimming.
- `standard` and `narrow`: the drawer replaces the family navigation track
  while open, so the content pane stays readable. No dimming.
- `tiny`: the drawer takes the whole body. There is nothing behind it to dim.
  `Esc` returns to the content pane.
- Never pass `dim: true` for the drawer. If a later frame API adds selective
  dimming, the drawer still does not dim content.

### Footer hints and help

- While the drawer is focused, `projectFrameControls(...)` returns the drawer
  layer's `hintSource` as `footerHintSource` and its `helpSource` as
  `helpSource`. Opening help from the drawer shows drawer help, because the
  existing `help` rule uses the underlying layer.
- The drawer hint text replaces the current `story-variants` case in
  `examples/docs/app-components-footer-hint.ts` and adds the close
  control, for example `Esc close • ↑/↓ variant • ,/. cycle • 1-4 profiles`.
- While a content pane is focused, its hint includes the open control (`i
  inspect`) so the drawer is discoverable without reading help.
- All hint and help copy goes through `dogfoodText(...)` localization keys.

### Graceful lowering

- `interactive`: as above.
- `static`: no drawer. The content that the drawer would hold renders as a
  titled section after the main content, in the same order.
- `pipe`: explicit field labels for the same facts, after the main content.
- `accessible`: the same facts linearized in plain language, without borders
  or colour, with the active variant named first.
- Lowered output never depends on drawer state. The same story produces the
  same lowered facts whether the drawer was open or closed. #633 owns the
  proof.

## Alternatives Considered

| Alternative | What it is | Why it lost |
| --- | --- | --- |
| **Drawer as frame Overlay** | Render the drawer through `overlayFactory` like the Theme Inspector drawer. | Every Overlay dims the frame in `renderFrameApp`, so the reader cannot read the content beside the context. It also hides the content under the drawer rather than reflowing it. Fixing that means a selective-dim API in `bijou-tui`, which is a bigger change than this outcome needs. |
| **Strong rail + inline variants only** (Alt 1) | Keep the wide right column; strengthen the focus rail; show variant state inline. | Leaves `story-variants` and `guide-meta` as permanent, wide-only competing columns, which is the problem #455 records. Its useful parts survive here: inline facts are #624 and the rail is #631. |
| **Persistent context rail** (Alt 3) | A rail of tabs (Variants, Props, Source, Tests, Proof) that opens drawers. | Needs an inspection vocabulary that the Blocks and IR work has not defined yet. Deferred, not rejected: the `ContextDrawerKind` union is the seam a rail would later select from. |

## Consequences

- The wide layout gets one fewer permanent column. Readers who used the right
  column now press `i`. The content-pane hint and the inline variant chips make
  that discoverable.
- `bijou-tui` gains one layer kind (`context-drawer`) in the frame-layer
  descriptors and in `projectFrameControls(...)`. Rendering stays in the page
  layout, so `app-frame-app-view.ts` and its dim rule do not change.
- Focus restore becomes testable as a pure function of
  `(restorePaneId, visible pane ids, page)`.
- The decision is reversible by a later DL record. Alternative 3 can build on
  this state without a migration.

## Contracts for Dependent Tasks

### #627 Drawer state and focus restore

- Implement `ContextDrawerState` in the docs page model with `open: false`
  default and `restorePaneId` capture on open.
- Render the drawer as a layout pane in all four layout variants, per the
  Layout section. Do not use `overlayFactory`.
- Add the `context-drawer` layer descriptor and the key-routing order.
- `Esc` and the toggle key close; restore follows the visible-pane rule.
- Tests: open/close golden sequence; close after resize where the restore pane
  is hidden; property test that random open/close/resize/pane-switch sequences
  always leave focus on a visible pane; a check that the frame does not dim when
  only the drawer is open.

### #628 Footer hints and help projection

- Drawer-focused: footer and `?` help come from the drawer layer. Content
  focused: content hints plus the open control.
- Help opened from the drawer shows drawer help.
- Localize all copy through `dogfoodText(...)`.
- Tests: footer text and help source for drawer focused, drawer open but
  unfocused, and drawer closed.

### #630 Move story variants and guide metadata

- Remove `story-variants` and `guide-meta` as permanent panes from
  `app-components-layout.ts` and `app-guide-layout.ts`; render their content as
  `ContextDrawerKind` members through `inspector()`.
- Do not move the Theme Inspector drawer.
- Requires #624 merged first, so required facts are inline before the column
  goes away.
- Tests: every fact the old panes showed is present in the drawer; the wide
  layout no longer has a right column with the drawer closed.

### #631 Focus rail

- The focused drawer uses the existing focus-area gutter seam with the strong
  rail; unfocused panes and an unfocused open drawer keep the quiet
  `docsThemeUnfocusedGutterToken(...)`.
- Exactly one strong rail is visible at a time.
- No new layout; no dimming used as a focus signal.
- Tests: rail token per pane for drawer focused and content focused.
