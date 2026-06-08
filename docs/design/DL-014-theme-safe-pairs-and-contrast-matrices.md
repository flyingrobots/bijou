---
title: DL-014 Theme safe pairs and contrast matrices
legend: DL
lane: cool-ideas
priority: medium
github_issue: 314
keywords:
  - design-language
  - themes
  - tokens
  - contrast
  - accessibility
---

# DL-014 Theme safe pairs and contrast matrices

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

Theme contrast should be declared as a reusable design-system contract, not as
one-off test loops.

Safe pairs name which foreground token paths are expected to be readable on
which background token paths. The contract feeds `doctorTheme()`, DOGFOOD
theme tests, future Theme Inspector swatches, and lower-mode accessibility
reports.

The first runtime shape is intentionally compact:

```ts
const pairs = defineThemeSafePairs()
  .readable('semantic.primary', 'surface.primary.bg')
  .status('status.error', 'surface.overlay.bg')
  .chrome('ui.cursor', 'surface.secondary.bg')
  .build();
```

Safe-pair background paths may target a token foreground, such as
`surface.primary`, or a token background slot, such as `surface.primary.bg`.

## Sponsored Human

A designer-engineer wants DogFood and first-party themes to prove readable
foreground/background combinations so that theme retuning is a design exercise
instead of a screenshot guessing game.

## Sponsored Agent

An agent auditing a theme wants a stable matrix of safe token pairs so it can
identify whether a low-contrast failure is a broken theme value, a missing
token, or an unsupported pair that should not have been used by the component.

## Hill

Bijou can declare safe token pairs once, run the same contrast contract through
`doctorTheme()`, and reuse the resulting pair matrix in DOGFOOD and future
Theme Inspector UX.

## Playback Questions

1. Can a safe pair target `surface.*.bg` instead of only token foregrounds?
2. Does the safe-pair builder reject duplicate foreground/background
   declarations?
3. Can `doctorTheme()` validate a safe-pair matrix without bespoke test code?
4. Does DogFood publish its readable/status/chrome pair matrix from the theme
   module rather than hiding it in tests?
5. Can Theme Inspector later display the same pair facts without inventing a
   second contrast registry?

## Scope

This slice includes:

- `defineThemeSafePairs()` as a fluent builder for safe-pair declarations
- `readable`, `status`, and `chrome` pair classifications
- support for `.bg` color-slot paths in `doctorTheme()` contrast pairs
- DOGFOOD dark/light shell pair contracts
- focused tests proving the contract and DogFood usage

## Non-Goals

This slice does not implement the Theme Inspector drawer, retune the global
default theme values, or replace the legacy single-mode `Theme` interface.
Those are separate follow-on slices.

## Safe-Pair Vocabulary

`readable` pairs are ordinary text and component foregrounds that must stay
legible on a surface.

`status` pairs are process, health, timeline, or object-state foregrounds that
must stay legible when rendered on a surface.

`chrome` pairs are shell/runtime affordances such as cursor and focus chrome
that must remain recognizable on app surfaces.

The kind is not decorative metadata. Future inspectors and reports can group
failures by kind so a theme author can distinguish typography problems from
status-color problems.

## Runtime Contract

`defineThemeSafePairs()` returns a pure builder. Chained calls accumulate
immutable pair declarations. `build()` returns a frozen array of frozen pair
objects compatible with `ThemeContrastPair`.

Duplicate foreground/background pairs are rejected because duplicate pair rows
make reports and inspectors ambiguous.

`doctorTheme()` resolves contrast pair paths through concrete token color
slots:

- `semantic.primary` resolves to the token foreground color.
- `surface.primary` resolves to the surface token foreground color.
- `surface.primary.bg` resolves to the surface token background color.

Missing paths remain errors. Invalid colors remain invalid-color issues from
the normal token scan.

## DOGFOOD Matrix

DogFood declares its safe-pair matrix beside its shell themes.

Readable foregrounds:

```text
semantic.primary
semantic.muted
semantic.accent
semantic.info
semantic.success
semantic.warning
semantic.error
```

Status foregrounds:

```text
status.active
status.pending
```

Chrome foregrounds:

```text
ui.cursor
```

Background slots:

```text
surface.primary.bg
surface.secondary.bg
surface.elevated.bg
surface.overlay.bg
surface.muted.bg
```

That matrix intentionally proves the dense docs shell before broader component
retokenization. Additional first-party pairs should be added only when a
component needs them as a real contract.

## Accessibility / Assistive Reading Posture

Safe-pair checks do not make color sufficient as the only meaning carrier.
They prove that color, when present, remains readable. The same components
still need text, symbols, structure, or state labels that survive no-color,
pipe, and accessible output modes.

## Agent Inspectability / Explainability Posture

A future inspector can group safe-pair facts by pair kind:

```text
readable semantic.primary on surface.primary.bg: pass 15.20
status status.pending on surface.overlay.bg: pass 8.40
chrome ui.cursor on surface.secondary.bg: pass 7.10
```

If the renderer later preserves per-cell token provenance, an agent can compare
the token pair actually used by a cell against the declared safe-pair matrix.

## Localization / Directionality Posture

No localized strings are introduced by this design. Token paths and pair kinds
are stable developer identifiers and must not encode locale-specific prose or
physical direction.

## Linked Invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md): safe pairs are
  only useful when `doctorTheme()` proves them from concrete theme values.
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md):
  contrast is necessary, but color is not the only meaning carrier.
- [Tests Are The Spec](../invariants/tests-are-the-spec.md): the pair builder
  and DogFood matrix land through focused runtime tests.
- [Docs Are The Demo](../invariants/docs-are-the-demo.md): DOGFOOD consumes
  the same pair contract the docs describe.

## Acceptance Criteria

- `defineThemeSafePairs()` builds immutable safe-pair declarations.
- Duplicate foreground/background declarations fail deterministically.
- `doctorTheme()` validates `.bg` color-slot paths in contrast pairs.
- DOGFOOD exports `DOGFOOD_THEME_SAFE_PAIRS` from its shell theme module.
- DOGFOOD dark/light tests validate themes through the exported safe-pair
  contract.
- The roadmap links issue #314 under Design Tokens And Theme Modes.

## Tests To Write First

- Core theme doctor test for `.bg` safe-pair validation.
- Core safe-pair builder duplicate rejection test.
- DOGFOOD preview test that calls `doctorTheme()` with
  `DOGFOOD_THEME_SAFE_PAIRS`.
- Roadmap/spec regression that #314 remains linked to DL-013 planning.

## Retrospective

The important shape is the reusable contract. DogFood's earlier contrast proof
was correct, but the pair list was trapped inside tests. This slice turns those
pairs into design-system data so the next retuning pass can change colors with
objective proof.
