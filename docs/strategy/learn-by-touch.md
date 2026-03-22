# Learn by Touch

_Milestone strategy for the post-v4 living docs platform_

## Why this milestone exists

After `v4.0.0`, the next problem is not "what capability can Bijou add next?" It is:

- how does someone understand Bijou quickly?
- how do docs, demos, examples, and tests stop drifting apart?
- how do we show graceful lowering instead of merely describing it?
- how do we make the system easy to explore without multiplying one-off example apps?

This milestone is the answer. It is the first post-v4 product milestone because it improves understanding, trust, and development speed at the same time.

`Learn by Touch` is a better name than "Milestone 1" because it reflects the actual philosophy:

- docs should be experiential, not only descriptive
- components should be explored in the medium they are built for
- users should be able to compare states, modes, and patterns directly
- the same source of truth should drive teaching, testing, and tooling

## Design-thinking frame

### Primary user

The primary user is the **curious builder**:

- a developer evaluating Bijou for a real terminal application
- a contributor trying to understand a component family or pattern
- a returning maintainer trying to remember what is canonical and what is not

They are not asking for infinite flexibility first. They are asking:

- "What is this thing?"
- "When do I use it?"
- "What does it look like in real terminal conditions?"
- "How does it behave in `rich`, `static`, `pipe`, and `accessible`?"
- "Can I trust that the example, docs, and tests all describe the same thing?"

### Secondary user

The secondary user is the **component author / framework maintainer**:

- they need a safe place to evolve a component family
- they need stories and scenarios that can double as docs and regressions
- they need a way to inspect behavior without hand-rolling a bespoke demo for every new idea

### Core jobs to be done

1. **Help me understand Bijou without hunting across the repo.**
   I want one place where the doctrine, the live behavior, and the example source agree.

2. **Help me compare interaction profiles and states quickly.**
   I want to see the same component in `rich`, `static`, `pipe`, and `accessible` without writing four custom demos.

3. **Help me trust what I am seeing.**
   I want docs, demos, and regression scenarios to come from one structured source of truth instead of diverging copies.

4. **Help me evolve the system safely.**
   I want to add or refine a component family once and have that work propagate into docs, previews, and test surfaces.

## The current problem

Today, Bijou is much healthier than it was pre-v4, but the learning surface is still fragmented:

- doctrine lives in `docs/design-system/*`
- public teaching lives in package READMEs and example READMEs
- interactive demonstrations live in example programs
- regression coverage lives in smoke harnesses, PTY scripts, and targeted tests

Each of those serves a purpose, but they do not share one canonical representation of "a component family in context." That fragmentation increases maintenance cost and makes the product harder to learn than it needs to be.

## Principles

This milestone should follow these principles:

1. **One source of truth**
   Stories should be structured records that can feed docs, demos, previews, and tests.

2. **Show behavior, not only prose**
   Lowering, width sensitivity, and interaction changes should be visible side-by-side.

3. **Docs are product**
   The docs experience is not a sidecar artifact. It is part of Bijou's value proposition.

4. **Terminal-native first**
   Bijou should document itself in its own medium where possible.

5. **Regression surfaces should emerge from teaching surfaces**
   If a story is canonical enough to teach, it should be close to canonical enough to test.

## Scope of Learn by Touch

### 1. Story Protocol

This is the highest-leverage foundation.

What it is:

- a structured `ComponentStory` / `PatternStory` model
- enough metadata to drive:
  - docs pages
  - live demos
  - examples/showcase entries
  - scenario tests
  - replay artifacts

What it should capture:

- title and summary
- family / pattern identity
- use / avoid guidance
- graceful lowering descriptions
- demo inputs / states
- width and profile presets
- optional source snippet references
- optional selectors / semantics
- optional scenario hooks

Why it matters:

- without this, every later investment duplicates logic
- with it, the docs TUI, scenario harness, lab mode, and replay tooling all share the same substrate

Primary assumption to test:

- one story format can serve both human-facing docs and machine-facing regression/tooling needs without becoming too heavy

### 2. Bijou Docs TUI

This is the flagship user-facing product surface.

What it is:

- a Bijou-native docs application
- left navigation, content pane, demo pane
- width and interaction-profile controls
- source and guidance next to live render output

Why it matters:

- it lets Bijou document itself in the medium it is designed for
- it makes the design system feel real instead of abstract
- it provides a natural home for component families, patterns, and canonical demos

Primary assumption to test:

- developers learn Bijou materially faster from a terminal-native docs surface than from disconnected README prose

### 3. Interaction Profile Simulator

This makes graceful lowering concrete.

