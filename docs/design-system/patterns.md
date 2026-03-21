# Patterns

This document defines the recurring product patterns that Bijou should support consistently.

These are the decision frameworks behind the component families.

## 1. Status and feedback

### The pattern

Not all feedback should interrupt the user equally. Choose the least disruptive surface that still preserves the needed meaning.

### Escalation ladder

#### `badge()`

Use when:

- the status is compact
- it belongs inline with another object
- the surrounding content already provides context

Avoid when:

- the user must act on the information
- the message needs explanation
- the status must persist as its own block

#### `note()`

Use when:

- the user needs supporting explanation
- the content is informational, not urgent
- the message belongs inside a form or guided flow

Avoid when:

- urgency or danger must be communicated
- the message should interrupt

#### `alert()`

Use when:

- the state should remain in the document flow
- the message is important enough to deserve its own block
- the user should see it while reading or editing nearby content

Avoid when:

- the event is brief and transient
- it belongs in an activity stream
- the app should manage stack/history/lifecycle

#### `toast()`

Use when:

- the event is transient
- the app is composing a one-off overlay directly
- custom placement matters, but full notification lifecycle does not

Avoid when:

- the message must remain in the page content
- the app needs stacking, history, routing, or recall
- the user needs to review a set of related events later

Content guidance:

- keep the message short and self-contained
- do not hide follow-up obligations in a toast body
- prefer one clear state statement over mixed status plus instructions plus history

#### notifications

Use when:

- the app owns transient messaging as a system
- stacking, placement, actions, routing, or history matter
- the user may need to reopen or review prior notices

Avoid when:

- the message should remain in page content
- a single local overlay would do
- the user must stop and decide before continuing

Content guidance:

- use notifications for events, not for durable documents
- route warnings and errors here when the app owns runtime messaging as a system
- actionable notifications should expose one obvious next step, not a mini workflow
- if users may need recall, the history/archive surface is part of the feature, not an optional afterthought

#### `modal()`

Use when:

- the user must stop and decide
- the app needs an explicit review or confirmation surface
- background actions should be blocked

Avoid when:

- a lighter inline or overlay treatment would do

Content guidance:

- the title should state the decision or review task clearly
- the body should explain the consequence, not repeat generic warning copy
- the modal should end in a clear next action or dismissal path
- avoid turning a modal into a drawer with extra blocking chrome

## 2. Selection versus action

This is one of the easiest places for a component library to become fuzzy.

### `select()`

Use when:

- the user is choosing one value
- the set is short and stable
- the result becomes stored state

### `multiselect()`

Use when:

- the user is building a set
- multiple simultaneous selections are meaningful

### `filter()`

Use when:

- the user is choosing one value from a larger set
- search/narrowing is the main task

### `commandPalette()`

Use when:

- the result is an action, navigation, or command
- the app wants one global action-discovery surface

Avoid `commandPalette()` when:

- the user is filling out a field value
- the result should behave like stored form data

## 3. Comparison versus browsing versus inspection

### `table()`

Use when:

- the user needs comparison across columns
- the same attributes matter across many rows

Avoid when:

- hierarchy is the main point
- the user needs focused keyboard inspection rather than passive comparison

### `tableSurface()`

Use when:

- the user needs the same passive comparison semantics as `table()`
- the surrounding V3 runtime is already composing `Surface` output
- cells may contain surface-native labels or badges

Avoid when:

- direct string output is the final destination
- the app needs keyboard-owned row/cell focus semantics

### `navigableTable()`

Use when:

- table data must be actively traversed
- the app wants row/cell focus semantics

Avoid when:

- passive comparison is enough
- the output must remain portable through core-only string rendering

### `browsableList()`

Use when:

- items are one-dimensional
- descriptions matter
- the user is exploring or choosing among records

### `tree()`

Use when:

- the primary relationship is parent/child

### `dag()`

Use when:

- the primary relationship is dependency or flow
- multiple parents or graph edges matter

## 4. Disclosure and progressive complexity

### `accordion()`

Use when:

- content is secondary or optional
- one page can hold both summary and detail

Avoid when:

- the sections are peer destinations that deserve explicit navigation

