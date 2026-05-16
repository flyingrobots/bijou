# RE-031 — Raytrace Shader Kernel

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Sponsor Human

A Bijou app builder creating title screens, procedural previews, or small
shader-driven scenes in terminal cells.

## Sponsor Agent

An implementation agent that needs to author terminal ray scenes without
copying vector math, camera rays, sphere intersections, and reflection helpers
into each app.

## Hills

1. A builder can import a tiny raytrace kernel from `@flyingrobots/bijou-tui`
   and use it inside `canvas()` shaders without pulling in an external 3D
   engine.
2. A builder can keep app-specific material and lighting decisions local while
   sharing the boring, error-prone geometry math.
3. An agent can factor a title-screen ray tracer into reusable Bijou helpers
   without turning Bijou into a full scene graph or renderer.

## Playback Questions

1. Can a caller create a look-at camera ray whose center sample points from
   the camera origin to the target?
2. Can the kernel report the first positive sphere hit with correct distance,
   hit point, and surface normal?
3. Can the kernel compare supported shapes and return the nearest hit?
4. Can reflection math be reused by app-specific lighting code without the app
   reimplementing vector operations?

## Requirements

- Export `RaytraceVector3`, `RaytraceRay`, `RaytraceSphere`,
  `RaytracePlane`, `RaytraceShape`, and `RaytraceHit` types from
  `@flyingrobots/bijou-tui`.
- Export pure vector helpers for add, subtract, scale, dot, cross, normalize,
  reflect, and mix-in camera composition.
- Provide a `raytraceLookAtRay()` helper that builds a normalized ray from an
  origin, target, screen coordinate, and focal length.
- Provide a `raytraceOrbitCameraRay()` helper for the common orbiting title
  screen camera pattern.
- Provide `raytraceSphereHit()`, `raytracePlaneHit()`, and
  `raytraceNearestHit()` primitives.
- Keep lighting, materials, shadows, and palette decisions out of this cycle.

## Acceptance Criteria

- Red tests prove camera center direction, sphere hit facts, nearest-hit
  selection, and reflection behavior.
- The implementation lives in `packages/bijou-tui/src/raytrace.ts` and is
  exported from the package root.
- `npm run test -- packages/bijou-tui/src/raytrace.test.ts
  packages/bijou-tui/src/index.test.ts` passes.
- `npm run lint --workspace @flyingrobots/bijou-tui` passes.
- `git diff --check` passes.

## Accessibility / Assistive Reading Posture

This is a math helper and does not change terminal output by itself. Apps using
it remain responsible for plain-text fallbacks and for not relying on decorative
motion as the only information channel.

## Localization / Directionality Posture

The kernel is independent of prose localization and text direction.

## Agent Inspectability / Explainability Posture

The helper names should expose the geometric truth directly. Agents should be
able to answer whether a title scene uses Bijou's shared hit math or app-local
lighting by reading imports and tests.

## Linked Invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)

## Implementation Outline

1. Add failing tests for look-at camera rays, sphere hits, nearest hits, and
   reflection.
2. Implement a focused raytrace helper module in `bijou-tui`.
3. Re-export the helper from the package root.
4. Document the intended boundary in the advanced guide and changelog.

## Tests To Write First

- `builds a normalized look-at camera ray`
- `reports the first positive sphere hit`
- `selects the nearest supported shape hit`
- `reflects a ray across a surface normal`

## Drift Check

- RED observed:
  `npm run test -- packages/bijou-tui/src/raytrace.test.ts
  packages/bijou-tui/src/index.test.ts` failed because `./raytrace.js` did
  not exist and `raytraceLookAtRay` was not exported.
- GREEN observed:
  `npm run test -- packages/bijou-tui/src/raytrace.test.ts
  packages/bijou-tui/src/index.test.ts` passed with 7 tests.
- Package lint observed:
  `npm run lint --workspace @flyingrobots/bijou-tui` passed.
- Root lint observed:
  `npm run lint` passed after the pre-existing local heatmap workspace drift
  was repaired.
- Whitespace drift:
  `git diff --check` passed.
- Pre-commit lockfile gate:
  `npm ls --all` remains blocked by local install-tree drift unrelated to the
  raytrace helper.

## Playback

1. `builds a normalized look-at camera ray` proves the center ray points from
   camera origin to target.
2. `reports the first positive sphere hit` proves sphere distance, point, and
   normal facts.
3. `selects the nearest supported shape hit` proves shape comparison across
   the supported primitive set.
4. `reflects a ray across a surface normal` proves the reflection helper used
   by app-owned lighting code.
5. `re-exports raytrace shader helpers from the package root` proves package
   ergonomics for single-import shader authoring.

## Retrospective

This cycle intentionally stopped at geometry. Bijou now owns the reusable
camera and intersection math that canvas shader authors are likely to copy
between apps, while app code still owns visual taste: material colors, theme
lookups, specular strength, reflections, shadows, and palette decisions. That
keeps the helper useful for jedit-style title scenes without turning Bijou into
a general-purpose renderer.
