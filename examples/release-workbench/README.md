# `release-workbench`

Canonical multi-view app-shell demo built on `createFramedApp()`.

Demonstrates:
- Tabs and shared frame chrome
- Multi-pane layouts with `grid()` and `splitPane()`
- Pane focus + per-pane scroll isolation
- Pane-scoped `drawer()` overlays
- Frame-level command palette

## Run

```sh
npx tsx examples/release-workbench/main.ts
```

## Controls

- `[` / `]`: previous/next tab
- `tab` / `shift+tab`: next/previous pane
- `j`/`k` or arrows: scroll focused pane
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