### `tabs()`

Use when:

- views are peers
- only one view should be foregrounded at a time

Avoid when:

- the user is progressing through steps
- hierarchy/path context matters more than peer switching

### `stepper()`

Use when:

- the user is moving through a process
- order matters

Avoid when:

- the views are non-sequential

## 5. Overlay escalation

Choose overlays by how much they should interrupt and how much context they should retain.

### Governing rules

- Overlays are for interruption, review, or supplemental context. They are not substitutes for normal page structure.
- Pick the least interruptive overlay that still preserves the meaning and action path.
- If users need history, stacking, routing, or recall, move up from `toast()` to the notification system.
- If background input must stop, use `modal()` rather than trying to make a toast or drawer behave like one.
- If the content is long-lived and belongs in the reading flow, use `alert()` or a normal page region instead of any overlay.

### `tooltip()`

- for tiny local explanation
- not for decisions
- not for content that needs scrolling, recall, or commands

### `drawer()`

- for supplemental context, inspectors, side work
- keep the main surface visible
- prefer when the user needs reference material while still working in the main task

### `modal()`

- for blocking review, choice, or confirmation
- background shortcuts and pointer actions should be blocked
- use sparingly; interruption must be justified

### `toast()`

- for one transient overlay the app is composing directly
- not for stack/history/routing problems

### notifications

- for events, not documents
- use history/archive when recall matters
- prefer over repeated ad hoc toasts once app-level messaging becomes systemic

## 6. Forms and progression

### `group()`

Use when:

- the form fits one mental step
- fields are directly related

### `wizard()`

Use when:

- the flow has stages
- branching or transformation matters
- the user benefits from progressive disclosure

### `confirm()`

Use when:

- the decision is truly binary

Avoid when:

- the user needs to compare options or consequences in detail

## 7. App shell composition

### Governing rules

- The shell exists to frame destinations, workspace state, and global actions. It should not compete with page content for narrative space.
- Use shell chrome for orientation, status, and cross-cutting actions. Put explanation and task detail back into the page.
- Prefer the simplest workspace that preserves the mental model. Do not use split panes or grids just because the runtime can.
- If a region is not meaningfully inspectable, comparable, or supplemental, it probably should not be its own pane.

### `createFramedApp()`

Use when:

- the app has multiple views or work areas
- shell chrome, palette, overlays, and notifications should be standardized

Avoid when:

- the app is really just one screen or one prompt loop

Content guidance:

- tabs should represent peer destinations, not unrelated commands
- shell notifications and overlays should remain subordinate to the active page task
- help text should clarify shell behavior, not restate page content

### `statusBar()`

Use when:

- global state, mode, or shortcut context belongs at the shell edge

Avoid when:

- the content is explanatory or multi-line

Content guidance:

- keep status text short, global, and low-drama
- reserve strong emphasis for mode changes, faults, or focus-critical state
- do not turn the status bar into a secondary page body

### `splitPane()` and `grid()`

Use when:

- spatial composition helps the user reason about the workspace

Avoid when:

- the layout would be simpler and more legible as a sequential flow

Content guidance:

- use split panes for comparison, side-by-side reference, or inspector-style secondary context
- use grids when the user is reading across stable regions, not when one long column would be clearer
- label regions by job, not by visual position alone

## 8. Mouse and multimodal interaction

Mouse support in Bijou should follow these rules:

- keyboard is baseline
- mouse is enhancement
- every click target should mirror an existing keyboard path
- overlays consume pointer input before background content
- drag is reserved for spatial interactions such as pane resizing

Good early mouse targets:

- tabs
- split dividers
- notification actions and dismiss buttons
- list/table row focus

Bad early mouse targets:

- hover-only critical meaning
- interactions that have no keyboard parity

## 9. Lowering across modes

Every pattern should have a graceful lowering story.

### Examples

- notifications may lower to logs or in-flow alerts
- command palette may lower to documented shortcuts or static command lists
- navigable inspection views may lower to passive read-only views
- modals may lower to step-by-step prompts or inline confirmation blocks

The docs for each family should make that lowering explicit instead of assuming an interactive full-screen terminal.
