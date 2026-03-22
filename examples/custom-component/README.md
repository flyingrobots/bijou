# `renderByMode()`

Authoring an app-specific primitive that lowers honestly across output modes.

## Run

```sh
npx tsx examples/custom-component/main.ts
```

## Use this when

- the app needs a domain-specific primitive that should not become a shared Bijou component
- the same semantic thing must render truthfully in rich, pipe, and accessible modes
- you want one authored abstraction instead of scattered mode checks throughout the app

## Choose something else when

- choose an existing Bijou family when the job already matches a shipped component
- avoid mode branching that only chases cosmetic differences instead of preserving semantic truth
- avoid using `renderByMode()` as a shortcut for inconsistent feature behavior across modes

## What this example proves

- one authored `spark()` primitive with rich, pipe, and accessible branches
- mode-aware rendering that preserves the same underlying meaning in each output profile
- `renderByMode()` as an authoring tool for app-owned primitives, not a replacement for the design system

[← Examples](../README.md)
