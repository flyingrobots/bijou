---
title: DF-078 DOGFOOD Release Story Surfaces
legend: DF
lane: asap
priority: medium
status: proposed
github_issue: 335
parent_issue: 354
keywords:
  - dogfood
  - release
  - changelog
  - graphql
  - demo-integrity
---

# DF-078 DOGFOOD Release Story Surfaces

Legend: [DF - DOGFOOD](../legends/DF-dogfood-field-guide.md)

## Linked Work

- GitHub Issue: #335
- v7.2 umbrella: #354
- GraphQL fixture lineage: #329
- Blocks app-binding lineage: #342
- Current release docs: [docs/releases/7.1.0](../releases/7.1.0/README.md)

This document shapes #335 into a bounded v7.2 demo-integrity pull. It does not
turn v7.2 into a broad release-story product, and it does not pull the V8
Runtime Graph product contract forward.

## Decision Summary

DOGFOOD already publishes release notes and migration docs in the Release
section, but the app does not yet explain the post-v7.1 proof chain as a
first-class product story. A presenter still has to narrate the important
relationship manually:

```text
GraphQL SDL fixture
  -> bijou-block/1 artifact
    -> ui-scene-ir/1 scene
      -> terminal Surface proof
        -> graphql-bijou-block-debug/1 facts
```

The v7.2 repair is to add release-story surfaces that make that chain visible
inside DOGFOOD:

1. A concise release-story entry point from the DOGFOOD home or Release page.
2. A "What's New" path that foregrounds the current release story, not only a
   Markdown document.
3. A GraphQL proof walkthrough tied to the real
   `examples/docs/fixtures/graphql/navigation-list.graphql` fixture.
4. A CHANGELOG viewer that preserves version boundaries, headings, and keyboard
   navigation.

## Sponsored Human

A release-video viewer needs DOGFOOD to show why Bijou's v7 proof matters
without requiring a source-code tour. The presenter should be able to open one
release-story path and walk from source SDL to rendered terminal proof.

## Sponsored Agent

An agent needs deterministic text and model witnesses for the release story:
which version is being described, which GraphQL fixture carries the proof, which
artifact and scene facts are inspectable, and which changelog section bounds the
claim.

## Hill

After this cycle, DOGFOOD can tell the current release story from inside the
app: current "What's New" copy is discoverable, the real GraphQL block proof is
inspectable step by step, and the changelog can be navigated by version without
losing Markdown heading structure.

## Scope

### Release Story Entry Point

Add a compact entry point that is visible from normal DOGFOOD navigation. The
entry should name the current release story and point to deeper pages rather
than becoming another long landing section.

Acceptable first placement:

- a Release page overview card, or
- a concise home-page section that links into Release.

The implementation should not add a first-run takeover until there is a clear
version-memory port and deterministic dismissal state.

### What's New Surface

The current Release section already reads
`docs/releases/${BIJOU_VERSION}/whats-new.md`. This cycle should make the
surface easier to present by adding a short release-story summary before the
long Markdown body or by adding a sibling guide that routes directly to the
current "What's New" page.

The source of truth remains the versioned release document. DOGFOOD should not
fork release claims into a second hand-maintained copy.

### GraphQL Proof Walkthrough

Add a DOGFOOD guide that explicitly walks the checked-in fixture through the
proof chain:

- source fixture path:
  `examples/docs/fixtures/graphql/navigation-list.graphql`
- compiled artifact kind: `bijou-block/1`
- lowered scene kind: `ui-scene-ir/1`
- terminal proof surface
- debug fact kind: `graphql-bijou-block-debug/1`

The guide must link the proof to the real `NavigationListBlock` fixture and to
the DOGFOOD navigation surface instead of describing a synthetic example.

### CHANGELOG Viewer

Add a first-class DOGFOOD path for `docs/CHANGELOG.md` that preserves:

- version boundaries
- Markdown headings
- keyboard navigation through sections
- readable current and historical release claims

