# Theme Token Vocabulary

This document locks down the canonical token vocabulary for Bijou.

The `Theme` type in
[`packages/bijou/src/core/theme/tokens.ts`](../../packages/bijou/src/core/theme/tokens.ts)
is the API truth. This page is the doctrine truth: it defines what each token
family is for, what first-party components should prefer, and what counts as
misuse.

## Why this exists

Bijou already ships a typed token model:

- `semantic`
- `surface`
- `border`
- `ui`
- `status`
- `gradient`

What was missing was the rulebook. Without one, component authors end up
choosing tokens by "what looks right in this preset" instead of by semantic
job, and the design system drifts into an untyped color bucket.

## Core rule

Choose tokens by meaning, not by color.

If a component needs a green foreground because it means "success", use a
success token. Do not reach for whichever family currently contains a green
hex value in the active preset.

## Canonical families

### `semantic`

Use `semantic` for general foreground meaning and emphasis inside a component.

This is the default family for:

- primary text emphasis
- supporting or muted text
- active or focused emphasis inside a component
- generic semantic cues that are not domain statuses

Built-in keys:

- `primary`
- `muted`
- `accent`
- `success`
- `error`
- `warning`
- `info`

House rules:

- prefer `semantic.primary` for deliberate foreground emphasis
- prefer `semantic.muted` for metadata, hints, and supporting text
- prefer `semantic.accent` for local active/focused affordances
- do not use `semantic.*` as a generic background-fill family

### `surface`

Use `surface` for containment, fill, elevation, and interruption level.

This is the default family for:

- panel and card backgrounds
- sidebars and secondary rails
- elevated regions
- overlays, drawers, and modal fills
- muted or disabled regions

Built-in keys:

- `primary`
- `secondary`
- `elevated`
- `overlay`
- `muted`

House rules:

- treat `surface.primary` as the default content-region fill
- treat `surface.secondary` as the secondary-pane or sidebar fill
- treat `surface.elevated` as the default fill for bounded contained objects
- treat `surface.overlay` as the interruption or overlay fill
- treat `surface.muted` as the disabled, inset, or de-emphasized fill
- do not use surface choice to smuggle status meaning

### `border`

Use `border` for structure, grouping, and boundary emphasis.

This is the default family for:

- box outlines
- separators that need tokenized color
- severity-bearing frames when the frame itself carries meaning

Built-in keys:

- `primary`
- `secondary`
- `success`
- `warning`
- `error`
- `muted`

House rules:

- prefer `border.muted` for ordinary structure
- use `border.primary` or `border.secondary` for stronger non-status grouping
- use status-colored borders only when the border itself is part of the state
- do not use warning/error borders as decoration

### `ui`

Use `ui` for runtime chrome and reusable system affordances that do not belong
to domain data.

This is the default family for:

- cursor or selection chrome owned by the shell/runtime
- scrollbars and tracks
- section headers
- logos or branded shell marks
- table headers when they are part of reusable framework chrome
- empty tracks and similar UI scaffolding

Built-in keys:

- `cursor`
- `scrollThumb`
- `scrollTrack`
- `sectionHeader`
- `logo`
- `tableHeader`
- `trackEmpty`

House rules:

- reserve `ui.*` for framework/runtime chrome, not business-domain statuses
- prefer a dedicated `ui` token when the same affordance recurs across shells
- do not use `ui.*` as a back door for arbitrary one-off component colors

### `status`

Use `status` for explicit state labels and indicators attached to an object,
process, or record.

This is the default family for:

- badges
- timeline states
- health/readiness indicators
- process states such as pending or active

Built-in keys:

- `success`
- `error`
- `warning`
- `info`
- `pending`
- `active`
- `muted`

House rules:

- use `status.*` when the UI is naming or signaling a real status
- prefer `status.pending` and `status.active` over reusing accent/focus tokens
- do not use `status.*` for focus, hover, or generic "selected" styling

### `gradient`

Use `gradient` for rare multi-stop emphasis that is intentionally decorative or
specialized.

Built-in keys:

- `brand`
- `progress`

House rules:

- gradients are optional emphasis, not required meaning
- never make critical status, navigation, or instructions depend on a gradient
- prefer `gradient.progress` only when the component is actually showing a
  progress fill or similar continuous range
- keep logos and brand treatments rare

## First-Party Defaults

When first-party components need a default token and do not have stronger
domain-specific semantics, prefer these defaults:

- default supporting text: `semantic.muted`
- explicit primary emphasis: `semantic.primary`
- local active or focused affordance: `semantic.accent`
- default structural border: `border.muted`
- default contained-region fill: `surface.elevated`
- default secondary-pane fill: `surface.secondary`
- default overlay fill: `surface.overlay`
- default disabled or inset fill: `surface.muted`
- reusable shell cursor or selected-shell chrome: `ui.cursor`
- table header chrome: `ui.tableHeader`
- progress empty track: `ui.trackEmpty`

These defaults are conventions, not excuses to skip judgment. If a component
has a stronger semantic job, use the family that matches the job.

## First-Party Prohibitions

First-party components should follow these rules:

- do not read raw token paths from `ctx.theme.theme.*` when an accessor exists
- do not invent new first-party token families ad hoc
- do not use `status.*` when the real meaning is focus or selection
- do not use `surface.*` as a generic foreground-emphasis bucket
- do not use gradients as a substitute for semantic color
- do not rely on color alone; meaning must survive `noColor`, `pipe`, and
  `accessible`

If the current token families are not expressive enough, change the theme
contract and docs in the same slice instead of sneaking around the vocabulary.

## Extension Rules

Third-party and app-level code may extend:

- `status`
- `ui`
- `gradient`

That is already part of the generic `Theme<S, U, G>` contract.

Rules for extension:

- extend when the new key represents a stable semantic role, not one
  component's temporary styling whim
- keep first-party components on the built-in shared vocabulary unless the
  contract is intentionally widened
- prefer wrapping a component with explicit token options over hard-coding raw
  token-path lookups
- when theme changes must invalidate cached component work, prefer the public
  `observeTheme(ctx, handler)` seam over direct `tokenGraph.on(...)`

## Access Pattern

Component code should prefer the accessor layer:

- `ctx.semantic(...)`
- `ctx.surface(...)`
- `ctx.border(...)`
- `ctx.status(...)`
- `ctx.ui(...)`
- `ctx.gradient(...)`

That keeps component code coupled to the public vocabulary instead of the raw
object shape or token-graph internals.

## Relationship To Foundations

The design-system foundations describe the high-level visual roles:

- foreground
- surface
- status
- accent
- border or separator

This page maps those roles onto the shipped API vocabulary:

- foreground -> `semantic`
- accent -> `semantic.accent`
- surface -> `surface`
- border or separator -> `border`
- reusable framework chrome -> `ui`
- explicit named state -> `status`
- rare multi-stop emphasis -> `gradient`

## Examples

Examples of the intended split:

- `alert()` should use `semantic(variant)` plus a matching border, not a
  gradient
- `badge()` should use `status.*` when it is carrying a real status
- `kbd()` should use muted structure tokens, not a status token
- `tableSurface()` should use `ui.tableHeader` for reusable header chrome
- shell cursor, scrollbars, and track fills should use `ui.*`, not business
  statuses
- overlays and drawers should communicate interruption primarily through
  `surface.overlay`, not by tinting everything as a warning
