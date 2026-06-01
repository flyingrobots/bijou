---
title: DX-036 Responsive table layout and variants
legend: DX
lane: design
priority: medium
keywords:
  - table
  - layout
  - responsive
  - lowering
  - developer-experience
---

# DX-036 Responsive Table Layout and Variants

Make `table()` behave more like builders expect from a table: it should fit the
available width by default, wrap cell content intelligently, and expose named
style variants without forcing users to choose a separate component.

Legend:

- [DX - Developer Experience](../legends/DX-developer-experience.md)

## Sponsor Human

App builders using `table()` for command output, reports, diagnostics, and docs
snippets should get readable tabular output without hand-calculating column
widths for every terminal size.

## Sponsor Agent

Agents generating Bijou CLI output should be able to choose a table variant and
pipe format declaratively, while trusting the component to fit the viewport,
wrap cells, preserve data in machine modes, and remain inspectable through
tests.

## Hill

A builder can render dense comparison data with `table()` and get responsive,
word-aware, aligned output by default, while choosing explicit visual variants
and explicit pipe/data formats without switching components.

## Playback Questions

- Does a default human-mode `table()` fit `ctx.runtime.columns` when content
  would otherwise exceed the terminal?
- Does `layout: "intrinsic"` preserve today's content-sized behavior?
- Do wrapped rows keep continuation lines aligned under the correct columns?
- Can callers choose `box`, `ascii-grid`, `ruled`, `header-rule`, `plain`,
  `markdown`, and `definition` as table variants?
- Does `pipe` mode still default to TSV?
- Can callers explicitly request CSV, Markdown, TSV, or ASCII grid pipe output?
- Are ANSI styles, OSC 8 links, emoji, CJK, and combining graphemes measured by
  visible terminal width rather than string length?
- Does `accessible` mode keep row/header/value semantics independent of the
  visual variant?

## Accessibility / Assistive Posture

Visual variants must not change the accessible reading contract. Accessible
mode should keep a row-oriented header/value narration that is stable even when
human output wraps, uses rules, or serializes differently for pipes.

## Localization / Directionality Posture

The first cycle is not a full bidirectional table layout project. It should
keep the existing left-to-right table assumption, but all measurement and
wrapping should remain grapheme-aware so localized strings, combining marks,
CJK, and emoji do not break alignment.

## Agent Inspectability / Explainability Posture

The layout engine should produce a shared fitted table model before rendering.
Tests should be able to inspect or prove the resolved widths, wrapped lines,
variant renderer output, and pipe serialization independently enough that an
agent can explain why a column wrapped or shrank.

## Linked Invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md)

## Current Truth

`table()` currently renders an intrinsic-width Unicode boxed table in human
modes:

- columns without explicit `width` grow to the widest header or cell
- the renderer does not consult `ctx.runtime.columns`
- cells wrap only when a column has an explicit `width`
- wrapping is grapheme-aware but hard-wraps; it does not prefer word boundaries
- `overflow: "truncate"` clips text without adding an ellipsis
- `pipe` mode lowers to TSV
- `accessible` mode lowers to `Row N: Header=value`

`tableSurface()` has the same intrinsic sizing posture: it creates a surface
large enough for the table instead of fitting a parent width.

## Product Decision

This should remain a `table()` feature, not become a separate `ruledTable()`
component.

Add table variants as one API axis, and keep machine/data serialization as a
separate axis:

```ts
table({
  columns,
  rows,
  layout: 'auto',
  variant: 'ruled',
  pipeFormat: 'tsv',
});
```

Recommended defaults:

- `layout: "auto"` for human modes
- `width: ctx.runtime.columns` for string rendering when no explicit width is
  provided
- `overflow: "wrap"` for human modes
- `wrap: "word"` so wrapping prefers whitespace boundaries
- hard-wrap unbreakable tokens rather than losing data
- `pipeFormat: "tsv"` for `pipe` mode

Keep an escape hatch:

- `layout: "intrinsic"` preserves today's content-sized behavior
- explicit `width` / `maxWidth` can override the runtime width
- `overflow: "truncate"` and a future `overflow: "ellipsis"` can support dense
  compact output where data loss is acceptable

## Layout Requirements

Build a shared fitted table model before rendering variants:

1. Measure headers and cells by visible terminal width, ignoring ANSI and OSC 8
   escapes and respecting grapheme widths.
2. Compute preferred column widths from content.
3. If the preferred table fits the available width, render at natural width.
4. If it does not fit, shrink flexible columns toward minimum widths.
5. Prefer wrapping cell text at word boundaries.
6. Hard-wrap a long unbreakable token only when it cannot fit.
7. Preserve alignment for continuation lines by leaving earlier columns blank
   and padding every column by visible width.
8. Recompute from the current width whenever a live TUI rerenders after a
   terminal resize.

Column options should grow beyond today's fixed `width`:

```ts
type TableColumn = {
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  weight?: number;
  align?: 'left' | 'right' | 'center';
};
```

For `tableSurface()`, the first practical step is explicit `width` / `maxWidth`
support. Parent-surface auto-fit can arrive once parent layout code has a stable
way to pass available width down to child surfaces.

## Variants To Support

### `variant: "box"`

The current Unicode boxed table. Keep this as the compatibility visual style,
but route it through the fitted table model.

### `variant: "ascii-grid"`

Portable boxed ASCII table:

```text
+----------+---------+-------+
| Name     | State   | Score |
+----------+---------+-------+
| Alice    | active  | 95    |
| Bob      | pending | 72    |
+----------+---------+-------+
```

This should be available explicitly as a visual variant and as an explicit pipe
format, but it should not replace TSV as the default `pipe` lowering.

### `variant: "ruled"`

The desired report style: no outer border, no vertical dividers, heavy header
rule, and light row separators.

