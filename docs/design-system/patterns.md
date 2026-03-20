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

#### notifications

Use when:

- the app owns transient messaging as a system
- stacking, placement, actions, routing, or history matter
- the user may need to reopen or review prior notices

Avoid when:

- the message should remain in page content
- a single local overlay would do
- the user must stop and decide before continuing

#### `modal()`

Use when:

- the user must stop and decide
- the app needs an explicit review or confirmation surface
- background actions should be blocked

Avoid when:

- a lighter inline or overlay treatment would do

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

### `tooltip()`

- for tiny local explanation
- not for decisions

### `drawer()`

- for supplemental context, inspectors, side work
- keep the main surface visible

### `modal()`

- for blocking review, choice, or confirmation
- background shortcuts and pointer actions should be blocked

### notifications

- for events, not documents
- use history/archive when recall matters

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

### `createFramedApp()`

Use when:

- the app has multiple views or work areas
- shell chrome, palette, overlays, and notifications should be standardized

Avoid when:

- the app is really just one screen or one prompt loop

### `statusBar()`

Use when:

- global state, mode, or shortcut context belongs at the shell edge

Avoid when:

- the content is explanatory or multi-line

### `splitPane()` and `grid()`

Use when:

- spatial composition helps the user reason about the workspace

Avoid when:

- the layout would be simpler and more legible as a sequential flow

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
