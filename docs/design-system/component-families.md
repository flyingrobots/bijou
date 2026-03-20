# Component Families

This document is the working semantic map for the shipped Bijou component families.

The goal is to stop thinking in terms of "every export is its own component."

## How to read this

- **Family** means one semantic job.
- **Variants** may be semantic, interaction-layer, or render-path variants.
- **Core** means it belongs in `@flyingrobots/bijou`.
- **TUI** means it belongs in `@flyingrobots/bijou-tui`.

## Status and feedback families

### Inline status

- Family: `badge()`
- Variants:
  - semantic/status variants
- Use when:
  - status is compact and local to another object
- Avoid when:
  - message must stand alone or explain itself
- Ownership:
  - core
- Carbon analogue:
  - tag

### In-flow status block

- Family: `alert()`
- Variants:
  - semantic tones
  - render-path companion: `alertSurface()`
- Use when:
  - status should remain part of the page/document
- Avoid when:
  - lifecycle/history/stacking is required
- Ownership:
  - core
- Carbon analogue:
  - inline notification

### Low-level transient overlay

- Family: `toast()`
- Variants:
  - status variants
  - anchor/placement
- Use when:
  - the app needs a one-off transient overlay and is composing overlays directly
  - placement matters, but lifecycle/history does not
- Avoid when:
  - stacking, routing, actions, or recall matter
  - the content should remain in page flow
- Ownership:
  - TUI
- Carbon analogue:
  - toast notification primitive

### Transient app notifications

- Family: notification system
- Variants:
  - `TOAST`
  - `INLINE`
  - `ACTIONABLE`
  - tones
  - placements
  - history/archive view
- Use when:
  - the app owns transient messaging and may need stacking, routing, actions, or recall
- Avoid when:
  - the content is primary page content
  - one local overlay is enough and app-wide lifecycle is unnecessary
- Ownership:
  - TUI
- Carbon analogue:
  - toast notification, actionable notification, notification panel/center

### Activity stream

- Family: `log()`
- Variants:
  - log levels
- Use when:
  - order and accumulation matter
- Avoid when:
  - the message should interrupt instead of accumulate
- Ownership:
  - core
- Carbon analogue:
  - activity log / event stream pattern

## Structural families

### Framed grouping

- Family: `box()`
- Variants:
  - titled via `headerBox()`
  - render-path companions via `boxSurface()` and `headerBoxSurface()`
- Use when:
  - grouping and containment matter
- Avoid when:
  - urgency or interruption is the primary job
- Ownership:
  - core
- Carbon analogue:
  - tile / contained section

### Dividers

- Family: `separator()`
- Variants:
  - labeled, unlabeled
  - render-path companion: `separatorSurface()`
- Use when:
  - a section boundary is needed without full containment
- Avoid when:
  - the content needs its own grouped region
- Ownership:
  - core
- Carbon analogue:
  - divider

## Choice and form families

### Text entry

- Family:
  - `input()`
  - `textarea()`
- Variants:
  - short-form versus long-form entry
- Use when:
  - the user is providing text rather than choosing from a fixed set
- Avoid when:
  - choices are already known and enumerable
- Ownership:
  - core
- Carbon analogue:
  - text input / text area

### Single choice

- Family:
  - `select()`
  - `filter()`
- Variants:
  - regular choice
  - searchable choice
- Use when:
  - the result is stored value state
- Avoid when:
  - selecting should trigger an app command rather than persist a value
- Ownership:
  - core
- Carbon analogue:
  - dropdown / combo box

### Multiple choice

- Family: `multiselect()`
- Variants:
  - default selections, checkbox set behavior
- Use when:
  - the user is building a set
- Avoid when:
  - the choice is singular or immediate action-oriented
- Ownership:
  - core
- Carbon analogue:
  - multi-select / checkbox group

### Binary decision

- Family: `confirm()`
- Variants:
  - default yes/no orientation
- Use when:
  - the decision is genuinely binary
- Avoid when:
  - nuance, comparison, or explanation is needed
- Ownership:
  - core
- Carbon analogue:
  - confirmation dialog pattern

### Multi-field and staged forms

- Family:
  - `group()`
  - `wizard()`
- Variants:
  - single-step grouped form
  - staged or branching flow
- Use when:
  - the user is progressing through related inputs
- Avoid when:
  - the fields are unrelated or the result is a command
- Ownership:
  - core
- Carbon analogue:
  - form group / multi-step flow

## Content organization families

### Peer navigation

- Family: `tabs()`
- Variants:
  - tab labels, badges, active state
