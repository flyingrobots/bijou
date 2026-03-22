# Background Panels

Demonstrates background token usage across containment, layout, and overlay surfaces.

## Run

```sh
npx tsx examples/background-panels/main.ts
```

## Use this when

- panel or overlay surfaces need semantic background separation
- containment and elevation should be visible without inventing custom ANSI styling
- you want background tokens to stay consistent across layout and overlay families

## Choose something else when

- the region only needs a border or title and background fill would add noise
- color is carrying meaning that should really be expressed by status components or text
- the surface would become unreadable in narrow or reduced-color terminals

## What this example proves

- `box()` can become a colored panel without changing its containment semantics
- layout and overlay families can share the same surface-token vocabulary
- background treatment should reinforce structure and elevation, not replace them

[← Examples](../README.md)
