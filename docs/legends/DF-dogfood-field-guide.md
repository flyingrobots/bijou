# DF — DOGFOOD Field Guide

_Legend for making DOGFOOD an honest, humane, and progressively more complete field guide for Bijou_

## Goal

Make DOGFOOD a truthful living guide to Bijou:

- honest about what is currently documented
- strong enough to act as the proving surface for shell, docs, and
  design-language work
- broad enough to carry components, guides, packages, and philosophy
  docs instead of pretending that the component browser is the whole
  docs product

This legend covers work like:

- DOGFOOD docs-pane honesty and progress signaling
- docs-shell teaching quality
- component-family story coverage growth
- clearer progress tracking between shipped Bijou families and DOGFOOD stories
- prose-doc reading and docs-site information architecture
- exposing repo/package/philosophy docs inside DOGFOOD
- demoting `examples/` behind DOGFOOD as a secondary/reference surface

## Human users

- builders trying to learn what Bijou currently offers
- maintainers checking whether the docs app is truthful about current coverage
- users deciding whether DOGFOOD is a living field guide or a complete reference

## Agent users

- agents auditing whether DOGFOOD claims more completeness than it actually has
- agents expanding story coverage family by family
- agents using DOGFOOD as the proving surface for docs, shell, and design-language changes

## Human hill

A user can open DOGFOOD and understand what Bijou is, where to find its
guides and philosophy docs, and how the component library fits into that
broader docs system without mistaking the app for either "only
components" or a complete exhaustive reference, and without being sent
back to the `examples/` tree as if that were the product docs front
door.

## Agent hill

An agent can measure current DOGFOOD component-family coverage
honestly, can see which non-component docs surfaces still need to exist
before DOGFOOD counts as a real terminal docs product, and can see that
`examples/` is now secondary rather than canonical.

## Core invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Related doctrine

- [Humane Shell](./HT-humane-terminal.md)
- [Design Language](./DL-design-language.md)
- [Bijou UX Doctrine](../strategy/bijou-ux-doctrine.md)

## Current cycle and backlog

- active cycle: [DF-025 — Make DOGFOOD The Only Human-Facing Docs Surface](../design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md)
- latest completed cycle: [DF-026 — Demote Examples To Secondary Reference Status](../design/DF-026-demote-examples-to-secondary-reference-status.md)
- current state:
  - DOGFOOD now documents all `35/35` canonical component families
  - the enforced coverage floor is `100%`
  - DOGFOOD now has visible top-level docs sections and a prose reader
  - DOGFOOD now publishes repo orientation, package docs, release docs,
    doctrine, architecture, invariants, and design-system guidance
    inside that shell
  - the next important gap is no longer docs posture; it is moving the
    release smoke contract onto DOGFOOD
- release-target backlog:
  - [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](../BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
- live follow-on backlog:
  - [DF-020 — Deepen DOGFOOD Story Depth and Variant Quality](../BACKLOG/up-next/DF-020-deepen-dogfood-story-depth-and-variant-quality.md)
- historical backlog lineage:
  - [DF-002 — Expand DOGFOOD Component Family Coverage](../BACKLOG/DF-002-expand-dogfood-component-family-coverage.md)
