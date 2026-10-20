# Bijou documentation

[Read the complete book](./book/bijou-designs.pdf), inspect its
[LaTeX source](./book/bijou-designs.tex), or see [edition and build details](./book/README.md).

The book consolidates 426 guides, reference pages, design records, release notes,
audits and retrospectives. The individual source Markdown files have been removed.
Their exact text and checksums remain in the book corpus so DOGFOOD, localization
checks and historical contract tests continue to work.

For a bounded source excerpt, run from the repository root:

```bash
node --import tsx scripts/read-documentation.ts docs/ARCHITECTURE.md 1 80
```

The arguments are the original path, first line and line limit (maximum 250).
`npm run docs:inventory` lists the retained operating documents and book artifacts.

Start with the [Preface](./book/bijou-designs.pdf#page=2). Each of the seven
parts introduces its material; Part III explains how to read the design records.

## Current operating references

- [Project front door](../README.md)
- [Agent agreements](../AGENTS.md)
- [TypeScript Code Standards](./typescript-code-standards.editors-edition.md)
- [Code Dojo exceptions and debt](./code-dojo-exceptions.md)
- [Changelog](./CHANGELOG.md)
- [Framed app tutorial](./guides/framed-app-tutorial.md)

GitHub issues and milestones own current scope. Historical proposals in the book
retain their original status. Linear migration still requires a connected team.
