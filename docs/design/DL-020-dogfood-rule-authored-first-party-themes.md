---
id: DL-020
title: Dogfood Rule-Authored First-Party Themes
status: active
lane: cool-ideas
priority: medium
github_issue: 446
legend: DL
---

# DL-020 - Dogfood Rule-Authored First-Party Themes

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

DL-019 added Bijou-native theme selector rules and inspection facts. This cycle
uses that system inside Bijou's own first-party defaults instead of keeping the
new rule layer as a demo-only API.

The public runtime contract remains unchanged:

```text
rule-authored preset definitions
  -> TokenGraph
    -> concrete Theme
      -> ResolvedTheme
        -> terminal rendering, DTCG interop, and inspectors
```

No external design-token dependency is introduced. The work is a narrow dogfood
pass over Bijou-owned themes only.

## Sponsored Human

A Bijou theme maintainer wants to adjust primitive palette choices and trust the
system to derive readable semantic roles, accents, borders, and UI affordances
without manually copying final hex values across every token family.

## Sponsored Agent

An agent auditing first-party themes wants deterministic provenance facts for
why default theme tokens were selected, so it can review rule behavior instead
of reverse-engineering intent from literal hex equality.

## Hill

`bijou-dark` and `bijou-light` are authored from primitive palette definitions
plus selector rules, materialize to the existing `Theme` shape, and expose rule
inspection facts that explain their first-party semantic choices.

## Playback Questions

- Can Bijou-owned defaults use selector rules while preserving the public
  `Theme` object shape and registry keys?
- Can tests prove first-party semantic choices through `TokenGraph.inspect()`
  rather than only final hex assertions?
- Can DTCG round trips, resolver behavior, RGB caches, and gradient consumers
  keep working with compiled rule-authored presets?
- Can third-party and legacy themes stay literal compatibility fixtures in this
  slice?

## Scope

Included:

- a small first-party preset authoring layer that compiles token graph
  definitions into `Theme`
- rule-authored `bijou-dark` and `bijou-light`
- tests for compiled values, registry identity, and rule inspection provenance
- docs/changelog updates that make dogfooding explicit

Out of scope:

- external `design-book` integration
- public breaking changes to `Theme`
- rewriting `cyan-magenta`, `teal-orange-pink`, `nord`, or `catppuccin`
- Theme Lab UI redesign

## Runtime Contract

Preset compilation must be pure and deterministic. It cannot read process state,
terminal facts, filesystem data, clocks, or network data.

The compiled object remains a normal `Theme`. Existing consumers can continue to
read `theme.semantic.primary.hex`, `theme.status.success`, `theme.gradient`, and
surface tokens without knowing how first-party themes were authored.

The preset authoring layer records the original rule definitions against the
compiled `Theme` identity. `createResolved()` uses those definitions when
present, so `ResolvedTheme.tokenGraph` remains rule-authored for first-party
presets. Cloned themes and DTCG imports fall back to concrete token graphs.

Tests may assert rule ids, selected candidate paths, dependencies, and selected
hex values from the same resolved graph inspectors consume.

## Accessibility And Assistive Posture

This slice improves color choice but does not make color the only carrier of
meaning. Existing labels, text structure, `NO_COLOR` behavior, and lower-mode
rendering remain the accessibility contract.

## Localization And Directionality Posture

This slice does not add DOGFOOD user-facing copy. Rule ids, token paths, design
document prose, and changelog entries are developer-facing documentation and
stable identifiers. Future DOGFOOD UI that renders these facts must use the
localization catalog.

## Agent Inspectability / Explainability Posture

The primary agent-facing value is provenance. An audit should be able to inspect
`semantic.accent` and `decision.primaryText`, see the selector rule, enumerate
candidates, and explain exclusions without comparing screenshots or final hex
equality.

## Implementation Outline

1. Add a small preset compiler that materializes graph definitions into `Theme`.
2. Move `bijou-dark` and `bijou-light` into rule-authored preset modules.
3. Preserve first-party rule definitions through `createResolved()`.
4. Keep literal legacy and third-party presets unchanged.
5. Update docs and changelog after the tests prove the behavior.

## Tests To Write First

- a red provenance test showing literal defaults expose `token` inspection
  instead of `rule`
- a dark-theme accent test proving `most-vivid` selects `brand.accent`
- a light-theme primary text test proving `min-contrast-with` selects
  `ink.primary`
- existing preset and DTCG tests proving resolved values stay compatible

## Retrospective / Closeout Notes

Close this cycle when CI is green, CodeRabbit is green, review threads are
resolved, and the PR summary records the rule probe values.

## Linked Invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md): compiled presets
  and inspection facts come from executing the graph.
- [Tests Are the Spec](../invariants/tests-are-the-spec.md): dogfood behavior
  lands through deterministic tests.
- [Docs Are the Demo](../invariants/docs-are-the-demo.md): the docs record that
  Bijou's defaults use the system they document.
