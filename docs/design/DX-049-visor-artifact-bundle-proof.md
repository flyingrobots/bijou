---
title: DX-049 VISOR Artifact Bundle Proof
legend: DX
lane: release
priority: high
github_issue: 458
parent_issue: 457
status: active
keywords:
  - developer-experience
  - visor
  - artifact-bundle
  - graphql
  - blocks
  - scene-ir
  - replay
  - v8.0.0
---

<!-- markdownlint-disable MD025 -->

# DX-049 VISOR Artifact Bundle Proof

Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)

## Linked Work

- User story: [#458](https://github.com/flyingrobots/bijou/issues/458)
- V8 tracker: [#457](https://github.com/flyingrobots/bijou/issues/457)
- Follow-on packed-cell proof:
  [#459](https://github.com/flyingrobots/bijou/issues/459)
- Broad source lineage:
  [#302](https://github.com/flyingrobots/bijou/issues/302)
- Contract design:
  [DX-048 V8 Runtime Graph And Scene IR Contract](./DX-048-v8-runtime-graph-scene-ir-contract.md)
- Prior DOGFOOD fixture proof:
  [DX-046 GraphQL Authored DOGFOOD Block Fixture](./DX-046-graphql-authored-dogfood-block-fixture.md)
- VISOR coordination tracker:
  [flyingrobots/visor#1](https://github.com/flyingrobots/visor/issues/1)

## Decision Summary

DX-046 proved that Bijou can compile a checked-in GraphQL SDL fixture into a
grouped `bijou-block/1` artifact, lower it into `ui-scene-ir/1`, render a
terminal proof, and emit deterministic `graphql-bijou-block-debug/1` facts.
DX-048 then defined the V8 contract boundary that VISOR needs to coordinate
across Bijou, WARP TTD, Geordi, Bunny, Wesley, and follow-on render targets.

Issue #458 should be the smallest implementation bridge between those two
facts. It should introduce a deterministic `visor-artifact-bundle/1` object
that wraps the existing GraphQL fixture source, `bijou-block/1` artifact,
`ui-scene-ir/1` scene, debug summary, replay metadata, visual scene facts, and
stable hashes. The bundle is a Bijou-emitted proof artifact for VISOR to index;
it is not a new VISOR runtime dependency inside Bijou.

## Sponsored Human

A maintainer wants one inspectable artifact that says, "this exact GraphQL
fixture produced this exact block artifact, scene IR, debug summary, replay
identity, and visual fact set." They should not need to reconstruct the proof
from scattered test helpers or terminal screenshots.

## Sponsored Agent

An agent wants to load one JSON-shaped bundle and trace a source field through
artifact facts, scene nodes, debug facts, replay metadata, visual target facts,
and stable hashes without executing DOGFOOD or scraping terminal output.

## Hill

Given the checked-in DOGFOOD GraphQL fixture, Bijou can emit a deterministic
`visor-artifact-bundle/1` whose source, normalized `bijou-block/1` facts,
`ui-scene-ir/1` facts, `graphql-bijou-block-debug/1` facts, replay metadata,
visual scene facts, and hash inventory are stable across runs and small enough
for VISOR, DOGFOOD, and future WARP TTD tooling to inspect.

## Playback Questions

- Which GraphQL fixture does the bundle represent?
- Which `bijou-block/1` artifact and `ui-scene-ir/1` scene are carried by the
  bundle?
- Which hashes prove the source, artifact, scene, debug summary, replay facts,
  visual scene facts, and full bundle?
- Which replay identity can future debugger tooling use without depending on
  host-local paths, timestamps, process ids, or terminal timing?
- Which visual scene facts can VISOR inspect before #459 adds packed-cell
  validation?
- Can a whitespace-only SDL edit preserve the artifact, scene, debug, visual,
  and bundle hashes where semantics do not change?
- Can malformed source or broken lowering assumptions fail before a bundle is
  emitted?

## Scope

- Add a public `visor-artifact-bundle/1` fact shape in Bijou.
- Build the first bundle from the existing constrained GraphQL block compiler
  path.
- Reuse the checked-in DOGFOOD GraphQL fixture unless implementation finds a
  smaller fixture that still proves the same source-to-scene path.
- Carry the fixture source name, semantic source hash, normalized source hash,
  `bijou-block/1` artifact, `ui-scene-ir/1` scene,
  `graphql-bijou-block-debug/1` summary, replay metadata, visual scene facts,
  and stable hashes.
- Keep the bundle JSON-serializable, deterministic, and free of absolute local
  paths, timestamps, process ids, screenshots, and operator terminal state.
- Add focused tests for deterministic output, hash stability, inspectability,
  and failure cases.

## Non-Goals

This cycle does not:

- implement #459 packed-cell-to-`Surface` validation
- implement WARP TTD browser UI or debugger sessions
- implement Geordi browser, image, or packed-cell endpoints
- require Bunny graphics, raycast, mesh, camera, shader, or geometry work
- require Wesley DTO generation or a general GraphQL compiler
- generalize every V8 schema shape
- make VISOR a runtime package dependency of Bijou
- add screenshot, video, or frame-capture file formats
- migrate additional DOGFOOD surfaces to GraphQL

## Bundle Contract

The first accepted bundle should be plain data:

```text
visor-artifact-bundle/1
  bundleVersion
  fixture
    id
    sourceName
    sourceHash
    normalizedSourceHash
  source
    language
    text
  artifacts
    bijouBlock
    uiScene
    debugSummary
  replay
    replayVersion
    scenarioId
    fixtureId
    deterministicSeed
    steps[]
  visual
    visualFactsVersion
    sceneId
    rootNodeId
    targetProfiles[]
    nodeFacts[]
    lowerModes[]
  hashes
    sourceHash
    normalizedSourceHash
    artifactHash
    sceneHash
    debugSummaryHash
    replayHash
    visualFactsHash
    bundleHash
  receipts[]
```

`bundleHash` is computed from the canonical bundle payload with the hash field
itself omitted. Hashing must use the same deterministic JSON rules already used
by the GraphQL block and scene IR proof path.

## Replay Metadata Contract

Replay metadata is identity and intent, not a full debugger session. The first
shape should record:

- stable scenario id
- fixture id
- deterministic seed or explicit no-randomness marker
- source, artifact, scene, debug, and visual hashes consumed by the replay
- ordered steps such as compile source, lower artifact, summarize debug facts,
  and expose visual facts

It must not record wall-clock timestamps, process ids, absolute paths, terminal
dimensions from the operator environment, or browser state. WARP TTD may later
load this metadata, but WARP TTD does not define the #458 shape.

## Visual Scene Facts Contract

Visual scene facts summarize the `ui-scene-ir/1` output for inspection. They
are not Geordi render receipts and not #459 packed-cell facts. The first shape
should expose:

- scene id and root node id
- target profile inventory
- node ids, roles, kinds, text facts, group ownership, and source references
- token refs, i18n keys, action ids, and binding ids
- lower-mode hashes and labels

That is enough for VISOR to prove what Bijou thinks the visual scene is before
future render targets prove how they draw it.

## Failure Cases

The bundle builder must reject:

- missing source name or fixture id
- source names that are absolute paths
- missing `bijou-block/1`, `ui-scene-ir/1`, or debug summary facts
- artifact, scene, debug, replay, or visual hash mismatches
- duplicate visual node ids
- lower-mode inventories that omit required node, i18n, or token witnesses
- replay metadata that contains host-local or wall-clock facts
- malformed source that the GraphQL block compiler already rejects

## Accessibility And Assistive Posture

The bundle must preserve lower-mode witnesses and semantic roles so the proof is
inspectable without color, terminal glyphs, or screenshots. Visual facts must
name text, node ids, i18n keys, token refs, and source refs independently of the
normal terminal rendering path.

## Localization And Directionality Posture

Renderable text continues to come from GraphQL `@bijouI18n` keys plus fallback
copy. The bundle must keep i18n keys and fallbacks visible in artifact, scene,
debug, and visual facts. Directionality remains deferred until V8 supports
localized layout constraints; this cycle must not hide that deferral.

## Agent Inspectability And Explainability Posture

The useful inspection path becomes:

```text
GraphQL fixture
  -> visor-artifact-bundle/1.fixture
  -> visor-artifact-bundle/1.artifacts.bijouBlock
  -> visor-artifact-bundle/1.artifacts.uiScene
  -> visor-artifact-bundle/1.artifacts.debugSummary
  -> visor-artifact-bundle/1.visual
  -> visor-artifact-bundle/1.replay
  -> visor-artifact-bundle/1.hashes
```

An agent should be able to answer, from the bundle alone:

- Which source field produced this node?
- Which i18n key and token refs belong to this text?
- Which action or binding facts are attached?
- Which target profile was declared?
- Which hash proves the source-to-scene chain?
- Which facts are deliberately not proven until #459 or a later external
  endpoint cycle?

## Linked Invariants

- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md):
  malformed source must fail before Bijou emits a bundle.
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md):
  bundle facts must preserve node identity, text, token refs, i18n keys,
  actions, bindings, and lower-mode meaning.
- [The Buffer Holds Facts](../invariants/buffer-holds-facts.md): the bundle is
  serializable data, not behavior.
- [Tests Are the Spec](../invariants/tests-are-the-spec.md): #458 is complete
  only when focused tests prove the deterministic bundle contract.

## Implementation Outline

1. Land this design packet and link it from roadmap, bearing, changelog, issue,
   and PR evidence.
2. Add RED tests for a missing `visor-artifact-bundle/1` builder and exported
   bundle type.
3. Add the bundle contract and deterministic canonical hashing.
4. Build the first bundle from the existing DOGFOOD GraphQL fixture,
   `compileGraphqlBijouBlock()`, `lowerBijouBlockToUiScene()`, and
   `createGraphqlBijouBlockDebugSummary()`.
5. Add replay metadata and visual scene fact extraction without introducing
   WARP TTD, Geordi, Bunny, Wesley, browser, or VISOR runtime dependencies.
6. Add failure coverage for host-local facts, absolute source names, duplicate
   visual ids, missing lower-mode witnesses, and hash mismatches.
7. Update `docs/CHANGELOG.md`, issue evidence, and PR evidence with the real
   implementation and validation commands.

## Tests To Write First

- RED: importing the bundle builder from `@flyingrobots/bijou` should fail
  before the implementation exists.
- RED: building from the checked-in DOGFOOD GraphQL fixture should produce
  `bundleVersion: "visor-artifact-bundle/1"` and carry `bijou-block/1`,
  `ui-scene-ir/1`, and `graphql-bijou-block-debug/1` artifacts.
- RED: the bundle hash should be stable across repeated runs and whitespace-only
  SDL edits that preserve semantic facts.
- RED: visual facts should list scene id, root node id, node ids, i18n keys,
  token refs, action ids, binding ids, target profiles, and lower-mode hashes.
- RED: replay metadata should carry stable fixture and scenario identity without
  timestamps, absolute paths, process ids, or live terminal dimensions.
- RED: malformed fixtures, absolute source names, hash mismatches, duplicate
  visual ids, and missing lower-mode witnesses should fail before bundle output.

## Validation Plan

Current design PR validation:

```bash
npx vitest run --config vitest.config.ts tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part02.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part04.test.ts
npm run docs:inventory
npm run typecheck:test
npm run code-dojo:changed
npm run lint
git diff --check
```

Future implementation validation after the RED-test slice creates
`tests/cycles/DX-049`:

```bash
npx vitest run --config vitest.config.ts tests/cycles/DX-049
```

## Closeout Notes

Open. This design starts #458. Keep `needs-design` on the issue until the
design PR lands; keep `work-in-progress` on the issue while the branch and PR
carry the cycle.
