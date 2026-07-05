---
title: DX-048 V8 Runtime Graph And Scene IR Contract
legend: DX
lane: release
priority: high
github_issue: 457
status: active
keywords:
  - developer-experience
  - runtime-graph
  - scene-ir
  - graphql
  - blocks
  - visor
  - v8.0.0
---

# DX-048 V8 Runtime Graph And Scene IR Contract

Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)

## Linked Work

- Goalpost tracker: [#457](https://github.com/flyingrobots/bijou/issues/457)
- First artifact proof:
  [#458](https://github.com/flyingrobots/bijou/issues/458)
- Packed-cell proof:
  [#459](https://github.com/flyingrobots/bijou/issues/459)
- Broad source lineage:
  [#302](https://github.com/flyingrobots/bijou/issues/302)
- VISOR coordination surface:
  [flyingrobots/visor](https://github.com/flyingrobots/visor)
- Prior Bijou proof:
  [DX-046 GraphQL Authored DOGFOOD Block Fixture](./DX-046-graphql-authored-dogfood-block-fixture.md)

## Decision Summary

`v7.1.0` proved a constrained path from GraphQL SDL to `bijou-block/1`,
`ui-scene-ir/1`, terminal proof, grouped debug facts, and DOGFOOD product
facts. `v7.2.0` stabilized the demo and release surface enough to stop treating
that path as release bookkeeping.

The V8 work starts by freezing the product contract before implementation
continues. DX-048 defines the source, artifact, IR, receipt, source-map,
lower-mode, debug, capture, and witness boundaries that #458 and #459 must
consume.

VISOR is the coordination surface for the proof. Bijou remains responsible for
the source-side contracts and the terminal `Surface` proof. Geordi, Wesley,
Bunny, WARP TTD, browser renderers, and native renderers may consume or inform
the contract later, but they do not define the first Bijou release gate.

## Sponsor Human

A maintainer wants V8 to become a stable product contract, not a pile of
exciting demos. They should be able to ask, "what exactly crosses from GraphQL
Blocks into Bijou Blocks IR and then into render targets?" and get a versioned,
testable answer.

## Sponsor Agent

An agent needs to trace one product fact from a GraphQL source fixture through
artifact fields, scene nodes, terminal cells, lower modes, source maps, debug
facts, and receipts without scraping rendered text or guessing ownership.

## Hill

Given a checked-in DOGFOOD GraphQL fixture, Bijou can produce a deterministic
artifact bundle with `bijou-block/1`, `ui-scene-ir/1`,
`graphql-bijou-block-debug/1`, lower-mode witnesses, source maps, receipts, and
packed-cell render evidence, and reviewers can replay the full path without any
Wesley or Geordi repository changes.

## Playback Questions

- What is the GraphQL Blocks source model allowed to express?
- Which facts belong in the `bijou-block/1` artifact and which belong only in
  the compiler receipt?
- What is the `ui-scene-ir/1` lowering contract and what facts must it preserve?
- Who owns receipt and source-map ownership when a source field fans out into
  multiple scene nodes or terminal cells?
- Which lower modes are mandatory for a fixture before V8 calls it product
  proof?
- What debug facts are stable enough for DOGFOOD, VISOR, and future replay
  tooling to inspect?
- What invalid source cases fail before terminal rendering?

## Scope

This cycle defines the V8 contract and proof boundaries:

- GraphQL Blocks source model:
  - fixture identity
  - component identity
  - field identity
  - group identity
  - binding and command-intent identity
  - i18n key references
  - theme token references
  - target render profile
- `bijou-block/1` artifact semantics:
  - stable artifact version
  - deterministic field and group ordering
  - explicit product-fact inventory
  - hashable payload shape
  - no hidden global registry dependency
- `ui-scene-ir/1` lowering contract:
  - stable scene version
  - node identity and role ownership
  - text, style, focus, and geometry facts
  - lower-mode witness fields
  - source-map references back to artifact and source spans
- receipt and source-map ownership:
  - source hash
  - artifact hash
  - scene hash
  - packed-cell hash
  - dependency and transform list
  - failure facts for rejected input
- debug fact contract:
  - `graphql-bijou-block-debug/1` summary facts
  - group, field, i18n, token, action, binding, lower-mode, and hash inventory
  - deterministic error categories
- DOGFOOD round-trip fixture:
  - source fixture checked into the repo
  - artifact bundle checked or snapshotted as test evidence
  - terminal `Surface` proof
  - lower-mode evidence
  - review path documented in DOGFOOD or release-facing docs

## Non-Goals

This cycle does not:

- implement the #458 artifact bundle
- implement the #459 packed-cell adapter
- migrate every DOGFOOD block to GraphQL
- introduce a general GraphQL resolver runtime
- require Geordi, Wesley, Bunny, WARP TTD, browser, or native app changes
- ship BlockLab, Theme Lab, localization workbench, or operator surfaces
- define the final browser or native render target APIs
- move all #302 lineage issues into `v8.0.0`

## Contract Sketch

The minimum accepted artifact bundle should be inspectable as plain facts:

```text
graphql-source/1
  -> bijou-block/1
    -> ui-scene-ir/1
      -> packed-bijou-cells/1
        -> terminal-surface-proof/1
```

Each transition must produce a receipt:

```text
receipt/1 {
  fromVersion
  toVersion
  sourceHash
  outputHash
  dependencyHashes[]
  transformFacts[]
  sourceMapRefs[]
  lowerModeWitnesses[]
  debugFactRefs[]
}
```

The receipt is not a logging nicety. It is the review contract. If a future
VISOR, DOGFOOD, WARP TTD, or browser proof cannot name the receipt it consumed,
it is not part of the V8 release gate.

## Failure Cases

The V8 contract must reject:

- duplicate source, field, group, node, binding, or command ids
- missing component identity
- missing product facts for a DOGFOOD witness
- broken i18n key references
- broken theme token references
- source spans that cannot map back from artifact or scene facts
- lower-mode witnesses that omit required role or text facts
- packed cells that cannot map to scene nodes
- debug summaries that omit hashes or dependency facts

## Accessibility Posture

The contract must preserve lower-mode witnesses. Terminal proof alone is not
enough. Every accepted DOGFOOD fixture must expose accessible text and role
facts through the artifact or scene receipt so reviewers can inspect a non-TTY
representation.

## Localization / Directionality Posture

The GraphQL source may reference i18n keys and source-language fallback copy,
but it must not smuggle untracked visible copy into the artifact. V8 must keep
localization keys visible in debug facts and receipts so DOGFOOD can explain
what translated and what fell back.

## Agent Inspectability / Explainability Posture

Agents must be able to inspect the complete source-to-render chain without
executing a full app:

- parse the fixture
- read the artifact
- read the scene IR
- read the receipt list
- read the source map
- read debug facts
- run the terminal proof
- compare hashes

This is the line between a demo and a product contract.

## Linked Invariants

- Tests Are the Spec
- Runtime Truth Wins
- Docs Are the Demo
- Work Is Issue-Backed
- Release Claims Need Proof
- Facts Before Behavior

## Implementation Outline

1. Land this design packet and post-release BEARING refresh.
2. Update #457 with the contract decision and the #458 / #459 pull order.
3. Add tests that keep ROADMAP, BEARING, and this design aligned.
4. In #458, introduce the artifact bundle fixture and receipt shape.
5. In #459, validate `packed-bijou-cells/1` and adapt it to `Surface`.
6. Only after #458 and #459 are stable, promote broader #302 lineage into V8
   implementation scope.

## Tests To Write First

- WF-130 roadmap tests must require this design packet while #457 is open.
- Artifact bundle tests in #458 should fail until `bijou-block/1`,
  `ui-scene-ir/1`, receipts, source maps, and debug facts are emitted together.
- Packed-cell tests in #459 should fail until `packed-bijou-cells/1` can map
  cells back to scene nodes and render a `Surface` proof.

## Validation Plan

```bash
npx vitest run --config vitest.config.ts tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part02.test.ts tests/cycles/WF-130/roadmap-goalpost-policy.part03.test.ts
npm run docs:inventory
npm run typecheck:test
npm run lint
git diff --check
```

## Closeout Notes

Open. This design is the first V8 pull after `v7.2.0` shipped.
