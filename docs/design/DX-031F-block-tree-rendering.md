---
title: DX-031F Block Tree Rendering
legend: DX
lane: design
---

# DX-031F Block Tree Rendering

_Design checkpoint for explicitly rendering nested block declarations without
turning every block into an implicit runtime manager_

Legend:

- [DX - Developer Experience](../legends/DX-developer-experience.md)

Depends on:

- [DX-031 - Standard Bijou Blocks](./DX-031-standard-bijou-blocks.md)
- [DX-034 - Declarative View Data Binding](./DX-034-declarative-view-data-binding.md)

## Why This Cycle Exists

Bijou blocks now have three separate capabilities:

- metadata and contract declaration
- structural composition of nested block declarations
- local block rendering

Those capabilities are deliberately separate. `AppShellComposition` can inspect
nested blocks without rendering them, and `block.render()` renders only that
block's local input. That kept discovery safe, but DOGFOOD exposed the next
missing seam: an AppShell preview that nests `ReaderSurface` and
`InspectorPanel` needs a renderer that explicitly walks that block tree.

Without a named block-tree renderer, AppShell has two bad options:

- print nested block names and pretend that is rendering
- make `block.render()` recursively render arbitrary children as a hidden side
  effect

Both are wrong. Recursive rendering is useful, but it must be explicit.

## Core Rule

Block tree rendering is explicit.

```text
BlockDefinition.render(input)
  renders one block only

AppShellComposition
  inspects declarations only

renderBlockTree(blockRenderNode(...))
  recursively renders a declared block tree
```

This preserves the boundary:

- composition can inspect nested blocks without executing render
- local block rendering stays predictable
- nested previews can render real child output
- provider lifecycle and command dispatch remain out of scope

## Vocabulary

### Block Render Node

A branded runtime value that pairs a `BlockDefinition` with the input used when
that block participates in an explicit render tree.

It is not a provider handle, subscription, cache entry, command dispatcher, or
view lifecycle owner.

### Block Tree Renderer

A pure renderer that starts from a `BlockRenderNode` or `BlockDefinition`,
recursively renders nested block slot values, and passes rendered child output
into parent slots.

The renderer may aggregate lowering facts. It must not resolve providers,
subscribe, refresh, dispatch Commands, mutate frames, or traverse the active TUI
view hierarchy.

## Behavior

When `renderBlockTree()` receives a node:

1. Validate the target is a real `BlockDefinition` or branded
   `BlockRenderNode`.
2. Resolve the effective mode from node input, inherited parent mode, or render
   options.
3. Walk own data properties of the slot record without invoking accessors.
4. Render nested `BlockRenderNode` and `BlockDefinition` slot values.
5. Replace each nested slot declaration with that child's rendered output.
6. Call the current block's local `render()` with the resolved input.
7. Return frozen output metadata with current and child lowering facts.

The parent block still owns how it displays a slot. The tree renderer only makes
sure the slot value is rendered child output rather than an unrendered
declaration.

## Non-Goals

- no provider subscriptions
- no provider refresh
- no active view hierarchy traversal
- no command dispatch
- no cache retention policy
- no schema binding changes
- no DOGFOOD-specific renderer branch
- no implicit recursive behavior inside ordinary `block.render()`

## DOGFOOD Posture

DOGFOOD block previews should use `renderBlockTree()` when they show nested
standard blocks.

That lets the Blocks section show:

- AppShell as a real shell surface
- ReaderSurface rendered inside AppShell content
- InspectorPanel rendered inside AppShell inspection
- pipe and accessible lowering that includes child block text and facts

DOGFOOD should not call composition introspection to render visuals. It should
use composition for declaration inspection and block-tree rendering for rendered
preview output.

## Acceptance Criteria

- Nested block previews render child output, not only child block names.
- `block.render()` remains a local single-block render contract.
- `AppShellComposition` continues to inspect declarations without calling
  render.
- Render tree inputs are runtime-branded rather than loose `{ block, input }`
  shapes.
- Accessor properties in slot records are not invoked during slot resolution.
- Child mode inherits from the parent unless a child explicitly sets its own
  mode.
- Recursive render depth is bounded and fails deterministically.
- Lowering facts from nested blocks remain inspectable.

## Retrospective

Landed as the explicit block-tree rendering slice. The renderer stays separate
from `block.render()` and `AppShellComposition`, which keeps declaration
inspection, local rendering, and recursive preview rendering as distinct
contracts.
