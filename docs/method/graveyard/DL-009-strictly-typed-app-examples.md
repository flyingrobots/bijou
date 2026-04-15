---
title: "DL-009 — Strictly Typed App Interface Examples"
legend: DL
lane: graveyard
---

# DL-009 — Strictly Typed App Interface Examples

## Disposition

Superseded by [DL-010 — Strictly Typed App Interface Examples](../retro/DL-010-strictly-typed-app-examples.md).
The work shipped, but this legacy pre-METHOD note used the `DL-009`
identifier before that id was later reused for
`DL-009 — Formalize Layout and Viewport Rules`. Keep this file only as
name/lineage preservation for the older backlog tree.

## Original Proposal

Legend: [DL — Design Language](../legends/DL-design-language.md)

## Idea

Many code examples in the repository's READMEs and GUIDEs currently use `App<any, any>` or `Model = any`. While concise, this masks the core TypeScript safety guarantees that make Bijou an "industrial-grade" engine.

Refactor all top-level documentation examples to use concrete `Model` and `Msg` types. Ensure that the `init`, `update`, and `view` functions are shown with their full generic context.

## Why

1. **Safety**: Demonstrates the TEA loop's state-machine guarantees immediately to new users.
2. **Clarity**: Makes it clear how messages and models flow through the update cycle.
3. **Consistency**: Aligns the documentation with the "Tests are the Spec" and "Runtime Truth Wins" invariants.

## Effort

Small — surgical updates to README.md and GUIDE.md files.
