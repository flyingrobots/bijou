# DOCUMENTATION

This is the repo documentation map for Bijou. Documentation is organized by
intent. Do not audit the repository by recursively walking the filesystem;
follow the entrypoints below.

Current Truth: start with the root README, this repo documentation map, and the
entrypoints below. For roadmap and release scope, use GitHub issues and milestones;
`docs/method/` preserves evidence and history.

## Entrypoints

| Surface | Role |
| :--- | :--- |
| **[README.md](../README.md)** | Public front door: package map, quick start, and positioning. |
| **[GUIDE.md](../GUIDE.md)** | Orientation: the fast path and monorepo orchestration. |
| **[DOGFOOD](./DOGFOOD.md)** | Canonical human-facing docs app. Run `npm run dogfood`. |
| **[ARCHITECTURE.md](../ARCHITECTURE.md)** | Structural reference: ports, adapters, and package responsibilities. |
| **[ADVANCED_GUIDE.md](../ADVANCED_GUIDE.md)** | Deep dives: pipeline, motion, shaders, and proving workflows. |
| **[Terminal Scenarios](./guides/terminal-scenarios.md)** | End-to-end guide for colored output, forms, TUI apps, and shader renderers. |
| **[Framed App Tutorial](./guides/framed-app-tutorial.md)** | Middle path between the tiny counter and DOGFOOD-scale framed apps. |

## Engineering And Work Tracking

| Signpost | Role |
| :--- | :--- |
| **[Workflow](./WORKFLOW.md)** | GitHub roadmap and milestones; pending Linear execution migration. |
| **[VISION](./VISION.md)** | Core tenets and project identity. |
| **[strategy/README.md](./strategy/README.md)** | Doctrine map: living strategy notes vs historical planning artifacts. |
| **[Design Book](./book/README.md)** | Complete LaTeX/PDF compilation of design records and actual DOGFOOD component specimens. |
| **[Design Cycles](./design/README.md)** | Active and landed cycle design docs. |
| **[System-Style JS](./system-style-javascript.md)** | Engineering doctrine: boundaries, adapters, and codecs. |
| **[TypeScript Code Standards](./typescript-code-standards.editors-edition.md)** | Verbatim Code Dojo doctrine for humans and agents touching TypeScript, tests, adapters, scripts, or architecture. |
| **[Code Dojo Exceptions](./code-dojo-exceptions.md)** | Standards-debt ledger and 50-violation-per-goalpost burndown policy. |
| **[Documentation Standards](./DOCUMENTATION_STANDARDS.md)** | Reader-task page types, corpus ownership, examples, accessibility, and upkeep policy. |
| **[Design System](./design-system/README.md)** | Foundations, patterns, and component families. |

## Reference

| Surface | Role |
| :--- | :--- |
| **[CLI](./CLI.md)** | Command surface: binaries and operator scripts. |
| **[MCP](./MCP.md)** | MCP server posture and tool reference. |
| **[Packed Bijou Cell Receipts](./reference/packed-bijou-cells.md)** | Exact `packed-bijou-cells/1` schema, validation diagnostics, and byte-preserving `Surface` adaptation. |
| **[Profunctor Page Inspection](./reference/profunctor-page-inspection.md)** | Exact `lowerProfunctorPageArtifacts()` inputs, modes, outputs, diagnostics, and bounded target posture. |
| **[guides/render-pipeline.md](./guides/render-pipeline.md)** | Concrete render-stage guide for `configurePipeline()`, `RenderState`, and stage-order truth. |
| **[CHANGELOG.md](./CHANGELOG.md)** | Historical truth of merged behavior. |
| **[specs/README.md](./specs/README.md)** | Spec artifact format, acceptance criteria conventions, and validation guidance. |

---
**For a machine-readable inventory of all documentation, run `npm run docs:inventory`.**
