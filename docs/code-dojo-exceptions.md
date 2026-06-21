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
| File/context baseline | 217 | Files over the Code Dojo context threshold. |
| Mock-ban baseline | 0 | Existing test mock/spy violations. |
| Code-size baseline | 45 | Files over the 500-line ratchet, including 3 over the 1000-line hard limit. |
| ESLint baseline | 0 | Type-aware ESLint findings after the WF-160 focused cleanup pass. |
| **Total** | **262** | Aggregate Code Dojo standards debt. |

WF-161 splits `91` over-threshold deterministic test/spec files into grouped
sub-spec files that each stay under the Code Dojo file/context thresholds. Nine
of those original spec files were also over the `500` line code-size ratchet.
This lowers file/context debt from `308` to `217`, code-size debt from `54` to
`45`, and aggregate Code Dojo debt from `362` to `262` without changing product
behavior.

BE-001 starts Project Big Extraction by turning
`examples/docs/dogfood-blocks.ts` from a `2,637` line / `92,020` byte hard-limit
monolith into a `97` line / `3,740` byte compatibility facade backed by focused
sub-150-line modules. This removes `dogfood-blocks.ts` from both the
file/context and code-size baselines, lowers hard-limit code-size files from
`4` to `3`, and lowers aggregate Code Dojo debt from `364` to `362`. This is an
interim structural reduction; it does not by itself satisfy the 50-violation
goalpost burndown policy.

WF-160 clears the final ESLint and mock-ban baselines while removing `22`
file/context entries through focused type extraction, test-support extraction,
and behavior-preserving test splits. Node IO and create-app CLI tests now use
observable fake writers/platform seams instead of process spies, pipeline tests
observe rebuild behavior through an explicit callback, and the PR review status
script uses validator-backed parsing instead of caller-chosen generics. The
aggregate Code Dojo ceiling falls from `414` to `364`, and the next target is
`314` or lower.

WF-159 lowers ESLint debt from `57` to `6` by making the i18n runtime boundary
return unknown catalog values instead of caller-chosen unchecked generics,
tightening localization interpolation, replacing scattered non-null and unsafe
test assertions with typed guards, cleaning theme token access and deprecated
barrel exports, and preserving active-binding malformed-input coverage through
an explicit runtime invocation helper. The aggregate Code Dojo ceiling falls
from `465` to `414`. Per the operator's temporary waiver for touched-file size
ratchets during this slice, existing file/context entries for touched
legacy-large files were refreshed without adding new counted file/context or
code-size violations; existing code-size ceilings for the touched i18n runtime
files were refreshed as well.

WF-158 lowers ESLint debt from `110` to `57` by cleaning focused form,
DOGFOOD, benchmark, TUI command/file/panel/status, progress, smoke, text
wrapping, component fallback, DAG overload, and runtime viewport clusters. The
aggregate Code Dojo ceiling falls from `518` to `465`. Per the operator's
temporary waiver for touched-file size ratchets during this slice, existing
file/context entries for touched legacy-large files were refreshed without
adding new counted file/context or code-size violations.

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

The current ceiling is `262`. The next met goalpost must lower the ceiling to
`212` or lower.

## Updating The Ceiling

At a goalpost boundary:

1. Remove or formally justify standards debt.
2. Run `npm run code-dojo:debt`.
3. Lower the `--max` value in the `code-dojo:debt` package script by at least
   50, or to zero if fewer than 50 violations remain.
4. Update this ledger's current count and next target.
5. Run `npm run code-dojo:verify`.

Do not raise the ceiling without explicit design-review justification.
