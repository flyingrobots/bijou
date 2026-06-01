---
title: DX-036 Responsive table layout and variants
legend: DX
lane: up-next
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
