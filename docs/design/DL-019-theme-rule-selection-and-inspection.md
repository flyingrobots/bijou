---
id: DL-019
title: Theme Rule Selection And Inspection
status: active
lane: cool-ideas
priority: medium
github_issue: 444
legend: DL
---

# DL-019 - Theme Rule Selection And Inspection

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

Bijou should adopt the strongest ideas from reactive design-token systems
without importing an incompatible dependency or replacing the existing runtime
theme contract.

The runtime truth remains:

```text
Theme
  -> ResolvedTheme
    -> TokenGraph
      -> ThemeAccessors
        -> terminal cells, lower modes, and DTCG interop
```

This cycle adds a Bijou-native rule layer for theme authoring and inspection:

- selector rules such as best contrast, minimum contrast, most vivid, least
  vivid, closest color, and ordered choice
- explicit candidate exclusions for reserved roles such as success and error
- structured inspection facts explaining why a rule chose a token
- dependency facts that Theme Inspector and tests can consume later
- compiled output that remains a normal Bijou `Theme` or token graph entry

No `design-book` runtime, dev, peer, optional, or generated dependency is added.
The external package is useful prior art, but its license and general CSS
surface do not belong in Bijou's Apache-2.0 zero-dependency core.

## Sponsored Human

A Bijou theme author wants to tune primitive palettes while keeping semantic
roles stable. They should be able to say "choose readable text for this
surface" or "choose a vivid accent that is not success or error" instead of
manually maintaining every derived hex value.

## Sponsored Agent

An agent auditing theme behavior wants deterministic facts for rule inputs,
candidate rejection, selected values, dependencies, and contrast proof so it
can explain a theme without sampling screenshots or guessing from final RGB
values.

## Hill

A Bijou theme author can define semantic theme roles through pure selector
rules, replay the product questions below with tests, compile the rules into
the existing theme/token graph contract, and inspect which candidates were
considered, rejected, and selected.

## Playback Questions

- Can a semantic foreground choose a readable color from a primitive palette
  without hard-coding the final hex value?
- Can a vivid accent selector exclude reserved success and error roles while
  still proving contrast against its surface?
- Can `TokenGraph.inspect()` explain every candidate read by a rule, including
  selected, eligible, excluded, invalid, and contrast-failed candidates?
- Can malformed rule inputs fail with the missing target, scope, candidate, or
  exclusion path instead of silently choosing a surprising color?
- Can the rule layer preserve existing `TokenGraph.get()` behavior for callers
  that only need a resolved `TokenValue`?

## Current Truth

Bijou already has:

- a public `Theme` contract with `semantic`, `surface`, `border`, `ui`,
  `status`, and `gradient` token families
- a `TokenGraph` with references, light/dark definitions, transforms, cache
  invalidation, and subscribers
- `defineTheme()` for mode-aware token themes
- `fromDTCG()` and `toDTCG()` for token document interop
- `doctorTheme()` and `defineThemeSafePairs()` for concrete contrast checks
- DOGFOOD Theme Lab and Theme Inspector surfaces for concrete token facts

The missing piece is rule provenance. Today a derived token can be encoded as a
manual hex, a direct reference, or a transform. It cannot yet say:

- choose the highest-contrast color from this palette
- choose the first color that reaches a contrast floor
- choose the most vivid color that is still readable
- exclude reserved role tokens from an accent search
- explain which candidates failed and why

## Problem

Manual semantic token maintenance creates drift:

- a primitive palette can change while semantic foregrounds stay stale
- a vivid accent may accidentally reuse a destructive or success role
- contrast proof happens after values are chosen instead of during selection
- Theme Inspector can show final values but not why those values won
- tests can assert concrete hex values but not the decision rule behind them

The answer is not to replace Bijou's runtime theme model. The runtime model
already encodes terminal-specific facts: `NO_COLOR`, foreground/background
tokens, text modifiers, RGB caches, ANSI downsampling, lower-mode behavior, and
safe-pair checks.

## Scope

This cycle adds pure core support for rule-based color selection and inspection.

