---
title: DX-045 GraphQL Block Groups And Debug Facts
legend: DX
lane: cool-ideas
priority: medium
github_issue: 302
status: landed
keywords:
  - developer-experience
  - graphql
  - blocks
  - ir
  - dogfood
  - debug-facts
  - render-everywhere
---

# DX-045 GraphQL Block Groups And Debug Facts

Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)

## Linked Work

- GitHub issue: [#302](https://github.com/flyingrobots/bijou/issues/302)
- Prior slice: [DX-044 GraphQL Authored Bijou Block IR Proof](./DX-044-graphql-authored-bijou-block-ir-proof.md)
- Runtime seed: [DX-042 Shared UI Scene IR And Bijou Render Target](./DX-042-shared-ui-scene-ir-and-bijou-render-target.md)
- Portable endpoint direction: [DX-043 Portable Bijou Blocks And Multi-Endpoint IR](./DX-043-portable-bijou-blocks-and-multi-endpoint-ir.md)

DX-044 proved the smallest boring path:

```text
GraphQL SDL
  -> bijou-block/1
    -> ui-scene-ir/1
      -> terminal Surface proof
```

DX-045 turns that proof into a more credible authoring pipeline by adding
explicit group nodes and deterministic debug facts. It should still stay inside
Bijou; Geordi remains the next endpoint after the semantic artifact is strong
enough to hand across a repository boundary.

## Decision Summary

GraphQL-authored Bijou blocks need a hierarchy before Dogfood or BlockLab can
use them naturally. The first hierarchy primitive should be a small
field-attached group directive, not a general GraphQL execution model.

The next flow is:

```text
GraphQL SDL fixture
  -> bijou-block/1 artifact with groups[]
    -> ui-scene-ir/1 group/text node tree
      -> terminal Surface proof
        -> debug summary facts
          -> ui-scene-receipt/1
```

The debug summary is deliberately fact-shaped. It is not a renderer and not a
test snapshot. It gives maintainers and agents one deterministic object that
answers what source, artifact, scene, nodes, tokens, i18n keys, actions,
bindings, and lower-mode witnesses exist.

## Sponsored Human

A Bijou author wants to organize a GraphQL-authored block into named sections
without hand-editing JSON IR, then confirm that the rendered terminal output and
debug facts still point back to the right source fields.

## Sponsored Agent

An agent wants a deterministic summary of the GraphQL-to-IR pipeline so it can
reason about a UI failure from source anchors, group ownership, token refs,
i18n keys, bindings, actions, hashes, and lower-mode output instead of
interpreting screenshots.

## Hill

Given a constrained GraphQL SDL file with text fields assigned to named groups,
Bijou can produce a stable grouped `bijou-block/1` artifact, lower it into a
valid `ui-scene-ir/1` group/text node tree, render the text nodes to a terminal
`Surface`, and emit deterministic debug facts that preserve source maps,
tokens, i18n keys, actions, bindings, lower-mode witnesses, and hashes.

## Playback Questions

- Can one SDL group directive become one `bijou-block/1` group and one
  `ui-scene-ir/1` group node with stable parent/child relationships?
- Can one SDL text field point to its owning group, text node, i18n key, token
  refs, action, binding, visible cells, and source anchor?
- Can whitespace-only SDL edits preserve the artifact hash, scene hash, and
  debug summary hash?
- Can lower modes prove the same grouped scene through node ids, i18n keys, and
  token refs?
- Can unsupported duplicate group ids fail before lowering creates a misleading
  receipt?

## Scope

- Add a constrained `@bijouGroup(...)` directive.
- Add `groups[]` to `bijou-block/1` while preserving existing flat-field
  compatibility.
- Lower block groups into `ui-scene-ir/1` group nodes.
- Preserve deterministic group source-map facts.
- Add a public debug summary helper for the GraphQL block pipeline.
- Add fixture-style tests for grouped SDL, duplicate groups, lower modes, and
  hash stability.
- Update issue, roadmap, bearing, and changelog evidence.

## Non-Goals

- No full GraphQL parser dependency.
- No nested GraphQL execution or resolver runtime.
- No automatic layout engine.
- No Geordi repository changes in this slice.
- No Dogfood-wide migration.
- No browser endpoint.
- No frame-capture file format.

## SDL Shape

The first grouped SDL shape stays explicit:

```graphql
type ReleaseCard
  @bijouBlock(id: "release.card", component: "ReleaseCardBlock")
  @bijouTarget(kind: "bijou-terminal", cols: 48, rows: 8)
  @bijouGroup(id: "release.card.header", label: "Header", x: 1, y: 1, width: 46, height: 3)
  @bijouGroup(id: "release.card.footer", label: "Footer", x: 1, y: 5, width: 46, height: 2) {
  heading: String!
    @bijouText(id: "heading", group: "release.card.header", x: 2, y: 1)
    @bijouI18n(key: "release.card.heading", fallback: "Bijou")
    @bijouToken(fg: "semantic.title.fg")

  openNotes: String
    @bijouText(id: "open-notes", group: "release.card.footer", x: 2, y: 5)
    @bijouAction(id: "release.openNotes", command: "release.openNotes", key: "Enter")
    @bijouI18n(key: "release.card.openNotes", fallback: "Open release notes")
    @bijouToken(fg: "semantic.action.fg", bg: "semantic.action.bg")
}
```

Group directives are type directives. Text fields opt into a group with
`@bijouText(group: "...")`. Omitting `group` preserves the DX-044 behavior and
parents the text node to the block root.

The subset allows only:

- one `type`
- type directives on the type declaration or following indented lines before
  `{`
- scalar fields
- field directives on following indented lines
- string and integer directive arguments
- group ids that are unique and cannot collide with the root node or field
  node ids

## Artifact Contract

`bijou-block/1` gains `groups[]`:

```text
bijou-block/1
  id
  component
  sourceHash
  rootNodeId
  groups[]
    id
    label
    source
    layout
  fields[]
    fieldName
    nodeId
    groupId
    text
    action
    binding
    token refs
    source
  targetProfiles[]
```

Existing consumers that only read `fields[]` remain valid. Lowering owns the
new parent-child relationships.

## Debug Summary Contract

The debug helper should return plain data:

```text
graphql-bijou-block-debug/1
  artifactVersion
  artifactHash
  sceneHash
  rootNodeId
  groups[]
  fields[]
  sourceMap[]
  i18nKeys[]
  tokenRefs[]
  actionIds[]
  bindingIds[]
  lowerModes[]
```

The summary should be stable enough to hash and inspect in tests. It should not
include host paths, timestamps, process ids, terminal dimensions from the
operator environment, or screenshots.

## Accessibility And Lower Modes

Groups must preserve semantic organization even when terminal color and layout
are unavailable. Lower modes must still expose:

- node ids for group and text nodes
- i18n keys for localized text
- token refs for styled text
- source anchors for field and group facts

No meaning in this slice may depend only on color.

## Localization And Directionality Posture

The compiler continues to require fallback text for renderable i18n text nodes.
Groups may carry labels for debug and inspector use, but group labels are not
user-facing localized strings in this slice. Directionality remains deferred
until multiline text and localized layout constraints exist in the IR.

## Agent Inspectability

The useful debug path should become:

```text
SDL type directive / field directive
  -> bijou-block/1 group / field
    -> ui-scene-ir/1 group / text node
      -> terminal cell source map
        -> debug summary
          -> receipt
```

An agent should be able to answer, from committed facts:

- Which SDL directive created this group?
- Which fields belong to this group?
- Which visible cells came from a field in that group?
- Which lower-mode output proves the same scene without color?
- Which hashes bind the artifact, scene, surface, and debug summary?

## Linked Invariants

- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md):
  grouped SDL authoring must fail at compile time when ids collide or point to
  missing groups.
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md):
  the grouped artifact must preserve semantic organization through
  `ui-scene-ir/1` and terminal lower modes.
