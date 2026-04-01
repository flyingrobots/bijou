# RE — Runtime Engine

_Legend for formalizing Bijou's retained-layout, hexagonal runtime architecture_

## Goal

Turn Bijou's runtime from a set of useful shell and rendering seams into a coherent engine model with explicit ownership of:

- application state machines
- view stacks
- retained layouts
- layout invalidation
- input routing
- commands
- effects
- adapter boundaries

This legend covers work like:

- first-class runtime layer/view objects
- state vs view-stack lifecycle rules
- layout-driven interaction geometry
- command/effect buffering
- input routing through retained layouts
- migration of existing shell/runtime code onto those seams

## Human users

- builders composing real Bijou apps
- maintainers evolving the runtime without introducing branch-order regressions
- DOGFOOD users depending on honest, predictable interaction behavior

## Agent users

- agents generating framed or layered Bijou apps
- agents inspecting runtime state to explain focus, routing, and layout ownership
- agents writing deterministic tests against runtime/input behavior

## Human hill

A builder can explain where state lives, where views live, how layout is invalidated, and how input flows without relying on shell-specific folklore or branch-order guesses.

## Agent hill

An agent can inspect runtime objects and predict routing, layout ownership, commands, and effects deterministically enough to generate or validate nontrivial Bijou apps.

## Core invariants

- [Focus Owns Input](/Users/james/git/bijou/docs/invariants/focus-owns-input.md)
- [Topmost Layer Dismisses First](/Users/james/git/bijou/docs/invariants/topmost-layer-dismisses-first.md)
- [State Machine and View Stack Are Distinct](/Users/james/git/bijou/docs/invariants/state-machine-and-view-stack-are-distinct.md)
- [Layout Owns Interaction Geometry](/Users/james/git/bijou/docs/invariants/layout-owns-interaction-geometry.md)
- [Commands Change State, Effects Do Not](/Users/james/git/bijou/docs/invariants/commands-change-state-effects-do-not.md)
- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)

## Related doctrine

- [Bijou UX Doctrine](/Users/james/git/bijou/docs/strategy/bijou-ux-doctrine.md)
- [The Humane Shell](/Users/james/git/bijou/docs/strategy/humane-shell.md)
- [Design-System Patterns](/Users/james/git/bijou/docs/design-system/patterns.md)

## Current cycle and backlog

- active cycle:
  - [RE-006 — Formalize Component Layout and Interaction Contracts](/Users/james/git/bijou/docs/design/RE-006-formalize-component-layout-and-interaction-contracts.md)
- backlog:
  - [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](/Users/james/git/bijou/docs/BACKLOG/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
