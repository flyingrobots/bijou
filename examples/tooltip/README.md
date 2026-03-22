# `tooltip()`, `compositeSurface()`

Tiny local explanatory overlay with directional placement.

## Run

```sh
npx tsx examples/tooltip/main.ts
```

## Use this when

- the user needs a short local explanation near a target
- the content is tiny, non-blocking, and not scrollable
- directional placement helps tie the explanation to a point of focus

## Choose something else when

- choose `drawer()` for supplemental detail or side work
- choose `modal()` for blocking review or confirmation
- choose the notification system for event messaging or recall

## What this example proves

- `tooltip()` with directional placement
- structured overlay content on the `Surface` path
- `compositeSurface()` for layering the tooltip over a rich background

[← Examples](../README.md)
