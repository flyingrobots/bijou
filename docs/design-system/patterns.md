# Patterns

This document defines the recurring product patterns that Bijou should support consistently.

These are the decision frameworks behind the component families.

## 0. Selection, focus, and rhythm

### The pattern

Bijou should make it obvious:

- which item is currently selected
- which region currently owns input
- which copy is primary versus supporting
- how dense content is meant to breathe

These decisions should not be improvised per surface.

### Canonical rules

#### Background fill means current selection

Use background fill to indicate the current selected row or item inside a collection.

Why:

- it reads immediately in dense TUIs
- it does not depend on one tiny pointer glyph
- it survives better than hue-only emphasis when terminals differ

Selection may also use supporting cues such as:

- a leading chevron
- bold value text
- a stronger border inside the selected row

But those are supporting cues. The canonical selected-item treatment is still background fill.

#### Structural accent means active region

Use a structural accent such as a gutter, border emphasis, or region frame to show the active region.

Why:

- region focus and row selection are not the same thing
- a pane can be active while its selected row changes
- a selected row can exist inside an inactive region without stealing shell ownership

The accent should describe ownership of input, not merely visual importance.

#### Visible controls are a promise

Follow [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md).

If a region is not active, its controls should not be advertised as though they will work.

When the shell owns focus, shell controls replace pane-local cues.

#### One cell of padding matters

Dense TUIs still need rhythm.

Canonical defaults:

- one cell of padding between content and region edges
- one blank line between titled sections
- one blank line between preference rows or similar stacked interactive rows when the surface can afford it

Do not cram labels, values, and descriptions together when one cell of space would make the surface easier to parse.

#### Stack beneath the label before truncating

When labels and values compete for the same horizontal space:

- wrap or stack first
- reflow second
- truncate only when the surface truly demands single-line identity

For settings and similar rows, values should stack beneath the label before truncating into ambiguity.

Marquee is an explicit overflow behavior for compact, focused single-line surfaces. It is not the default solution.

#### Supporting copy should look supporting

Descriptions, helper copy, and secondary explanation should look visibly quieter than primary actions and current values.

Use:

- muted tokens
- dim modifiers when needed
- more breathing room around primary actions than around support prose

Do not make supporting copy compete with what the user is supposed to act on now.

#### Layers should behave like a stack

When interactive layers overlap, they should behave in top-down order.

Canonical rules:

- the topmost layer owns input
- the topmost layer owns the visible control hints
- dismiss actions target the topmost dismissible layer first
- underlying regions do not keep advertising controls while covered

This means a palette, drawer, or modal should not merely look on top. It should also be the source of truth for routing and footer/help copy.

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

#### `skeleton()`

Use when:

- the content shape is known but a short-lived loading gap would otherwise cause layout pop
- the user benefits from seeing where content will land

Avoid when:

- honest partial content is already available
- the loading state is long-lived enough that explicit progress or retry messaging would be more honest
- the placeholder would imply certainty the app does not actually have yet

#### `progressBar()` / `createAnimatedProgressBar()`

Use when:

- percent-complete is actually known or can be estimated honestly
- the user benefits from determinate progress instead of generic activity

Avoid when:

- completion is unknown and the percentage would be fake
- the work is so brief that the bar would only flicker

Loading-screen rule:

- a loading screen should show at most one progress bar
- that bar must represent actual loading progress
- do not use a progress bar on a title or splash screen unless the screen is truly a loading surface

#### `spinnerFrame()` / `createSpinner()`

Use when:

- the task is active but indeterminate
- the user needs reassurance that work is still happening

Avoid when:

- completion can be expressed honestly as a determinate bar
- animation would distract more than it reassures

## 2. Selection versus action

This is one of the easiest places for a component library to become fuzzy.

### `select()`

Use when:

- the user is choosing one value
- the set is short and stable
- the result becomes stored state

Avoid when:

- the list is large enough that search is the real task
- the outcome should trigger an immediate app command instead of persisting a value

### `multiselect()`

Use when:

- the user is building a set
- multiple simultaneous selections are meaningful

Avoid when:

- the user should choose exactly one option
- the user is really firing commands one at a time instead of building a lasting set

### `filter()`

Use when:

- the user is choosing one value from a larger set
- search/narrowing is the main task

Avoid when:

- the option set is already short and stable enough for `select()`
- the result is a command or navigation action rather than stored value state

