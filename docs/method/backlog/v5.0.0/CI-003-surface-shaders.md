---
title: CI-003 — Surface Shaders (CRT / Scanlines)
lane: v5.0.0
---

# CI-003 — Surface Shaders (CRT / Scanlines)

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

Add a "Post-Process" middleware to `@flyingrobots/bijou-tui`'s render pipeline that operates directly on the final byte-buffer before it is diffed and emitted. This middleware could simulate:

- CRT scanlines (alternating row brightness/dimming)
- Scanline flicker (subtle per-frame variation)
- Signal static / noise (random cell or byte corruption)
- "Vignette" effects (darkening edges of the terminal)

## Why

1. **Expressivity**: It pushes the "high-fidelity" aesthetic to its limit, giving Bijou apps a distinct feel that is both professional and nostalgic.
2. **Low-Allocation Performance**: Since the pipeline is byte-packed, these effects can be implemented using zero-allocation loops on typed arrays.
3. **Product Differentiation**: It shows that the terminal can be an expressive visual medium, not just a static character grid.

## Effort

Medium — requires adding the middleware and a set of byte-manipulation shaders for common effects.
