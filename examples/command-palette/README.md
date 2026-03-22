# `commandPaletteSurface()`

Filterable action-discovery surface with a fixed search row and viewport-backed results.

## Run

```sh
npx tsx examples/command-palette/main.ts
```

## Use this when

- the result is an action, navigation target, or command
- the app needs one global action-discovery surface
- grouped command search is more honest than a one-off prompt

## Choose something else when

- choose `select()` or `filter()` when the result should become stored form state
- choose `browsableListSurface()` when the content is really a record list instead of an action list
- choose `filePickerSurface()` when path traversal is the mental model

## What this example proves

- `commandPaletteSurface()` on the structured shell path
- `commandPaletteKeyMap()` plus focus, paging, and query filtering
- fixed search row with viewport-backed result masking
- action discovery that stays distinct from value-picking prompts

[← Examples](../README.md)
