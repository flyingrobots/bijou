# DF-070 - DOGFOOD Block Product Polish

Linked legend: [DF - DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

## Sponsor Human

DOGFOOD should stop feeling like a contract debugger for Blocks and start
feeling like a terminal product authored from Blocks.

## Sponsor Agent

An agent should be able to inspect DOGFOOD and see that semantic Blocks own the
major product surfaces, while prose, navigation, preview, and settings behavior
remain observable through tests instead of hand-audited screenshots.

## Hill

DOGFOOD moves from "Blocks are documented here" toward "DOGFOOD is materially
built from Blocks." The first proof is product polish: word-aware prose
wrapping, block-owned documentation and navigation surfaces, block-owned
inspector/settings surfaces, and block/story preview parity without inventing
new provider, lifecycle, localization, or callback rules.

## Core Rule

Rendered DOGFOOD polish must consume existing contracts.

That means:

- prose wrapping belongs at text/prose boundaries, not arbitrary surface
  clipping
- Blocks own semantic product regions
- components remain the leaf rendering vocabulary
- localization goes through the localization port
- data flow stays unidirectional
- story and block previews should share the same shell assumptions

## Ten-Slice Plan

1. Refresh BEARING and cycle truth after DF-069 and DX-035 merged.
2. Add word-boundary prose wrapping behavior.
3. Route DOGFOOD prose surfaces through the word-aware wrapper.
4. Move `DocumentationArticleBlock` onto the real DOGFOOD article render path.
5. Move `NavigationListBlock` onto the real DOGFOOD navigation render path.
6. Move `GuideInspectorBlock` onto the real DOGFOOD inspector render path.
7. Move `SettingsMenuBlock` onto the real DOGFOOD settings surface.
8. Persist DOGFOOD's selected locale behind the existing localization boundary.
9. Expand localization catalog coverage for the block-authored surfaces touched
   by this cycle.
10. Align DOGFOOD Blocks preview and Storybook preview posture so both expose
    rendered product examples without debug-only wrapper clutter.

The cycle pauses after slice 5 for drift review before continuing.

## Non-Goals

- no new provider lifecycle system
- no hidden global block registry
- no broad visual redesign
- no conversion of every leaf component into a Block
- no AppFrame rewrite
- no localization runtime rewrite
- no tests that assert prose documentation wording instead of rendered behavior

## Tests To Write First

- behavior tests proving prose wrapping breaks at word boundaries where possible
- behavior tests proving DOGFOOD article/navigation surfaces use the same
  rendered output paths their Blocks publish
- behavior tests proving block discovery and preview indexing do not execute
  unrelated render paths
- behavior tests proving locale persistence and catalog coverage changes remain
  behind the localization port

## Retrospective

Not started.
