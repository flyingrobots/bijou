---
title: MCP interactive documentation for all Bijou components
legend: DF
lane: v5.0.0
---

# MCP interactive documentation for all Bijou components

bijou-mcp should serve as interactive documentation for all of Bijou, not just a rendering service. Add a bijou_docs tool (or MCP resource endpoints) that returns structured, machine-readable documentation for any component: what it does, when to use it, when NOT to use it, interaction profile behavior (interactive/static/pipe/accessible), related components, and example output. Think of it as the design-system field guide but queryable by LLMs — an agent could ask "when should I use a table vs a DAG?" or "what component handles step progress?" and get an authoritative answer with examples. This makes Bijou self-documenting inside any MCP-capable coding tool.

## Progress (2026-04-12)

`bijou_docs` now exists and already covers the current `bijou-mcp` render-tool surface. It also documents a first bounded set of public first-party component families that do not yet have dedicated MCP render tools, including `markdown()`, `guidedFlow()`, `preferenceListSurface()`, the spinner/timer family, and the current data-viz surfaces such as `sparkline()` and `perfOverlaySurface()`.

The remaining gap is breadth, not direction: the catalog still is not a complete field guide for every first-party component or every DOGFOOD surface, and the docs-only families still stop short of a one-tool-per-component interactive render story.

## Completed (2026-04-14)

`bijou_docs` now covers the public first-party Bijou component-family
surface exposed by `@flyingrobots/bijou`, including the previously
missing `note()`, the core choice/form families, expressive branding
helpers, and the `renderByMode()` authoring helper. The catalog still
prefers real MCP render tools when they exist, and it now synthesizes
representative plain-text examples for the remaining docs-only
families.
