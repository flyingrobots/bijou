---
title: DX-046 GraphQL Authored DOGFOOD Block Fixture
legend: DX
lane: asap
priority: high
github_issue: 329
parent_issue: 302
status: landed
keywords:
  - developer-experience
  - dogfood
  - graphql
  - blocks
  - ir
  - debug-facts
  - v7.1.0
---

# DX-046 GraphQL Authored DOGFOOD Block Fixture

Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)

## Linked Work

- User story: [#329](https://github.com/flyingrobots/bijou/issues/329)
- Parent tracker: [#302](https://github.com/flyingrobots/bijou/issues/302)
- Prior slice:
  [DX-045 GraphQL Block Groups And Debug Facts](./DX-045-graphql-block-groups-and-debug-facts.md)
- Runtime seed:
  [DX-042 Shared UI Scene IR And Bijou Render Target](./DX-042-shared-ui-scene-ir-and-bijou-render-target.md)
- Portable endpoint direction:
  [DX-043 Portable Bijou Blocks And Multi-Endpoint IR](./DX-043-portable-bijou-blocks-and-multi-endpoint-ir.md)
- DOGFOOD surface block lineage:
  [DF-030 Dogfood Docs Surface Block](./DF-030-dogfood-docs-surface-block.md)

This cycle is the narrow `v7.1.0` implementation item. It must not move the
broad #302 tracker out of `Beyond`; #329 carries the release-scoped DX-046
proof.

## Decision Summary

DX-044 and DX-045 proved that constrained GraphQL SDL can produce
`bijou-block/1`, lower into `ui-scene-ir/1`, render terminal proof, and emit
`graphql-bijou-block-debug/1` facts. DX-046 turns that compiler proof into a
real DOGFOOD product fixture.

The first DOGFOOD target is `NavigationListBlock` from
`examples/docs/dogfood-blocks.ts`. It is small enough for a release-boundary
slice but real enough to carry product semantics: navigation items, selection
state, command intents, i18n text, token styling, group structure, terminal
proof, and debug facts.

The useful flow is:

```text
NavigationListBlock GraphQL SDL fixture
  -> bijou-block/1 grouped artifact
    -> ui-scene-ir/1
      -> terminal Surface proof
        -> graphql-bijou-block-debug/1 facts
          -> DOGFOOD product facts
```

## Sponsored Human

A maintainer wants the post-V7 GraphQL block compiler to prove it can describe
an actual DOGFOOD surface, not only synthetic release-card examples.

A DOGFOOD reader benefits because the docs navigation surface becomes
inspectable from one source contract instead of only from runtime rendering
code.

## Sponsored Agent

An agent wants to trace one DOGFOOD navigation field from SDL through
`bijou-block/1`, `ui-scene-ir/1`, terminal cells, lower modes, debug summary
facts, and receipt hashes without scraping screenshots or reconstructing
product intent from rendered text.

## Hill

Given a checked-in GraphQL SDL fixture for `NavigationListBlock`, Bijou can
compile it into a deterministic grouped `bijou-block/1` artifact, lower it into
a valid `ui-scene-ir/1` scene, render terminal proof, and emit
`graphql-bijou-block-debug/1` facts that preserve source maps, token refs,
i18n keys, actions, bindings, groups, lower-mode witnesses, and hashes.

## Playback Questions

- Which DOGFOOD product surface is now authored as GraphQL SDL?
- Can a maintainer prove that the fixture is tied to the existing
  `docs.navigation` registry entry and `NavigationListBlock` component name?
- Can one SDL field be traced through artifact field, scene node, terminal
  cell source map, lower-mode row, debug fact, and receipt dependency?
- Can debug facts list the DOGFOOD groups, fields, i18n keys, token refs,
  action ids, binding ids, lower-mode hashes, artifact hash, and scene hash?
- Can failure tests reject missing or broken product facts before terminal
  proof is generated?

## Scope

- Add a checked-in GraphQL SDL fixture for `NavigationListBlock`.
- Keep the fixture inside the Bijou repository and inside the existing
  constrained compiler path.
- Compile the fixture with `compileGraphqlBijouBlock()`.
- Lower the artifact with `lowerBijouBlockToUiScene()`.
- Render deterministic terminal proof with `lowerUiSceneToTerminalProof()`.
- Assert `createGraphqlBijouBlockDebugSummary()` facts for the real DOGFOOD
  surface.
- Add tests that bind the fixture to `defaultDogfoodBlockRegistry` and the
  existing `docs.navigation` surface.
- Update changelog and issue/PR evidence.

## Non-Goals

- Do not require Wesley or Geordi repository changes.
- Do not migrate all DOGFOOD blocks to GraphQL.
- Do not rewrite the DOGFOOD navigation runtime or docs app.
- Do not introduce a general GraphQL parser or resolver runtime.
- Do not create BlockLab, Theme Lab, localization workbench, or a browser
  endpoint.
- Do not move parent issue #302 out of the `Beyond` milestone.

## Fixture Contract

The fixture should live at
`examples/docs/fixtures/graphql/navigation-list.graphql` unless implementation
finds a stronger local convention.

Expected SDL shape:

```graphql
type DogfoodNavigationList
  @bijouBlock(id: "dogfood.navigation", component: "NavigationListBlock")
  @bijouTarget(kind: "bijou-terminal", cols: 80, rows: 8)
  @bijouGroup(id: "dogfood.navigation.header", label: "Header", x: 1, y: 0, width: 46, height: 2)
  @bijouGroup(id: "dogfood.navigation.items", label: "Items", x: 1, y: 2, width: 46, height: 5) {
  title: String!
    @bijouText(id: "dogfood.navigation.title", group: "dogfood.navigation.header", x: 2, y: 0)
    @bijouI18n(key: "dogfood.navigation.title", fallback: "Documentation")
    @bijouToken(fg: "semantic.nav.title.fg")

  activeItem: String!
    @bijouText(id: "dogfood.navigation.active", group: "dogfood.navigation.items", x: 2, y: 2)
    @bijouAction(id: "navigation.selectItem", command: "navigation.selectItem", key: "Enter")
    @bijouBind(id: "navigation.selection.activeLabel", kind: "state", path: "navigation.selection.activeLabel")
    @bijouI18n(key: "dogfood.navigation.active", fallback: "Active: Blocks")
    @bijouToken(fg: "semantic.nav.item.active.fg", bg: "semantic.nav.item.active.bg")

  itemCount: String!
    @bijouText(id: "dogfood.navigation.itemCount", group: "dogfood.navigation.items", x: 2, y: 3)
    @bijouBind(id: "navigation.items.count", kind: "computed", path: "navigation.items.count")
    @bijouI18n(key: "dogfood.navigation.itemCount", fallback: "Items: 7")
    @bijouToken(fg: "semantic.nav.item.fg")

  expandHint: String
    @bijouText(id: "dogfood.navigation.expandHint", group: "dogfood.navigation.items", x: 2, y: 4)
    @bijouAction(id: "navigation.expandGroup", command: "navigation.expandGroup", key: "ArrowRight")
    @bijouI18n(key: "dogfood.navigation.expandHint", fallback: "Expand group")
    @bijouToken(fg: "semantic.nav.hint.fg")
}
```

The implementation may adjust coordinates, labels, or token names if existing
terminal proof requires it, but the fixture must still preserve:

- `NavigationListBlock` as the component
- `dogfood.navigation` as the artifact id
- `docs.navigation` as the registry surface connected by tests
- `navigation.selectItem`, `navigation.expandGroup`, and selection/item-count
  binding facts

## Accessibility And Assistive Posture

Meaning must survive without color or borders. The `node-ids`, `i18n-keys`, and
`token-refs` lower modes must expose the same DOGFOOD navigation nodes as the
normal terminal proof, and the active selection must be identifiable through
source maps and binding facts.

## Localization And Directionality Posture

Renderable fields must use `@bijouI18n` with fallback text. This slice does not
add runtime translation behavior or directionality rules; it preserves i18n keys
and fallbacks so later locale-aware fixtures can replace the fallback text
without changing the artifact contract.

## Agent Inspectability And Explainability Posture

The committed facts should let an agent inspect:

- fixture source path and semantic source anchors
- artifact id, component, source hash, and group hierarchy
- scene id, root node, action ids, binding ids, i18n keys, and token refs
- terminal cell source-map entries for visible navigation text
- lower-mode rows and hashes
- debug summary hash, artifact hash, and scene hash

No emitted artifact may include absolute local paths, timestamps, process ids,
or screenshots.

## Linked Invariants

- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md):
  the DOGFOOD SDL fixture must fail before lowering when required source facts
  are malformed or missing.
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md):
  the fixture must preserve DOGFOOD navigation meaning across `bijou-block/1`,
  `ui-scene-ir/1`, terminal cells, and lower modes.
