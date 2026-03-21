# Component Families

This document is the working semantic map for the shipped Bijou component families.

The goal is to stop thinking in terms of "every export is its own component."

## How to read this

- **Family** means one semantic job.
- **Variants** may be semantic, interaction-layer, or render-path variants.
- **Core** means it belongs in `@flyingrobots/bijou`.
- **TUI** means it belongs in `@flyingrobots/bijou-tui`.

## Documentation completeness status

This page is a living component-family reference.

The stated design-system standard requires each mature family doc to include:

- what it is
- variations
- when to use
- when not to use
- content guidance
- interaction ownership
- graceful lowering across `rich`, `static`, `pipe`, and `accessible`
- related families
- closest Carbon analogue

This page now meets the structural documentation standard for shipped families: every family below includes variants, usage guidance, content guidance, ownership, graceful lowering, related families, and a Carbon analogue. The remaining work is about depth and sharper examples, not missing required sections.

## Component slice checklist

When a component family is changed in code, the matching family docs should be checked in the same slice.

Minimum verification:

- the family is present in this guide
- the listed variants still match reality
- `Use when` and `Avoid when` still match the implementation and examples
- graceful lowering still matches the runtime behavior
- related families still make sense after the code change

If those checks fail, the component work is not doctrinally complete yet.

## Status and feedback families

### Inline status

- Family: `badge()`
- Variants:
  - semantic/status variants
- Use when:
  - status is compact and local to another object
- Avoid when:
  - message must stand alone or explain itself
- Content guidance:
  - keep badge labels terse, stable, and noun-like or state-like
  - avoid embedding full sentences or multi-step guidance in badges
- Ownership:
  - core
- Graceful lowering:
  - rich/static: keep compact label styling inline with nearby content
  - pipe: lower to plain inline text label without relying on color
  - accessible: speak the status in plain words next to the owning object
- Related families:
  - `alert()`
  - `note()`
  - notification system
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
- Content guidance:
  - include the state, cause, and next useful action in the body when possible
  - keep the headline short and let supporting text carry detail
- Ownership:
  - core
- Graceful lowering:
  - rich/static: remain a boxed or otherwise clearly separated in-flow message
  - pipe: lower to emphasized plain text that stays in document order
  - accessible: keep message text and severity explicit, with no dependence on borders or color
- Related families:
  - `badge()`
  - `note()`
  - `toast()`
  - notification system
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
- Content guidance:
  - keep the message short enough to scan without stopping the task
  - avoid multiline operational detail that really belongs in notifications or a drawer
- Ownership:
  - TUI
- Graceful lowering:
  - rich: anchored transient overlay with placement and timing
  - static: lower to visible in-flow status or last-frame summary rather than hidden motion
  - pipe: lower to one plain event line or app-owned log entry
  - accessible: prefer explicit announcement text over spatial anchoring
- Related families:
  - `alert()`
  - `modal()`
  - notification system
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
- Content guidance:
  - titles should summarize the event, while body text should explain consequence or next step
  - actionable notifications should expose one clear primary action instead of a menu of choices
- Ownership:
  - TUI
- Graceful lowering:
  - rich: stacked overlays with placement, action buttons, animation, and archive/history
  - static: visible notices plus accessible history review surface
  - pipe: lower to ordered event lines and routed warnings/errors
  - accessible: simplify to explicit chronological reviewable notices with actions described in text
- Related families:
  - `toast()`
  - `alert()`
  - `log()`
  - `modal()`
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
- Content guidance:
  - log lines should remain chronological, specific, and attributable
  - avoid decorative phrasing that makes scanning and filtering harder
- Ownership:
  - core
- Graceful lowering:
  - rich/static: retain ordered styled lines with level cues
  - pipe: already natural plain sequential output
  - accessible: keep timestamps/levels explicit and avoid decorative formatting
