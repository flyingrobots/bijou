---
title: DL-010 — Strictly Typed App Interface Examples
lane: retro
legend: DL
---

# DL-010 — Strictly Typed App Interface Examples

## Disposition

Completed on `release/v5.0.0`. The remaining public doc example that still used
`App<any, ...>` in `packages/bijou-tui/README.md` is now typed with an explicit
`ParentModel`, and a repo search over root/package READMEs plus GUIDE surfaces
no longer finds `App<any, any>`, `App<any, ...>`, or `Model = any` examples in
the top-level documentation path.

## Original Proposal

Legend: [DL — Design Language](../legends/DL-design-language.md)

Many code examples in the repository's READMEs and GUIDEs currently use
`App<any, any>` or `Model = any`. While concise, this masks the core
TypeScript safety guarantees that make Bijou an "industrial-grade" engine.

Refactor all top-level documentation examples to use concrete `Model` and `Msg`
types. Ensure that the `init`, `update`, and `view` functions are shown with
their full generic context.