Included:

- color candidate scopes represented as token paths or explicit color values
- selector functions for contrast, vividness, closeness, ordered position, and
  minimum contrast
- explicit `not` exclusions by token path
- selector result facts with candidate pass/fail reasons
- dependency extraction for references and candidate scopes
- `TokenGraph` support for rule definitions if that can land without breaking
  existing callers
- focused tests for selection, exclusion, dependency, and cycle behavior
- design-system docs and changelog notes

Out of scope:

- no external `design-book` package integration
- no CSS renderer
- no typography, spacing, motion, or duration token categories
- no Figma adapter
- no Theme Lab redesign in this slice
- no element-level renderer provenance
- no app-frame theme-mode UX changes

## API Direction

The first public API should be small and structural. Exact names can move in
implementation, but the shape should stay close to this:

```ts
const graph = createTokenGraph({
  palette: {
    ink: "#0b1020",
    paper: "#f8fafc",
    cyan: "#38bdf8",
    green: "#22c55e",
    red: "#ef4444",
  },
  surface: {
    primary: { fg: "#f8fafc", bg: { ref: "palette.ink" } },
  },
  semantic: {
    primary: bestContrastWith(
      { ref: "surface.primary.bg" }, // token background slot
      scope("palette"),
    ),
    accent: mostVivid(scope("palette"), {
      against: { ref: "surface.primary.bg" },
      minContrast: 4.5,
      not: ["palette.green", "palette.red"],
    }),
  },
});
```

If the fluent helper API is too large for the first slice, the serialized graph
definition may use plain discriminated data instead:

```ts
semantic: {
  primary: {
    rule: "best-contrast-with",
    target: { ref: "surface.primary.bg" },
    candidates: { scope: "palette" },
  },
}
```

Slot-path references ending in `.bg` are part of this cycle's contract. A
reference such as `{ ref: "surface.primary.bg" }` resolves the background color
of the `surface.primary` token while `{ ref: "surface.primary" }` keeps the
existing foreground-reference behavior.

The graph should expose inspection facts separately from resolved values:

```ts
const fact = graph.inspect("semantic.accent", "dark");
```

The returned fact should be structured enough for tests and future Theme
Inspector rows:

```text
semantic.accent
  rule: most-vivid
  selected: palette.cyan (#38bdf8)
  dependencies: surface.primary.bg, palette.ink, palette.paper, palette.cyan,
    palette.green, palette.red
  rejected:
    palette.paper - eligible, not selected
    palette.green - excluded
    palette.red - excluded
    palette.ink - contrast below 4.5
```

## Selector Vocabulary

The initial selector vocabulary should cover the high-value color decisions.
Selectors that compare against a target put the target first. Selectors that
rank only a candidate collection put the collection first.

`bestContrastWith(target, candidates)` chooses the candidate with the highest
contrast ratio against the target. Equal scores keep candidate order.

`minContrastWith(target, candidates, { ratio })` chooses the first candidate
that clears the requested contrast ratio, using deterministic candidate order.

`mostVivid(candidates, options)` chooses the highest-chroma candidate, with
optional `against`, `minContrast`, and `not` constraints. First-slice chroma is
the deterministic RGB channel spread: `max(red, green, blue) - min(red, green,
blue)`. If `minContrast` is present, `against` is required.

`leastVivid(candidates, options)` chooses the lowest-chroma candidate, with the
same optional constraints and the same `minContrast` rule.

`closestColor(target, candidates)` chooses the closest candidate to a target
color. The first slice uses squared RGB distance and keeps candidate order for
equal distances.

`nthColor(candidates, index)` chooses a candidate by ordered position. Integer
indices use array-style ordering, negative integers count from the end, and
out-of-range integers clamp to the nearest valid candidate. Fractional indices
clamp to `0` through `1` and use `round((length - 1) * index)`.

## Runtime Contract

Selectors are pure. They do not read process state, filesystem data, terminal
facts, or clocks.

Selector helpers return plain `ThemeColorRuleDefinition` data. The token graph
evaluates that intermediate rule definition, and the existing `TokenGraph.get()`
path still returns a resolved `TokenValue`.

