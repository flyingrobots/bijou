# `modal()`, `compositeSurface()`, `createInputStack()`

Blocking decision overlay with layered input ownership.

## Run

```sh
npx tsx examples/modal/main.ts
```

## Use this when

- the user must stop and review or decide before continuing
- background shortcuts and pointer actions should be blocked
- the dialog belongs to the current task, not to a long-lived notification stream

## Choose something else when

- choose `drawer()` when the user still needs the main surface visible and interactive
- choose `toast()` for one lightweight transient overlay with no blocking behavior
- choose the notification system when stacking, actions, routing, or recall matter
- choose `alert()` when the message should remain in the page flow

## What this example proves

- `modal()` with structured body and hint content
- `compositeSurface()` as the preferred overlay composition path
- `createInputStack()` blocking background key handlers while the modal is open
- separate help and confirm dialogs without pretending they are the same interruption

[← Examples](../README.md)