- Use when:
  - views are peers and only one is active
- Avoid when:
  - order or hierarchy is the main idea
- Ownership:
  - core
- Carbon analogue:
  - tabs

### Progressive disclosure

- Family:
  - `accordion()`
  - `interactiveAccordion()`
- Variants:
  - static disclosure
  - keyboard-owned TUI inspection
- Use when:
  - detail is secondary to summary
- Avoid when:
  - sections are peers that deserve first-class navigation
- Ownership:
  - core plus TUI interaction layer
- Carbon analogue:
  - accordion

### Path and progress

- Family:
  - `breadcrumb()`
  - `stepper()`
  - `paginator()`
- Variants:
  - location, process progress, page count
- Use when:
  - the UI needs wayfinding or progress communication
- Avoid when:
  - tabs or lists express the job more clearly
- Ownership:
  - core
- Carbon analogue:
  - breadcrumb / progress indicator / pagination

## Data and browsing families

### Dense comparison

- Family:
  - `table()`
  - `tableSurface()`
  - `navigableTable()`
- Variants:
  - `table()` for passive comparison in core string output
  - `tableSurface()` for passive comparison in V3 surface-first output
  - `navigableTable()` for keyboard-owned inspection in the TUI layer
- Use when:
  - row/column comparison is the main task
- Avoid when:
  - hierarchy or dependency structure dominates
  - items are primarily one-dimensional and should read as a list instead
- Ownership:
  - core plus TUI interaction layer
- Carbon analogue:
  - data table

### Hierarchy

- Family:
  - `tree()`
  - `filePicker()`
- Variants:
  - static hierarchy
  - interactive filesystem browser
- Use when:
  - parent/child nesting is the mental model
- Avoid when:
  - multiple parents or graph dependencies matter
- Ownership:
  - core plus TUI interaction layer
- Carbon analogue:
  - tree view / file browser pattern

### Lists for exploration

- Family:
  - `enumeratedList()`
  - `browsableList()`
- Variants:
  - passive list
  - interactive browsable list
- Use when:
  - one-dimensional items are being scanned or explored
- Avoid when:
  - columns or hierarchy carry the meaning
- Ownership:
  - core plus TUI interaction layer
- Carbon analogue:
  - ordered/unordered list / selectable list

### Temporal or dependency views

- Family:
  - `timeline()`
  - `dag()`
  - `dagSlice()`
  - `dagStats()`
  - `dagPane()`
- Variants:
  - chronological
  - dependency graph
  - focused fragment
  - metrics
  - interactive graph inspection
- Use when:
  - time or dependency is the actual structure
- Avoid when:
  - a plain table or tree is enough
- Ownership:
  - core plus TUI interaction layer
- Carbon analogue:
  - timeline has a close analogue; DAG does not and should be treated as a specialized Bijou family

## Overlay and shell families

### Overlay primitives

- Family:
  - `tooltip()`
  - `drawer()`
  - `modal()`
  - `toast()`
- Variants:
  - explanatory
  - supplemental
  - blocking
  - transient
- Use when:
  - the app needs layered interaction surfaces
- Avoid when:
  - the content should just live in the document or shell
- Ownership:
  - TUI
- Carbon analogue:
  - tooltip / side panel / modal / toast notification

### App shell

- Family:
  - `createFramedApp()`
  - `statusBar()`
  - `commandPalette()`
- Variants:
  - shell, status rail, action discovery
- Use when:
  - the app has multiple views, overlays, navigation, and shell chrome
- Avoid when:
  - the app is really one screen or one prompt
- Ownership:
  - TUI
- Carbon analogue:
  - shell, header/footer, command palette

### Workspace layout

- Family:
  - `splitPane()`
  - `grid()`
  - `flex()`
  - `vstack()`
  - `hstack()`
  - `place()`
- Variants:
  - user-resizable, named-area, compositional layout primitives
- Use when:
  - spatial arrangement materially helps the task
- Avoid when:
  - a sequential flow would be simpler and more legible
- Ownership:
  - TUI
- Carbon analogue:
  - layout grid / split layout / stack primitives

## Families that still need stronger doctrine

These are shipped, but the guidance is still thinner than it should be:

- `alert()` versus notifications versus `toast()`
- `tree()` versus future interactive tree behavior
- `timeline()` density and audit-trail guidance
- overlay family specialization beyond primitive API docs
- `statusBar()` as a shell pattern
- `commandPalette()` modes beyond simple action search
- mouse-first interaction policy for shell and overlay families