```text
Name       State     Score
━━━━━━━━━  ━━━━━━━━  ━━━━━
Alice      active    95
─────────  ────────  ─────
Bob        pending   72
```

This variant must support wrapped cells and continuation-line alignment from
the first implementation.

### `variant: "header-rule"`

Compact report style with only a header separator:

```text
Name       State     Score
---------  --------  -----
Alice      active    95
Bob        pending   72
```

### `variant: "plain"`

Borderless aligned columns:

```text
Name       State     Score
Alice      active    95
Bob        pending   72
```

Use spaces for visual alignment, not tabs. Tabs belong to TSV serialization;
space padding is the only reliable way to align ANSI-styled and wide-character
terminal content.

### `variant: "markdown"`

GitHub-flavored Markdown pipe table:

```text
| Name  | State   | Score |
|-------|---------|------:|
| Alice | active  |    95 |
| Bob   | pending |    72 |
```

This is useful both as a human/static variant and as `pipeFormat: "markdown"`
when the destination is a README, issue, PR, or docs file. Escape `|`,
backslashes, and multiline cells deliberately.

### `variant: "definition"`

Two-column field/value output:

```text
Field          Value
━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━
PR             https://github.com/flyingrobots/bijou/pull/120
State          MERGED
Merged at      2026-05-31T21:30:02Z
```

This can be implemented as a table variant with inferred `Field` and `Value`
columns for two-column rows.

### `variant: "expanded"`

psql-style record inspection:

```text
-[ RECORD 1 ]-------------------------
name   | Alice
state  | active
score  | 95
-[ RECORD 2 ]-------------------------
name   | Bob
state  | pending
score  | 72
```

This is valuable for narrow terminals and many-column records, but it changes
the reading mode from row comparison to record inspection. It can follow after
the fitted table model and primary variants are stable.

## Formats To Support

Keep serializations separate from visual variants:

- `pipeFormat: "tsv"`: default lowest lowering for machine use
- `pipeFormat: "csv"`: RFC-style escaped CSV for spreadsheet and shell export
- `pipeFormat: "markdown"`: docs-friendly pipe table
- `pipeFormat: "ascii-grid"`: explicit human-readable pipe output

TSV should remain the default pipe lowering because `pipe` usually means tools,
scripts, and data transfer. ASCII grid and Markdown are useful, but they are
human presentation formats and should be opt-in.

CSV must quote fields containing comma, quote, CR, LF, or other ambiguous
content according to a documented policy. TSV also needs a deliberate escaping
or preservation policy for tabs and newlines instead of accidental raw joins.

## Implementation Outline

1. Extract or replace the current table-private width/wrap helpers with a
   shared fitted table model that can serve all string variants.
2. Extend `TableColumn` with optional `minWidth`, `maxWidth`, `weight`, and
   `align`.
3. Add `layout`, `width` / `maxWidth`, `variant`, `pipeFormat`, and
   word-wrapping options to `TableOptions`.
4. Make human modes default to width-aware `layout: "auto"` and use
   `ctx.runtime.columns` when no width is provided.
5. Preserve today's content-sized rendering behind `layout: "intrinsic"`.
6. Render `box`, `ascii-grid`, `ruled`, `header-rule`, `plain`, `markdown`, and
   `definition` from the fitted model.
7. Keep TSV as the default pipe lowering, then add explicit CSV, Markdown, and
   ASCII grid pipe formats with escaping tests.
8. Bring `tableSurface()` to parity for explicit `width` / `maxWidth` once the
   string model is stable.
9. Update DOGFOOD or design-system docs with examples for the human-facing
   variants.

## Tests To Write First

- A regression proving current intrinsic tables can exceed narrow runtime width,
  then the new default fits that width.
- A compatibility test proving `layout: "intrinsic"` retains old content-sized
  output.
- Fitted-width tests for fixed, min, max, weighted, and aligned columns.
- Word-boundary wrapping and hard-wrap fallback tests.
- Continuation-line alignment tests for multiline rows.
- ANSI, OSC 8, emoji, CJK, and combining-grapheme alignment tests.
- Snapshot-style tests for `box`, `ascii-grid`, `ruled`, `header-rule`,
  `plain`, `markdown`, and `definition`.
- Pipe-format tests for TSV default, CSV escaping, Markdown escaping, and ASCII
  grid opt-in lowering.
- Accessible-mode tests proving visual variants do not change semantic
  row/header/value reading order.

## Explicit Non-Goals

- Do not add `ruledTable()` as a separate public component.
- Do not support Org-mode / Emacs table syntax in the first pass.
- Do not make ASCII grid the default `pipe` lowering.
- Do not silently truncate data by default.
- Do not redesign `navigableTable()` before the passive `table()` model is
  stable.

## Acceptance Bar

- `table()` defaults to width-aware layout in human modes.
- `layout: "intrinsic"` preserves old content-sized behavior.
- Fixed, minimum, maximum, weighted, and aligned columns are covered by tests.
- Word-boundary wrapping uses shared text wrapping behavior where possible.
- ANSI, OSC 8 links, emoji, CJK, and combining graphemes stay aligned.
- Wrapped rows keep continuation lines under the correct columns.
- `box`, `ascii-grid`, `ruled`, `header-rule`, `plain`, `markdown`, and
  `definition` variants have snapshot-style tests.
- `pipeFormat: "tsv"`, `"csv"`, `"markdown"`, and `"ascii-grid"` are covered
  with escaping tests.
- `accessible` mode preserves semantic row/header/value reading order.
- DOGFOOD or design-system docs show at least `box`, `ruled`, `header-rule`,
  `plain`, `markdown`, and `definition` examples.
- Follow-on work is filed for `expanded` if it is not implemented in the first
  cycle.

## Retrospective

Not started.
