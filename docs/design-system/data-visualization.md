# Data Visualization Policy

Bijou already ships several data-display families:

- `table()`
- `tree()`
- `timeline()`
- `dag()`
- `dagSlice()`
- `dagStats()`
- interactive siblings such as `navigableTable()` and `dagPane()`

This document defines when to use each one and when not to visualize at all.

## 1. Start with the question, not the component

Before choosing a view, answer:

1. Is the user comparing records?
2. Is the user following hierarchy?
3. Is the user following chronology?
4. Is the user following dependencies or flow?
5. Is the user inspecting, or just reading?

If you do not know the question, the visualization choice will be decorative rather than informative.

## 2. Default selection ladder

### Use `table()` when comparison is primary

Choose a table when:

- the same attributes matter across many rows
- the user needs side-by-side comparison
- scanability matters more than storytelling

Avoid `table()` when:

- hierarchy is primary
- chronology is primary
- the dependency structure itself is the meaning

### Use `tree()` when parent/child hierarchy is primary

Choose a tree when:

- nesting is the message
- branches matter more than attributes
- the user needs to understand containment or lineage

Avoid `tree()` when:

- nodes have multiple parents
- the user is comparing many scalar attributes across peers

### Use `timeline()` when chronology is primary

Choose a timeline when:

- sequence over time is the point
- events build a story
- state changes need a temporal narrative

Avoid `timeline()` when:

- side-by-side comparison matters more than order
- timestamps are metadata rather than the central axis

### Use `dag()` when dependency or flow is primary

Choose a DAG when:

- nodes depend on one another
- parallel branches matter
- multiple parents or non-tree edges matter

Avoid `dag()` when:

- a plain tree or table already tells the truth
- the graph is so large that the shape becomes noise

## 3. Passive versus active inspection

### Passive reading

Use:

- `table()`
- `tree()`
- `timeline()`
- `dag()`

when the user is reading or scanning.

### Active inspection

Use:

- `navigableTable()`
- `browsableList()`
- `dagPane()`
- future interactive tree/file-browser patterns

when the user needs focus, selection, keyboard traversal, or drill-in behavior.

## 4. Density policy

Terminals tolerate dense information, but the wrong kind of density becomes illegible quickly.

### Good density

- aligned columns
- consistent row shape
- compact but meaningful labels
- restrained use of borders and status color

### Bad density

- too many competing tones
- wide wrapped columns inside already dense tables
- graphs with too many labels to read
- timelines with so much metadata that order disappears

## 5. Narrow terminal policy

Visualization must degrade honestly in narrow spaces.

### Preferred behavior

- reflow to fewer columns
- wrap supporting text
- reduce metadata before reducing meaning
- collapse to summary plus drill-in path where appropriate

### Avoid

- silently truncating the very field the user is trying to inspect
- forcing a graph into a width where it no longer communicates structure

## 6. When not to visualize

Do not force a data structure into a component just because one exists.

Avoid visualizing when:

- a short sentence says it more clearly
- a count or badge communicates enough
- the user only needs one record
- the structure is incidental rather than informative

Examples:

- one build status: use `badge()` or `alert()`, not `table()`
- one warning with context: use `alert()` or notification, not `timeline()`
- one path: use `breadcrumb()` or plain text, not `tree()`

## 7. Data visualization and graceful lowering

These families should preserve meaning across modes:

- `table()` should still compare
- `tree()` should still show nesting
- `timeline()` should still show order
- `dag()` should still show dependency structure, or degrade to a truthful summary if a full graph is not legible

If the only good version of a view is the rich interactive one, then the family needs:

- a TUI-only interaction layer
- a simplified lower-fidelity companion
- or a different canonical representation

## 8. Future chart policy

When Bijou adds chart families such as sparklines, bars, or scatter plots, the default rules should be:

- use charts for trend, shape, or distribution
- use tables for exact values
- pair chart and summary where the chart alone cannot carry the meaning
- do not make color the only way categories are distinguished
- narrow terminals should prefer simpler marks over denser ones

## 9. Practical recommendations for today

- Prefer `table()` for operational comparison.
- Prefer `timeline()` for histories and release/event storytelling.
- Prefer `tree()` for nested structure and navigation lineage.
- Prefer `dag()` for pipelines, dependencies, and workflow execution reasoning.
- Prefer interactive siblings only when the user must inspect, not just read.
