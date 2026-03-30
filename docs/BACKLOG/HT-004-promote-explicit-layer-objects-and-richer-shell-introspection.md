# HT-004 — Promote Explicit Layer Objects and Richer Shell Introspection

Legend:

- [HT — Humane Terminal](/Users/james/git/bijou/docs/legends/HT-humane-terminal.md)

Depends on:

- [HT-003 — Implement Layer Stack and Input Map Routing](/Users/james/git/bijou/docs/design/HT-003-implement-layer-stack-and-input-map-routing.md)

## Goal

Promote the current described layer stack into richer explicit layer objects so the shell, apps, and agents can share more than just booleans and inferred input maps.

## Why this is on the backlog

HT-003 made the stack real enough for routing and truthful controls, but the shell still derives most layers from existing booleans and page modal presence.

This follow-on should explore:

- explicit shell/page layer objects
- richer layer metadata for agents and tests
- layer-owned footer/help/control sources
- a cleaner path for page-defined overlays beyond `modalKeyMap`
