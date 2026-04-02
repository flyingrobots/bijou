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
- [Current Plan](./PLAN.md)
  - the shortest honest answer to "what are we doing next?"
- [Legends](./legends/README.md)
  - thematic workstreams and the intent behind them
- [Backlog](./BACKLOG/README.md)
  - not-started work items
- [Design Cycles](./design/README.md)
  - active and landed cycle docs; historical implementation record
- [Invariants](./invariants/README.md)
  - project-wide truths design and implementation should not violate casually
- [DOGFOOD Docs Surface](../examples/docs/README.md)
  - the living docs app and proving surface
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
- [Curated Example Map](./EXAMPLES.md)
  - which examples are still canonical versus merely illustrative
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
2. read [Current Plan](./PLAN.md)
3. read the relevant [Legend](./legends/README.md) and [Backlog](./BACKLOG/README.md) item
4. use [DOGFOOD](../examples/docs/README.md) and the [Design System](./design-system/README.md) as the proving surfaces
5. only then reach for [Roadmap](./ROADMAP.md), archived docs, or legacy specs
