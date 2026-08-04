---
title: DL-023 Sapphire Theme System
legend: DL
lane: roadmap
priority: medium
github_issue: 352
status: shaping
keywords:
  - design-language
  - color
  - oklch
  - theme-tokens
  - light-dark
  - v9.0.0
---

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Linked Work

- Foundation story: [#352](https://github.com/flyingrobots/bijou/issues/352)
  — expose public color-space conversion and circular blending helpers
- Generator story: [#318](https://github.com/flyingrobots/bijou/issues/318)
  — Rampensau-inspired Bijou theme generator
- Theme lab: [#315](https://github.com/flyingrobots/bijou/issues/315)
- Inspector drawer: [#311](https://github.com/flyingrobots/bijou/issues/311)
- Inspector pointer probe:
  [#317](https://github.com/flyingrobots/bijou/issues/317)
- Drawer-led chroma and focus language:
  [#455](https://github.com/flyingrobots/bijou/issues/455)
- Theme hotkey affordance:
  [#336](https://github.com/flyingrobots/bijou/issues/336)
- External model: [Design Book](https://github.com/meodai/design-book) by
  meodai, version `0.5.0`, **AGPL-3.0-only**
- Sibling application of that model:
  `profunctoroptics/website` `src/palette.js`

## Decision Summary

Bijou will rebuild its first-party light and dark themes as one **derived
system anchored on a single sapphire brand hue**, replacing hand-picked
per-mode hex literals with perceptual ramps and decision rules.

Three decisions frame the campaign.

1. **Design Book is a specification and an offline generator, never a
   runtime dependency.** It is AGPL-3.0-only; `@flyingrobots/bijou` is
   Apache-2.0 and published to npm. It will be installed as a
   `devDependency` in a private, non-published workspace that emits token
   data as a build artifact. Generated values are committed; the generator
   is never linked into shipped code.
2. **The brand hue is sapphire, OKLCH hue `255`.** This is continuity, not
   a repaint: today's `brand.primary` already measures `h=257.5` in dark
   and `h=255.8` in light. The campaign makes that hue systematic and
   derived instead of hand-tuned per mode.
3. **The decision vocabulary already exists and is kept.** The work is
   replacing the sRGB math underneath it, not replacing the model.

## Current Truth

Bijou already implements most of Design Book's model natively in
Apache-2.0 code. `createTokenGraph()` is a reactive graph with dependency
tracking, cache invalidation, subscriptions, and `inspect()`. Its
`ColorDefinition` union already supports raw hex, `{ ref, transform }`,
and adaptive `{ light, dark }`. `theme-rules.ts` already exports `scope`,
`tokenCandidate`, `colorCandidate`, `bestContrastWith`, `minContrastWith`,
`mostVivid`, `leastVivid`, `closestColor`, and `nthColor`. `BIJOU_DARK`
already resolves `semantic.accent` through a real `mostVivid(...)` rule
with a `minContrast` gate and a `not` exclusion list.

The gap is underneath that vocabulary. Four concrete defects:

- **Vividness is not chroma.** `scoreThemeRuleCandidate` ranks
  `mostVivid` / `leastVivid` by `max(r,g,b) - min(r,g,b)`, which is RGB
  range, not perceptual chroma. Saturated yellow and saturated blue score
  identically despite very different perceived vividness.
- **Nearest colour is not perceptual.** `closestColor` uses squared
  Euclidean distance in sRGB rather than a ΔE in OKLAB.
- **No perceptual space at all.** Every transform (`lighten`, `darken`,
  `saturate`, `desaturate`, `complementary`, `mix`) is sRGB or HSL.
  `hslToRgb` and `hue2rgb` are private to `color.part02.ts`, and
  `rgbToHsl` is exported from `color.part01.ts` but not re-exported
  through the `color.ts` facade, so it is effectively private too. That
  private-helper gap is the literal subject of #352.
- **No ramp and no adaptive shade.** There is no ramp primitive and no
  `shade()` that flips darken/lighten based on input lightness, so light
  and dark presets are maintained as two independent hex sets.

Two collisions exist in the shipped presets today:

- `BIJOU_LIGHT` sets `brand.primary` and `brand.info` to the identical
  literal `#285c9e`, so the two roles are indistinguishable in light mode.
- The light surface family is warm cream (`#fbf7ea`, `h=92.7`) while the
  brand is cool blue. That warm/cool split is deliberate and must survive
  the migration; it is not drift to be normalised away.

## Measured Constraints

All values below are computed against sRGB with a chroma-preserving gamut
clamp that holds lightness and hue. They are the reason the campaign is
staged the way it is.

**The sRGB gamut shell at hue 255** peaks at a cusp of `L=0.62`,
`Cmax=0.204`. Chroma falls away steeply on both sides — at `L=0.94` only
`C=0.029` is achievable, and at `L=0.30` roughly `C=0.10`.

A naive constant-chroma ramp therefore cannot be honest. Requesting a flat
`C=0.14` across eleven stops silently clamps at seven of them:

| Stop | L | Result | Requested `C=0.14` |
| --- | --- | --- | --- |
| 50 | 0.97 | `#eff6ff` | clamped to `0.014` |
| 100 | 0.94 | `#dfedff` | clamped to `0.029` |
| 200 | 0.87 | `#b8d7ff` | clamped to `0.065` |
| 300 | 0.78 | `#85baff` | clamped to `0.114` |
| 400 | 0.66 | `#5294e6` | held |
| 500 | 0.55 | `#3072c1` | held |
| 600 | 0.47 | `#155aa7` | held |
| 700 | 0.39 | `#004387` | clamped to `0.128` |
| 800 | 0.31 | `#002f62` | clamped to `0.102` |
| 900 | 0.23 | `#001c3f` | clamped to `0.076` |
| 950 | 0.16 | `#000d23` | clamped to `0.053` |

The ramp primitive must therefore taper chroma along a cusp-aware path
rather than request a constant the gamut cannot supply.

**No single stop serves both modes.** Measuring each stop against the
shipped surfaces — light `#fbf7ea`, dark `#171827` — shows one crossover
band and no overlap at AA:

| Stop | On light | On dark |
| --- | --- | --- |
| 300 | 1.87 | 8.75 AA |
| 400 | 2.91 | 5.63 AA |
| 500 | **4.55 AA** | 3.60 (large only) |
| 600 | 6.42 AA | 2.55 |
| 700 | 9.10 AA | 1.80 |

Stop `500` is the only stop passing AA on light, and it fails AA on dark.
This is empirical proof that role binding must stay mode-dependent — which
is what the existing `{ light, dark }` definitions and `minContrastWith`
rules already express. The architecture is correct; the inputs are not.

## Roadmap

Six phases. Phase 1 is additive and independently landable; everything
after it depends on it.

### Phase 1 — Perceptual colour floor (#352)

Land OKLAB/OKLCH as public, documented, tested colour math in
`@flyingrobots/bijou`, with zero runtime dependencies.

- `oklch()` / `oklab()` conversions both directions, plus the existing
  `rgbToHsl` / `hslToRgb` promoted to the public `color.ts` facade.
- Chroma-preserving gamut mapping that holds `L` and `h` and reduces `C`
  toward the shell, never clipping RGB channels.
- Circular hue interpolation with explicit shorter/longer path selection.
- Weighted blending in a caller-chosen space, distinct from the existing
  token-preserving `mix()`.
- `deltaEOk` for perceptual distance.

Acceptance is the issue's own criteria plus: hue wraparound, grayscale
`C=0` edge cases, out-of-gamut requests, and clamping are all covered by
tests written first.

### Phase 2 — Repoint the decision rules onto that floor

Swap the metrics in `theme-rule-metrics.ts` without changing any rule
signature or preset authoring surface.

- `mostVivid` / `leastVivid` rank by OKLCH chroma, not RGB range.
- `closestColor` ranks by `deltaEOk`, not squared sRGB distance.
- Existing preset snapshots are expected to move. Every changed hex is
  reviewed and justified in the PR, not silently re-baselined.

### Phase 3 — Ramp and adaptive shade primitives (#318)

- A cusp-aware `ramp()` producing the `50…950` stop family, tapering
  chroma along the gamut shell instead of requesting a flat constant.
- `shade()` that flips darken/lighten from the input's own lightness, so
  one authored rule works in both modes.
- `relativeTo()` for per-channel OKLCH edits.
- RampenSau-style hue/lightness/chroma trajectories with easing, which is
  what #318 asks for, expressed over the Phase 1 floor.

### Phase 4 — Rebuild the first-party presets on sapphire

- `BIJOU_LIGHT` and `BIJOU_DARK` become one authored system anchored on
  hue `255`, with per-mode role binding retained.
- Resolve the `brand.primary` / `brand.info` literal collision in
  `BIJOU_LIGHT`.
- Preserve the warm-cream light surface family; the warm/cool split is
  intentional.
- Verify every foreground/background pair at AA in both modes, and verify
  the ANSI-256 and ANSI-16 downsample paths still separate the roles.

### Phase 5 — Offline generation workspace

- Private, non-published workspace with `design-book` as a
  `devDependency`, marked `"private": true`.
- Emits committed token data; the generator never enters the shipped
  dependency graph of any published package.
- A test asserts no published `package.json` reaches `design-book`, so the
  licence boundary is enforced by the suite rather than by convention.

### Phase 6 — Operator surfaces (#315, #311, #317, #455, #336)

Theme lab, preset gallery, inspector drawer, pointer probe for token
provenance, drawer-led chroma language, and the theme hotkey. These are
the v9.0.0 Product Workbench surfaces and land last, because they are
worth building only on top of a system whose values are derived and whose
provenance `inspect()` can explain.

## Scope

Phases 1 through 5, plus the design and issue grooming for Phase 6.

## Non-Goals

- No new runtime dependency for any published package.
- No replacement of the token graph, the rule vocabulary, or the preset
  authoring surface. This campaign changes the maths beneath them.
- No APCA migration. Contrast stays WCAG 2.x for now; APCA is a separate
  story if it is wanted.
- No conversion of the legacy `CYAN_MAGENTA` or `TEAL_ORANGE_PINK`
  presets. They remain as-is for compatibility.
- No DOGFOOD visual redesign beyond what the preset rebuild implies.

## Release Disposition

Every linked issue currently sits in `v9.0.0`, which
[BEARING](../BEARING.md) reserves for Product Workbench and operator
surfaces after V8 stabilises the source/artifact/IR contract.

Phase 1 is additive, dependency-free, and touches no V8 surface, so it can
land ahead of that order without disturbing the V8 contract. Phases 2
through 5 should be sequenced against V8 closeout. Phase 6 stays in
`v9.0.0` behind the workbench.

This ordering is a proposal against the standing roadmap, and it should be
confirmed before Phase 2 begins rather than assumed.

## Accessibility And Assistive Posture

Contrast is a gate, not a report. Every semantic foreground/background
pair ships with a verified AA ratio in both modes, and the measured
crossover above is the reason role binding stays mode-dependent. The
ANSI-256 and ANSI-16 downsample paths are part of the acceptance surface,
because a brand that separates roles in truecolor and collapses them at 16
colours has not shipped.

## Agent Inspectability And Explainability Posture

`inspect()` already returns `{ kind, path, mode, hex, dependencies }`.
Once values are derived rather than literal, that output becomes a real
explanation of why a colour won — which is the precondition for the #317
provenance probe. Rule inspection must therefore keep reporting the
candidate set, the winning candidate, and the score that selected it.

## Tests To Write First

1. OKLCH round-trip within tolerance across the sRGB cube.
2. Gamut mapping holds `L` and `h` and only reduces `C`.
3. Hue interpolation wraps correctly across `0°`/`360°` in both
   directions.
4. `mostVivid` ranks by OKLCH chroma — a fixture where RGB range and
   perceptual chroma disagree must select the perceptual winner.
5. `closestColor` ranks by ΔE — a fixture where sRGB distance and ΔE
   disagree must select the perceptual winner.
6. `ramp()` output is monotonic in lightness and stays in gamut at every
   stop.
7. `shade()` is direction-correct from both a light and a dark input.
8. Every `BIJOU_LIGHT` / `BIJOU_DARK` semantic pair meets AA in its own
   mode.
9. `BIJOU_LIGHT` `brand.primary` and `brand.info` resolve to distinct
   values.
10. No published package resolves `design-book` at any depth.
