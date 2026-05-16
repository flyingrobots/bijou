---
title: DF-029 Fixture-to-Docs Promotion Path
legend: DF
lane: design
---

# DF-029 Fixture-to-Docs Promotion Path

## Framing

Good Bijou examples often start as regression fixtures. Good docs examples often
become the clearest regression fixtures. Today the promotion path between those
surfaces is mostly manual, which means provenance, story ids, component
metadata, and capture outputs drift.

DF-029 adds a pure promotion record that links fixture, docs, story, example, or
MCP artifacts. The first slice is not a file-writing CLI; it is the canonical
record and text report that future commands can emit, review, and preserve.

## Sponsored Users

- Maintainers promoting stable fixtures into docs and DOGFOOD stories.
- Docs authors linking examples back to executable regression coverage.
- MCP/tooling authors reusing example provenance in agent-facing payloads.
- Agents proposing docs updates from failing or useful fixtures.

## Hills

1. A maintainer can record a fixture-to-docs promotion with source artifact,
   target artifact, component metadata, story matrix, tags, and notes.
2. A docs author can reverse that record when a docs story should become a
   regression fixture.
3. A reviewer can read a deterministic report that preserves provenance without
   inspecting multiple files.

## Playback Questions

- Does the record support fixture, docs, story, example, and MCP artifacts?
- Does the helper preserve metadata and story capture matrix references?
- Are tags normalized deterministically?
- Can the promotion direction be reversed without losing provenance?
- Does report text include id, source, target, component, matrix, tags, and
  notes?
- Does `@flyingrobots/bijou` export the promotion API from the root barrel?

## Requirements

- Add `createFixturePromotionRecord(options)`.
- Add `reverseFixturePromotionRecord(record, options?)`.
- Add `fixturePromotionText(record)`.
- Support artifact kinds `fixture`, `docs`, `story`, `example`, and `mcp`.
- Support optional `ComponentMetadata` and `StoryCaptureMatrix`.
- Keep the first slice pure and deterministic; no filesystem writes.

## Acceptance Criteria

- RED tests fail before implementation and pass after.
- Promotion records keep source, target, metadata, matrix, tags, and notes.
- Reverse promotion swaps source/target and preserves provenance.
- Report text is stable and suitable for docs, review comments, and agent output.
- Docs and changelog describe the helper.

## Implementation Outline

- Implement the helper in `packages/bijou/src/core/fixture-promotion.ts`.
- Export it from `packages/bijou/src/index.ts`.
- Keep artifact paths as caller-owned strings; path validation belongs to a
  future CLI/adapter.

## Drift Check

- Scope stayed pure and provenance-focused. No files are written, no paths are
  resolved, and no docs are generated in this slice.
- The record supports fixture, docs, story, example, and MCP artifacts and can
  carry DX-025 metadata plus DF-028 story matrices.
- Tag normalization is deterministic: trimmed, de-duplicated, and sorted.

## Playback

- `createFixturePromotionRecord()` stores id, source artifact, target artifact,
  optional component metadata, optional story matrix, normalized tags, and notes.
- `reverseFixturePromotionRecord()` swaps source and target while preserving
  metadata, matrix, tags, and notes.
- `fixturePromotionText()` renders id, source, target, component, matrix, tags,
  and notes as deterministic text.
- `@flyingrobots/bijou` exports the promotion API from the root barrel.

## Retrospective

- The promotion record is deliberately not a CLI. That keeps adapter concerns
  like path existence, markdown insertion, and baseline writing outside core.
- Together with component metadata and story capture matrices, it gives future
  docs tooling a compact provenance spine instead of one-off comments.
