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
- prefer `semantic.accent` for local active/focused affordances inside a
  component
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
- focused pane gutters owned by reusable shell frames
- scrollbars and tracks
- section headers
- logos or branded shell marks
- table headers when they are part of reusable framework chrome
- empty tracks and similar UI scaffolding

Built-in keys:

- `cursor`
- `focusGutter`
- `scrollThumb`
- `scrollTrack`
- `sectionHeader`
- `logo`
- `tableHeader`
- `trackEmpty`

House rules:

- reserve `ui.*` for framework/runtime chrome, not business-domain statuses
- prefer a dedicated `ui` token when the same affordance recurs across shells
- use `ui.focusGutter` for focused shell pane gutters; use
  `semantic.accent` for local active emphasis inside a component
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

## Per-Token Library Reference

Every token below is a role, not a paint name. The examples are intentionally
strict so components remain readable when a theme changes.

### Semantic Tokens

| Token | Use when | Do not use when |
| --- | --- | --- |
| `semantic.primary` | Main readable text, selected document body text, and deliberate foreground emphasis. | The text is supporting metadata, a status label, or decorative brand copy. |
| `semantic.muted` | Secondary copy, timestamps, helper copy, inactive labels, and low-emphasis hints that must still be readable. | The content is disabled, destructive, or critical to the task. |
| `semantic.accent` | Local emphasis inside a component, selected inline text, command affordances, and non-status callouts. | The meaning is focus owned by the shell, a process status, or a brand logo. |
| `semantic.success` | Human-readable success copy, positive validation messages, and resolved inline facts. | The UI is only drawing a status dot, badge, or border. Use `status.success` or `border.success`. |
| `semantic.error` | Error copy, destructive inline warning text, and validation failure prose. | The role is merely an error-colored frame or status chip. |
| `semantic.warning` | Cautionary copy where a user may need to slow down before acting. | Ordinary emphasis, progress, or decorative warm color. |
| `semantic.info` | Informational copy, neutral notices, and non-blocking explanatory text. | Active selection, focus, or branded chrome. |

### Surface Tokens

| Token | Use when | Do not use when |
| --- | --- | --- |
| `surface.primary` | The default document, editor, or main content background. | Sidebars, modal interruption, disabled wells, or one-off accent fills. |
| `surface.secondary` | Navigation rails, sidebars, metadata panes, and secondary work regions. | Main reading surfaces or raised controls that need elevation. |
| `surface.elevated` | Cards, popovers, field groups, panels, and bounded objects that sit above the base surface. | Full-screen content regions or modal scrims. |
| `surface.overlay` | Modal dialogs, drawers, command palettes, and interruption surfaces. | Decorative tinting, status meaning, or ordinary sidebars. |
| `surface.muted` | Disabled regions, inset wells, skeleton tracks, and deliberately de-emphasized containers. | Muted foreground text. Use `semantic.muted`. |

### Border Tokens

| Token | Use when | Do not use when |
| --- | --- | --- |
| `border.primary` | Strong structural grouping, active panel outlines, and primary separators. | Local text emphasis or generic accent foreground. |
| `border.secondary` | Secondary grouping, alternate section outlines, and non-primary divider emphasis. | Warning, error, or selected state. |
| `border.success` | A boundary itself communicates a successful state. | A success badge or success prose would be clearer. |
| `border.warning` | A boundary itself communicates caution or review-needed state. | Decorative warm framing or hover/focus styling. |
| `border.error` | A boundary itself communicates invalid, destructive, or failed state. | Non-error emphasis or ordinary grouping. |
| `border.muted` | Default boxes, separators, table rules, and low-emphasis structure. | Disabled text or muted copy. |

### UI Tokens

| Token | Use when | Do not use when |
| --- | --- | --- |
| `ui.cursor` | Runtime cursor, selected shell row chrome, and reusable selection affordances. | Business-domain active state or selected text inside one component. |
| `ui.focusGutter` | Focus indicators owned by the app frame, pane gutter, or reusable shell. | Inline focus styling inside a component. |
| `ui.scrollThumb` | Scrollbar thumbs and viewport-position indicators. | General progress bars or sliders. |
| `ui.scrollTrack` | Scrollbar tracks and scroll wells. | Disabled containers or progress-empty tracks. |
| `ui.sectionHeader` | Reusable shell headers, section rails, and framework-level headings. | Document body headings with product semantics. |
| `ui.logo` | Product mark, brand lockup, title-screen brand treatment, or recurring shell identity mark. | Generic accent text or status emphasis. |
| `ui.tableHeader` | Reusable table header chrome that is part of the framework. | Arbitrary table cell foreground or selected row styling. |
| `ui.trackEmpty` | Empty progress tracks, meters, and fixed scaffold tracks. | Scroll tracks, disabled fills, or muted text. |

### Status Tokens

