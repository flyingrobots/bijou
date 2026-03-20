# Notification System

App-managed transient messaging with stacking, actions, placement control, and history.

## Run

```sh
npx tsx examples/notifications/main.ts
```

## Use this when

- the app owns notification lifecycle instead of rendering a single local overlay
- stacking, placement changes, actions, routing, or recall matter
- users may need to reopen archived warnings, errors, or actionable notices

## Choose something else when

- choose `alert()` when the message should remain in page flow
- choose `toast()` when you only need a single low-level transient overlay
- choose `modal()` when the user must stop and decide before continuing

## What this example proves

- `ACTIONABLE`, `INLINE`, and `TOAST` notification variants
- per-notification placement and duration
- animated entry, relocation, and dismissal
- bounded stack behavior with archived history
- framed-app routing for actions, dismiss, keyboard shortcuts, and mouse clicks

[← Examples](../README.md)
