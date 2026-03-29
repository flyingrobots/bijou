# Accessibility and Assistive Modes

_Design note for accessible Bijou experiences beyond visual rich-mode parity_

## Why this exists

Bijou already has an `accessible` lowering target for many individual components.

That is useful, but it is not enough.

A component can lower honestly while the overall app still fails people who need:

- screen readers
- low-vision support
- color-blind-safe signaling
- reduced motion
- lower cognitive load
- alternate input or assistive interaction

This note exists to make one thing explicit:

`accessible` output is necessary, but it is not the same thing as an accessible product.

## Current reality

Today Bijou is relatively strong at:

- giving many core components an explicit `accessible` rendering path
- avoiding purely decorative borders/backgrounds in accessible mode
- encouraging explicit text like `Warning: message` instead of ornamental styling

Today Bijou is not yet strong enough at:

- making a complex framed app like DOGFOOD truly usable in accessible mode
- representing interactive structure in a semantic layer above pure visual layout
- addressing low-vision and color-blind needs as first-class design inputs

## Product stance

Bijou should treat accessibility as a design system concern, not a fallback string concern.

That means:

- a view may need to lower to a different experience, not merely a flatter rendering
- linear reading order matters more than preserving spatial cleverness
- visual semantics must become explicit text when required
- assistive users should not be abandoned simply because a surface was originally designed for rich TUI interaction

## Design principles

### 1. Linear truth beats spatial fidelity

When an interface becomes hard to perceive spatially, Bijou should prefer a linear, explicit representation over a compressed imitation of the rich layout.

For example:

- a three-pane docs shell should probably lower to a guided sequential reading model
- not a cramped textual copy of the same spatial arrangement

### 2. Important meaning must survive without color

State should not rely on hue alone.

Selection, severity, status, and affordance should also be carried by:

- text
- labels
- structure
- glyphs
- grouping

### 3. Reduced motion is a first-class mode

Animation can enrich a TUI, but it should never be required for comprehension.

Bijou should support:

- reduced-motion profiles
- low-motion shell behavior
- motion-free explanations of dynamic state

### 4. Accessible mode is not a dump

Plain text should still be:

- structured
- oriented
- navigable
- intentional

Accessible lowering should not mean “unstyled but still confusing.”

### 5. Cognitive load is part of accessibility

Accessibility includes how much the user has to remember, infer, and hold in working memory.

We should minimize:

- hidden modes
- overloaded hint bars
- unexplained jargon
- surfaces with too many equally weighted actions

## Assistive posture

### Screen readers and terminal reality

Terminal screen-reader behavior varies and may not provide a rich widget model comparable to the web.

Bijou should therefore not assume:

- semantic terminal accessibility metadata will rescue a visually dense TUI
- a screen reader can infer pane relationships or control ownership from layout alone

Instead, Bijou should own semantic clarity in the content it emits.

### Voice and alternate interaction

Bijou should eventually grow toward a semantic model that can describe:

- role
- label
- description
- current state
- available actions
- focus order

That model could support:

- accessible lowering
- docs
- testing
- explainability
- future assistive adapters

This should be treated as a semantic shadow model rather than a visual clone of rich-mode layout.

## Low-vision design posture

Bijou should eventually support and audit for:

- high-contrast themes
- monochrome-safe or low-hue themes
- reduced visual clutter
- larger spacing or simplified shell modes where appropriate

This does not mean every app must ship all of these immediately.

It does mean the framework should make them possible and should not fight them.

## Color-blindness posture

The framework should help builders avoid:

- meaning carried only by red/green or similar hue pairings
- state changes visible only through chroma
- token combinations that collapse under common color-vision deficiencies

Future tooling should include:

- contrast checks
- token-pair warnings
- color-blind simulation or heuristics

## DOGFOOD implication

DOGFOOD is the proving surface, which means Bijou should eventually support an accessible DOGFOOD experience that is genuinely usable.

The likely direction is:

- search-first
- linear navigation
- explicit “you are here” copy
- explicit action lists
- no dependence on three-pane spatial inference

That should be treated as a different truthful experience, not a cramped copy of the rich shell.

That is a different experience, not just a visually flattened copy of the rich shell.

## Backlog direction

Recommended next-layer backlog:

- high-contrast / low-motion shell profiles
- token contrast and color-blind auditing tools
- semantic shadow-model exploration for interactive surfaces
- accessibility review of DOGFOOD as a full app, not just component stories
- cognitive-load heuristics for shell and component surfaces

## Relationship to other doctrine

This note should be read alongside:

- [Bijou UX Doctrine](./bijou-ux-doctrine.md)
- [The Humane Shell](./humane-shell.md)
- [Localization and Bidirectionality](./localization-and-bidirectionality.md)
- [Content Guide](./content-guide.md)

## Acceptance bar

This direction is working when:

- Bijou stops equating accessible mode with “flat text fallback”
- rich-shell surfaces are evaluated as experiences, not just as render outputs
- low-vision, motion, and color-blind needs influence design decisions early
- the framework begins to grow explicit semantic and audit tooling in support of that goal
