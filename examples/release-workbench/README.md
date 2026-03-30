# `release-workbench`

Canonical multi-view app-shell demo built on `createFramedApp()`.

## Run

```sh
npx tsx examples/release-workbench/main.ts
```

## Use this when

- you want the canonical shell example instead of a minimal framed-app starter
- the product has multiple destinations, pane-focused workspace state, overlays, and global action discovery
- you need a concrete example of shell roles staying distinct: status/help/palette/notifications/overlays

## Choose something else when

- choose `app-frame` when you want a smaller focused shell example
- choose a single-page example when the product is really one surface or one prompt loop

## What this example proves

- tabs and shared frame chrome
- multi-pane layouts with split and grid page composition
- pane focus plus per-pane scroll isolation
- pane-scoped `inspectorDrawer()` overlays
- shell-level command palette and confirmation flow

## Controls

- `[` / `]`: previous/next tab
- `tab` / `shift+tab`: next/previous pane
- `j`/`k`: scroll focused pane
- `ctrl+p` or `:`: open command palette
- `o`: toggle panel drawer
- `a`: cycle drawer anchor (`right` -> `left` -> `bottom` -> `top`)
- `y`: cycle drawer target (focused panel or full frame)
- `n` / `b`: next/previous release train
- `?`: help (`?` or `esc` closes help)
- `q` or `esc`: open quit confirmation dialog (when closed)
- `enter`: confirm quit when dialog is open
- `esc`: cancel quit when dialog is open
- `ctrl+c`: force quit immediately

[← Examples](../README.md)
