# Bijou documentation

| Surface | Role |
| :--- | :--- |
| [Project README](../README.md) | Public front door |
| [Teaching book](https://github.com/flyingrobots/bijou-job-monitor/blob/main/book/bijou-book.pdf) | Build and test the job monitor |
| [Design Archive](./book/bijou-archive.pdf) | Historical design records |
| [Complete edition](./book/bijou-designs.pdf) | Frozen teaching and historical collection |

[Read the teaching book](https://github.com/flyingrobots/bijou-job-monitor/blob/main/book/bijou-book.pdf), use the
[Design Archive](./book/bijou-archive.pdf), or
[Read the complete book](./book/bijou-designs.pdf).
See [LaTeX sources and edition details](./book/README.md).

The teaching book follows a job monitor through five Parts: why Bijou, building
the application, understanding its machinery, making it dependable, and shipping
and maintaining it. It includes practical reference material and the component atlas.

The archive preserves 426 guides, principles, design records,
release notes, audits and retrospectives as historical appendices. Their original
claims and status have not been reclassified as current implementation guarantees.
The complete edition preserves the combined 20 October 2026 publication. The live
teaching book and its LaTeX sources now belong to the job-monitor repository.
Individual source Markdown files remain removed;
their exact text and hashes survive in the frozen corpus for DOGFOOD and checks.

For a bounded source excerpt, run from the repository root:

```bash
node --import tsx scripts/read-documentation.ts docs/ARCHITECTURE.md 1 80
```

The arguments are the original path, first line and line limit (maximum 250).
`npm run docs:inventory` lists the retained operating documents and book artifacts.

Start with the teaching book's Preface and version page. Every teaching Part
has an introduction and a concrete learning outcome. The seven workshops use the
separate [published companion repository](https://github.com/flyingrobots/bijou-job-monitor),
pinned to Bijou 7.2.0 at edition `book-v2`. Five independent build stages, actual
source diffs and an explained exercise answer key support the workshops. The human
walkthrough is prepared; the user will arrange an unfamiliar reader.
The glossary and topic finder support practical lookup.

## Getting started

- [Build your first Bijou app](./guides/getting-started.md): minimal app, packages, layouts, and DOGFOOD controls.
- [Job Monitor tutorial](https://github.com/flyingrobots/bijou-job-monitor): a complete application and the teaching book.
- [Developing Bijou](./development.md): toolchain, testing, localization, and contribution workflow.

## Current operating references

- [Latest features in DOGFOOD](../examples/docs/content/guides-latest-features.md)
- [MCP package guide](../examples/docs/content/package-mcp.md)
- [Project front door](../README.md)
- [Agent agreements](../AGENTS.md)
- [TypeScript Code Standards](./typescript-code-standards.editors-edition.md)
- [Code Dojo exceptions and debt](./code-dojo-exceptions.md)
- [Changelog](./CHANGELOG.md)
- [V8 product witness replay](./releases/8.0.0/product-witness-replay.md)
- [V8 stable acceptance packet](./releases/8.0.0/stable-acceptance.md)
- [Framed app tutorial](./guides/framed-app-tutorial.md)

GitHub issues and milestones own current scope. Historical proposals in the book
retain their original status. Linear migration still requires a connected team.

`npm run release:readiness -- --milestone v8.0.0` requires a live release
packet at `docs/releases/8.0.0/stable-acceptance.md` or the legacy `README.md`
path in that directory. An archived packet remains available for historical
reading, but cannot satisfy the current release-evidence check. The report names
the live packet it found; its presence does not replace review of its evidence.

DOGFOOD labels its archive-backed articles as historical references. Its live
Latest Features guide covers later font, typography, animation, and theme work;
the package READMEs and runnable examples provide the detailed current contracts.

Release document paths use the release line: `8.0.0-alpha.1`, `8.0.0-beta.12`,
`8.0.0-rc.1`, and stable `8.0.0` share `docs/releases/8.0.0/`. The readiness
milestone is `v8.0.0`; DOGFOOD uses the same directory for its release guides.
Prereleases keep their exact version in document content, without duplicating
the directory. Preserved historical documents remain accessible through the
bounded reading command above.
