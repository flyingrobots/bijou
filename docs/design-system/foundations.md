# Foundations

This document defines the shared design language behind Bijou.

It is not an API document. It is the policy layer that should shape API design, examples, and component usage.

## 1. Color

### Purpose

Color in Bijou should communicate:

- status
- hierarchy
- separation
- focus
- interruption level

Color should not carry meaning alone. Every important state must still survive `noColor`, `pipe`, and `accessible` runs.

### Color roles

Bijou should treat tokens as belonging to a small set of roles:

- **foreground**
  - primary text, secondary text, subdued text
- **surface**
  - canvas, elevated region, overlay, inset region
- **status**
  - success, warning, error, info, neutral
- **accent**
  - active/focused selection, primary affordance
- **border/separator**
  - grouping and structural division

The exact API-level mapping from these roles to Bijou's shipped token families
is defined in [Theme Token Vocabulary](./theme-tokens.md).

### Color rules

- Use status color to explain state, not to decorate.
- Use accent color for focus and active affordances, not for arbitrary emphasis.
- Use background fills sparingly and deliberately. A background should indicate containment, elevation, or interruption.
- Avoid using more than one strong status tone in the same local region unless comparing states is the point.
- In `noColor`, every state must still read correctly from words, symbols, order, or borders.

### Terminal-specific guidance

- Strong color contrast is expensive in a dense terminal. Use saturated status tones for small focal areas, not for entire screens.
- Large filled regions should be reserved for overlays, selected/focused states, or major grouping moves.
- Bright foreground on dark background is the default mental model in many terminals, but docs should not assume dark mode semantics.

## 2. Spacing and rhythm

Carbon uses a 2x grid. Bijou needs a terminal-first equivalent.

### Bijou spacing model

- The atomic unit is **1 cell**.
- The default rhythm unit is **2 cells**.
- Dense internal padding can use 1-cell increments.
- Structural gaps between sections, panes, and overlay edges should prefer the 2-cell rhythm.

### Default guidance

- inline gap: `1`
- local group gap: `1` or `2`
- section gap: `2`
- pane or card padding: usually `1` vertically, `2` horizontally
- modal margin from viewport edge: minimum `1`, preferred `2`
- stacked transient gap: `1`

### Why this matters

Without a declared rhythm, terminal UIs become visually noisy very fast. Bijou should feel intentionally packed, not cramped.

## 3. Text hierarchy and emphasis

Terminal typography is mostly:

- placement
- spacing
- boldness
- token choice
- borders/dividers
- line length

not font families or font sizes.

### Hierarchy levels

- **page/shell title**
  - strongest label in the local frame
- **section title**
  - container or region label
- **body**
  - default content
- **supporting text**
  - help text, metadata, timestamps, hints

### Emphasis rules

- Prefer structure before decoration.
  - use spacing, grouping, and labeling first
- Bold should mark titles, active labels, or short key facts.
- Dim/subdued text should carry metadata, not primary instructions.
- Avoid combining too many modifiers at once.
  - bold + color + underline + inverse is usually design panic, not design clarity

### Content density

- Tight density is acceptable in terminals, but meaning must still scan.
- Long prose should wrap and breathe.
- Dense data views should prefer alignment and scanability over decorative framing.

## 4. Overflow

Bijou should default to **wrap for prose-like content** and **truncate or clip only where layout semantics demand it**.

### Default policy

- prose, supporting text, and descriptions: wrap
- labels inside constrained shell chrome: clip or truncate
- tabular cells: wrap when the row can grow, truncate when preserving scanability is more important
- activity streams and logs: do not silently destroy ordering to preserve prettiness

### Why

Truncation is often a hidden data-loss bug disguised as layout discipline.

### Required controls

Families that render text in constrained spaces should expose overflow choices where practical:

- `wrap`
- `truncate`
- `clip`

Not every component needs every mode, but the library should speak one consistent overflow language.

## 5. Motion

Motion should clarify:

- entry
- exit
- relationship between before and after
- focus shifts
- interruption level

Motion should not exist just because the runtime can animate.

### Motion rules

- Transient surfaces may animate in and out.
- Page or pane transitions should reinforce spatial or logical movement.
- Fast repetitive interactions should avoid theatrical motion.
- Any animation must have a deterministic non-animated truth underneath it.

### Practical policy

- notifications: short edge-based slide or fade motion
- shell/page transitions: modest, directional, and optional
- loading states: subtle looping motion
- structural resize: prefer stable layout over decorative flourish

## 6. Elevation and interruption

Terminals do not have shadows in the usual sense. Elevation must be conveyed through:

- border treatment
- fill treatment
- separation from background
- reserved space
- z-order and animation

### Interruption ladder

From least interruptive to most interruptive:

1. inline help or note
2. badge or subtle status
3. alert
4. toast / notification
5. drawer
6. modal

This ladder should show up consistently in docs and examples.

## 7. Focus and active state

Bijou is keyboard-first.

The user should always be able to tell:

- what is focused
- what is active
- what is selected
- what is merely present

### Focus cues

Use some combination of:

- accent color
- border or gutter treatment
- active label treatment
- position within a structured list

### Rules

- Do not rely on color alone for focus.
- Focus cues should be local and unmistakable.
- Shell-level focus and component-level focus should not compete visually at the same strength.

## 8. Input modality policy

### Keyboard first

Bijou should assume keyboard interaction is the baseline.

Every important interactive flow should work without a mouse.

### Mouse as enhancement

Mouse input is valuable, but it should be:

- additive
- discoverable
- consistent
- never the only path

### Pointer policy

- Click should usually mirror an existing keyboard action.
- Hover-only meaning should be minimal.
- Drag should be reserved for clearly spatial interactions, such as split dividers.
- Overlays should consume mouse events before background content.

## 9. Package ownership

### Core `@flyingrobots/bijou`

Use core for semantics that survive graceful degradation:

- status and structural components
- forms and prompts
- prose and log output
- data views that still make sense as text

### `@flyingrobots/bijou-tui`

Use TUI for:

- shells
- overlays
- scrolling
- focus-heavy inspection
- animation
- notification systems
- pointer-heavy or lifecycle-heavy behavior

## 10. What this means for future library work

New component work should start by answering:

1. Which pattern is this serving?
2. Is it semantic, interaction-layer, or render-path variation?
3. Does it belong in core or TUI?
4. What is the default overflow behavior?
5. How does it lower through non-interactive modes?
6. What is the Carbon-style "when to use / when not to use" story?
