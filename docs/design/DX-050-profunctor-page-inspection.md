---
title: DX-050 Profunctor Page Inspection
legend: DX
lane: release
priority: high
github_issue: 468
status: complete
keywords:
  - developer-experience
  - profunctor-page
  - scene-ir
  - target-inspection
  - v10.0.0
---

Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)

## Linked Work

- Bijou story: [#468](https://github.com/flyingrobots/bijou/issues/468)
- Implementation pull request:
  [#474](https://github.com/flyingrobots/bijou/pull/474)
- Website campaign:
  [profunctor-optics-website#14](https://github.com/flyingrobots/profunctor-optics-website/issues/14)
- Canonical website specimen revision:
  [`6a411d7`](https://github.com/flyingrobots/profunctor-optics-website/commit/6a411d72c55edb6e4acc3b556d5cf96c303376f5)
- Sibling Geordi proof:
  [geordi#52](https://github.com/flyingrobots/geordi/issues/52) and
  [geordi#53](https://github.com/flyingrobots/geordi/pull/53)
- Code Dojo prerequisite:
  [WF-163](./WF-163-respecting-dojo-ratchet-112.md)

## Decision Summary

Bijou will consume byte-identical copies of the canonical Keep
`profunctor-page/0`, source map, and build manifest. It will validate their
versions, identities, references, and pinned digests before lowering the page
through a Bijou-owned `ui-scene-ir/1`, layout, and `Surface` path.

The website remains authoritative for page composition and source occurrences.
Bijou owns terminal render identities, inspection facts, residuals, and its
receipt. Geordi is sibling evidence, not a package dependency or authority.

## Current Truth

Before DX-050, Bijou could lower Bijou-owned scenes and blocks to terminal
surfaces, but it could not validate, inspect, or lower the website-owned
`profunctor-page/0` family. The canonical ProjectPage specimen existed only in
the website repository at revision `6a411d7`; Bijou had no pinned copy, page
target profile, cross-artifact validation, source-to-render map, target receipt,
or terminal witness for that family.

## Acceptance Criteria

- Pin byte-identical `profunctor-page/0`,
  `profunctor-page-source-map/0`, and `profunctor-build-manifest/0` inputs to
  website revision `6a411d7` with exact SHA-256 digests.
- Validate versions, identities, references, dependency digests, root
  reachability, reading order, and target capabilities before lowering.
- Reject visible unsupported blocks and obstructed or clipped output with a
  stable diagnostic and no target artifact.
- Residualize only hidden unsupported blocks, with the unsupported block
  identity preserved in the target map.
- Emit deterministic scene, target-map, receipt, and terminal-witness bytes
  through the existing layout and `Surface` contracts.
- Preserve page, template, source-occurrence, token, reading-order, landmark,
  and action facts across all supported inspection modes.
- Hold the Code Dojo debt ceiling at `62` aggregate violations or lower and
  pass the focused contract, generation, documentation, and full repository
  gates.

## Sponsor Human

James Ross.

## Sponsor Agent

Codex.

## Hill

Given the canonical Keep specimen, Bijou emits deterministic terminal
inspection evidence that preserves page, template, source-occurrence, token,
reading-order, and link identities; assigns every supported visible node a
Bijou render identity; residualizes hidden unsupported nodes; and rejects
malformed, contradictory, or visibly unsupported inputs.

## Playback Questions

1. Which exact website revision and input digests produced this proof?
2. Where does each page node appear in `ui-scene-ir/1` and `Surface` output?
3. Which token, reading-order, source, and action facts remain inspectable?
4. Which upstream capabilities does Bijou refuse rather than inherit?
5. Does repeated lowering emit byte-identical artifacts and receipts?

## Scope

- Vendor the three canonical inputs with provenance and SHA-256 pins.
- Parse and validate the version-zero artifact family fail closed.
- Lower supported ProjectPage blocks to one deterministic `ui-scene-ir/1`.
- Adapt the scene through existing layout and `Surface` contracts.
- Emit a Bijou target map, receipt, and inspectable terminal witness.
- Preserve source-map identities without mutating compiler-owned occurrences.
- Reduce Code Dojo debt to `62` aggregate violations or lower.

## Non-Goals

- No website runtime or production GraphQL server.
- No mutation of authored page, source-map, or build-manifest authority.
- No Geordi dependency, pixel parity, browser semantics, or HTML claims.
- No general page-family vocabulary or `/0` to `/1` promotion.
- No unsupported-block approximation or silent capability inheritance.
- No redesign of DOGFOOD, the website, or existing `Surface` behavior.

## Target Contract

The target accepts exact UTF-8 bytes for `profunctor-page/0`,
`profunctor-page-source-map/0`, and `profunctor-build-manifest/0`. It returns
Bijou-owned scene, target-map, receipt, and terminal-witness artifacts or one
stable diagnostic with a code, input path, and detail.

Supported visible page nodes receive injective render identities. Hidden
unsupported nodes receive explicit residuals. Visible unsupported nodes fail
closed without target artifacts. Target output records upstream claims as not
inherited and binds every output digest to the exact input family.

## Accessibility And Assistive Posture

The terminal witness preserves text, semantic roles, reading order, link
destinations, and residual explanations without relying on color alone. It
does not claim browser landmarks, accessibility-tree parity, or native links.

## Localization And Directionality Posture

Input text and order are preserved exactly. Token roles remain references, not
resolved theme guesses. No new translation authority or bidirectional layout
claim is introduced; unsupported direction-sensitive behavior is residualized.

## Agent Inspectability And Explainability Posture

An agent can trace input digest to page node, template node, source occurrence,
scene node, terminal region, token references, action destination, and receipt
without scraping screenshots or executing the website.

## Linked Invariants

- Canonical bytes stay owned by the website at revision `6a411d7`.
- Every supported visible page node maps to one target identity.
- Every hidden unsupported page node maps to one explicit residual.
- Every visible unsupported page node fails closed before output.
- Render identities are injective and target-owned.
- Reading order, tokens, actions, and source occurrences remain inspectable.
- Unsupported versions, references, blocks, or claims fail closed.
- Generated outputs are deterministic and inventory checked.
- The Code Dojo ceiling falls from `112` to `62` or lower.

## Implementation Outline

1. Copy and pin the canonical three-file specimen.
2. Add contract types, parsers, and stable diagnostics.
3. Add target-profile validation and explicit residuals.
4. Lower supported nodes into `ui-scene-ir/1`.
5. Render through layout and `Surface` without host timing or paths.
6. Emit and verify target map, receipt, and witness bytes.
7. Remove at least 50 measured Code Dojo violations.
8. Update living docs, artifact inventory, and closeout evidence.

## Tests To Write First

- Reject malformed JSON, unsupported versions, digest drift, and identity drift.
- Reject duplicate nodes, invalid slots, references, tokens, and actions.
- Prove every supported visible node maps injectively.
- Prove hidden unsupported nodes residualize and visible unsupported nodes
  fail closed.
- Prove exact reading order, token, action, and source-occurrence preservation.
- Prove repeated output and receipts are byte-identical.
- Prove fixture inventory, website revision, and all three hashes are pinned.
- Prove layout and `Surface` output retain the declared inspection facts.

## Retrospective And Closeout

DX-050 emits `page.bijou.scene.json`, `page.bijou.map.json`,
`page.bijou.receipt.json`, and `page.bijou.txt`. The public failure boundary is
the seven-code `BIJOU_PAGE_*` diagnostic family documented in the
[inspection reference](../reference/profunctor-page-inspection.md#diagnostics).

The canonical inputs remain pinned to website revision `6a411d7`:

- Page SHA-256:
  `12b90184b4e238bc6bd7db944af8651900b830ea76ba775ab7c7ee20be051e73`.
- Source-map SHA-256:
  `a40e97f2fd513519092d2a131c0d7107517b92bd7e9cfd5e79df70a65a3fe044`.
- Build-manifest SHA-256:
  `975efc9c701cbd7a6981787150748b76d1e53fd83cd424128667bc8014687ab7`.

The bounded target supports the five ProjectPage block definitions. Hidden
unsupported blocks become `hidden-unsupported-block` residuals. Visible
unsupported blocks, semantic-document sources, application islands, inherited
semantic-HTML claims, and output that exceeds the fixed terminal profile fail
closed or remain explicit target obstructions.

Focused contract evidence passes `38` tests across the five target suites, the
generator suite, and this design contract. Full local verification passes
`4,015` tests. Code Dojo reports `62` aggregate violations: `37` file/context,
`25` code-size, `0` mock-ban, and `0` ESLint.

The follow-on path remains the `v8.0.0` Runtime Graph And Scene IR milestone,
the website publication campaign in
[profunctor-optics-website#14](https://github.com/flyingrobots/profunctor-optics-website/issues/14),
and the sibling Geordi proof in
[geordi#52](https://github.com/flyingrobots/geordi/issues/52) and
[geordi#53](https://github.com/flyingrobots/geordi/pull/53).
