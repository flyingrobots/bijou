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
| ESLint baseline | 266 | Type-aware ESLint findings after the DF-077 DOGFOOD app/theme extraction pass. |
| **Total** | **674** | Aggregate Code Dojo standards debt. |

DF-077 keeps `examples/docs/app.ts` over both size thresholds, but it tightens
that file's file/context baseline from `5,793` to `4,166` split-counted lines
and from `201,982` to `147,799` bytes. It also lowers ESLint debt from `317` to
`266`, so the aggregate Code Dojo ceiling falls from `725` to `674`.

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

The current ceiling is `674`. The next met goalpost must lower the ceiling to
`624` or lower.

## Updating The Ceiling

At a goalpost boundary:

1. Remove or formally justify standards debt.
2. Run `npm run code-dojo:debt`.
3. Lower the `--max` value in the `code-dojo:debt` package script by at least
   50, or to zero if fewer than 50 violations remain.
4. Update this ledger's current count and next target.
5. Run `npm run code-dojo:verify`.

Do not raise the ceiling without explicit design-review justification.
