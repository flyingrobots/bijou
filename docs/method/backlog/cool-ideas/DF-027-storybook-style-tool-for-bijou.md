---
title: "DF-027 — Storybook-Style Tool for Bijou"
legend: DF
lane: cool-ideas
---

# DF-027 — Storybook-Style Tool for Bijou

A dedicated Storybook-style workstation for Bijou components and shells.

## Why

Bijou already has partial realizations of this idea:

- `examples/showcase/` for direct example rendering
- DOGFOOD's `storybook-workstation` / component explorer surface
- `bijou_docs` in `@flyingrobots/bijou-mcp` for queryable component guidance

But those surfaces do not yet add up to a true Storybook-style tool.

The missing product is a focused workstation where builders can:

- browse first-party components and shells by family
- inspect variant matrices and mode lowerings side-by-side
- interact with live stateful examples
- view source/args/story metadata together with the rendering
- export or reuse stories as docs, regression fixtures, and MCP examples

## Shape

Possible deliverables:

- a dedicated DOGFOOD mode or standalone app focused only on component stories
- stable story metadata format for component examples and variants
- live controls / args editing for bounded component inputs
- per-mode previews: interactive, static, pipe, accessible
- easy capture path into docs, MCP docs payloads, screenshots, or tests

## Why this is different from current repo truth

Today the idea is spread across DOGFOOD, showcase examples, and MCP docs. This note tracks the missing unification into one coherent Storybook-style tool rather than more isolated partials.
