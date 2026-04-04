# DOGFOOD

_Documentation Of Good Foundational Onboarding and Discovery_

DOGFOOD is Bijou's canonical human-facing docs surface.

If you are trying to learn Bijou, start here, not with the general
`examples/` inventory.

## Run

```bash
npm run dogfood
```

## What DOGFOOD Is For

DOGFOOD is where Bijou now proves:

- how the shell behaves in a real product surface
- how the component library is documented and explored
- how package, release, and philosophy docs fit together in one
  terminal-native docs experience

It is not just another demo. It is the repo's living docs app.

## What It Covers Today

The current DOGFOOD shell includes top-level sections for:

- `Guides`
- `Components`
- `Packages`
- `Philosophy`
- `Release`

The component-family explorer is still an important part of DOGFOOD, but
it is no longer the whole story.

## Relationship To `examples/`

The `examples/` tree still exists, but it is now secondary. Treat it as:

- reference and migration material
- isolated API seam proofs
- smoke and regression substrate

not as the main public docs path.

## Implementation Note

The app currently lives under [`examples/docs/`](../examples/docs/README.md)
for implementation reasons. That path should not be mistaken for the
user-facing information architecture.
