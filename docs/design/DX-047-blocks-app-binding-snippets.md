---
id: DX-047
title: Blocks App Binding Snippets
status: active
lane: asap
priority: medium
github_issue: 342
legend: DX
---

# DX-047 - Blocks App Binding Snippets

Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)

## Decision Summary

DOGFOOD's Blocks docs should show how a block becomes application code, not
only how a block is described as metadata. For `v7.2.0`, the bounded repair is
to add an app-binding walkthrough centered on the existing `CounterDemoBlock`
fixture:

- show the block contract: model, config, data requirement, and command intents
- show the application state/update path that owns counter state
- show how keyboard actions become command-intent emissions
- show how the app renders the block from model-owned state
- prove the snippet is not stale by compiling a canonical source file and
  testing that the rendered docs fence matches it exactly

## Sponsored Human

A release-video viewer needs to understand why Blocks are reusable product
assemblies rather than screenshots or one-off demos. The Blocks page should let
the presenter say "this is how you wire one into your app" without leaving
DOGFOOD.

## Sponsored Agent

An agent needs a deterministic docs witness that can inspect the Blocks section
and verify that the app-binding example names the real API pieces: block config,
state ownership, command intents, update routing, render invocation, and
lower-mode expectations.

## Hill

After this cycle, a developer can open DOGFOOD's Blocks section and see a
complete, real app-binding snippet for `CounterDemoBlock`, including the state
and command routing that make the block interactive.

## Problem

Issue #342 came from the `v7.1.0` release-video rehearsal. The Blocks section
now has useful catalog and preview surfaces, but it still reads like a product
taxonomy. It does not yet answer the practical developer question:

```text
How do I bind this block to my application's state and commands?
```

The current "How to Make Your Own Blocks" page shows block authoring metadata
and a minimal `defineBlock()` shape. It does not show the application side of
the contract: TEA state, update routing, render-time config, and command-intent
handling.

## Scope

- Add a focused app-binding section to the Blocks docs.
- Use `CounterDemoBlock` as the first example because it already proves bounded
  state, command intents, interaction keys, and lower-mode output in DOGFOOD.
- Keep the code snippet small enough to read inside the terminal.
- Back the snippet with deterministic tests so API names and command paths do
  not drift silently.
- Update release-facing signposts and changelog entries for #342.

## Non-Goals

- Do not redesign BlockLab.
- Do not build a code editor or tutorial runner.
- Do not pull broad #302 Runtime Graph / Scene IR product-contract work into
  this cycle.
- Do not add a new production counter block. `CounterDemoBlock` remains a
  DOGFOOD fixture.
- Do not rewrite the standard block catalog.

## User Experience Contract

The Blocks docs should show both sides of a block contract:

- the reusable block owns metadata, data requirements, command intents, render
  contract, and lower-mode behavior
- the application owns model state, update decisions, host data, and when to
  invoke the block

The snippet should be readable in DOGFOOD at normal release-video dimensions.
It should not require a browser, external docs page, or source-code search to
explain the basic integration path.

## Playback Questions

- Can a viewer see where counter state lives?
- Can a viewer see which key emits which command intent?
- Can a viewer see that the block render input is built from app-owned state?
- Can a viewer see how lower modes stay meaningful when interaction is absent?
- Can a test fail if the docs remove the binding path or let the snippet drift
  away from real APIs?

## Accessibility / Assistive Posture

The binding explanation must be useful as text. Code snippets and prose should
not rely on color-only emphasis. The lower-mode note should explain what pipe
and accessible output preserve from the interactive block.

## Localization / Directionality Posture

This cycle adds English-source documentation copy only. DOGFOOD already labels
English-source Markdown under non-English locales; this cycle should preserve
that behavior. No new right-to-left layout behavior is introduced.

## Agent Inspectability / Explainability Posture

Agents should be able to inspect:

- the rendered Blocks docs text
- the exact snippet source text
- whether the snippet references real exported `CounterDemoBlock` helpers
- whether the snippet names command-intent routing and lower-mode output

The proof should not depend on screenshots.

## Linked Invariants

- Blocks are product-level assemblies, not leaf visual components.
- Application state owns business data; block render functions consume
  explicit inputs.
- Command intents describe user intent; applications interpret and apply those
  intents.
- DOGFOOD release claims must be demonstrable inside DOGFOOD.

## Implementation Outline

1. Add a reusable app-binding snippet source for `CounterDemoBlock` at
   `examples/docs/content/blocks-counter-app-binding.snippet.ts`.
2. Render that exact snippet in `examples/docs/content/blocks-make-your-own.md`;
   generated copies must derive from the canonical snippet source.
3. Add prose explaining app-owned state, command intent routing, render-time
   config, and lower-mode output.
4. Add focused tests that render the Blocks guide and assert the app-binding
   section is visible and legible.
5. Add compile and source-integrity tests so the snippet cannot drift from the
   canonical source file or the real helper API.
6. Update `docs/CHANGELOG.md`, `docs/BEARING.md`, and `docs/ROADMAP.md`.

## Tests To Write First

- A DOGFOOD Blocks render test fails unless "How to Make Your Own Blocks"
  includes a visible `CounterDemoBlock` app-binding section.
- A snippet integrity test fails unless the documented code matches the
  canonical source file and references the real counter model, config,
  command-intent, update, and render helpers.
- Existing CounterDemoBlock preview and intent-key tests continue to pass.

## Acceptance Criteria

- Blocks docs include at least one complete app-binding snippet.
- The snippet uses real Bijou / DOGFOOD APIs from a canonical source file and is
  covered by deterministic type and source-integrity proof.
- Interactive block docs explain state ownership and command routing.
- DOGFOOD renders the snippet legibly in the Blocks section.
- The release/video script can explain "how to use this in your app" from the
  Blocks docs alone.
- Issue #342 is closed by the implementation PR.

## Retrospective

To be completed when the PR lands.
