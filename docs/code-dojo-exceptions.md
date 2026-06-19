# Code Dojo Exceptions

This ledger tracks the standards debt that remains after installing the
verbatim [TypeScript Code Standards Editor's Edition](./typescript-code-standards.editors-edition.md)
artifact.

Passing `npm run code-dojo:verify` means the repository did not grow the
currently tracked standards debt. It does not mean the repository fully adheres
to the standards.

`npm run code-dojo:ci` remains the local full-proof lane when a change needs
the standards checks plus build, typecheck, workspace lint, ESLint, and tests.

## Counted Violations

`npm run code-dojo:debt` is the source of truth for the aggregate Code Dojo
debt count.

The count is intentionally rule-based, not file-unique. A file can count once
for file/context debt and again for code-size debt because those are separate
standards violations.

Current count:

| Source | Count | Meaning |
| :--- | ---: | :--- |
| File/context baseline | 331 | Files over the Code Dojo context threshold. |
| Mock-ban baseline | 22 | Existing test mock/spy violations. |
| Code-size baseline | 55 | Files over the 500-line ratchet, including 4 over the 1000-line hard limit. |
| ESLint baseline | 110 | Type-aware ESLint findings after the WF-157 focused cleanup pass. |
| **Total** | **518** | Aggregate Code Dojo standards debt. |

WF-157 lowers ESLint debt from `162` to `110` by cleaning focused i18n
catalog/freezing boundaries, MCP docs example coercion, TUI key/navigation,
drawer, motion, notification, pager, split-pane, runtime-support, subapp, and
example bootstrap clusters. The aggregate Code Dojo ceiling falls from `570` to
`518`. Per the operator's temporary waiver for touched-file size ratchets
during this slice, existing file/context entries for touched legacy-large files
were refreshed without adding new counted file/context or code-size violations.

WF-156 lowers ESLint debt from `215` to `162` by cleaning focused TUI runtime,
notification, list, DAG, layout, timer, grapheme, block-tree, create-app CLI,
release-readiness, release metadata, and canary smoke-runner clusters. The
aggregate Code Dojo ceiling falls from `623` to `570`. Per the operator's
temporary waiver for touched-file size ratchets during this slice, existing
file/context and code-size entries for touched legacy-large files were refreshed
without adding new counted file/context or code-size violations.

WF-155 lowered ESLint debt from `266` to `215` by cleaning focused Storybook,
counter fixture, TUI app, focus-area, collection-surface, surface primitive,
split-editor, i18n localization, and Node IO clusters while keeping touched
file/context ceilings flat or lower. The aggregate Code Dojo ceiling falls from
`674` to `623`.

WF-155 also keeps breaking up the oversized DOGFOOD app entrypoint by extracting
standard block docs, live block preview rendering, and Theme Inspector state
into sub-150-line modules. `examples/docs/app.ts` remains counted debt, but it
falls from `4,165` physical lines / `147,799` bytes to `3,306` physical lines /
`114,890` bytes in this pass, and DOGFOOD raw-string debt falls from `2,415` to
`2,373` without increasing any per-file baseline.

## Goalpost Burndown Policy

Every met repo goalpost must reduce the aggregate Code Dojo debt count by at
least 50 violations until the count reaches zero.

This is additive. It does not replace:

- touched-file cleanup rules
- file/context ratchets
- mock-ban ratchets
- code-size ratchets
- DOGFOOD localization ratchets
- CI, review, release, or merge-readiness gates

When fewer than 50 violations remain, the next met goalpost must reduce the
count to zero.

The current ceiling is encoded in `package.json`:

```text
npm run code-dojo:debt
```

The current ceiling is `518`. The next met goalpost must lower the ceiling to
`468` or lower.

## Updating The Ceiling

At a goalpost boundary:

1. Remove or formally justify standards debt.
2. Run `npm run code-dojo:debt`.
3. Lower the `--max` value in the `code-dojo:debt` package script by at least
   50, or to zero if fewer than 50 violations remain.
4. Update this ledger's current count and next target.
5. Run `npm run code-dojo:verify`.

Do not raise the ceiling without explicit design-review justification.