- Related families:
  - notification system
  - `alert()`
  - `badge()`
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
- Content guidance:
  - titles should describe the region’s job, not restate surrounding context
  - keep dense prose out of narrow boxes unless wrapping materially helps comprehension
- Ownership:
  - core
- Graceful lowering:
  - rich/static: keep bordered or titled containment when space allows
  - pipe: lower to plain grouped text with spacing and optional title
  - accessible: preserve title and content order without decorative framing
- Related families:
  - `separator()`
  - `alert()`
  - `grid()`
  - `splitPane()`
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
- Content guidance:
  - labels should name the next section or state, not repeat a page title
  - use dividers sparingly so they mark real boundaries rather than visual noise
- Ownership:
  - core
- Graceful lowering:
  - rich/static: render as visual divider or labeled rule
  - pipe: lower to simple text divider or heading-like label
  - accessible: preserve section naming without decorative characters being the only cue
- Related families:
  - `box()`
  - `tabs()`
  - `breadcrumb()`
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
- Content guidance:
  - prompts should describe the expected input shape and any critical constraints
  - placeholders and defaults should clarify intent, not substitute for the label
- Ownership:
  - core
- Graceful lowering:
  - rich: interactive field/editor treatment with validation feedback
  - static: render current value or prompt snapshot honestly
  - pipe: fall back to line-buffered prompt/input flow
  - accessible: keep prompt, validation, and submitted value explicit in text
- Related families:
  - `select()`
  - `filter()`
  - `group()`
  - `wizard()`
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
- Content guidance:
  - option labels should be distinct, parallel, and easy to scan
  - searchable choice should use concise matching text, not long descriptive paragraphs
- Ownership:
  - core
- Graceful lowering:
  - rich: keyboard choice list with focus and optional search narrowing
  - static: show current selection or available options snapshot
  - pipe: lower to numbered or searchable textual selection flow
  - accessible: keep option labels, current selection, and prompt semantics explicit
- Related families:
  - `multiselect()`
  - `commandPalette()`
  - `input()`
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
- Content guidance:
  - options should read like members of one set, not unrelated commands
  - summary text should make selection state obvious without requiring visual checkboxes
- Ownership:
  - core
- Graceful lowering:
  - rich: checkbox-style set selection with keyboard toggling
  - static: show selected values snapshot honestly
  - pipe: lower to comma-separated or numbered textual selection flow
  - accessible: describe the current set in plain text rather than relying on checkmarks alone
- Related families:
  - `select()`
  - `filter()`
  - `group()`
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
- Content guidance:
  - questions should be explicit about the consequence of yes versus no
  - destructive confirmations should name the thing being changed or removed
- Ownership:
  - core
- Graceful lowering:
  - rich: yes/no confirmation prompt or focused confirm surface
  - static: show the confirmation question and current default honestly
  - pipe: lower naturally to textual yes/no input
  - accessible: preserve the binary choice and default state explicitly
- Related families:
  - `modal()`
  - `alert()`
  - `wizard()`
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
- Content guidance:
  - each step or group should have a clear goal and avoid mixing unrelated concepts
  - summaries and progress text should orient the user without duplicating every field label
- Ownership:
  - core
- Graceful lowering:
  - rich: grouped or staged prompts with progress and validation
  - static: show the current step/group snapshot honestly
  - pipe: lower to sequential prompts while preserving branching meaning
  - accessible: keep step names, requirements, and progress explicit in text
- Related families:
  - `input()`
  - `select()`
  - `confirm()`
  - `stepper()`
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
- Content guidance:
  - tab labels should be short destination names, not action phrases
  - unread counts or compact status belong in secondary adornments, not the core label
- Ownership:
  - core
- Graceful lowering:
  - rich/static: keep one active peer view visibly selected
  - pipe: lower to labeled current section plus sibling list if needed
  - accessible: preserve peer destinations and active state explicitly in text
