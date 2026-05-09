---
title: DF-053 Audit motion and shader effects family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - motion
---

# DF-053 Audit motion and shader effects family across real surfaces

## Framing

Motion and shader effects have become a real authoring surface, not a demo
side quest. `canvas()` now has quad, Braille, and glyph-fit resolution modes,
the raytrace helpers are available for app-owned shader scenes, and spring
animation is stable under slow terminal pulses.

The DOGFOOD docs still treat that family as a small animated field. That is too
thin for current repo truth. The story should prove the full family against real
runtime behavior instead of trusting isolated fixtures or prose alone.

## Sponsored Users

- TUI app authors who want expressive terminal visuals without inventing their
  own canvas, ray, or animation substrate.
- Documentation readers evaluating whether motion, shader, and transition
  effects lower honestly across rich, static, pipe, and accessible output.
- Maintainers who need regression tests that keep examples, docs, and exported
  APIs aligned as the rendering stack evolves.

## Hills

1. A TUI app author can inspect one DOGFOOD story and see `canvas()` cover quad,
   Braille, glyph-fit, and raytrace-backed shader output without local hacks.
2. A docs reader can switch the same story across rich, static, pipe, and
   accessible profiles and get truthful lowerings instead of decorative glyphs
   leaking into constrained modes.
3. A maintainer can run a focused cycle test that proves `canvas()`, transition
   shaders, `animate()`/spring motion, and `timeline()` remain represented by
   real examples and DOGFOOD previews.

## Playback Questions

- Does the motion/shader DOGFOOD story include variants for shader waves,
  Braille fields, glyph-fit raytraced surfaces, and spring/timeline motion
  orchestration?
- Do pipe and accessible previews describe the state-change meaning without
  relying on Braille, block, or ornamental shader characters?
- Does a static profile render a deterministic visual snapshot that still
  exercises the shader path?
- Do example sources for transitions and spring animation compile against the
  current public API surface?

## Requirements

- Keep the existing motion/shader story identity and coverage family id.
- Add real story variants instead of only expanding prose.
- Use the current `canvas()` API, including `resolution: 'glyph'`, for at least
  one DOGFOOD preview.
- Use exported raytrace helpers inside the DOGFOOD preview so the raytrace
  kernel is proven from a real docs surface.
- Represent spring motion and `timeline()` together in a deterministic preview.
- Keep pipe and accessible lowerings textual and meaning-first.
- Repair any stale example code uncovered by the audit.

## Acceptance Criteria

- `tests/cycles/DF-053/motion-shader-dogfood-audit.test.ts` fails before the
  DOGFOOD story and stale example are updated.
- The motion/shader story exposes `shader-wave`, `braille-field`,
  `glyph-raytrace`, and `spring-timeline` variants.
- Rendering every motion/shader variant in `interactive`, `static`, `pipe`, and
  `accessible` story profiles produces non-empty output.
- Pipe and accessible variants avoid Braille and block-art glyph leakage.
- The spring example no longer passes removed `animate()` options.

## Implementation Outline

- Expand `motionPreview()` so it can render wave, Braille, glyph-raytrace, and
  spring/timeline previews from one helper.
- Import the needed public `bijou-tui` helpers through the package surface
  rather than private module paths.
- Add DF-053 cycle tests that render the DOGFOOD story through the story
  protocol instead of snapshotting internals.
- Remove stale spring-example drift discovered during the audit.

## Drift Check

- `examples/docs/stories.ts` now imports `bijou-tui` from the workspace source
  barrel so DOGFOOD tests read current package truth instead of stale ignored
  `dist/` artifacts.
- `examples/spring/main.ts` still demonstrated `animate()` with a removed `fps`
  option; the audit repaired that example while keeping the same runtime story.
- No follow-on backlog item is needed for this slice. The remaining broader
  opportunity is to add a dedicated visual capture for the motion/shader story,
  but the current tests already prove static, pipe, accessible, and rich-story
  rendering.

## Playback

- RED: `tests/cycles/DF-053/motion-shader-dogfood-audit.test.ts` failed on the
  missing story variants, incomplete related-family docs, and stale spring
  example option.
- GREEN: the motion/shader story now renders `shader-wave`, `braille-field`,
  `glyph-raytrace`, and `spring-timeline` variants across every documented
  profile.
- The glyph raytrace preview uses `canvas()` with `resolution: 'glyph'` and
  the exported raytrace helpers.
- The spring/timeline preview uses the exported motion timeline and spring
  stepping helpers to produce a deterministic frame.
- Pipe and accessible previews lower to explicit text without Braille or block
  glyph leakage.

## Retrospective

- The real drift was not in `canvas()` this time; it was DOGFOOD breadth. The
  docs surface had not caught up with the rendering primitives already landed.
- The source-barrel import is important for this repo because `dist/` is ignored
  and can lag behind source during active cycles.
- Testing the story protocol directly is a better guard than static prose checks:
  it proves variants render through the same path the docs app uses.
