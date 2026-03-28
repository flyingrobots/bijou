# bijou-i18n Should Be a Real Package

_Design note for splitting Bijou localization into a runtime package and a tooling package_

## Why this exists

The current localization doctrine is intentionally broad:

- shell copy should be localizable
- direction should become a first-class concern
- long strings need honest layout behavior
- spreadsheet workflows are real

That direction is correct, but it still leaves one architectural question unresolved:

**Where does i18n live in the monorepo?**

For Bijou, localization should not be treated as:

- a pile of helper functions hidden inside `@flyingrobots/bijou`
- an afterthought attached to shell copy
- a spreadsheet-specific workflow jammed directly into runtime code

If Bijou is serious about localization, then `bijou-i18n` should be a real localization tool with a real package boundary.

## Product stance

Bijou should ship localization as at least two distinct concerns:

1. **Runtime i18n**
   A pure, in-memory, host-agnostic catalog runtime that applications and shell surfaces can use at render time.

2. **Catalog tooling**
   Build-time and workflow tooling for:
   - stale detection
   - spreadsheet export/import
   - reference validation
   - pseudo-localization
   - compiled catalog generation

Those should not live in one package.

## Recommended package split

### `@flyingrobots/bijou-i18n`

This package should own the **runtime contract**.

It should be:

- platform-agnostic
- filesystem-agnostic
- network-agnostic
- string-first but not string-only
- usable entirely in memory

It should expose concepts like:

- locale
- direction (`ltr` / `rtl` / `auto`)
- catalogs
- namespaced keys
- message lookup
- generic localized resource lookup
- formatter hooks
- runtime-safe reference resolution
- catalog load/unload

This is the package that `@flyingrobots/bijou` and `@flyingrobots/bijou-tui` should consume.

### `@flyingrobots/bijou-i18n-tools`

This package should own the **workflow and compilation layer**.

It should handle:

- authoring-catalog ingestion
- source-hash tracking
- stale translation detection
- spreadsheet export/import
- tabular reference resolution
- compilation from authoring catalogs to runtime catalogs
- pseudo-localization
- overflow and RTL stress tooling

This package is allowed to care about:

- files
- CSV/TSV/XLSX-like workflows
- report generation
- developer tooling ergonomics

That would be the wrong responsibility for the runtime package.

## Why the split matters

### 1. Runtime should stay clean

The runtime should not drag in assumptions about:

- spreadsheets
- local files
- Google Sheets
- Excel
- CI pipelines
- catalog publishing workflows

It should simply answer:

- what locale is active?
- what direction is active?
- what is the value of this key?
- how do I format this number/date/list?

### 2. Tooling should be free to get messy

Localization tooling inevitably touches:

- spreadsheets
- CSV churn
- stale-string workflows
- diffs
- audit reports
- pseudolocales
- translators and reviewers

That is real work, but it belongs in tooling, not in the runtime path.

### 3. Bijou should support more than strings

The common case is message lookup, but real localization systems also need:

- localized resources
- shared terminology
- structured data
- references to other catalog entries

That means the authoring model cannot be "English string dictionary only."

But it also does not mean the runtime should become a spreadsheet interpreter.

The right compromise is:

- rich authoring catalogs and tooling
- normalized runtime catalogs

## Catalog model direction

Bijou should think in catalogs, not isolated string tables.

Every catalog entry should have:

- a namespace
- an id
- a kind
- a source value
- per-locale values
- metadata

Kinds should eventually include at least:

- `message`
- `resource`
- `data`

This allows a message to depend on:

- primitive interpolation values
- referenced terminology
- structured data rows
- non-string localized resources

That is a better fit for real production localization than pretending every placeholder is a primitive scalar.

## References are a first-class requirement

Bijou should explicitly support catalog references.

Examples:

- glossary terms reused across many messages
- names sourced from a shared data table
- localized labels pulled from another namespace
- richer resource resolution for non-string values later

This does **not** mean runtime message resolution should become arbitrary spreadsheet logic.

It means the system should support references as a first-class authoring concept, then normalize them into a runtime-safe catalog format.

## What belongs in `bijou`

`@flyingrobots/bijou` itself should still own:

- text layout
- wrapping
- clipping
- future overflow policies like marquee
- direction-aware layout primitives
- accessible lowering

That line matters.

Localization packages should answer:

- what content is available?
- which locale/direction is active?
- how do I resolve a message/resource?

They should **not** own:

- how a list row wraps
- whether a compact shell stacks a value beneath a label
- whether a one-line label uses marquee or truncation

Those are UI and layout concerns.

## Relationship to bidirectionality

`bijou-i18n` should expose direction metadata and locale context.

But the actual mirroring and logical-layout work should stay in:

- `@flyingrobots/bijou`
- `@flyingrobots/bijou-tui`

That means:

- i18n runtime provides `direction`
- shell and layout systems decide how `start` / `end` map to screen geometry

That is the clean separation.

## Suggested package roadmap

### Phase 1

- define runtime catalog types
- define runtime `I18nPort`
- ship in-memory runtime catalogs
- move shell-copy direction toward message descriptors

### Phase 2

- define authoring catalog format
- add stale detection via source hash
- add spreadsheet export/import
- compile authoring catalogs into runtime catalogs

### Phase 3

- add pseudo-localization tooling
- add long-string and RTL stress reports
- add clearer workflow around catalog slicing and dynamic loading

### Phase 4

- optional external adapters if justified later
  - Google Sheets
  - filesystem-backed catalog publishing
  - remote bundle loading

Those should remain optional and should not be assumed by default.

## Initial package naming recommendation

Use:

- `@flyingrobots/bijou-i18n`
- `@flyingrobots/bijou-i18n-tools`

If external system adapters appear later, keep them separate:

- `@flyingrobots/bijou-i18n-sheets`
- `@flyingrobots/bijou-i18n-fs`
- `@flyingrobots/bijou-i18n-cli`

That keeps the core runtime and workflow contracts clean.

## Success criteria

This direction is successful when:

- localization runtime concerns stop being mixed with spreadsheet/tooling concerns
- Bijou has a real i18n runtime package rather than ad hoc shell-local helpers
- spreadsheet and stale-string workflows have an official home without polluting runtime
- catalogs support more than plain strings
- direction metadata is available to the shell and layout layers early

## Relationship to other doctrine

This note is a follow-on to:

- [Localization and Bidirectionality](./localization-and-bidirectionality.md)
- [Bijou UX Doctrine](./bijou-ux-doctrine.md)
- [Accessibility and Assistive Modes](./accessibility-and-assistive-modes.md)
- [Content Guide](./content-guide.md)

It narrows one specific architectural question:

**If Bijou is going to take localization seriously, where should that capability actually live?**

The answer is:

- runtime in `bijou-i18n`
- workflow and spreadsheets in `bijou-i18n-tools`
