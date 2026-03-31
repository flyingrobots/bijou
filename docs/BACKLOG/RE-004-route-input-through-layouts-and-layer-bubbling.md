# RE-004 — Route Input Through Layouts and Layer Bubbling

Legend: [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

## Idea

Route input events through the retained layouts of the current view stack, topmost layer first, with explicit block/pass-through semantics.

## Why

Current shell routing still mixes layer metadata with branch-ordered mouse/key special cases.

## Likely scope

- define layout-driven hit testing
- define topmost-first routing
- define blocking vs bubbling
- ensure topmost blocking views prevent lower layouts from receiving the same input
