---
title: DL-025 Theme Lab Specimen And Probe
legend: DL
lane: roadmap
priority: medium
github_issue: 315
status: shaping
keywords:
  - design-language
  - theme-lab
  - blocks
  - inspector
  - design-book
  - v9.0.0
---

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Linked Work

- Colour campaign: [DL-023](./DL-023-sapphire-theme-system.md)
- Provenance landed: [DL-024](./DL-024-theme-lab-design-book-provenance.md)
- Theme lab and preset gallery:
  [#315](https://github.com/flyingrobots/bijou/issues/315)
- Pointer probe: [#317](https://github.com/flyingrobots/bijou/issues/317)
- Theme inspector drawer:
  [#311](https://github.com/flyingrobots/bijou/issues/311)
- Rampensau generator: [#318](https://github.com/flyingrobots/bijou/issues/318)
- Developer log drawer: [#493](https://github.com/flyingrobots/bijou/issues/493)

## Decision Summary

The Theme Lab should stop being a page *about* a theme and become a page
*wearing* one: a realistic application layout, assembled from standard Blocks,
that repaints as the theme is edited — with the editor able to say when a
chosen colour is a bad idea, and to propose ones that are not.

Four workstreams. Two are buildable now; two are blocked on perceptual colour
maths that does not exist yet, and saying otherwise would be dishonest.

## Current Truth

DL-024 gave the lab a live preview, but that preview is a strip of five
components chosen to be compact. It answers "do the status roles differ" and
nothing else. It cannot show whether a theme survives contact with a real
layout — nested surfaces, dense tables, chrome against content, a focused pane
beside an unfocused one — which is where theme bugs actually live.

The repository already has the vocabulary this needs. Twenty-seven standard
Block factories ship today, including `appShellBlock`, `readerSurfaceBlock`,
`inspectorPanelBlock`, and the component families: `activityStreamBlock`,
`denseComparisonBlock`, `hierarchyBlock`, `explorationListBlock`,
`pathProgressBlock`, `singleChoiceBlock`, `multipleChoiceBlock`,
`binaryDecisionBlock`, `textEntryBlock`, `progressIndicatorBlock`,
`inlineStatusBlock`, `brandEmphasisBlock`, and more. A specimen app can be
composed from these rather than hand-drawn, which also means the specimen
exercises the Block contracts as a side effect.

What does not exist is any basis for judging a colour. `mostVivid` ranks by
`max(r,g,b) - min(r,g,b)`, `closestColor` ranks by squared sRGB distance, and
there is no perceptual space, no gamut awareness, and no chroma. "Design Book
would have beef with this colour" is not a statement Bijou can currently make.

## Workstreams

### A. Block-composed specimen (buildable now)

Replace the five-component strip with a specimen application composed from
standard Blocks: a shell with navigation, a reader surface, a dense table, a
status list, form controls, and an inspector panel — rendered through a context
cloned onto the draft theme, exactly as the current preview is.

The specimen is the deliverable that makes every other workstream judgeable,
and it needs nothing that does not already exist.

Open question: whether the specimen lives in the Theme Lab pane, or becomes a
full-page mode the lab switches into. A half-width pane may be too small to
show a layout honestly.

### B. Colour advice (blocked on DL-023 phase 1)

Mark an edited colour as not recommended, with a reason. Candidate checks, all
of which need OKLCH:

- contrast against the surfaces the token actually renders on
- chroma beyond what the sRGB gamut can hold at that lightness, which clips
- lightness too close to a neighbouring role to stay distinguishable
- collision with a role that must stay tellable apart, which
  [DL-024](./DL-024-theme-lab-design-book-provenance.md) can already detect

This cannot ship before the perceptual floor. An advisor built on
`max(r,g,b) - min(r,g,b)` would be confidently wrong, which is worse than
silent.

### C. Recommended-colour generation (blocked on DL-023 phases 1 and 3)

Propose colours that pass the checks in B rather than only flagging failures:
a cusp-aware ramp for the hue, adaptive shades, and harmony-aware suggestions
that avoid perceptually muddy regions. This is the substance of
[#318](https://github.com/flyingrobots/bijou/issues/318).

### D. Element provenance (partly specified already)

Two shapes were proposed, and they are not alternatives so much as two
densities of the same idea.

**Pointer probe.** Hover draws a box around the element under the cursor and a
drawer reports the Block, component, and token behind it; Blocks and components
are selectable. This is [#317](https://github.com/flyingrobots/bijou/issues/317)
essentially verbatim, already milestoned for `v9.0.0`.

**Inline token annotations.** Elements render with a `[token]` tag attached,
turning the whole surface into a legend at once. Cheaper than the probe, needs
no mouse, works in a screenshot or a recorded tape, and shows every element
simultaneously rather than one at a time. It is worse for dense layouts, where
the annotations will not fit.

Recommendation: build the annotation mode first as a debug render flag, since
it is cheap and immediately useful for the specimen in A, and treat the pointer
probe as the richer follow-on it is already scoped to be.

## Sequencing

```text
DL-023 phase 1 (OKLCH floor, #352)
  -> B colour advice
    -> C recommended generation (#318)

A Block-composed specimen  ---- independent, buildable now
  -> D1 inline [token] annotations
    -> D2 pointer probe (#317)
```

A and D1 can proceed immediately. B and C wait on #352, which raises its
priority: it is now the gate on the two most interesting parts of this vision,
not merely a tidy-up of two ranking functions.

## Non-Goals

- No `design-book` runtime dependency. It remains a specification and an
  offline generator, per DL-023.
- No replacement of the existing Theme Inspector drawer in this campaign;
  [#311](https://github.com/flyingrobots/bijou/issues/311) owns that surface.
- No claim that a colour is "recommended" until there is perceptual maths
  behind the claim.

## Tests To Write First

1. The specimen composes only from published Block definitions.
2. The specimen repaints when the draft theme changes — assert on cell colours,
   not on ANSI text.
3. Every specimen region resolves its colours from tokens; no raw hex.
4. Annotation mode labels an element with the token that produced it.
5. Annotation mode is off by default and changes no default render.
6. An advisor verdict cites the check it failed and the measured value.
