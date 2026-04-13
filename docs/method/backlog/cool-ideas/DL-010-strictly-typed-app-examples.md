# DL-010 — Strictly Typed App Interface Examples

Legend: [DL — Design Language](../../legends/DL-design-language.md)

_Migrated from the legacy `docs/BACKLOG/` tree, where this idea used the
older `DL-009` identifier before METHOD claimed that slot for layout and
viewport formalization._

## Idea

Many code examples in the repository's READMEs and GUIDEs currently use `App<any, any>` or `Model = any`. While concise, this masks the core TypeScript safety guarantees that make Bijou an "industrial-grade" engine.

Refactor all top-level documentation examples to use concrete `Model` and `Msg` types. Ensure that the `init`, `update`, and `view` functions are shown with their full generic context.

## Why

1. **Safety**: Demonstrates the TEA loop's state-machine guarantees immediately to new users.
2. **Clarity**: Makes it clear how messages and models flow through the update cycle.
3. **Consistency**: Aligns the documentation with the "Tests are the Spec" and "Runtime Truth Wins" invariants.

## Effort

Small — surgical updates to README.md and GUIDE.md files.
