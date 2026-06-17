# DOCUMENTATION

This is the repo documentation map for Bijou. Documentation is organized by
intent. Do not audit the repository by recursively walking the filesystem;
follow the entrypoints below.

Current Truth: start with the root README, this repo documentation map, and the
entrypoints below. For live work tracking, use open GitHub Issues and labels;
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

## Doctrine and Direction

| Signpost | Role |
| :--- | :--- |
| **[VISION](./VISION.md)** | Core tenets and project identity. |
| **[BEARING](./BEARING.md)** | Current direction and active tensions. |
| **[METHOD](./METHOD.md)** | Repo work doctrine: backlog lanes and the cycle loop. |
| **[method/backlog/README.md](./method/backlog/README.md)** | Historical evidence: older backlog lanes and shaped release lineage. |
| **[strategy/README.md](./strategy/README.md)** | Doctrine map: living strategy notes vs historical planning artifacts. |
| **[Design Cycles](./design/README.md)** | Active and landed cycle design docs. |
| **[Legends](./legends/README.md)** | Thematic intent by lane and doctrine family. |
| **[System-Style JS](./system-style-javascript.md)** | Engineering doctrine: boundaries, adapters, and codecs. |
| **[TypeScript Code Standards](./typescript-code-standards.editors-edition.md)** | Verbatim Code Dojo doctrine for humans and agents touching TypeScript, tests, adapters, scripts, or architecture. |
| **[Code Dojo Exceptions](./code-dojo-exceptions.md)** | Standards-debt ledger and 50-violation-per-goalpost burndown policy. |
| **[Design System](./design-system/README.md)** | Foundations, patterns, and component families. |

## Reference

| Surface | Role |
| :--- | :--- |
| **[CLI](./CLI.md)** | Command surface: binaries and operator scripts. |
| **[MCP](./MCP.md)** | MCP server posture and tool reference. |
| **[Technical Teardown](./TECHNICAL_TEARDOWN.md)** | End-to-end architecture and runtime explanation for new readers. |
| **[guides/render-pipeline.md](./guides/render-pipeline.md)** | Concrete render-stage guide for `configurePipeline()`, `RenderState`, and stage-order truth. |
| **[CHANGELOG.md](./CHANGELOG.md)** | Historical truth of merged behavior. |
| **[ROADMAP](./ROADMAP.md)** | Reference-only strategic horizon, not the active queue. |
| **[specs/README.md](./specs/README.md)** | Spec artifact format, acceptance criteria conventions, and validation guidance. |

---
**For a machine-readable inventory of all documentation, run `npm run docs:inventory`.**
