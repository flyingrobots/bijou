# `createFramedApp()`

Compact app-shell example with tabs, pane focus, overlays, and shared shell chrome.

## Run

```sh
npx tsx examples/app-frame/main.ts
```

## Use this when

- the app has multiple peer destinations or work areas
- pane focus, shell help, overlays, and optional command palette behavior should be standardized
- the shell should frame workspace state instead of every page rebuilding chrome from scratch

## Choose something else when

- choose a simpler single-surface app when the product is really one screen or one prompt loop
- choose `release-workbench` when you want the fuller canonical multi-view shell example instead of a compact starter

## What this example proves

- `createFramedApp()` with tabbed pages and shared shell behavior
- split and grid page layouts inside the framed shell
- a pane-scoped `inspectorDrawer()` block driven from the shell overlay factory
- shell-level help and command palette integration without each page reimplementing them

[← Examples](../README.md)
