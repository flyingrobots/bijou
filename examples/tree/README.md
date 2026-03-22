# `tree()`

Passive hierarchical view for parent/child nesting.

![demo](demo.gif)

## Run

```sh
npx tsx examples/tree/main.ts
```

## Use this when

- parent/child nesting is the mental model
- the user should read hierarchy, not operate a full browser-like workspace
- indentation and containment communicate the meaning better than columns

## Choose something else when

- choose `filePickerSurface()` when the interaction is really filesystem traversal
- choose `dag()` when multiple parents or dependency flow matter
- choose `table()` when comparison across attributes matters more than nesting

## What this example proves

- `tree()` as a passive hierarchy renderer
- readable nesting that still makes sense when flattened into textual output
- the distinction between general hierarchy display and richer interactive browsing families

[← Examples](../README.md)
