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

- active cycle:
  - [DF-021 — Shape DOGFOOD As Terminal Docs System](../design/DF-021-shape-dogfood-as-terminal-docs-system.md)
- latest completed cycle:
  - [WF-006 — Cut Clean 4.1.0 Release Boundary](../design/WF-006-cut-clean-4-1-0-release-boundary.md)
- release-target backlog:
  - [DF-022 — Build Prose Docs Reader And Top-Level DOGFOOD Nav](../BACKLOG/v4.1.0/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)
  - [DF-023 — Publish Repo, Package, And Release Guides In DOGFOOD](../BACKLOG/v4.1.0/DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
  - [DF-024 — Publish Philosophy, Architecture, And Doctrine Guides In DOGFOOD](../BACKLOG/v4.1.0/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)
- live backlog:
  - [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](../BACKLOG/up-next/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
- migration debt still worth tracking:
  - [WF-002 — Migrate Legacy Planning Artifacts](../BACKLOG/WF-002-migrate-legacy-planning-artifacts.md)