### `commandPalette()` / `commandPaletteSurface()`

Use when:

- the result is an action, navigation, or command
- the app wants one global action-discovery surface
- the user may benefit from mixed command groups such as actions, navigation, or recent destinations

Content guidance:

- palette entries should read like things the app can do, not field values the app stores
- group commands by user intent (`Navigation`, `Actions`, `Recent`) instead of raw subsystem names when possible
- keep descriptions short enough to scan without turning the palette into a browseable document

Avoid `commandPalette()` / `commandPaletteSurface()` when:

- the user is filling out a field value
- the result should behave like stored form data
- the content is really a browseable record list rather than an action list

## 3. Comparison versus browsing versus inspection

### `table()`

Use when:

- the user needs comparison across columns
- the same attributes matter across many rows

Avoid when:

- hierarchy is the main point
- the user needs focused keyboard inspection rather than passive comparison
- the item set is effectively one-dimensional and would read more honestly as a list

### `tableSurface()`

Use when:

- the user needs the same passive comparison semantics as `table()`
- the surrounding V3 runtime is already composing `Surface` output
- cells may contain surface-native labels or badges

Avoid when:

- direct string output is the final destination
- the app needs keyboard-owned row/cell focus semantics

### `navigableTable()` / `navigableTableSurface()`

Use when:

- table data must be actively traversed
- the app wants row/cell focus semantics
- comparison across stable columns is still the job even while navigating

Avoid when:

- passive comparison is enough
- the output must remain portable through core-only string rendering
- the user is really selecting among one-dimensional records instead of comparing attributes

### `browsableList()` / `browsableListSurface()`

Use when:

- items are one-dimensional
- descriptions matter
- the user is exploring or choosing among records

Avoid when:

- actions/commands are the result rather than records
- column comparison is the point
- hierarchy/path structure is the point

### `filePicker()` / `filePickerSurface()`

Use when:

- the user is traversing filesystem hierarchy
- the current path and directory transitions are part of the job

Avoid when:

- the content is generic hierarchy rather than actual file/path navigation
- actions/commands are the result rather than a selected file or directory

## 3.5 Viewport masking and scroll ownership

### Governing rules

- `viewportSurface()` is the canonical masking primitive for bounded overflow scrolling in rich TUI composition.
- `viewport()` is the explicit text-lowering path when the content is intentionally string-first.
- `pagerSurface()` and `focusAreaSurface()` are specialization layers on top of the viewport primitive, not separate scroll systems.
- If a component only needs a clipped window plus scroll state, it should wrap viewport semantics rather than invent a bespoke `scrollY` slicer.
- `navigableTableSurface()` is the important exception: wrapped comparison rows keep row-aware scroll semantics, so generic line clipping is the wrong abstraction there.
- Scroll ownership must stay unified. If keyboard focus, mouse hit-testing, and rendering disagree about the visible window height, the component has a layout bug.
- Scrollbars belong to the viewport layer. Components should not fake overflow by moving rows around without giving the user a truthful masked window.

### Layout rules

- Components should either fill the rectangle their parent assigns them or be intentionally placed within it by a parent-owned layout helper such as `placeSurface()`.
- Parents own outer whitespace and anchoring. Child components should not silently shrink and leave accidental slack against a pane edge.
- When a pane has a fixed header or separator row, the remaining rows should belong to one honest body region rather than an ad hoc mix of body plus invisible slack.
- Overflow handling must be explicit: wrap, stack, clip, or viewport. Scrolling content without a matching viewport contract is not an acceptable fallback.

### `viewportSurface()`

Use when:

- an existing `Surface` or layout-backed region just needs a scrollable mask
- the app already owns the surrounding chrome and only needs honest overflow scrolling
- the component should stay on the structured `Surface` path

Avoid when:

- the content is intentionally string-first and the text-lowering path is the actual destination
- the component needs domain-specific focus chrome or status semantics that belong in a higher-level wrapper

## 3.6 Containment and formatted documents

### `box()` / `headerBox()`

Use when:

- a region needs visible containment or a local title
- peer panels need to feel like separate working areas
- compact metadata belongs in a header rather than in the surrounding prose

Avoid when:

- every subsection would get a border just for visual decoration
- the real job is status escalation, not containment
- a divider, heading, or simple whitespace would communicate structure more honestly

### `markdown()`

Use when:

