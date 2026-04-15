# Secondary Example Map

This file is no longer a giant per-example status ledger.

It is a maintainer-facing and agent-facing reference map, not a public
docs hub.

DOGFOOD is the primary living-docs and proving surface. In v4.4.0,
31 examples were retired because DOGFOOD now covers their component
families directly. The remaining examples exist for runtime seam
references, shell proving, and leaf API demos that DOGFOOD does not
yet teach.

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

### Remaining Leaf Examples

Keep leaf examples when they are the clearest isolated explanation of
a family or API seam not yet covered by DOGFOOD stories. The remaining
set in this file is the current reference for example retirements that
still depend on deeper DOGFOOD teaching. The historical depth follow-on
is [DF-020](./method/retro/DF-020-deepen-dogfood-story-depth-and-variant-quality.md).

## Cut Later

An example becomes a retirement candidate only when all of the following are true:

1. DOGFOOD or another canonical scenario now teaches the same decision clearly.
2. No migration guide or package README still points to the example.
3. It is not carrying unique smoke or regression value.
4. It is not the clearest isolated proof of a public API seam.

## Relationship To Release Smoke

Release smoke now runs through `smoke:dogfood`.

Tracked closure:

- [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

That means examples are no longer the release-facing smoke contract even
if some internal reference tooling around example scenarios still
exists.