- Related families:
  - `stepper()`
  - `breadcrumb()`
  - `createFramedApp()`
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
- Content guidance:
  - section headers should summarize the concealed content well enough to support scanning
  - disclosed content should stay tightly related to its summary row
- Ownership:
  - core plus TUI interaction layer
- Graceful lowering:
  - rich: collapsible sections with optional keyboard-owned inspection
  - static: show expanded/collapsed state honestly without requiring motion
  - pipe: lower to section headings with visible disclosed content
  - accessible: keep section labels and disclosure state explicit in text
- Related families:
  - `tabs()`
  - `box()`
  - `interactiveAccordion()`
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
- Content guidance:
  - path and progress labels should emphasize where the user is, not every possible destination
  - step titles should be stable and action-oriented enough to support review and recovery
- Ownership:
  - core
- Graceful lowering:
  - rich/static: retain location, step, or page state with simple styling
  - pipe: lower to plain path/progress/page summaries
  - accessible: preserve order and active/current state explicitly
- Related families:
  - `tabs()`
  - `wizard()`
  - `statusBar()`
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
- Content guidance:
  - column headers should describe comparable attributes, not narrative explanations
  - cell text should stay compact enough that wrapping does not obscure the comparison task
- Ownership:
  - core plus TUI interaction layer
- Graceful lowering:
  - rich: passive table or focused navigable inspection depending on variant
  - static: retain tabular comparison when width allows, otherwise favor honest wrapped rows
  - pipe: lower to textual row/column output without hidden clipping
  - accessible: preserve headers, row labels, and comparison semantics explicitly
- Related families:
  - `browsableList()`
  - `tree()`
  - `navigableTable()`
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
- Content guidance:
  - labels should make nesting meaningful even when indentation is flattened or linearized
  - path context should be explicit when many siblings have similar names
- Ownership:
  - core plus TUI interaction layer
- Graceful lowering:
  - rich: render hierarchy with optional interactive file/navigation layer
  - static: keep visible nesting and path structure honestly
  - pipe: lower naturally to textual indented hierarchy/path lists
  - accessible: preserve parent/child relationships in linear text
- Related families:
  - `browsableList()`
  - `dag()`
  - `filePicker()`
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
- Content guidance:
  - list rows should begin with the most distinguishing label or identifier
  - descriptions should help the scan task, not turn each row into a paragraph
- Ownership:
  - core plus TUI interaction layer
- Graceful lowering:
  - rich: passive or keyboard-browsable list with optional descriptions
  - static: keep readable ordered list snapshot
  - pipe: lower naturally to plain item list text
  - accessible: preserve item ordering, active selection, and descriptions explicitly
- Related families:
  - `table()`
  - `tree()`
  - `commandPalette()`
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
- Content guidance:
  - events and nodes should expose the causal or temporal relationship, not just labels
  - annotations should stay lightweight enough that the structure remains legible
- Ownership:
  - core plus TUI interaction layer
- Graceful lowering:
  - rich: preserve chronology or graph shape with optional focused inspection
  - static: keep time/dependency order honestly even if the spatial rendering simplifies
  - pipe: lower to ordered event lists or textual dependency traces
  - accessible: linearize the structure while preserving temporal/dependency meaning explicitly
- Related families:
  - `table()`
  - `tree()`
  - `log()`
  - `dagPane()`
- Carbon analogue:
  - timeline has a close analogue; DAG does not and should be treated as a specialized Bijou family

### Scrollable inspection panes

- Family:
  - `pager()`
  - `pagerSurface()`
  - `focusArea()`
  - `focusAreaSurface()`
- Variants:
  - linear pager
  - focused pane with gutter
  - text-lowering path
  - surface-native path
- Use when:
  - a bounded pane is for reading, reviewing, or scrolling through content rather than navigating a richer table, tree, or graph structure
- Avoid when:
  - the content needs row/column comparison, hierarchy, or domain-specific navigation semantics