What it is:

- a shared control surface for `rich`, `static`, `pipe`, `accessible`
- likely paired with width presets, reduced motion, and no-color modes

Why it matters:

- graceful lowering is one of Bijou's clearest differentiators
- right now it is described better than it is demonstrated

Primary assumption to test:

- showing profile shifts directly will reduce both documentation ambiguity and component misuse

### 4. Surface Selector Model

This makes stories and scenarios targetable in a stable way.

What it is:

- semantic targeting over surfaces and layout output
- ids, classes, scoped regions, and text-based hooks where appropriate

Why it matters:

- docs and tests should not depend on brittle coordinates
- selector semantics are the bridge between human-facing demos and machine-driven assertions

Primary assumption to test:

- a small selector model can cover most docs/demo/test needs without turning into a fake DOM

### 5. Surface Scenario Test Harness

This turns stories into interactive truth surfaces.

What it is:

- a Playwright-like harness for Bijou apps and surface stories
- scripted input, semantic selection, frame assertions, deterministic flows

Why it matters:

- it can make the same stories useful for docs demos and regression checks
- it reduces the cost of verifying behavior that is currently trapped inside bespoke examples

Primary assumption to test:

- once stories and selectors exist, scenarios can become the shared layer for docs, bug repros, and regression testing

### 6. Component Lab Mode

This is the interactive workbench inside the docs system, not a separate competing product.

What it is:

- a knob-driven or control-driven exploration surface for stories
- state toggles, width toggles, profile toggles, maybe timing or pointer toggles

Why it matters:

- it helps authors and users poke at a component family without writing another one-off demo
- but it should live inside the docs/story system, not alongside it as another disconnected example app

Primary assumption to test:

- a lab mode is most valuable when it is powered by stories, not by custom per-example controls

## The next pass

The next pass should not try to build all six pieces at once. It should validate the smallest coherent loop:

1. **Story Protocol v0**
2. **Docs TUI vertical slice**
3. **Interaction Profile Simulator**
4. **Surface Selector Model**
5. **Surface Scenario Test Harness**
6. **Component Lab Mode**

### Why this order

#### 1. Story Protocol v0

Build first because everything else gets cheaper and truer once stories exist.

The goal is not to design the perfect eternal schema. The goal is to prove that one story record can power:

- one docs page
- one live demo
- one source snippet
- one profile comparison

Recommended first families:

- `alert()` / `note()` for simple lowering
- `modal()` / `drawer()` for richer structured overlays
- `navigableTableSurface()` or `viewportSurface()` for structured TUI behavior

#### 2. Docs TUI vertical slice

Once the story shape exists, build a narrow docs app that renders a few canonical stories.

The first slice should include:

- left nav
- content pane
- demo pane
- one or two width presets
- one or two family pages

Do not try to build the full docs universe first.

#### 3. Interaction Profile Simulator

Add the control that most directly demonstrates Bijou's difference.

The first simulator should support:

- `rich`
- `static`
- `pipe`
- `accessible`

Optional next toggles:

- reduced motion
- narrow width
- no color

#### 4. Surface Selector Model

Once stories and docs exist, define the semantic targeting needed to make them testable and inspectable.

Keep the first version minimal:

- `id`
- `class`
- scoped region / pane identity
- text contains

#### 5. Surface Scenario Test Harness

After stories and selectors exist, use them to prove the docs surface can also be exercised mechanically.

The first version should be able to:

- open a story
- toggle profile or width
- assert on semantic targets
- capture a frame sequence if needed

#### 6. Component Lab Mode

Only after the above loop exists should the team add richer controls.

That keeps the lab from becoming another disconnected example swamp.

## Success criteria

Learn by Touch is successful when:

- a new contributor can learn a component family from one canonical surface
- docs, demos, and regressions are visibly converging instead of drifting
- at least one family can be documented, previewed, profile-switched, and scenario-tested from the same story record
- the docs app feels like a real product surface, not a pile of examples behind a menu

## Non-goals for the first iteration

- replacing every example immediately
- building the full visual studio
- perfecting every replay or selector capability before the docs TUI exists
- inventing a giant story schema before proving a narrow vertical slice

## Recommended first slice

If the team wants the most leverage with the least risk, start here:

1. define `ComponentStory` v0
2. author three canonical stories:
   - `alert()` / `note()`
   - `modal()` / `drawer()`
   - `viewportSurface()` or `navigableTableSurface()`
3. build a docs TUI shell that renders those stories
4. add profile switching to those pages

That is the smallest slice that proves the philosophy instead of merely describing it.
