---
title: "DX-025 — Component Metadata Contract"
legend: DX
lane: cool-ideas
---

# DX-025 — Component Metadata Contract

A canonical metadata format for first-party Bijou components, shells, and stories.

Why:
- docs, MCP payloads, showcase examples, and Storybook-style tooling all want overlapping component metadata
- today that information is spread across examples, docs, and code rather than one stable contract
- a shared metadata shape would let multiple tooling surfaces stay in sync

Possible scope:
- package, component name, family, modes, args, variants, invariants, examples, and related docs
- story-level metadata that can be consumed by DOGFOOD, MCP docs, and story workstations
- support for source links, test fixtures, and capture outputs
- clear extension rules for third-party components

This is infrastructure for richer docs and tooling, not just another docs index.
