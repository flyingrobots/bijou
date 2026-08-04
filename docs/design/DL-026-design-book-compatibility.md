---
title: DL-026 Design Book Compatibility
legend: DL
lane: roadmap
priority: medium
github_issue: 498
status: shaping
keywords:
  - design-language
  - design-book
  - color
  - tokens
  - compatibility
---

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Purpose

What "Design Book compatible" means for Bijou, concretely enough to check.
This is the reference the colour campaign is measured against; the cycle plan
lives in [DL-023](./DL-023-sapphire-theme-system.md).

[Design Book](https://github.com/meodai/design-book) is **AGPL-3.0-only** and
Bijou is Apache-2.0 with zero runtime dependencies. Compatibility therefore
means *conformance to the model*, not linkage. Bijou reimplements the ideas in
its own code; Design Book is a specification and, in one bounded workspace, an
offline generator ([#498](https://github.com/flyingrobots/bijou/issues/498)).

## The Model, In One Paragraph

A token stores *how its value is chosen*, not a frozen value. Dependents
recompute when inputs change. Any token can explain why it holds what it
holds. Themes are scopes that inherit. Values are chosen by named decisions —
contrast, vividness, nearness, position — evaluated in a perceptual space.

## Conformance Matrix

Legend: **yes** shipped · **partial** shipped but unsound · **no** absent.

### 1. Token graph

| Capability | Design Book | Bijou | Gap |
| --- | --- | --- | --- |
| Reactive graph, dependents recompute | yes | **yes** `createTokenGraph()` | — |
| References between tokens | `ref()` | **yes** `{ ref }` | — |
| Introspection of a value's origin | `inspect()` | **yes** `inspect()` | — |
| Dependency graph exposed | `getDependencyGraph()` | **yes** `collectTokenDependents()` | — |
| Cycle detection | yes | **partial** resolution guards visited paths; no explicit report | worth an issue if it bites |
| Scope inheritance (`extends`) | yes | **partial** `{ light, dark }` per token; no scope-level inheritance | see *Scope inheritance* |
| Batch update / flush | yes | **no** | low value in a TUI; not planned |

### 2. Decision functions

| Capability | Design Book | Bijou | Gap |
| --- | --- | --- | --- |
| Highest contrast | `bestContrastWith` | **yes** | — |
| Minimum contrast | `minContrastWith` | **yes** | — |
| Most / least vivid | `mostVivid` | **partial** ranks by `max(r,g,b)-min(r,g,b)` | [#496](https://github.com/flyingrobots/bijou/issues/496) |
| Nearest colour | `closestColor` | **partial** ranks by squared sRGB distance | [#496](https://github.com/flyingrobots/bijou/issues/496) |
| Positional selection | `nth()` | **yes** `nthColor()` | — |
| Exclusion sets | `not:` | **yes** | — |
| Colour mixing | `colorMix()` | **partial** `mix` transform is sRGB | [#352](https://github.com/flyingrobots/bijou/issues/352) |
| Adaptive shade | `shade()` | **no** | [#352](https://github.com/flyingrobots/bijou/issues/352) |
| Per-channel relative edit | `relativeTo()` | **no** | [#352](https://github.com/flyingrobots/bijou/issues/352) |
| Ramp generation | `ramp()` | **no** | [#318](https://github.com/flyingrobots/bijou/issues/318) |

The vocabulary is almost complete. The maths under it is not.

### 3. Colour space

| Capability | Design Book | Bijou | Gap |
| --- | --- | --- | --- |
| Perceptual space (OKLCH/OKLAB) | via culori | **no** | [#352](https://github.com/flyingrobots/bijou/issues/352) |
| Gamut mapping | yes | **no** | [#352](https://github.com/flyingrobots/bijou/issues/352) |
| Circular hue interpolation | yes | **no** | [#352](https://github.com/flyingrobots/bijou/issues/352) |
| Perceptual distance (delta-E) | yes | **no** | [#352](https://github.com/flyingrobots/bijou/issues/352) |
| HSL conversion exposed | n/a | **partial** `rgbToHsl` exists but is not re-exported through `color.ts` | [#352](https://github.com/flyingrobots/bijou/issues/352) |

**This row is the campaign.** Every *partial* above resolves to the same
missing floor.

### 4. Output

| Capability | Design Book | Bijou | Gap |
| --- | --- | --- | --- |
| Design-token interop | W3C DTCG | **yes** `fromDTCG` / `toDTCG` | — |
| CSS variables | yes | **no** | out of scope; Bijou targets terminals |
| Dependency graph render | SVG | **partial** Theme Lab token graph | — |
| Terminal surfaces | n/a | **yes** | Bijou-specific |

### 5. Beyond Design Book

Terminal rendering imposes constraints Design Book never faces, and Bijou is
weaker here than the table above suggests.

| Capability | Bijou | Gap |
| --- | --- | --- |
| ANSI-256 / ANSI-16 downsample | **partial** mis-quantizes 112 of 256 channel values | [#499](https://github.com/flyingrobots/bijou/issues/499) |
| Contrast checking | **yes** WCAG 2.x | APCA is a possible future story |
| Colour vision deficiency | **no** | [#500](https://github.com/flyingrobots/bijou/issues/500) |
| Role collision detection | **yes** landed in DL-024 | — |
| Text modifiers as tokens | **yes** `modifiers` | ahead of Design Book |

## Scope Inheritance

Design Book models themes as scopes where `dark extends light` and unoverridden
tokens resolve through the parent, staying in the dependency graph.

Bijou models modes per token: `{ light: …, dark: … }`, resolved by a `mode`
argument. This is sufficient for two modes and gets awkward beyond that — a
third mode, or a brand variant of an existing mode, would mean widening every
adaptive definition rather than declaring one scope that inherits.

No issue filed. The current model is adequate for what Bijou ships, and the
cost of changing it is high. Worth revisiting only if a third mode or a
per-product brand variant becomes real.

## What "Levelling Up" Means, In Order

1. **[#352](https://github.com/flyingrobots/bijou/issues/352) — the perceptual floor.**
   OKLCH/OKLAB, gamut mapping, circular hue interpolation, delta-E. Nothing
   below this line can be done honestly without it, and six of the entries
   above resolve to it.
2. **[#496](https://github.com/flyingrobots/bijou/issues/496) — repoint the rules.**
   Vividness by chroma, nearness by delta-E. Vocabulary unchanged.
3. **[#318](https://github.com/flyingrobots/bijou/issues/318) — ramps and shades.**
   Cusp-aware `ramp()`, adaptive `shade()`, `relativeTo()`.
4. **[#497](https://github.com/flyingrobots/bijou/issues/497) — rebuild the presets.**
   One hue anchor, derived rather than typed, role collisions resolved.
5. **[#499](https://github.com/flyingrobots/bijou/issues/499) — fix the downsample.**
   Independent of the above and can land any time; it is the last stage before
   pixels and currently discards palette quality.
6. **[#500](https://github.com/flyingrobots/bijou/issues/500) — CVD checking.**
   Contrast is necessary and not sufficient; `success`/`error` is the canonical
   failure and nothing checks it.
7. **[#495](https://github.com/flyingrobots/bijou/issues/495) — advice and generation.**
   The payoff: tell an author a colour is a bad idea, and propose better ones.

Surfaces ([#494](https://github.com/flyingrobots/bijou/issues/494),
[#317](https://github.com/flyingrobots/bijou/issues/317),
[#311](https://github.com/flyingrobots/bijou/issues/311)) run in parallel; they
make the work visible but do not depend on it.

## The One-Line Summary

Bijou already has Design Book's *model*. What it lacks is Design Book's
*mathematics* — and every interesting thing on this page is downstream of
adding it.
