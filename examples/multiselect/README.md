# `multiselect()`

Checkbox-style prompt for building a lasting set of selected values.

![demo](demo.gif)

## Run

```sh
npx tsx examples/multiselect/main.ts
```

## Use this when

- the user is building a set
- multiple simultaneous selections are meaningful
- the resulting collection becomes stored configuration or state

## Choose something else when

- choose `select()` or `filter()` when exactly one value should win
- choose `commandPaletteSurface()` when the user is triggering commands instead of collecting state

## What this example proves

- `multiselect()` as a set-building prompt
- keyboard-driven checkbox semantics
- graceful lowering of selection state into textual prompt output

[← Examples](../README.md)
