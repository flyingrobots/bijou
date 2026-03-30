# HT-003 — Implement Layer Stack and Input Map Routing

Legend:

- [HT — Humane Terminal](/Users/james/git/bijou/docs/legends/HT-humane-terminal.md)

Depends on:

- [HT-002 — Layered Focus and Interaction](/Users/james/git/bijou/docs/design/HT-002-layered-focus-and-interaction.md)

## Goal

Refactor `createFramedApp()` so shell and page interaction layers behave like an explicit stack, with topmost-layer dismissal and input-map-derived control hints.

## Why this is on the backlog

The design pass is done, but the runtime still routes search, help, settings, notifications, quit confirm, and page-owned modals through branch order instead of a first-class layer model.

This cycle should:

- introduce a layer-stack model
- make `Esc` dismiss topmost layers before it requests quit
- drive footer/help control hints from the active input map
- expose enough structured layer state for agents and tests to reason about shell ownership