- the content is help, reference, release notes, or bounded prose
- lightweight structure such as headings, lists, quotes, links, and code fences materially helps comprehension
- the same content should lower honestly across rich, pipe, and accessible modes

Avoid when:

- the content is so large that it really needs document navigation instead of one rendered block
- the prose is user-authored rich content that expects full browser-grade markdown semantics
- the app is really laying out UI regions or controls and is trying to use markdown as a layout engine
- dense comparison, forms, or command discovery are the real jobs

### `hyperlink()`

Use when:

- the destination itself should remain part of the rendered output
- terminals with link support can benefit from clickability without hiding where the link goes

Avoid when:

- the label is vague or generic
- trust depends on seeing the actual destination, but the surrounding content hides it
- the interaction is really an app-owned action instead of an external destination

### `kbd()`

Use when:

- a local action needs an inline shortcut cue
- the key hint belongs right next to the control, field, or instruction it affects

Avoid when:

- the user needs a grouped command reference or shell-level keymap
- shortcut chips would start competing with the real content for attention

### `pagerSurface()` / `focusAreaSurface()`

Use when:

- the scrollable region needs explicit line status, current-position framing, or focus gutter semantics
- the pane is part of a larger workspace that needs visible ownership/focus signals

Avoid when:

- a plain masked region is enough and extra chrome would distract from the task

### Choosing among browseable structures

- Choose `browsableListSurface()` when rows are essentially labels plus brief descriptions.
- Choose `commandPaletteSurface()` when the outcome is an action or navigation command.
- Choose `filePickerSurface()` when path traversal is the mental model.
- Choose `navigableTableSurface()` when comparison across columns remains the job even while navigating.
- Choose `viewportSurface()` directly when the content already exists as a region and just needs bounded overflow masking.

### `tree()`

Use when:

- the primary relationship is parent/child
- the user needs to understand nesting or containment

Avoid when:

- multiple parents or dependency edges matter
- the user is really traversing filesystem paths, where `filePickerSurface()` is more honest
- dense row/column comparison would communicate the content more clearly than nesting

### `dag()` / `dagPane()`

Use when:

- the primary relationship is dependency or flow
- multiple parents or graph edges matter
- the user needs to answer questions like “what does this depend on?” or “what does this unblock?”

Avoid when:

- a tree, timeline, or table would answer the question more directly
- the graph would mostly act as architecture wallpaper instead of supporting a concrete task
- the user really needs a metrics summary or focused fragment instead of the whole graph

### `timeline()`

Use when:

- chronology is the main structure
- events should read as a sequence, milestone trail, or audit-oriented progression

Avoid when:

- dependency or causality matters more than ordering
- the content is so dense that a table, log, or summary-plus-detail drill-down would be more readable
- the user is really comparing attributes across many events rather than following a temporal story

## 3.7 Expressive branding and decorative emphasis

### `loadRandomLogo()` / `gradientText()`

Use when:

- the product needs a deliberate branded or celebratory moment
- splash surfaces, docs, or demos benefit from a little atmosphere

Avoid when:

- ordinary workspace chrome, navigation, status, or instructions need to stay neutral and legible
- the emphasis would compete with the actual task
- the color treatment is being asked to carry meaning that should live in text

## 5. App-authored primitives

### `renderByMode()`

Use when:

- the app needs a domain-specific primitive that the shared component library should not own
- the same semantic concept must lower honestly across rich, pipe, and accessible output

Avoid when:

- a shipped Bijou family already matches the job
- the branching only exists to chase visual novelty instead of preserving meaning

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
- the current stage should be understandable at a glance

Avoid when:

- the views are non-sequential
- the user is really switching among peer destinations instead of progressing through a flow

### `breadcrumb()`

Use when:

- the user needs path context
- hierarchy or nesting should stay visible while reading the current location

Avoid when:

- peer destinations are the real model
- the path is so deep or unstable that a simpler label plus local navigation would be clearer

### `paginator()`

Use when:

- the current page or position within a bounded sequence matters
- page count should be visible without turning into a full navigation menu

Avoid when:

- the user needs rich peer navigation rather than compact progress
- the content is an infinite feed or unbounded stream where page counts are misleading

## 5. Overlay escalation

Choose overlays by how much they should interrupt and how much context they should retain.

### Governing rules

