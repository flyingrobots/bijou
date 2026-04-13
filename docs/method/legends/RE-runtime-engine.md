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

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)
- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md)
- [Host APIs Stay Behind Adapters](../invariants/host-apis-stay-behind-adapters.md)
- [Codecs Are Not Domain Models](../invariants/codecs-are-not-domain-models.md)
- [Focus Owns Input](../invariants/focus-owns-input.md)
- [Topmost Layer Dismisses First](../invariants/topmost-layer-dismisses-first.md)
- [State Machine and View Stack Are Distinct](../invariants/state-machine-and-view-stack-are-distinct.md)
- [Layout Owns Interaction Geometry](../invariants/layout-owns-interaction-geometry.md)
- [Commands Change State, Effects Do Not](../invariants/commands-change-state-effects-do-not.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)

## Related doctrine

- [System-Style JavaScript](../system-style-javascript.md)
- [Bijou UX Doctrine](../strategy/bijou-ux-doctrine.md)
- [The Humane Shell](../strategy/humane-shell.md)
- [Design-System Patterns](../design-system/patterns.md)

## Current cycle and backlog

- latest completed cycle:
  - [RE-016 — DAG renderer should handle cycles gracefully](../retro/RE_016-dag-cycle-graceful-handling.md)
- previous completed cycle:
  - [RE-007 — Migrate Framed Shell Onto Runtime Engine Seams](../retro/RE_007-migrate-framed-shell-onto-runtime-engine-seams.md)
- next queue note:
  - [RE-012 — Pipeline Observability Hooks](../backlog/cool-ideas/RE_012-pipeline-observability-hooks.md)
