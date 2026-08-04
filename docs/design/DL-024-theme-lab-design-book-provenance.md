---
title: DL-024 Theme Lab Design Book Provenance
legend: DL
lane: roadmap
priority: medium
github_issue: 317
status: active
keywords:
  - design-language
  - theme-lab
  - provenance
  - token-graph
  - design-book
---

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Linked Work

- Colour campaign: [DL-023](./DL-023-sapphire-theme-system.md)
- Prior Theme Lab cycles: [DL-019](./DL-019-theme-rule-selection-and-inspection.md),
  [DL-021](./DL-021-dogfood-theme-token-usage-proof.md),
  [DL-022](./DL-022-theme-lab-editor-graph-ux.md)
- Provenance probe story:
  [#317](https://github.com/flyingrobots/bijou/issues/317)
- External model: [Design Book](https://github.com/meodai/design-book), used as
  specification only — it is AGPL-3.0-only and never enters the shipped
  dependency graph.

## Decision Summary

The DOGFOOD Theme Lab keeps its editor, and gains the part of Design Book's
model it was missing: tokens that can **explain themselves**.

Design Book's central claim is that a token should store *how its value is
chosen*, that dependents recompute from that, and that `inspect()` can say why
a value won. Bijou already implements all three — `createTokenGraph()`,
the `mostVivid` / `minContrastWith` rule vocabulary, and a rule inspection that
returns the rule, the selected candidate, every rejected candidate, and the
score and contrast each was ranked on.

The Theme Lab used none of it. This cycle connects them.

## Current Truth

Three defects, each a consequence of the one before it.

**Provenance was unreachable.** `compileRuleAuthoredPreset` retains authoring
definitions in a `WeakMap` keyed on the theme object. DOGFOOD built its shell
themes with `structuredClone`, which produces a theme that renders identically
but resolves to `undefined` in that registry. Every rule, candidate set, and
dependency edge behind `DOGFOOD_DARK_THEME` was therefore invisible to the app
editing it.

**So the graph was hand-maintained.** With the real edges unreachable,
`app-theme-lab-graph.ts` declared them in a frozen table beside the editor, and
`app-theme-lab-editor-write.ts` re-declared the same relationships again as a
propagation `switch`. Two hand-written copies of something the token graph
already knew.

**So the graph drifted.** Read back from the real definitions, the table was
wrong in six of its eight rows. It claimed `semantic.primary` fed
`surface.primary` and `ui.tableHeader` (they depend on `decision.primaryText`),
that `border.primary` fed `ui.scrollThumb` (it references `brand.primary`), and
that `ui.cursor` fed a token called `focus.current` — which does not exist
anywhere in `Theme`. It also missed a real and load-bearing edge:
`surface.primary.bg` feeds `semantic.accent`, because the accent rule gates its
candidates on contrast against the background. Change the surface and the
accent can re-decide. The drawn graph never said so.

## What Landed

**A rename that keeps provenance.** `renameRuleAuthoredTheme(theme, name)` is
public alongside `ruleAuthoredDefinitions(theme)`. DOGFOOD's shell themes use
it, so the lab can now inspect the theme it is editing.

**Edges read back out of the graph.** `collectTokenDependents()` and
`collectTransitiveTokenDependents()` invert what `inspect()` already reports.
The frozen table is gone. Edges are transitive, because the editor's question
is "what moves if I change this" — editing `status.success` changes
`semantic.success`, which changes `border.success`, and all three belong on
screen.

**A provenance panel: "Why this value".** For the selected token it reports the
rule that chose it, every candidate that rule weighed, each candidate's score
and contrast ratio, and whether it won, lost, or was excluded — each row
carrying its own swatch, because the point of showing a candidate set is that
the rejected colours are visible. Referenced tokens report what they defer to.
Literals report that they are literals, which is itself the finding: a literal
cannot re-decide when the palette moves.

## Deliberate Consequence

The panel displays `score 149` for the winning accent candidate. That is
`max(r,g,b) - min(r,g,b)` for `#f2c45d` — the sRGB-range stand-in for chroma
that [DL-023](./DL-023-sapphire-theme-system.md) phase 2 replaces. Surfacing
the real ranking number rather than a flattering one is the intent. A lab that
hides the metric cannot be used to fix the metric.

## Non-Goals

- No OKLCH editing yet. The channel nudger stays on RGB until DL-023 phase 1
  lands a perceptual floor; editing L/C/H over sRGB maths would be theatre.
- No replacement of the hand-written propagation `switch` in
  `app-theme-lab-editor-write.ts`. Reading edges from the graph is done;
  driving *writes* through the graph is a larger change and belongs with the
  phase 4 preset rebuild.
- No `design-book` dependency, at runtime or otherwise, in this cycle.

## Tests To Write First

1. Provenance is recoverable from a first-party preset.
2. Provenance survives a rename, and the rename does not alias the source.
3. Provenance reaches the DOGFOOD shell themes.
4. Rule inspection reports the rule, the winner, and the full candidate set
   with its exclusions.
5. Dependents match the real consumers of `semantic.accent`.
6. A token nothing references reports no consumers — the `focus.current`
   regression.
7. No dependents map entry names a token that does not exist.
8. Transitive closure reaches `border.success` from `status.success`.
9. The panel distinguishes rule, reference, and literal.
10. The panel explains rather than throws for a token field with no rule.

## Follow-Up

- Localization keys `themeLab.provenance.*` ship with English fallbacks only;
  catalogue translations are outstanding.
- `app-theme-lab-editor-write.ts` still encodes propagation by hand. It should
  be driven by the same graph, tracked with the DL-023 phase 4 rebuild.
