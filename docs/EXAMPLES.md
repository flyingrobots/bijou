# Secondary Example Map

This file is no longer a giant per-example status ledger.

It is a maintainer-facing and agent-facing reference map, not a public
docs hub.

That old format made sense when examples were the main teaching surface. It is now actively misleading because Bijou has a stronger split:

- DOGFOOD is the primary living-docs and proving surface
- a smaller set of examples still matters as canonical runtime, shell, migration, or regression references
- the rest of the examples are useful leaf demos, not the source of truth for the product story

If you are trying to learn Bijou, start with [DOGFOOD](./DOGFOOD.md),
not this file.

For the full secondary/internal inventory, use
[../examples/README.md](../examples/README.md).

## Keep

These examples still have clear secondary/reference value.

### Runtime References

Keep these as the main runtime reference set for the `v4.0.0` line:

- `examples/v3-demo`
- `examples/v3-css`
- `examples/v3-motion`
- `examples/v3-subapp`
- `examples/v3-worker`
- `examples/v3-pipeline`

They keep the historical `v3-*` names, but they remain the clearest runtime seam references on this branch.

### DOGFOOD And Shell Proving Surfaces

Keep these because they prove product-level behavior rather than isolated leaf rendering:

- `examples/docs`
  - the living docs app and current proving surface
- `examples/release-workbench`
  - canonical multi-view control-room shell
- `examples/notifications`
  - notification stack, routing, history, and shell review behavior
- `examples/app-frame`
  - framed shell reference

### Reference Leaf Examples

Keep leaf examples when they are the clearest isolated explanation of a family or API seam.

Examples that still fit that role include:

- `alert`, `note`, `badge`, `kbd`
- `table`, `tree`, `dag`, `dag-fragment`, `dag-stats`
- `input`, `select`, `multiselect`, `filter`, `wizard`, `textarea`
- `viewport`, `pager`, `navigable-table`, `browsable-list`, `file-picker`
- `modal`, `drawer`, `tooltip`, `toast`
- `canvas`, `mouse`, `focus-area`, `dag-pane`

The full list lives in [../examples/README.md](../examples/README.md). This page is intentionally not a second exhaustive catalog.

## Merge Into DOGFOOD

Prefer moving teaching value into DOGFOOD when the example is primarily there to show:

- a component family's semantic guidance
- lowering behavior across profiles
- shell discoverability and navigation
- settings/help/search patterns
- product-writing or design-language decisions

If an example's best value is "this should really be a story inside the docs app," it should migrate there instead of growing a parallel README/demo/test story.

## Cut Later

An example becomes a retirement candidate only when all of the following are true:

1. DOGFOOD or another canonical scenario now teaches the same decision clearly.
2. No migration guide or package README still points to the example.
3. It is not carrying unique smoke or regression value.
4. It is not the clearest isolated proof of a public API seam.

Until then, deleting examples is usually just deleting reference coverage under a nicer label.

## Relationship To Release Smoke

The repo still carries `smoke:examples:*`, but that should not be treated
as the long-term end state.

Tracked direction:

- [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](./BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

That shift should happen in stages, not through blind example deletion.
