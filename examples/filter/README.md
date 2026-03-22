# `filter()`

Search-first single-choice prompt for choosing one stored value from a larger set.

![demo](demo.gif)

## Run

```sh
npx tsx examples/filter/main.ts
```

## Use this when

- the user is still choosing one stored value
- the option set is large enough that narrowing is the main task
- search keywords help the right choice surface faster

## Choose something else when

- choose `select()` when the list is already short and stable
- choose `commandPaletteSurface()` when the result is an action or navigation command
- choose `browsableListSurface()` when the content is really a record browser rather than a filtered prompt

## What this example proves

- `filter()` as a search-first value-selection prompt
- normal/insert mode filtering behavior
- graceful lowering of searchable choice into textual prompt flows

[← Examples](../README.md)
