# `toast()`, `compositeSurface()`

Low-level transient overlay primitive with explicit anchoring.

## Run

```sh
npx tsx examples/toast/main.ts
```

## Use this when

- you are composing one transient overlay directly
- explicit anchoring matters
- the app does not need stack/history management

## Choose something else when

- choose `alert()` when the message should remain in page flow
- choose the notification system when the app needs stacking, actions, routing, or history
- choose `drawer()` or `modal()` when the overlay needs supplemental work or a blocking decision

## What this example proves

- `toast()` as the low-level transient overlay primitive
- `compositeSurface()` as the preferred rich-TUI composition path
- anchor changes and width control for direct overlay placement

[← Examples](../README.md)
