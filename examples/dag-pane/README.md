# `dagPane()`

Interactive DAG inspection pane with keyboard navigation, focus, and scrolling.

![demo](demo.gif)

## Run

```sh
npx tsx examples/dag-pane/main.ts
```

## Use this when

- graph inspection is an active task rather than passive explanation
- the user needs keyboard-owned selection, path highlighting, and scrolling
- the graph is important enough to deserve its own workspace pane

## Choose something else when

- choose `dag()` when the graph can stay passive
- choose `dagSlice()` when only one neighborhood or dependency chain matters
- choose `dagStats()` when structural summary matters more than graph navigation
- choose `timeline()` or `tree()` when order or simple hierarchy would be clearer than graph inspection

## What this example proves

- node-to-node keyboard navigation across parents, children, and siblings
- auto-highlight of the active dependency path
- viewport scrolling and focus ownership for a graph pane inside a TUI workspace

[← Examples](../README.md)
