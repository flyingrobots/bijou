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

## What this example proves

- `breadcrumb()` as path context rather than command navigation
- separator changes for different path semantics
- a wayfinding component that lowers cleanly to text without losing hierarchy

[← Examples](../README.md)
