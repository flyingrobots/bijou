# Bijou documentation

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

## Current operating references

- [Project front door](../README.md)
- [Agent agreements](../AGENTS.md)
- [TypeScript Code Standards](./typescript-code-standards.editors-edition.md)
- [Code Dojo exceptions and debt](./code-dojo-exceptions.md)
- [Changelog](./CHANGELOG.md)
- [Framed app tutorial](./guides/framed-app-tutorial.md)

GitHub issues and milestones own current scope. Historical proposals in the book
retain their original status. Linear migration still requires a connected team.
