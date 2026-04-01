# Bijou Vision

_Living statement of what Bijou is for, how it should feel, and where it should be used_

## What Bijou is

Bijou is a framework for building **surface-native terminal applications** that are:

- styled
- stateful
- testable
- humane
- honest across different output modes

Bijou is not trying to pretend the terminal is a browser.

It is trying to take the terminal seriously as its own medium:

- dense, but not cramped
- expressive, but not decorative for its own sake
- interactive, but still degradable
- structured, inspectable, and testable

The long-term goal is not only to ship components.

The goal is to make it straightforward to build terminal software that feels:

- calm
- explicit
- reliable
- accessible
- governable

## What Bijou is not

Bijou is not primarily:

- a string-templating helper for ad hoc CLI output
- a browser-emulation layer in a terminal window
- a pile of isolated widgets without shell doctrine
- a framework that treats docs, accessibility, and graceful degradation as afterthoughts

It should stay willing to say "this belongs to the shell," "this belongs to layout," or "this should lower differently in a non-rich mode" instead of flattening every concern into raw component calls.

## Product vision

Bijou should become the framework people reach for when they want to build serious terminal software with:

- real application state
- real interaction structure
- real layout ownership
- real testing and replayability
- real design standards

The ideal Bijou app should be explainable in a few plain statements:

- where state lives
- what views are visible
- what currently owns input
- how layout is being constrained
- what commands can change state
- what effects may happen as a consequence

That clarity is part of the product.

## Design philosophy

### 1. Hexagonal at the core

The core should own:

- state
- view stack
- layout
- routing
- commands
- effects

Adapters should own:

- terminal protocols
- Node boundaries
- clocks, files, and platform APIs
- transport and environment details

If a behavior is important enough to test, inspect, or lower accessibly, it should probably exist inside the hexagon.

### 2. Graceful lowering is part of the contract

Rich mode is not the only reality.

Bijou should preserve meaning across:

- rich interactive mode
- static mode
- pipe mode
- accessible mode

Visual parity is not the requirement.
Semantic honesty is.

### 3. Layout is a first-class concern

Components should not only know how to render.

They should also have explicit answers for:

- how they size
- how they stretch or shrink
- how they align and anchor
- how they overflow
- when they need a viewport

If layout ownership is vague, interaction ownership becomes vague too.

### 4. Input belongs to the active interaction model

Input should flow through explicit ownership:

- topmost active view/layer first
- layout-defined interaction geometry
- component-local handling
- commands and effects emitted intentionally

This is how modals block lower layers, how shells avoid stale controls, and how input remains explainable instead of branch-order magic.

### 5. Commands and effects are not the same thing

Commands mean:

- "app, change something meaningful"

Effects mean:

- "runtime, perform this consequence"

Bijou should keep that distinction clean.

It is not just type hygiene. It is how stateful behavior stays understandable.

### 6. The shell is a product surface, not glue

Search, help, settings, notifications, quit flows, and framing chrome are part of the user experience.

They should not feel like bolted-on conveniences around "the real app."

### 7. The docs are the proving ground

DOGFOOD is important because it forces Bijou to live with its own decisions.

The docs should not only describe the system.
They should exercise it.

### 8. Human and agent users both matter

Agents are first-class users of the framework and its artifacts.

A good Bijou system should be understandable enough that:

- humans can reason about it
- agents can inspect it
- tests can prove it
- docs can teach it

That means explicit contracts beat folklore.

## Design values

### Calm over noise

Density is good.
Chaos is not.

### Explicit over magical

The framework should prefer clear ownership and named seams over hidden cleverness.

### Honest over flashy

A simpler truthful fallback is better than a rich presentation that lies about capability.

### Structured over stringly

Structured surfaces, layout nodes, and runtime objects are preferable where behavior needs to be inspectable or composable.

### Testable by design

Important behavior should be expressible in deterministic tests instead of only in screenshots or subjective demos.

### Humane by default

The framework should make it easier to do the right thing for:

- accessibility
- localization
- explainability
- reduced motion
- low cognitive load

## Recommended use cases

Bijou is a strong fit for:

### Operator and internal tools

Apps where people live in terminals and need:

- dashboards
- workflow tools
- review surfaces
- deployment or environment controls
- data inspection
- incident response interfaces

### Developer tools

Apps where state, logs, structured output, and keyboard-driven flows matter:

- local dev control planes
- test/replay tools
- code review helpers
- repo/workspace tools
- build and release interfaces

### Guided and explainable interfaces

Apps that need to teach, justify, or walk users through decisions:

- AI-assisted flows
- operator handoff tools
- approvals
- audits
- onboarding/tutorial surfaces

### Dense information browsing

Apps that need to browse or compare structured information:

- tables
- trees
- timelines
- layered detail panes
- searchable docs and knowledge systems

### Documentation and field guides

Apps where the documentation itself should be interactive, testable, and mode-aware.

DOGFOOD is the canonical example of this.

## Less ideal use cases

Bijou is probably a weaker fit when the primary requirement is:

- pixel-perfect graphical presentation
- highly freeform mouse-first visual design
- document editing that depends on browser/editor ecosystems Bijou does not aim to replace
- experiences where the terminal itself is already the wrong medium

That is not a failure.
It is a boundary.

## What good Bijou apps should feel like

A good Bijou app should answer these questions quickly:

- Where am I?
- What can I do right now?
- What currently owns input?
- What changes if I activate this?
- How do I dismiss or back out safely?

It should also make these answers legible to the builder:

- Which state is active?
- Which views are stacked?
- Which layout owns this space?
- Which component owns this interaction?
- Which command changes state?
- Which effect leaves the core?

## Relationship to other docs

This document sits above more specific doctrine and design notes:

- [Bijou UX Doctrine](bijou-ux-doctrine.md)
- [The Humane Shell](humane-shell.md)
- [Accessibility and Assistive Modes](accessibility-and-assistive-modes.md)
- [Localization and Bidirectionality](localization-and-bidirectionality.md)
- [AI Explainability Standard](ai-explainability-standard.md)
- [Content Guide](content-guide.md)
- [Architecture — Bijou](/Users/james/git/bijou/docs/ARCHITECTURE.md)

## Living-document note

This document should evolve when Bijou's self-conception changes:

- if the architecture center of gravity changes
- if the product promise changes
- if the recommended use cases change
- if the framework starts aiming at a different class of software

If those things change and this file stays stale, the repo will start lying about what Bijou is for.
