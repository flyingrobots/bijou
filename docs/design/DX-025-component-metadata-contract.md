---
title: DX-025 Component Metadata Contract
legend: DX
lane: design
---

# DX-025 Component Metadata Contract

## Framing

Bijou has component facts scattered across package docs, strategy docs, examples,
tests, DOGFOOD stories, and MCP-facing payloads. Those surfaces should not each
invent a slightly different idea of what a component is.

DX-025 adds a pure component metadata contract in core. The first slice defines
the runtime shape, validates common drift, and renders a deterministic summary.
It does not build the story workstation; it gives that workstation, DOGFOOD,
MCP docs, and agent workflows one shared object to consume.

## Sponsored Users

- Maintainers curating first-party component docs and examples.
- Tool builders generating DOGFOOD pages, MCP payloads, or story indexes.
- Third-party authors who want extension metadata without copying internal docs.
- Agent workflows that need stable facts about component modes and invariants.

## Hills

1. A maintainer can describe a component's package, family, modes, args,
   variants, invariants, docs, examples, and source path in one runtime object.
2. A tool can validate metadata and get deterministic issue paths for duplicate
   ids, missing required fields, and empty required lists.
3. A docs or agent surface can render a compact summary without parsing markdown.

## Playback Questions

- Does the contract capture package name, component name, family, modes, docs,
  args, variants, invariants, examples, and source path?
- Does validation reject blank required fields and empty mode lists?
- Does validation report duplicate mode names and duplicate ids deterministically?
- Can variants and invariants attach semantic facts for mode-lowering checks?
- Does a helper throw on invalid metadata for authoring-time guardrails?
- Does `@flyingrobots/bijou` export the contract and helpers from the root
  barrel?

## Requirements

- Add `ComponentMetadata` and related runtime types.
- Add `validateComponentMetadata(metadata)`.
- Add `defineComponentMetadata(metadata)` for authoring-time validation.
- Add `componentMetadataSummary(metadata)` and
  `componentMetadataReportText(report)`.
- Keep the contract pure and package-neutral enough for third-party components.
- Reuse `OutputMode` and `ModeLoweringFact` types where metadata touches modes
  and semantic facts.

## Acceptance Criteria

- RED tests fail before implementation and pass after.
- Valid metadata reports no issues and produces a stable summary.
- Invalid metadata reports deterministic issue paths and messages.
- `defineComponentMetadata()` throws on invalid metadata.
- Docs and changelog describe the metadata contract.

## Implementation Outline

- Implement the helper in `packages/bijou/src/core/component-metadata.ts`.
- Export it from `packages/bijou/src/index.ts`.
- Keep validation strict enough to catch drift but not so broad that it becomes
  a schema language.

## Drift Check

- Scope stayed on the contract and validation layer. The story workstation and
  DOGFOOD migration remain follow-up work that can consume this object.
- Validation catches required-field drift, empty mode lists, duplicate modes,
  duplicate arg names, and duplicate ids across variants, invariants, and
  examples. It does not become a schema language or a docs parser.
- Variants and invariants can carry `ModeLoweringFact` records, connecting this
  contract to DX-026 without coupling metadata to rendered output.

## Playback

- `ComponentMetadata` captures package name, component name, family, modes,
  docs, args, variants, invariants, examples, tags, and source path.
- `validateComponentMetadata()` returns deterministic issue paths and messages.
- `defineComponentMetadata()` throws with the report text when metadata contains
  errors.
- `componentMetadataSummary()` renders a compact, stable summary for docs,
  agents, and MCP payloads.
- `componentMetadataReportText()` renders validation output in review-friendly
  text.
- `@flyingrobots/bijou` exports the contract and helpers from the root barrel.

## Retrospective

- This gives DOGFOOD and MCP tooling a shared object without forcing either
  surface to own the component taxonomy.
- Keeping semantic facts attached to variants and invariants should make future
  story audits and mode-lowering checks cheaper: metadata can describe the
  intended truth, and render-specific tooling can prove it.
