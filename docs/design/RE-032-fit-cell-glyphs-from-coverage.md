# RE-032 — Fit Cell Glyphs From Coverage

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Sponsor Human

A terminal app builder experimenting with alternatives to Braille for dense
procedural art, logos, minimaps, and shader previews.

## Sponsor Agent

An implementation agent that needs to collapse high-resolution cell coverage
into a reasonable glyph without inventing a one-off character heuristic inside
an app.

## Hills

1. A builder can sample a 2x4 cell and ask Bijou for the closest matching
   glyph instead of hard-coding Braille.
2. A builder can choose either geometry-aware Unicode candidates or a strictly
   ASCII density ramp for terminals with limited glyph support.
3. An agent can experiment with solid, hatch, slash, and density renderings of
   the same source coverage while keeping the fitting rule testable.

## Playback Questions

1. Does full 2x4 coverage choose a full block rather than a density fallback?
2. Does top-half coverage choose the upper-half block?
3. Does diagonal coverage choose a diagonal glyph when Unicode candidates are
   enabled?
4. Can a caller provide custom candidates and have exact coverage win?
5. Does ASCII mode stay inside plain ASCII characters?

## Requirements

- Export `fitCellGlyph()`, `CELL_GLYPH_UNICODE_CANDIDATES`, and
  `CELL_GLYPH_ASCII_DENSITY_RAMP` from `@flyingrobots/bijou-tui`.
- Accept eight numeric coverage samples in row-major 2x4 order.
- Clamp coverage values into `[0, 1]`.
- Score geometry candidates by mean squared error against the samples.
- Support `mode: 'unicode'` for block/line/diagonal candidates.
- Support `mode: 'ascii'` for a density-only ASCII ramp.
- Support explicit candidate overrides for app experiments.
- Keep this helper independent from `canvas()` so apps can opt into it without
  changing existing Braille behavior.

## Acceptance Criteria

- Red tests prove full-block, top-half, diagonal, custom-candidate, and ASCII
  density behavior.
- The implementation lives in `packages/bijou-tui/src/cell-glyph-fit.ts` and
  is exported from the package root.
- `npm run test -- packages/bijou-tui/src/cell-glyph-fit.test.ts
  packages/bijou-tui/src/index.test.ts` passes.
- `npm run lint --workspace @flyingrobots/bijou-tui` passes.
- `git diff --check` passes.

## Accessibility / Assistive Reading Posture

This helper only chooses display glyphs. Apps remain responsible for
non-visual labels or alternate views when glyph geometry carries meaning.

## Localization / Directionality Posture

Glyph fitting is independent of language and directionality. ASCII mode exists
for the most conservative terminal compatibility path.

## Agent Inspectability / Explainability Posture

The fitting rule must be data-driven: candidates expose their coverage masks,
and tests assert expected matches. Agents can explain a glyph choice as the
lowest mean squared error among candidate masks.

## Linked Invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)

## Implementation Outline

1. Add failing tests for block, half-block, diagonal, custom candidate, and
   ASCII density behavior.
2. Implement candidate masks and MSE scoring in `cell-glyph-fit.ts`.
3. Re-export the helper from `bijou-tui`.
4. Document the helper in the advanced guide and changelog.

## Tests To Write First

- `chooses a full block for full coverage`
- `chooses an upper-half block for top-half coverage`
- `chooses a diagonal glyph for diagonal coverage`
- `honors exact custom candidate matches`
- `uses only the ASCII density ramp in ascii mode`

## Drift Check

- RED observed:
  `npm run test -- packages/bijou-tui/src/cell-glyph-fit.test.ts
  packages/bijou-tui/src/index.test.ts` failed because
  `./cell-glyph-fit.js` did not exist and `fitCellGlyph` was not exported.
- GREEN observed:
  `npm run test -- packages/bijou-tui/src/cell-glyph-fit.test.ts
  packages/bijou-tui/src/index.test.ts` passed with 9 tests.
- Package lint observed:
  `npm run lint --workspace @flyingrobots/bijou-tui` passed.
- Root lint observed:
  `npm run lint` passed.
- Whitespace drift:
  `git diff --check` passed.
- Pre-commit lockfile gate:
  `npm ls --all` remains blocked by local install-tree drift unrelated to the
  glyph fitting helper.

## Playback

1. `chooses a full block for full coverage` proves exact dense coverage maps
   to `█`.
2. `chooses an upper-half block for top-half coverage` proves geometry beats a
   generic density choice.
3. `chooses a diagonal glyph for diagonal coverage` proves Unicode diagonal
   candidates are part of the fit set.
4. `honors exact custom candidate matches` proves app experiments can override
   the built-in candidates.
5. `uses only the ASCII density ramp in ascii mode` proves the conservative
   mode stays plain ASCII.

## Retrospective

This cycle gives apps an experiment hook without changing `canvas()` behavior.
Braille remains the high-density default, while `fitCellGlyph()` lets a caller
try solid, partial, diagonal, or ASCII-density collapse from the same 2x4
coverage samples. That is the right boundary for logo experiments because the
app can decide when visual smoothness matters less than a cleaner glyph shape.
