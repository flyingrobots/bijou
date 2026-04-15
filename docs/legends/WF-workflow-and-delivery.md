# WF — Workflow and Delivery

_Legend for how Bijou work gets captured, designed, tested, landed, and reviewed_

## Goal

Make Bijou’s delivery process legible to both humans and agents.

This legend exists so the repo can answer:

- what are we working on?
- where does design truth live?
- how are cycles started and closed?
- where do debt and follow-on ideas go?

## Human users

- maintainers
- contributors
- reviewers

## Agent users

- coding agents
- design agents
- review agents

## Human hill

A human can understand the current process without having to infer it from old roadmap habits or scattered chat context.

## Agent hill

An agent can place docs, tests, and follow-on debt in the right location by reading repo artifacts instead of relying on implicit memory.

## Core invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Current cycle and backlog

- current posture:
  - `4.4.1` is the current tagged release line
  - no version-target release lane is active right now
  - the active engineering focus is docs-system tooling, i18n catalog loader, and post-v5 follow-on hardening
- latest workflow closure:
  - [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](../design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
- latest docs-surface closure:
  - [DF-025 — Make DOGFOOD The Only Human-Facing Docs Surface](../design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md)
- migration lineage:
  - [WF-002 — Migrate Legacy Planning Artifacts](../method/retro/WF_002-migrate-legacy-planning-artifacts.md)
- canonical queue reminder:
  - live work belongs in [docs/method/backlog/](../method/backlog/README.md)
  - `docs/BACKLOG/` remains compatibility/archive only
