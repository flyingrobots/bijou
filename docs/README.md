# Documentation Map

Use this page as the repository's documentation entrypoint.

Do not audit Bijou by recursively walking the filesystem and guessing which file is authoritative. Start here, then follow the current-truth lanes below.

If you want a repo-owned inventory instead of a raw filesystem crawl, run:

```bash
npm run docs:inventory
```

## Current Truth

These are the docs that describe what Bijou is, what it is doing now, and how current work should be interpreted.

- [Root README](../README.md)
  - front door: package map, DOGFOOD overview, quick start, and public positioning
- [METHOD](./METHOD.md)
  - repo work doctrine: backlog lanes, cycle loop, signposts, and ship sync
- [BEARING](./BEARING.md)
  - current direction, latest merged work, and tensions
- [VISION](./VISION.md)
  - bounded synthesis of where Bijou is trying to go
- [System-Style JavaScript](./system-style-javascript.md)
  - engineering doctrine for runtime-backed modeling, boundaries, adapters, and codecs
- [DOGFOOD](./DOGFOOD.md)
  - canonical human-facing docs surface and terminal docs app entrypoint
- [Current Plan](./PLAN.md)
  - short narrative summary of the current queue; supporting signpost, not the authority
- [Legends](./legends/README.md)
  - thematic workstreams and the intent behind them
- [Backlog](./BACKLOG/README.md)
  - not-started work items, with METHOD lanes
- [Design Cycles](./design/README.md)
  - active and landed cycle docs; historical implementation record
- [Invariants](./invariants/README.md)
  - project-wide truths design and implementation should not violate casually
- [Design System](./design-system/README.md)
  - foundations, patterns, component families, and policy docs
- [Changelog](./CHANGELOG.md)
  - shipped release notes and notable repo-facing changes

## Reference Docs

These are still active references, but they are not the main execution surface.

- [Architecture](./ARCHITECTURE.md)
  - current monorepo/package/runtime structure
- [Migrating to v4.0.0](./MIGRATING_TO_V4.md)
  - upgrade guidance for existing apps
- [Secondary Example Map](./EXAMPLES.md)
  - secondary/internal example inventory and retirement policy
- [Release Guide](./release.md)
  - repo-native release process, guards, validation, and publish verification
- [Release Docs](./releases/README.md)
  - long-form "what's new" and migration guides for individual releases
- [Workflow](./WORKFLOW.md)
  - repo-local planning and delivery model

## Historical And Legacy

These files still matter, but they should not be mistaken for the current source of truth.

- [Roadmap](./ROADMAP.md)
  - broad migration/reference surface for unfinished ideas
- [Completed](./COMPLETED.md)
  - shipped milestones and historical summaries
- [Graveyard](./GRAVEYARD.md)
  - intentionally abandoned or indefinitely deferred ideas
- [Legacy Specs](./specs/README.md)
  - older planning artifacts kept for reference until migrated or retired
- [Archive](./archive/README.md)
  - exploratory and historical docs that are worth preserving but should not read like front-door guidance

## Audit Rule

If you are a human or an agent trying to answer "what is true right now?":

1. read [Root README](../README.md)
2. read [METHOD](./METHOD.md), [BEARING](./BEARING.md), and [VISION](./VISION.md)
3. for engineering questions, read [System-Style JavaScript](./system-style-javascript.md) and [Architecture](./ARCHITECTURE.md)
4. read the relevant [Legend](./legends/README.md) and the actual backlog lane or cycle doc
5. check [Changelog](./CHANGELOG.md) if landed behavior matters
6. use [DOGFOOD](./DOGFOOD.md) and the [Design System](./design-system/README.md) as the proving surfaces
7. only then reach for [Plan](./PLAN.md), [Roadmap](./ROADMAP.md), archived docs, or legacy specs
