# RE-010 — Scope Mutable Surface Caches

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Problem

Two module-level mutable variables cache Surface objects across
frames:

- `composedFrameScratch` in `app-frame.ts:675`
- `focusedPaneMeasureScratch` in `app-frame-actions.ts:54`

If any code path mutates the returned surface after the cache check,
the mutation corrupts the cache for subsequent frames. This is a
latent state-corruption bug.

## Fix

Scope caches to the `createFramedApp` closure (not module-level) to
prevent cross-instance contamination. Consider a ScratchPool class
that clears and returns owned surfaces, cloning on checkout if the
surface will be mutated externally.

## Effort

Small — move variables into the closure and add a dimension check.
