# Bijou Design System

Bijou now has enough surface area that "here are the exports" is no longer a good documentation strategy.

This section defines the design language behind the library:

- the foundations that shape the UI
- the interaction and layout patterns that recur across apps
- the component families and their intended jobs
- the policy for visualizing data instead of guessing ad hoc each time

This is deliberately closer to Carbon than to an API reference.

## What this section is for

Use these docs when you need to answer:

- What problem does this component family solve?
- Which variation should I use?
- When should I choose one component over another?
- When should I avoid this component entirely?
- Does this belong in core `@flyingrobots/bijou` or in `@flyingrobots/bijou-tui`?
- How should this degrade across interactive, static, pipe, and accessible runs?
- What is the terminal-first equivalent of a desktop/web design-system pattern?

## Read in this order

1. [Foundations](./foundations.md)
2. [Patterns](./patterns.md)
3. [Blocks](./blocks.md)
4. [Pointer and Mouse Policy](./pointer.md)
5. [Component Families](./component-families.md)
6. [Data Visualization Policy](./data-visualization.md)

For the raw inventory and taxonomy work behind these docs, see [../archive/component-system-audit.md](../archive/component-system-audit.md).

## Core system ideas

### Bijou is not just a component library

Bijou is made of four layers:

1. **Foundations**
   - color, spacing rhythm, text hierarchy, overflow, motion, focus, interruption
2. **Patterns**
   - status, selection, browsing, overlays, forms, shell composition
3. **Component families**
   - specific primitives that implement those patterns
4. **Blocks**
   - reusable product-level assemblies such as app frames, settings flows, and guided workflows

Components and blocks should be downstream of the first two layers. If the design language is weak, the component catalog and block library both become noisy no matter how many exports exist.

### Core versus TUI ownership

- `@flyingrobots/bijou` owns semantics that survive degradation.
- `@flyingrobots/bijou-tui` owns focus, motion, overlays, shell behavior, scrolling, history, and other lifecycle-heavy interactions.

That means:

- `alert()` belongs in core.
- `toast()` belongs in TUI.
- notifications belong in TUI because they are a system, not just a rendering.

### Variations are not all equal

Bijou uses three kinds of variation:

- **semantic variants**
  - for example status tone or severity
- **interaction-layer variants**
  - for example `accordion()` versus `interactiveAccordion()`
- **render-path variants**
  - for example `box()` versus `boxSurface()`

Only the first kind is a "visual variant" in the usual design-system sense. The other two exist because Bijou has to survive different interaction and rendering layers.

### Graceful lowering is a first-class design constraint

Every family should answer:

- What does this look like in a rich interactive terminal?
- What remains true in static CI output?
- What remains true in pipe mode?
- What becomes simpler in accessible mode?

If a component cannot answer that question, it probably belongs in `@flyingrobots/bijou-tui`, not in core.

## Carbon-style documentation standard

Every mature component-family page in Bijou should include:

- What it is
- Variations
- When to use
- When not to use
- Content guidance
- Interaction ownership
- Graceful lowering path
- Related families
- Closest Carbon analogue

The component-family guide now meets this structural baseline and its structure is checked by a repo preflight script. That preflight is intentionally structural: it verifies required family sections and graceful-lowering mode coverage inside the family guide. Semantic accuracy, package/example doc drift, and touched-component doc completeness are still review responsibilities, not something the current script can prove automatically.

## Component-change gate

From the v4 pure-surface cleanup onward, any component-family change should be evaluated against the docs in the same slice.

For every component or component family touched, verify:

- documentation exists
- documented variants are current
- `When to use` guidance is present and still accurate
- `When not to use` guidance is present and still accurate
- core-versus-TUI ownership is explicit
- graceful lowering is documented across `rich`, `static`, `pipe`, and `accessible` when applicable
- related families are listed

The CI preflight enforces the structural minimum for the family guide. If any of the broader checks below are missing or materially wrong, the docs are still incomplete and that gap should be fixed in the same slice or explicitly logged as backlog debt before the work is considered done.

## Current gaps this section is meant to close

Bijou is already strong on breadth and runtime architecture. The weaker parts are:

- explicit usage guidance
- family-level documentation
- documentation completeness against the standard defined above
- pattern-level decision support
- data-visualization doctrine
- mouse and multi-input policy

These docs exist to correct that.
