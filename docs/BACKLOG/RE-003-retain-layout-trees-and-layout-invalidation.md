# RE-003 — Retain Layout Trees and Layout Invalidation

Legend: [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

## Idea

Retain layout trees for active views and recompute them only when invalidated instead of treating layout as a transient rendering side effect.

## Why

Input routing, viewport ownership, anchoring, and overflow handling all need authoritative geometry.

## Likely scope

- define retained layout nodes and layout invalidation causes
- formalize resize/stretch/shrink/anchor rules
- define when layout is recomputed
- align viewport ownership with retained geometry