- Overlays are for interruption, review, or supplemental context. They are not substitutes for normal page structure.
- Pick the least interruptive overlay that still preserves the meaning and action path.
- If users need history, stacking, routing, or recall, move up from `toast()` to the notification system.
- If background input must stop, use `modal()` rather than trying to make a toast or drawer behave like one.
- If the content is long-lived and belongs in the reading flow, use `alert()` or a normal page region instead of any overlay.
- Use structured `Surface` content inside overlays when the interrupting layer needs real rows, embedded components, or richer layout. Flatten to plain text only at explicit lowering boundaries.

### `tooltip()`

- for tiny local explanation attached to nearby content
- prefer one or two short lines that clarify a control, label, or state
- not for decisions
- not for content that needs scrolling, recall, commands, or workflow ownership

### `drawer()`

- for supplemental context, inspectors, side work
- keep the main surface visible
- prefer when the user needs reference material while still working in the main task
- use panel-scoped drawers when the supplemental context belongs to one workspace region instead of the whole frame
- do not turn a drawer into a modal by stuffing it with blocking confirmation copy

### `modal()`

- for blocking review, choice, or confirmation
- background shortcuts and pointer actions should be blocked
- use sparingly; interruption must be justified
- prefer short review-and-decide tasks over deep browsing or long-lived side work

### `toast()`

- for one transient overlay the app is composing directly
- not for stack/history/routing problems
- if the same class of event happens repeatedly, stop composing ad hoc toasts and move up to notifications

### notifications

- for events, not documents
- use history/archive when recall matters
- prefer over repeated ad hoc toasts once app-level messaging becomes systemic
- route app-owned warnings and errors here when users may need to revisit them after the initial interruption
- keep actions singular and obvious; do not hide multi-step workflows inside notification cards

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
- Keep shell roles distinct:
  - status rails communicate concise global state
  - help hints teach shortcuts and scope
  - command palette surfaces action discovery
  - notifications surface events and follow-up
- If one shell element starts doing another shell element's job, the design is drifting.

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
- command palette entries should prefer actions and navigation targets, not field-style data entry or explanatory prose
- use drawers for supplemental workspace context and notifications for event messaging; do not overload the status rail with either

### `statusBar()` and `statusBarSurface()`

Use when:

- global state, mode, or shortcut context belongs at the shell edge

Avoid when:

- the content is explanatory or multi-line

Content guidance:

- keep status text short, global, and low-drama
- use `statusBarSurface()` when shell chrome is already being composed as a `Surface`
- keep `statusBar()` for explicit text output or lowering
- reserve strong emphasis for mode changes, faults, or focus-critical state
- do not turn the status bar into a secondary page body
- do not route transient warnings or task-specific explanation here when notifications or in-page content would be more honest

### `helpShort()` / `helpView()` and surface companions

Use when:

- keyboard ownership is real and shortcut discovery needs a concise hint or grouped reference

Avoid when:

- the text would only restate visible controls without clarifying behavior or scope

Content guidance:

- use `helpShortSurface()` for shell hints that stay on the structured `Surface` path
- use `helpViewSurface()` for grouped shortcut references embedded inside a rich TUI surface or modal
- keep the plain string helpers for explicit lowering, pipe output, or textual docs/examples
- group by user intent (`Navigation`, `Actions`, `Selection`) rather than by key shape
- help is for shortcut discovery and scope clarification, not for executing commands or replacing a command palette

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

## 10. Motion and shader effects

Motion and shader effects are supporting patterns, not the product itself.

Use them when:

- they clarify transition, progress, focus, or spatial change
- the user benefits from seeing continuity rather than a sudden visual jump
- the effect reinforces the information architecture instead of competing with it

Avoid them when:

- they are only decorative noise
- they make dense work harder to read
- the same information would be clearer as stable content, a status change, or a simpler transition

Specific guidance:

- use transition shaders to reinforce page or workspace change, not to show off that the renderer can animate
- use `canvas()` for purposeful visual surfaces such as splash, background atmosphere, or dedicated visual moments, not as a default wrapper around ordinary productivity screens
- reduced-motion and non-interactive modes must still tell the truth even when the effect disappears entirely

- notifications may lower to logs or in-flow alerts
- command palette may lower to documented shortcuts or static command lists
- navigable inspection views may lower to passive read-only views
- modals may lower to step-by-step prompts or inline confirmation blocks

The docs for each family should make that lowering explicit instead of assuming an interactive full-screen terminal.
