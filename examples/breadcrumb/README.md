# `breadcrumb()`

Navigation breadcrumb trails

![demo](demo.gif)

## Run

```sh
npx tsx examples/breadcrumb/main.ts
```

## Use this when

- path context helps explain the current location
- hierarchy should stay visible while the user reads the current node or page
- a compact path summary is more honest than a full navigation control

## Choose something else when

- choose `tabs()` when the destinations are peers
- choose `stepper()` when the user is progressing through ordered stages
- choose a simple title when the path is too unstable or deep to help comprehension

## Right-to-left layout

Pass `direction: 'rtl'`, or create the context with `direction: 'rtl'`. In `interactive` and
`static` output the trail reads right to left: the current item is rightmost and keeps its styling,
and a directional separator glyph is mirrored (`›` becomes `‹`). An ASCII separator such as `/` or `>`
is left alone, because it may be a path or code. Labels are never reversed. `pipe` and `accessible`
output keep logical order, so parsers and screen readers read the trail from root to current item.

## What this example proves

- `breadcrumb()` as path context rather than command navigation
- separator changes for different path semantics
- a wayfinding component that lowers cleanly to text without losing hierarchy

[← Examples](../README.md)