- [The Buffer Holds Facts](../invariants/buffer-holds-facts.md): debug output
  must be serializable fact records, not executable renderer behavior.
- [Tests Are the Spec](../invariants/tests-are-the-spec.md): grouped authoring
  is complete only when focused tests prove the compiler, lowering, lower
  modes, and debug summary.

## Implementation Outline

1. Add this design doc and tracker updates.
2. Add grouped SDL fixture tests that fail against the DX-044 flat compiler.
3. Extend `bijou-block/1` types with `groups[]` and `groupId`.
4. Parse repeated `@bijouGroup(...)` type directives.
5. Validate group ids and field group references before lowering.
6. Lower groups into `ui-scene-ir/1` group nodes.
7. Add `createGraphqlBijouBlockDebugSummary()`.
8. Prove normal rendering and lower modes for one grouped block.
9. Preserve whitespace-stable artifact, scene, and debug hashes.
10. Update changelog, issue, and PR evidence.

## Tests To Write First

- RED: grouped SDL should compile into two groups and two grouped fields.
- RED: grouped lowering should produce a valid `ui-scene-ir/1` tree with root
  children as group ids and group children as text node ids.
- RED: debug summary should list artifact hash, scene hash, groups, fields,
  i18n keys, token refs, actions, bindings, source-map anchors, and lower-mode
  hashes.
- RED: duplicate group ids and missing field group references should fail
  before lowering.
- GREEN: terminal normal, `node-ids`, `i18n-keys`, and `token-refs` lower modes
  should render deterministic grouped-scene facts.

## Closeout

The cycle is landed when:

- this design doc links #302
- the branch PR links this design and #302
- `compileGraphqlBijouBlock()` supports grouped authoring
- `lowerBijouBlockToUiScene()` preserves group hierarchy
- `createGraphqlBijouBlockDebugSummary()` is exported
- focused grouped GraphQL tests are green
- `npm run lint`, `npm run typecheck:test`, `npm run docs:inventory`, and the
  relevant focused tests are green
- the PR names what remains for Dogfood-wide authoring and Geordi endpoints