- Ownership:
  - TUI
- Content guidance:
  - use `pager()` / `pagerSurface()` for long linear text where the status line and current line position matter
  - use `focusArea()` / `focusAreaSurface()` when the pane participates in a larger workspace and needs explicit focus ownership
  - prefer the surface-native path when the pane body is already composed from `Surface` content; keep the string path as explicit lowering, not the default teaching path
  - gutter chrome should communicate focus and workspace ownership, not carry primary content meaning
- Graceful lowering:
  - rich: scrollable pane with honest status/focus chrome and bounded viewport behavior
  - static: visible excerpt or current window with enough status context to explain where the user is
  - pipe: lower to sequential text without pretending the hidden region is still interactively present
  - accessible: linearize the pane content while preserving scroll position or focus context explicitly
- Related families:
  - `viewport()`
  - `dagPane()`
  - `createFramedApp()`
  - `browsableList()`
- Carbon analogue:
  - closest to a scrollable content region or code viewer; not a direct Carbon family

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
- Content guidance:
  - `tooltip()` content should be short, local, and explanatory, not actionable or scrollable
  - `drawer()` content should support supplemental work, inspection, or side-by-side context without stealing the whole task
  - `modal()` content should justify blocking the user and should end in a clear decision, confirmation, or review step
  - `toast()` content should be short-lived and self-contained, not a surrogate notification center
  - when rich TUI structure matters, overlays should accept or compose structured `Surface` content instead of flattening component content into strings first
- Graceful lowering:
  - rich: layered overlay surfaces with blocking or non-blocking behavior depending on variant
  - static: lower to visible in-flow or shell-level snapshots rather than hidden z-order
  - pipe: lower to plain text event or prompt surfaces appropriate to interruption level
  - accessible: linearize overlay content with explicit relationship to the blocked or supplemented context
- Related families:
  - notification system
  - `alert()`
  - `createFramedApp()`
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
- Content guidance:
  - the shell should frame destinations and workspace state, not become a dumping ground for unrelated metadata
  - status lines should carry concise global context, not replace in-page guidance
  - command palette entries should prefer actions and navigation targets over field-style data entry
  - tabs should represent peer destinations or work areas, not disguised command buttons
- Graceful lowering:
  - rich: full shell chrome with tabs, palette, overlays, notifications, and workspace regions
  - static: retain the active page and essential shell context without pretending background interactivity exists
  - pipe: lower to current page content plus minimal status/context framing
  - accessible: linearize active shell state, navigation context, and current overlays into one readable flow
- Related families:
  - `statusBar()`
  - `tabs()`
  - `commandPalette()`
  - notification system
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
- Content guidance:
  - use `splitPane()` when the user benefits from explicit primary-versus-secondary context
  - use `grid()` when multiple stable regions deserve simultaneous visibility
  - use `flex()` / `vstackSurface()` / `hstackSurface()` / `placeSurface()` to keep rich TUI composition structured; keep `vstack()` / `hstack()` / `place()` for explicit text composition or lowering
  - region titles and borders should explain job and hierarchy, not merely expose geometry
- Graceful lowering:
  - rich: keep spatial relationships and resizable or placed regions where they materially help
  - static: retain simplified spatial grouping when possible without fake interactivity
  - pipe: lower to sensible sequential content order
  - accessible: linearize regions in a predictable reading order with section labels
- Related families:
  - `box()`
  - `createFramedApp()`
  - `focusArea()`
- Carbon analogue:
  - layout grid / split layout / stack primitives

## Families that still need stronger doctrine

These are shipped, but the guidance is still thinner than it should be:

- `alert()` versus notifications versus `toast()`
- `tree()` versus future interactive tree behavior
- `timeline()` density and audit-trail guidance
- `statusBar()` as a shell pattern
- `commandPalette()` modes beyond simple action search
- mouse-first interaction policy for shell and overlay families
