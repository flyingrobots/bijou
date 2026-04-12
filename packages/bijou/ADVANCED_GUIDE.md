# Advanced Guide — @flyingrobots/bijou

Use [GUIDE.md](./GUIDE.md) for the common path.

Use this guide when you are working on core rendering doctrine, theme/token
machinery, custom components, advanced component-family selection, or test and
performance contracts that should stay in the pure core package.

## Core Doctrine

The core package is intentionally mixed-mode:

- strings remain first-class at explicit CLI boundaries
- `Surface` values are the structured path for runtime composition
- crossing between the two should be explicit, not accidental

Rule of thumb:

- if the endpoint is still a prompt-driven CLI or document render, string-first
  helpers like `box()` and `table()` are honest
- if the surrounding app is already rendering structured output, stay on the
  surface path with `boxSurface()`, `tableSurface()`, `alertSurface()`, and
  friends
- only lower a `Surface` back to text with
  `surfaceToString(surface, ctx.style)` when you are truly at a boundary

For the deeper rendering posture, also read:

- [Root Advanced Guide](../../ADVANCED_GUIDE.md)
- [Byte-Pipeline Recovery](../../docs/perf/RE-017-byte-pipeline.md)

## Terminal Text Sanitization Boundary

Raw terminal text should be sanitized when it crosses into the surface model,
not after it has already become cells.

Rule of thumb:

- use `stringToSurface()` for plain text boundaries
- use `parseAnsiToSurface()` only when you are intentionally accepting SGR or
  OSC 8 styling input
- use `sanitizeTerminalText()` first when untrusted or user-provided terminal
  text is being inspected outside those helpers
- do not let arbitrary cursor movement, clear-screen, bell, or other control
  sequences survive into a `Surface`

This keeps the string boundary explicit and prevents accidental terminal
injection when a surface later flows back out through `surfaceToString()` or
the runtime diff writer.

## Byte-Packed Surface Expectations

`Surface` is a byte-backed render structure, not a themed string blob.

That matters because:

- backgrounds and semantic color should survive composition honestly
- performance-sensitive code should resolve color to bytes once, not by
  reparsing strings in hot loops
- component authors should think in terms of cells, spans, and render modes,
  not just formatted text snippets

If you are touching the render bedrock, read:

- [README](./README.md)
- [surface primitives tests](./src/core/components/surface-primitives.test.ts)
- [Byte-Pipeline Recovery](../../docs/perf/RE-017-byte-pipeline.md)

## Theme Engine And Token Graph

The beginner guide covers presets and basic extension. The advanced lane is:

- semantic token accessors like `semantic()`, `surface()`, `border()`, `ui()`
- token graph references and transforms
- DTCG import/export
- custom theme extension without coupling app code to raw theme object shape

Read:

- [GUIDE theme section](./GUIDE.md#themes)
- [token graph spec](../../docs/specs/token-graph.spec.json)
- [theme graph implementation](./src/core/theme/graph.ts)
- [theme graph types](./src/core/theme/graph-types.ts)
- [DTCG tests](./src/core/theme/dtcg.test.ts)

## Custom Components And Mode-Aware Authoring

Use `renderByMode()` when you are building a component that must stay truthful
across:

- `interactive`
- `static`
- `pipe`
- `accessible`

That usually means:

- define the meaning first
- decide what honest lowering looks like in each mode
- keep styling lookups on the resolved context
- avoid leaking Node or TUI runtime concerns into the pure package

Good companion docs:

- [GUIDE custom components](./GUIDE.md#custom-components)
- [Design System Overview](../../docs/design-system/README.md)
- [Content Guide](../../docs/strategy/content-guide.md)
- [Accessibility and Assistive Modes](../../docs/strategy/accessibility-and-assistive-modes.md)

## Component Families Beyond The Fast Path

The quick guide covers the most common choices. The families below are still
core territory and deserve deliberate use:

- `accordion()` when progressive disclosure inside document flow matters more
  than shell routing
- `tabs()` when the user is switching among peer sections inside one bounded
  component, not across a shell workspace
- `timeline()` when chronology is the reading path
- `tree()` when parent/child structure is the actual story
- `dag()`, `dagSlice()`, and `dagStats()` when dependency, causal flow, or
  graph health are the real jobs
- `markdown()` when the content is intentionally prose-first and should lower
  honestly across modes
- `perfOverlaySurface()` when you need a prebuilt performance view that can be
  blitted into an existing runtime surface

For design intent rather than just signatures, read:

- [Component Families](../../docs/design-system/component-families.md)
- [Patterns](../../docs/design-system/patterns.md)
- [Data Visualization Policy](../../docs/design-system/data-visualization.md)

## Testing Contracts

The beginner rule still holds: use test adapters, not process mocking.

The advanced layer adds stricter expectations:

- test multiple output modes when the component meaning changes by mode
- assert on rendered truth, not internal helper implementation
- prefer deterministic surfaces and direct strings over snapshot sprawl
- when a component exists in both string and surface form, verify the path you
  actually intend to ship

Useful anchors:

- [GUIDE testing](./GUIDE.md#testing)
- [test adapters](./adapters/test)
- [surface primitives tests](./src/core/components/surface-primitives.test.ts)
- [bg fill tests](./src/core/bg-fill.test.ts)

## Stay In Core Or Move Up?

Stay in `@flyingrobots/bijou` when the work is:

- pure rendering or prompt logic
- mode-aware but not fullscreen-runtime-owned
- portable across Node, MCP, static output, and TUI surfaces

Move to `@flyingrobots/bijou-tui` when the work becomes:

- fullscreen runtime behavior
- shell-owned interaction
- viewport, motion, overlays, or page-to-page transitions
- event-loop or input-routing ownership