- [The Buffer Holds Facts](../invariants/buffer-holds-facts.md): debug output
  must stay inspectable as serializable facts.
- [Tests Are the Spec](../invariants/tests-are-the-spec.md): DX-046 is not
  complete until focused tests prove the real DOGFOOD fixture contract.

## Implementation Outline

1. Add this design doc and issue/roadmap updates.
2. Add failing tests for the checked-in DOGFOOD GraphQL fixture.
3. Add the `NavigationListBlock` SDL fixture.
4. Add any small fixture loader or export needed by tests.
5. Compile the fixture into `bijou-block/1` and assert DOGFOOD registry
   alignment.
6. Lower the artifact into `ui-scene-ir/1` and assert terminal proof facts.
7. Assert `graphql-bijou-block-debug/1` fields, groups, lower modes, and hashes.
8. Add failure coverage for missing DOGFOOD product facts.
9. Update changelog and issue/PR evidence.

## Tests To Write First

- RED: loading the checked-in DOGFOOD navigation SDL fixture should fail before
  the fixture exists.
- RED: compiling the fixture should produce `dogfood.navigation`,
  `NavigationListBlock`, two groups, DOGFOOD fields, token refs, i18n keys,
  action ids, binding ids, and a neutral source name.
- RED: registry alignment should prove `defaultDogfoodBlockRegistry` maps
  `docs.navigation` to `NavigationListBlock`.
