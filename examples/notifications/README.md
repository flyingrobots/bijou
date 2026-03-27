# Notification System

App-managed transient messaging with stacking, actions, placement control, and shell-owned review.

## Run

```sh
npx tsx examples/notifications/main.ts
```

## Use this when

- the app owns notification lifecycle instead of rendering a single local overlay
- stacking, placement changes, actions, routing, or recall matter
- users may need to reopen archived warnings, errors, or actionable notices through the standard shell notification center

## Choose something else when

- choose `alert()` when the message should remain in page flow
- choose `toast()` when you only need a single low-level transient overlay
- choose `modal()` when the user must stop and decide before continuing
- choose `drawer()` when the user needs supplemental context while keeping the main task visible
- choose `note()` when the content is explanatory support rather than an event stream

## What this example proves

- `ACTIONABLE`, `INLINE`, and `TOAST` notification variants
- per-notification placement and duration
- animated entry, relocation, and dismissal
- bounded stack behavior with archived history
- shell-owned notification review via `Shift+N`
- framed-app routing for actions, dismiss, keyboard shortcuts, mouse clicks, and shell overlays

[← Examples](../README.md)