Rule failures are deterministic:

- missing target, explicit candidate, candidate-scope, and exclusion paths throw
  with the missing path
- vividness selectors throw when `minContrast` is set without `against`
- no minimum-contrast candidate throws unless the selector defines an explicit
  fallback
- cycles remain cycle errors

Inspection dependencies include target and `against` references plus every
candidate path read from explicit candidate lists or scopes, whether the
candidate was selected, eligible-but-not-selected, excluded, invalid, or below
the contrast floor.

## Accessibility And Assistive Posture

Selector rules improve color quality, but they do not make color sufficient as
the only meaning carrier. The same graceful-lowering rule applies:

- no-color output must keep text, symbols, or structure
- pipe output must not depend on swatches
- accessible output must name state and intent

Contrast-aware selection is proof that a chosen color is readable when color is
available. It is not proof that the UI is accessible by itself.

## Localization And Directionality Posture

No user-facing localized copy is required for the core rule primitives. Rule
ids, token paths, candidate paths, and inspection facts are developer-facing
identifiers.

Future DOGFOOD Theme Inspector prose that explains rule facts must flow through
the DOGFOOD localization catalog. Token paths remain stable identifiers and are
not localized.

## Agent Inspectability / Explainability Posture

Inspection facts are a first-class product requirement. An agent should be able
to assert:

- which selector rule resolved a token
- which references and candidate scopes the rule read
- which candidate won
- which candidates were rejected
- whether a candidate failed contrast, was excluded, or was the wrong type
- which downstream token paths depend on the resolved token

These facts should not require terminal rendering, screenshot analysis, or RGB
equality guessing.

## Linked Invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md): resolved values
  and inspection facts come from executing the graph.
- [Tests Are the Spec](../invariants/tests-are-the-spec.md): selector behavior
  lands through deterministic tests before docs claims.
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md):
  color quality does not replace lower-mode structure.
- [Docs Are the Demo](../invariants/docs-are-the-demo.md): future Theme Lab
  surfaces should consume the same inspection facts tests assert.

## Implementation Outline

1. Add selector definition types to the core theme graph.
2. Collect deterministic candidates from explicit paths and scopes.
3. Implement contrast, vividness, closeness, and ordered selection helpers.
4. Expose `TokenGraph.inspect()` or an adjacent pure inspection API.
5. Preserve existing `TokenGraph.get()` behavior for raw, ref, mode, and
   transform definitions.
6. Wire the new types and helpers into the theme barrel and root package.
7. Document the recipe pattern in the design-system theme authoring docs.
8. Record the shipped behavior in `docs/CHANGELOG.md`.

## Tests To Write First

- `bestContrastWith()` chooses the readable foreground from a candidate scope.
- `minContrastWith()` rejects candidates below the minimum ratio and selects
  the first passing candidate.
- `mostVivid()` respects `against`, `minContrast`, and `not` exclusions.
- `leastVivid()` chooses the muted readable candidate.
- `closestColor()` and `nth()` are deterministic.
- selector definitions participate in graph dependency inspection.
- circular selector references still fail deterministically.
- existing graph reference and transform tests keep passing.

## Acceptance Criteria

- Bijou has no dependency on `design-book`.
- Theme selectors are pure core functions.
- Token graph rule definitions resolve to existing `TokenValue` objects.
- Inspection facts explain selected and rejected candidates.
- Exclusions by token path prevent reserved roles from winning accent rules.
- The new API exports from `@flyingrobots/bijou`.
- Design-system docs show the primitive -> semantic rule -> UI token workflow.
- Local validation includes focused theme tests, `npm run typecheck:test`,
  `npm run lint`, `npm run code-dojo:changed`, and `git diff --check`.
- Code Dojo debt remains verifiable through `npm run code-dojo:debt` and
  `npm run code-dojo:verify`; this cycle does not claim the repo goalpost
  unless that aggregate report reaches `112` or lower.

## Retrospective

To be completed when the cycle lands.
