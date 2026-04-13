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
  - `4.5.0` is the active release branch
  - no dedicated workflow cycle is active right now
  - the most recent completed runtime-engine cycle is
    [RE-016 — DAG renderer should handle cycles gracefully](../retro/RE_016-dag-cycle-graceful-handling.md)
- latest workflow closure:
  - [WF-002 — Migrate Legacy Planning Artifacts](../retro/WF_002-migrate-legacy-planning-artifacts.md)
- previous workflow closure:
  - [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](../design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
- latest docs-surface closure:
  - [DF-025 — Make DOGFOOD The Only Human-Facing Docs Surface](../design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md)
- live backlog:
  - no dedicated workflow cycle is live right now
- next runtime-engine issue in the live backlog:
  - [RE-012 — Pipeline Observability Hooks](../backlog/cool-ideas/RE_012-pipeline-observability-hooks.md)