The first slice may reuse the existing Markdown reader. A custom changelog
index is acceptable only if it does not duplicate changelog content or invent a
second release-history source of truth.

## Out Of Scope

- First-run modal or full-screen takeover with persisted dismissal state.
- Runtime storage, host preferences, or cross-session version memory.
- Rewriting the release docs pipeline.
- Moving the broad #302 Runtime Graph tracker into v7.2.
- Migrating more DOGFOOD blocks to GraphQL.
- Building a source-code browser or full artifact inspector.

## Playback Questions

1. Can a presenter reach the current release story from DOGFOOD without knowing
   a source file path?
2. Can the presenter open a GraphQL proof walkthrough and point to the real
   `NavigationListBlock` SDL fixture?
3. Can a viewer see the sequence `GraphQL SDL -> bijou-block/1 ->
   ui-scene-ir/1 -> terminal proof -> debug facts` inside DOGFOOD?
4. Can a viewer open the changelog and move between version boundaries without
   losing headings?
5. Can tests prove these routes from model state and rendered text rather than
   screenshots?

## Accessibility And Assistive Posture

The release story must work as text. Color may support hierarchy, but the proof
chain, version names, fixture path, artifact kinds, and changelog boundaries
must be visible in plain text and preserved in accessible lower modes where
applicable.

## Localization And Directionality Posture

The first implementation may use English-source Markdown, matching the existing
Release section behavior. If new DOGFOOD chrome labels are added, they must use
catalog keys and keep all supported locale rows current. The design introduces
no new right-to-left layout behavior.

## Agent Inspectability And Explainability Posture

Agents should be able to inspect:

- the Release navigation guide ids
- the rendered release-story text
- the GraphQL fixture path and proof-chain labels
- the changelog guide id and version-boundary headings
- the tests that pin the routes

The proof must not depend on screenshots, timestamps, process ids, or local
absolute paths.

## Linked Invariants

- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md):
  the release story must remain meaningful as text, not only styled terminal
  layout.
- [The Buffer Holds Facts](../invariants/buffer-holds-facts.md): the GraphQL
  proof route should expose inspectable artifact and debug-fact labels.
- [Tests Are the Spec](../invariants/tests-are-the-spec.md): the release-story
  route is not complete until scripted DOGFOOD tests prove navigation and text
  witnesses.

## Implementation Outline

1. Add a focused DOGFOOD release-story guide under the Release page.
2. Add a GraphQL proof walkthrough that references the real NavigationListBlock
   SDL fixture and proof-chain labels.
3. Add a CHANGELOG guide or changelog subsection that reads from
   `docs/CHANGELOG.md`.
4. Add scripted DOGFOOD tests for the Release route, GraphQL proof text, and
   changelog version-boundary headings.
5. Add any new DOGFOOD localization keys needed for navigation chrome.
6. Update `docs/CHANGELOG.md`, `docs/ROADMAP.md`, and `docs/BEARING.md` with
   the landed v7.2 release-story status.

## Test Plan

- Add or extend `tests/cycles/DF-023/publish-repo-package-and-release-guides-in-dogfood.test.ts`
  or a new DF-078 test file for the Release route.
- Add a text assertion for the GraphQL proof chain and fixture path.
- Add a text assertion for at least `[Unreleased]` and `[7.1.0]` changelog
  boundaries.
- Run focused DOGFOOD release tests, `npm run docs:inventory`,
  `npm run typecheck:test`, DOGFOOD i18n gates if chrome labels change,
  `git diff --check`, and the normal pre-push gate before review.

## Acceptance Criteria

- DOGFOOD has a visible release-story entry point.
- DOGFOOD can show the current "What's New" release story from the Release
  section.
- DOGFOOD can show a GraphQL proof walkthrough tied to the real
  NavigationListBlock SDL fixture.
- DOGFOOD can show changelog content with version boundaries intact.
- First-run modal behavior is deliberately deferred unless a deterministic
  version-memory port is added in the same cycle.
- #335 has enough scoped design detail to leave `needs-design`.