| Token | Use when | Do not use when |
| --- | --- | --- |
| `status.success` | A badge, chip, timeline item, or indicator says the object succeeded. | Success prose or border-only success. |
| `status.error` | A badge, chip, timeline item, or indicator says the object failed or is invalid. | Error prose or destructive button text. |
| `status.warning` | A badge, chip, timeline item, or indicator says caution or review is required. | Warm decorative emphasis. |
| `status.info` | A badge, chip, timeline item, or indicator says informational or neutral status. | General informational prose. |
| `status.pending` | A state indicator says queued, waiting, loading, or not yet resolved. | Disabled content or muted metadata. |
| `status.active` | A state indicator says running, live, current, or in progress. | Keyboard focus, selected row, or cursor chrome. |
| `status.muted` | A state indicator says archived, inactive, skipped, or intentionally quiet. | Ordinary secondary copy. |

### Gradient Tokens

| Token | Use when | Do not use when |
| --- | --- | --- |
| `gradient.brand` | A rare brand treatment, title art, or identity moment benefits from multi-stop color. | The user must infer meaning from it. |
| `gradient.progress` | A meter, progress fill, or continuous range benefits from directional color. | Static decoration, status badges, or body text. |

## Default Dark/Light UX Audit

The legacy `CYAN_MAGENTA` preset is useful as a vivid terminal-native default,
but it is not ideal as the model for dense product surfaces. It uses saturated
terminal colors for many unrelated jobs: cyan appears as info, active state,
cursor, scrollbar, logo, and primary border; magenta appears as accent,
secondary border, and focus gutter. That makes the app energetic, but it also
makes many regions compete at the same visual priority.

DogFood should use a calmer shell posture:

- neutral surfaces carry most of the screen
- one accent family carries local emphasis and shell selection
- status colors remain distinct from focus and brand
- muted text remains contrast-safe instead of merely dim
- dark and light themes both satisfy readable foreground/background pairs

The current DogFood dark shell uses dark neutral surfaces, readable cool/warm
accents, and separate success/warning/error/info colors. The current DogFood
light shell uses light neutral surfaces with darker semantic colors instead of
pastel foregrounds. Both modes target at least 4.5:1 contrast for surface text
and common semantic foregrounds on every shell surface.

Compared with large design systems, Bijou is intentionally compact today. The
runtime vocabulary has about thirty direct color-bearing slots plus two
gradient roles. Material-style systems expose more paired foreground/background
roles. Carbon and Atlassian-style systems go further with text hierarchy,
interaction states, icon roles, and component-specific aliases. Bijou should
grow only when a missing role causes repeated ambiguity in real components.

## Safe-Pair Contrast Contract

Theme contrast is declared through safe pairs rather than buried inside one-off
test loops. A safe pair names a foreground token path and a background token
path that a theme promises will remain readable.

Safe-pair background paths may target token background slots:

```text
semantic.primary on surface.primary.bg
semantic.muted on surface.secondary.bg
status.active on surface.overlay.bg
ui.cursor on surface.elevated.bg
```

Use the `defineThemeSafePairs()` builder when a first-party app or component
needs a reusable contrast matrix:

```ts
const pairs = defineThemeSafePairs()
  .readable('semantic.primary', 'surface.primary.bg')
  .status('status.error', 'surface.overlay.bg')
  .chrome('ui.cursor', 'surface.secondary.bg')
  .build();
```

Then pass those pairs to `doctorTheme()`:

```ts
const report = doctorTheme(theme, { contrastPairs: pairs });
```

Safe-pair kinds communicate intent:

- `readable`: ordinary text or component foregrounds that must stay legible
- `status`: process, health, timeline, or object-state colors
- `chrome`: shell/runtime affordances such as cursor and selection chrome

Do not use safe pairs as a way to bless every possible token combination.
Declare pairs only when a component or product surface expects that
combination to work.

## Theme Debugger Direction

The next inspectability step should be a Theme Inspector drawer.

Recommended UX:

- `F10` opens a shell drawer from any app frame that opts in.
- The drawer shows token swatches grouped by `semantic`, `surface`, `border`,
  `ui`, `status`, and `gradient`.
- Each swatch renders the token name and uses the token value as the swatch
  fill or foreground, depending on token family.
- The drawer can toggle dark and light modes without permanently changing the
  app until the user applies the selection.
- Each swatch displays contrast facts for its documented safe pair when one is
  known.
- Future renderer provenance can let an inspected cell report whether it came
  from a token, a raw color, or a lowered/no-color fallback.

The first implementation should inspect theme tokens only. Element-level token
overlays should wait until renderer provenance is available, because guessing
token ownership from final RGB values would be misleading.

## First-Party Defaults

When first-party components need a default token and do not have stronger
domain-specific semantics, prefer these defaults:

- default supporting text: `semantic.muted`
- explicit primary emphasis: `semantic.primary`
- local active or focused affordance inside a component: `semantic.accent`
- default structural border: `border.muted`
- default contained-region fill: `surface.elevated`
- default secondary-pane fill: `surface.secondary`
- default overlay fill: `surface.overlay`
- default disabled or inset fill: `surface.muted`
- reusable shell cursor or selected-shell chrome: `ui.cursor`
- reusable focused shell gutter chrome: `ui.focusGutter`
- reusable scrollbar chrome: `ui.scrollThumb` and `ui.scrollTrack`
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
- shell cursor, focused gutters, scrollbars, and track fills should use
  `ui.*`, not business statuses
- overlays and drawers should communicate interruption primarily through
  `surface.overlay`, not by tinting everything as a warning
