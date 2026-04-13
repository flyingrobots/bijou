# DOCUMENTATION

This is the repo documentation map for Bijou. Documentation is organized by
intent. Do not audit the repository by recursively walking the filesystem;
follow the entrypoints below.

## Current Truth

If you want the current-truth docs lane, start with the root README, this repo
documentation map, and the signposts below before you drift into historical or
reference material.

## Entrypoints

| Surface | Role |
| :--- | :--- |
| **[README.md](../README.md)** | Public front door: package map, quick start, and positioning. |
| **[GUIDE.md](../GUIDE.md)** | Orientation: the fast path and monorepo orchestration. |
| **[DOGFOOD](./DOGFOOD.md)** | Canonical human-facing docs app. Run `npm run dogfood`. |
| **[ARCHITECTURE.md](../ARCHITECTURE.md)** | Structural reference: ports, adapters, and package responsibilities. |
| **[ADVANCED_GUIDE.md](../ADVANCED_GUIDE.md)** | Deep dives: pipeline, motion, shaders, and proving workflows. |

## Doctrine and Direction

| Signpost | Role |
| :--- | :--- |
| **[VISION](./VISION.md)** | Core tenets and project identity. |
| **[BEARING](./BEARING.md)** | Current direction and active tensions. |
| **[METHOD](./METHOD.md)** | Repo work doctrine: backlog lanes and the cycle loop. |
| **[System-Style JS](./system-style-javascript.md)** | Engineering doctrine: boundaries, adapters, and codecs. |
| **[Design System](./design-system/README.md)** | Foundations, patterns, and component families. |

## Reference

| Surface | Role |
| :--- | :--- |
| **[CLI](./CLI.md)** | Command surface: binaries and operator scripts. |
| **[MCP](./MCP.md)** | MCP server posture and tool reference. |
| **[guides/render-pipeline.md](./guides/render-pipeline.md)** | Concrete render-stage guide for `configurePipeline()`, `RenderState`, and stage-order truth. |
| **[CHANGELOG.md](./CHANGELOG.md)** | Historical truth of merged behavior. |
| **[ROADMAP](./ROADMAP.md)** | Broad strategic horizon. |

---
**For a machine-readable inventory of all documentation, run `npm run docs:inventory`.**