- RED: lowering and terminal proof should expose visible navigation text and
  source-map entries for the active item.
- RED: debug summary should include artifact hash, scene hash, summary hash,
  groups, fields, i18n keys, token refs, actions, bindings, and normal /
  `node-ids` / `i18n-keys` / `token-refs` lower modes.
- RED: malformed DOGFOOD fixture variants should fail before terminal proof
  when they omit required i18n, action, binding, group, or token facts.

## Closeout

The cycle is landed when:

- #329 links this design doc and the PR
- #302 remains the broad Beyond tracker
- `v7.1.0` keeps #329 as the release-scoped tracker item
- the branch PR links #329, #302, and this design
- focused DX-046 tests are green
- `npm run docs:inventory`, `npm run typecheck:test`, `npm run lint`, focused
  tests, and the relevant full validation are green
- `docs/CHANGELOG.md` records the real DOGFOOD GraphQL fixture under
  `Unreleased`

## Implementation Notes

This cycle adds `examples/docs/fixtures/graphql/navigation-list.graphql` as the
first checked-in DOGFOOD GraphQL SDL fixture. Focused tests compile it into the
`dogfood.navigation` `bijou-block/1` artifact, prove that it matches the
existing `docs.navigation` registry entry and `NavigationListBlock`, lower it
to `ui-scene-ir/1`, render terminal proof, assert debug facts, and reject
malformed fixture variants before terminal proof.
