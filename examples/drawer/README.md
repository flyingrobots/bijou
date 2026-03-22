# `drawer()`, `compositeSurface()`

Supplemental side-panel overlay that keeps the main task visible.

## Run

```sh
npx tsx examples/drawer/main.ts
```

## Use this when

- the user needs reference material, inspector detail, or side work
- the main surface should stay visible while the drawer is open
- the context belongs to one workspace region or one supplemental task

## Choose something else when

- choose `modal()` when background interaction must stop
- choose `tooltip()` for tiny local explanation
- choose the notification system for transient event messaging

## What this example proves

- `drawer()` with structured `Surface` content
- `compositeSurface()` for panel layering without falling back to string composition
- a supplemental detail panel that does not steal the whole task

[← Examples](../README.md)
