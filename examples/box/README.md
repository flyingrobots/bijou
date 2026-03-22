# `box()`, `headerBox()`

Contained regions and titled panels for grouping related content.

![demo](demo.gif)

## Run

```sh
npx tsx examples/box/main.ts
```

## Use this when

- a region needs visible containment
- sibling panels should read as separate working areas
- `headerBox()` can explain a panel with a short title plus compact detail metadata

## Choose something else when

- choose `separator()` when a boundary is enough and full containment would add noise
- choose `alert()` when the message is really status escalation rather than grouping
- avoid stacking boxes everywhere just to manufacture visual weight

## What this example proves

- `box()` for simple containment and padded breathing room
- `headerBox()` for titled panels with terse secondary detail
- nested boxes only when they explain real structure, not as default decoration

For background-filled panel treatment, see [`background-panels`](../background-panels/).

[← Examples](../README.md)
