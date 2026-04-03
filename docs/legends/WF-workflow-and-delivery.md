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
  - [WF-006 — Cut Clean 4.1.0 Release Boundary](../design/WF-006-cut-clean-4-1-0-release-boundary.md)
- latest completed cycle:
  - [WF-005 — Close 4.1.0 i18n Publish-Surface Gap](../design/WF-005-close-4-1-0-i18n-publish-surface-gap.md)
- release-target backlog:
  - none; the cycle-shaped `4.1.0` blockers are closed
- live backlog:
  - [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](../BACKLOG/up-next/WF-003-replace-smoke-examples-with-smoke-dogfood.md)
- migration debt still worth tracking:
  - [WF-002 — Migrate Legacy Planning Artifacts](../BACKLOG/WF-002-migrate-legacy-planning-artifacts.md)
