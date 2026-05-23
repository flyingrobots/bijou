# DF-069 - Block-Authored DOGFOOD

Linked legend: [DF - DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

## Sponsor human

DOGFOOD should prove that Bijou applications can be authored from Blocks, not
only that Blocks can be previewed inside DOGFOOD.

## Sponsor agent

An agent should be able to inspect DOGFOOD and identify the semantic blocks
that make up the product surface without reverse-engineering bespoke render
helpers.

## Hill

DOGFOOD becomes a block-authored application at the semantic surface boundary:
title screen, shell regions, navigation, articles, settings, story previews,
block previews, and inspector panes are declared as Blocks. Components remain
the lower-level rendering vocabulary inside those Blocks.

## Core Rule

Blocks own product semantics. Components own leaf rendering.

That means this work should create and consume Blocks for surfaces such as:

- `TitleScreenBlock`
- `NavigationListBlock`
- `DocumentationArticleBlock`
- `SettingsMenuBlock`
- `StorybookWorkbenchBlock`
- `BlockPreviewBlock`
- `GuideInspectorBlock`

It should not wrap every `boxSurface()`, `markdown()`, or list row in a Block.

## Architecture

The target composition is:

```text
DOGFOOD app
  -> AppFrame / AppShell composition
    -> page and region Blocks
      -> components
        -> surfaces
```

The existing unidirectional data-binding rule still applies:

```text
business logic / providers
  -> immutable snapshots
  -> binding frames
  -> blocks and views render
  -> command intents
  -> business logic owns the next state
```

Block-authored DOGFOOD must not introduce hidden provider registries, callback
backchannels, render-time refresh hooks, mutable view stores, or direct provider
reads from rendering code.

## Storybook Implication

The standalone Storybook app should stop being a parallel bespoke TUI. It
should use the same framed shell path as DOGFOOD and expose a
`StorybookWorkbenchBlock` contract so story preview work exercises the product
composition model.

## Non-goals

- no full visual redesign of DOGFOOD
- no attempt to convert every low-level component into a Block
- no new provider lifecycle system
- no new localization runtime
- no hidden global block registry
- no rendered AppShell policy invented outside existing contracts

## Accessibility / Assistive Posture

Block-authored DOGFOOD should make semantic regions easier to lower across
interactive, static, pipe, and accessible modes. Blocks should preserve facts
about navigation, content, settings, previews, and inspector state without
requiring agents or assistive modes to parse terminal art.

## Localization / Directionality Posture

Blocks should receive localized labels and copy through DOGFOOD's localization
port, not through direct catalog access. Block metadata may describe the
surface, but runtime-visible labels remain localized app data.

## Agent Inspectability / Explainability Posture

Agents should be able to ask which DOGFOOD Blocks are active, what data
requirements they declare, which command intents they expose, and which surface
they render into.

## Linked Invariants

- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)
- [Commands Change State, Effects Do Not](../invariants/commands-change-state-effects-do-not.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)

## Implementation Outline

1. Update BEARING so the next product gravity is block-authored DOGFOOD.
2. Add DOGFOOD-local block registry helpers for semantic app surfaces.
3. Add `StorybookWorkbenchBlock` and move Storybook toward the framed shell.
4. Add DOGFOOD Blocks for title, navigation, documentation article, settings,
   block preview, and guide inspector surfaces.
5. Prove the block-authored registry without rendering every block during
   discovery.
6. Keep visual changes incremental and scoped.

## Tests To Write First

- behavior tests proving the Storybook app is framed rather than bespoke
- behavior tests proving DOGFOOD block registry discovery does not call render
- behavior tests proving core DOGFOOD surfaces have Block definitions
- behavior tests proving localization and command intent boundaries stay
  declarative

## Playback

DF-069A lands the block-authored DOGFOOD contract layer:

- DOGFOOD has a local, branded `DogfoodBlockRegistry`.
- Registry discovery rejects loose block-shaped objects.
- Registry discovery records surface ownership without calling `render()`.
- Storybook now has a `StorybookWorkbenchBlock` contract and the interactive
  Storybook entrypoint uses the AppFrame shell.
- DOGFOOD surface blocks now cover title, navigation, documentation article,
  block preview, guide inspector, settings, and Storybook workbench surfaces.

## Retrospective

This slice deliberately stops at semantic surface contracts and the Storybook
frame migration. It does not rewrite every DOGFOOD renderer yet, does not move
provider lifecycle policy, and does not convert leaf components into Blocks.

The final review gate also tightened the DOGFOOD i18n debt scanner so framed
Storybook machine tokens such as key names, event discriminants, mode literals,
pane overflow policy, tones, and internal thrown errors do not count as visible
English copy. Storybook labels and rendered text still count as localization
debt until they move behind a localization port.
