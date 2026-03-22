# `select()`

Single-select prompt for choosing one stored value from a short, stable set.

![demo](demo.gif)

## Run

```sh
npx tsx examples/select/main.ts
```

## Use this when

- the user is choosing one value
- the options are short, stable, and easy to scan
- the result becomes stored state rather than triggering a command

## Choose something else when

- choose `filter()` when search and narrowing are the real job
- choose `multiselect()` when the user is building a set
- choose `commandPaletteSurface()` when the result is an action or navigation command

## What this example proves

- core `select()` as a value-picking prompt
- the simplest honest choice surface for one stored value
- graceful lowering from interactive prompt flow to textual selection modes

[← Examples](../README.md)
