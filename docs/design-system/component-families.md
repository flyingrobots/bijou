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

### Loading placeholders

- Family: `skeleton()`
- Variants:
  - single-line, multiline, and region-shaped placeholders
- Use when:
  - the expected content shape is known but the content is not available yet
  - a short-lived loading interval would otherwise cause distracting layout pop
- Avoid when:
  - honest partial content can already be shown
  - the delay is long enough that a clearer loading state, progress indicator, or retry path is needed
  - the placeholder would outlive the user’s trust and start to look like fake content
- Content guidance:
  - skeletons should roughly match the final information density instead of becoming ornamental gray bars everywhere
  - use them for short-lived uncertainty, then yield to partial or explicit loading states as soon as real content exists
  - keep labels or surrounding context explicit so the user knows what is loading
- Ownership:
  - core
- Graceful lowering:
  - rich/static: preserve the placeholder shape while loading is genuinely transient
  - pipe: lower to explicit loading text or field labels instead of decorative placeholder bars
  - accessible: announce loading state and the affected region explicitly rather than relying on visual shimmer or shape
- Related families:
  - `spinner()`
  - `progressBar()`
  - `note()`
- Carbon analogue:
  - skeleton state

### Inline shortcut cues

- Family: `kbd()`
- Variants:
  - single key, chord, and adjacent grouped key cues
- Use when:
  - a local action or instruction needs an inline shortcut hint
  - the shortcut belongs next to the thing it affects
- Avoid when:
  - the user needs a broader command reference or grouped shortcut map
  - the chip would become the primary content instead of a supporting cue
- Content guidance:
  - show only the keys the user actually needs at that moment
  - keep shortcut chips close to the related action label instead of collecting them into decorative clutter
  - use shell help views for broader keybinding discovery; keep `kbd()` for inline, local hints
- Ownership:
  - core
- Graceful lowering:
  - rich/static: preserve compact key-chip treatment inline with related content
  - pipe: lower to explicit key names in plain text without decorative framing being the only cue
  - accessible: speak the shortcut and related action in one readable phrase
- Related families:
  - `helpView()`
  - `commandPalette()`
  - `note()`
- Carbon analogue:
  - keyboard key / shortcut hint

### Progress indicators

- Family:
  - `progressBar()`
  - `createProgressBar()`
  - `createAnimatedProgressBar()`
  - `spinnerFrame()`
  - `createSpinner()`
- Variants:
  - determinate bar
  - indeterminate spinner
  - live controller helpers
  - animated progress interpolation
- Use when:
  - the user needs honest feedback that work is ongoing
  - determinate versus indeterminate progress is actually known
- Avoid when:
  - loading is so brief that the indicator would flicker more than it helps
  - the state should be explained as a durable message or result instead of transient activity
- Content guidance:
  - use `progressBar()` when completion can be estimated honestly
  - use `spinnerFrame()` / `createSpinner()` when activity is real but percent-complete is not
  - switch from placeholder to progress indicator only when process feedback matters more than preserving layout shape
  - pair progress indicators with clear labels so users know what is happening, not just that something is moving
- Ownership:
  - core
- Graceful lowering:
  - rich/static: preserve determinate or indeterminate activity cues honestly
  - pipe: lower to explicit text progress or repeated status lines without fake animation semantics
  - accessible: announce task state, progress, and completion explicitly in text
- Related families:
  - `skeleton()`
  - `badge()`
  - notification system
- Carbon analogue:
  - progress bar / loading spinner

## Structural families

### Framed grouping

- Family: `box()`
- Variants:
  - titled via `headerBox()`
  - render-path companions via `boxSurface()` and `headerBoxSurface()`
- Use when:
  - grouping, containment, or local region identity matter
  - peer panels need to read as separate working areas
  - a compact title plus detail helps orient a panel without consuming a full heading block
- Avoid when:
  - urgency or interruption is the primary job
  - every subsection would get its own border purely for decoration
  - a separator, heading, or whitespace would communicate structure more honestly
- Content guidance:
  - use `box()` for grouped content and `headerBox()` when the region needs a clear title plus compact secondary detail
  - titles should describe the region’s job, not restate surrounding context
  - `headerBox()` detail text should carry terse metadata such as environment, path, version, or scope rather than a second sentence
  - nested boxes should be rare and should explain real hierarchy or comparison, not just add more chrome
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

### Explainability walkthroughs

- Family: `explainability()`
- Variants:
  - visible provenance label
  - rationale, evidence, next-action, and governance sections
  - confidence and source metadata
- Use when:
  - AI-mediated or machine-assisted output needs explicit explanation instead of decorative summary
  - the user needs one calm guided-flow surface that separates recommendation from supporting evidence
  - the next action matters more than conversational prose
- Avoid when:
  - the content is just a generic status or note with no recommendation/evidence structure
  - the app needs a full multi-step wizard or inspector panel instead of one explainability surface
  - the app is hiding service latency or speculative output behind an authoritative-looking card
- Content guidance:
  - keep the title as the recommendation or explanation itself, not a vague marketing headline
  - make `[AI]` or equivalent provenance visible
  - separate rationale, evidence, and next action into distinct sections instead of mixing them together
  - governance text should clarify review posture without becoming the dominant content
- Ownership:
  - core
- Graceful lowering:
  - rich/static: preserve section rhythm and explicit provenance inside one calm grouped surface
  - pipe: lower to labeled plain-text sections with one obvious next action
  - accessible: linearize the same fields explicitly with no dependence on borders, color, or layout
- Related families:
  - `note()`
  - `alert()`
  - `stepper()`
  - `timeline()`
- Carbon analogue:
  - no exact analogue; closest to an explainability panel or guided recommendation card

### Inspector panels

- Family: `inspector()`
- Variants:
  - current-selection emphasis
  - compact titled sections
  - muted supporting-copy sections
- Use when:
  - a side panel needs to summarize the currently selected thing without taking over the primary task
  - supporting context should stay structured and calmer than the main content
  - the panel needs one obvious current value plus compact supporting sections
- Avoid when:
  - the content is a full guided recommendation with evidence and next-action structure; prefer `explainability()`
  - the surface is really just an alert, note, or one-line status
  - the panel needs its own complex navigation or multistep interaction model
- Content guidance:
  - make the current selection more obvious than supporting copy
  - keep section titles short and concrete
  - let supporting details look supporting; do not let descriptions overpower the active value
  - stack explicit sections before inventing another decorative box inside the panel
- Ownership:
  - core
- Graceful lowering:
  - rich/static: preserve titled containment, current-selection emphasis, and compact section rhythm
  - pipe: lower to explicit field labels with one obvious current selection
  - accessible: linearize the same fields in plain language without borders or color
- Related families:
  - `box()`
  - `explainability()`
  - `preferenceListSurface()`
  - notification system
- Carbon analogue:
  - side panel / contextual detail panel

### Formatted documents and prose

- Family: `markdown()`
- Variants:
  - headings, emphasis, lists, blockquotes, links, code fences, and other supported markdown structures with mode-aware lowering
- Use when:
  - help, reference, release notes, readme-like content, or bounded prose needs lightweight structure
  - the same content should remain honest across rich, pipe, and accessible output modes
- Avoid when:
  - the content needs deep document navigation rather than one rendered block
  - the app is really composing interface layout, forms, or command surfaces rather than prose
  - browser-grade markdown fidelity or arbitrary user-authored rich documents are expected
- Content guidance:
  - headings should break the content into scannable chunks instead of reproducing the entire document hierarchy from another medium
  - keep fenced code blocks and quotes short enough that the surrounding task still matters more than ornamental formatting
  - links should remain explicit and self-describing, since terminals vary in clickable-link support
  - use markdown for documents and reference prose, not as a substitute layout engine for application chrome
  - when markdown appears in overlays or panes, keep the scope intentionally bounded and move to pager or navigation patterns if the content becomes a document-reading task
- Ownership:
  - core
- Graceful lowering:
  - rich/static: preserve supported markdown structure and emphasis honestly within terminal constraints
  - pipe: lower to plain text with heading/list/code semantics still understandable without styling
  - accessible: linearize headings, lists, links, and code cues explicitly in reading order
- Related families:
  - `note()`
  - `box()`
  - `pager()`
  - `helpView()`
- Carbon analogue:
  - structured text / markdown content block

### Linked destinations

- Family: `hyperlink()`
- Variants:
  - OSC 8 clickable link
  - explicit fallback text or URL modes
- Use when:
  - the destination matters and should remain part of the rendered output
  - terminals with hyperlink support should get a direct clickable affordance without hiding the actual destination semantics
- Avoid when:
  - the destination is untrusted, ambiguous, or should not be activated casually
  - link text is the only place where critical meaning or safety context appears
  - the user needs an app-owned action rather than an external destination
- Content guidance:
  - link labels should describe the destination or resource, not generic phrases like “click here”
  - when trust matters, keep the host or destination obvious in the surrounding text or fallback behavior
  - use fallback modes intentionally so non-supporting terminals still preserve the destination honestly
- Ownership:
  - core
- Graceful lowering:
  - rich/static: use OSC 8 when supported while keeping meaningful visible link text
  - pipe: lower to explicit text plus destination URL when needed
  - accessible: preserve label and destination clearly in reading order without assuming clickability
- Related families:
  - `markdown()`
  - `note()`
  - `helpView()`
- Carbon analogue:
  - link

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
  - the option set is large enough that search, ranking, or narrowing is the real task
- Content guidance:
  - option labels should be distinct, parallel, and easy to scan
  - searchable choice should use concise matching text, not long descriptive paragraphs
  - if search is the real job, prefer `filter()` semantics over stuffing too many options into plain `select()`
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
  - the user is really firing commands rather than collecting lasting state
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
  - the prompt is really a multi-option choice disguised as yes/no
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
  - use `breadcrumb()` when path context helps orient the current location, not as a decorative header flourish
  - use `paginator()` when compact position-in-sequence feedback is enough and the user does not need a richer navigation control
  - use `stepper()` when the current stage and remaining path matter more than peer switching
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

### Motion and shader effects

- Family:
  - `canvas()`
  - transition shaders
  - `animate()`
  - `timeline()`
- Variants:
  - decorative visual field
  - transition reinforcement
  - motion choreography
  - custom shader override
- Use when:
  - motion or shader output clarifies state change, transition, or atmosphere
- Avoid when:
  - the effect is only decorative noise
  - readability, scanning, or task focus would be harmed
  - the same meaning would be clearer as stable content or a simpler status cue
- Content guidance:
  - `canvas()` should be reserved for deliberate visual moments such as splash surfaces, atmospheric backgrounds, or specialized visual regions, not routine productivity chrome
  - transition shaders should reinforce page or workspace change, not compete with the content being changed
  - animation timing should support comprehension and must have an honest reduced-motion or non-interactive fallback
  - shader overrides should preserve semantic content where possible and avoid turning ordinary task flows into spectacle
- Ownership:
  - TUI
- Graceful lowering:
  - rich: preserve the motion or visual effect when it materially helps
  - static: lower to truthful final-state snapshots without pretending the transition still exists
  - pipe: drop decorative effects and keep only the meaning-bearing content
  - accessible: preserve state change meaning explicitly without requiring visual motion
- Related families:
  - `createFramedApp()`
  - `statusBar()`
  - notification system
  - `timeline()`
- Carbon analogue:
  - no exact analogue; closest to expressive motion and illustration guidance rather than one component family

### Expressive branding and decorative emphasis

- Family:
  - `loadRandomLogo()`
  - `gradientText()`
- Variants:
  - ASCII logo sizes
  - single-line or multiline gradient emphasis
- Use when:
  - the interface needs a deliberate branded or celebratory moment
  - splash surfaces, docs, demos, and launch moments benefit from expressive treatment
- Avoid when:
  - routine application chrome or task-critical labels need to stay plain and scannable
  - color, decoration, or branding would compete with the actual work
  - the same text must remain equally legible in constrained or no-color environments
- Content guidance:
  - treat logos and gradients as rare emphasis, not the default voice of the interface
  - never make critical state, instructions, or navigation depend on gradient color alone
  - use expressive branding to open, celebrate, or orient, then get out of the user’s way
- Ownership:
  - core
- Graceful lowering:
  - rich/static: preserve expressive branding where it adds real atmosphere without obscuring content
  - pipe: lower to plain ASCII/text without pretending the gradient or brand treatment still carries meaning
  - accessible: keep the textual content explicit and avoid decorative output that adds noise to the reading order
- Related families:
  - `canvas()`
  - `box()`
  - `markdown()`
- Carbon analogue:
  - closest to illustration, expressive color, and brand guidance rather than one component family

## Authoring families

### Mode-aware custom primitives

- Family:
  - `renderByMode()`
- Variants:
  - interactive/rich branch
  - pipe branch
  - accessible branch
  - app-specific authored primitive
- Use when:
  - the app needs a domain-specific primitive that does not belong in the shared component library
  - the same semantic thing must render honestly across multiple output modes
- Avoid when:
  - an existing Bijou family already matches the job
  - the branching only exists to chase cosmetics rather than preserve semantic truth
- Content guidance:
  - author one semantic primitive first, then define how it lowers by mode
  - keep all branches truthful to the same underlying meaning instead of inventing different features per mode
  - prefer app-owned names and domain language over generic helper wrappers
- Ownership:
  - core authoring helper for app-defined primitives
- Graceful lowering:
  - rich/static: use the richest honest rendering for the environment
  - pipe: lower to plain, explicit text without hidden styling assumptions
  - accessible: preserve the same semantic meaning in a reading-order-friendly form
- Related families:
  - `note()`
  - `badge()`
  - `markdown()`
- Carbon analogue:
  - closest to an internal component authoring pattern rather than a shipped Carbon family

## Data and browsing families

### Dense comparison

- Family:
  - `table()`
  - `tableSurface()`
  - `navigableTable()`
  - `navigableTableSurface()`
- Variants:
  - `table()` for passive comparison in core string output
  - `tableSurface()` for passive comparison in V3 surface-first output
  - `navigableTable()` for keyboard-owned inspection in the TUI layer
  - `navigableTableSurface()` for keyboard-owned inspection on the structured surface path
- Use when:
  - row/column comparison is the main task
- Avoid when:
  - hierarchy or dependency structure dominates
  - items are primarily one-dimensional and should read as a list instead
- Content guidance:
  - column headers should describe comparable attributes, not narrative explanations
  - cell text should stay compact enough that wrapping does not obscure the comparison task
  - use `navigableTableSurface()` when the table lives inside a rich TUI surface and the row-aware inspection model should remain structured
  - unlike list/picker/palette families, navigable tables should keep row-aware scrolling semantics rather than generic line clipping whenever wrapped rows materially affect comparison
  - if rows wrap so heavily that column comparison is no longer readable, the table should usually collapse to a summary row plus a focused drill-down region instead of pretending dense comparison still works
  - choose `navigableTable()` / `navigableTableSurface()` only when keyboard traversal is actually part of the job; otherwise keep the table passive
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
  - `filePickerSurface()`
- Variants:
  - static hierarchy
  - interactive filesystem browser
- Use when:
  - parent/child nesting is the mental model
- Avoid when:
  - multiple parents or graph dependencies matter
  - the interaction is really filesystem traversal, where `filePicker()` / `filePickerSurface()` are more honest
  - dense comparison matters more than nesting
- Content guidance:
  - labels should make nesting meaningful even when indentation is flattened or linearized
  - path context should be explicit when many siblings have similar names
  - use `filePickerSurface()` when the picker lives inside a rich TUI pane and should inherit shared viewport masking semantics; keep `filePicker()` as the explicit text-lowering path
  - directories should remain visually distinct from files, and moving to a parent or child path should be explicit rather than hidden behind overloaded actions
  - `tree()` should stay focused on passive hierarchy display; if arbitrary hierarchy needs keyboard-owned non-filesystem inspection later, that should become an explicit interactive tree family instead of overloading `tree()` itself
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
  - `browsableListSurface()`
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
  - use `browsableListSurface()` when the list belongs inside a rich TUI region and should share viewport masking semantics with pagers and focus panes; keep `browsableList()` as the explicit text-lowering path
  - if the next user action is “run a command” rather than “inspect a record,” move up to `commandPalette()` instead of making the list pretend to be an action launcher
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
  - readers need to answer “what happened next?” or “what depends on this?”
- Avoid when:
  - a plain table or tree is enough
  - the graph is mostly decorative architecture wallpaper
  - a summary metric or local fragment would answer the question more honestly than the whole structure
- Content guidance:
  - events and nodes should expose the causal or temporal relationship, not just labels
  - annotations should stay lightweight enough that the structure remains legible
  - use `timeline()` when chronology is the actual reading path, not as a decorative status list
  - if timeline rows become so dense that the user is comparing attributes instead of following sequence, collapse to summary milestones plus drill-down or move to a table/log view
  - use `dag()` / `dagPane()` when causality, dependency, or multi-parent structure matters more than order
  - use `dagPane()` when graph inspection is an active task and keyboard-owned navigation, focus, and scrolling are part of the job; keep plain `dag()` for passive explanation
  - use `dagSlice()` when the honest scope is a neighborhood, ancestor chain, or descendant chain and the full graph would exceed the reader’s cognitive budget
  - use `dagStats()` when graph health, breadth, depth, or duplication risk matters more than visual shape
  - if most nodes have only one parent and the reader still consumes them in sequence, `timeline()` or `tree()` is usually clearer than a DAG
  - audit-trail timelines should preserve event ordering and consequence clearly, but avoid stuffing each row with enough metadata that the temporal story disappears
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

### Viewport masking and scrollable inspection panes

- Family:
  - `viewport()`
  - `viewportSurface()`
  - `pager()`
  - `pagerSurface()`
  - `focusArea()`
  - `focusAreaSurface()`
- Variants:
  - pure scroll mask
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
  - use `viewportSurface()` as the base masking primitive when any existing `Surface` or layout-backed region simply needs bounded overflow scrolling
  - keep `viewport()` as the explicit text-lowering path for string-first output, not the default teaching path for rich TUI composition
  - use `pager()` / `pagerSurface()` for long linear text where the status line and current line position matter
  - use `focusArea()` / `focusAreaSurface()` when the pane participates in a larger workspace and needs explicit focus ownership
  - prefer the surface-native path when the pane body is already composed from `Surface` content; keep the string path as explicit lowering, not the default teaching path
  - gutter chrome should communicate focus and workspace ownership, not carry primary content meaning
  - `browsableListSurface()`, `filePickerSurface()`, and `commandPaletteSurface()` now converge on viewport semantics; `navigableTable()` remains the row-aware holdout because wrapped-row comparison still needs a more specialized scroll model
  - viewport masking is the wrong abstraction when the user thinks in semantic rows rather than rendered lines; in that case keep row-aware scroll ownership local to the domain-specific component
- Graceful lowering:
  - rich: scrollable pane with honest status/focus chrome and bounded viewport behavior
  - static: visible excerpt or current window with enough status context to explain where the user is
  - pipe: lower to sequential text without pretending the hidden region is still interactively present
  - accessible: linearize the pane content while preserving scroll position or focus context explicitly
- Related families:
  - `viewport()`
  - `viewportSurface()`
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
  - if the user may need recall, stacking, or routing, stop composing ad hoc `toast()` overlays and move up to the notification system
  - if the user still needs the main task visible and interactive, prefer `drawer()` over `modal()`
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

### Notification system

- Family:
  - `renderNotificationStack()`
  - `renderNotificationHistory()`
  - `pushNotification()`
  - `dismissNotification()`
  - `tickNotifications()`
  - framed runtime notification routing
- Variants:
  - `ACTIONABLE`
  - `INLINE`
  - `TOAST`
  - info, success, warning, error tone variants
  - per-notification placement and duration
- Use when:
  - the app owns transient messaging as a system instead of rendering one ad hoc overlay at a time
  - stacking, placement, routing, or history matter
  - warnings and errors should be reviewable after the moment they first appear
- Avoid when:
  - the message should remain in normal page flow as part of the document
  - a single local transient overlay is enough
  - the user must stop and decide before continuing
- Ownership:
  - TUI
- Content guidance:
  - use notifications for events and follow-up prompts, not durable documents or long-form explanation
  - actionable notifications should expose one obvious next step, not a miniature workflow or form
  - if users may need to revisit prior notices, the archive/history surface is part of the feature, not an optional add-on
  - route app-owned warnings and errors here when recall matters, while still keeping stderr/log output honest where appropriate
  - use placement and duration to control interruption level, not to smuggle unrelated importance into every message
- Graceful lowering:
  - rich: stacked notifications with actions, placement, history, and explicit dismissal
  - static: visible current notifications or a truthful archived summary without pretending transient timing still exists
  - pipe: lower to sequential event text or explicit warning/error records
  - accessible: linearize current and archived notices with tone, action, and dismissal state made explicit
- Related families:
  - `toast()`
  - `alert()`
  - `modal()`
  - `drawer()`
  - `createFramedApp()`
- Carbon analogue:
  - notification / toast notification center pattern

### App shell

- Family:
  - `createFramedApp()`
  - `statusBar()`
  - `statusBarSurface()`
  - `commandPalette()`
  - `commandPaletteSurface()`
- Variants:
  - shell container, status rail, action discovery
- Use when:
  - the app has multiple views, overlays, navigation, and shell chrome
- Avoid when:
  - the app is really one screen or one prompt
- Ownership:
  - TUI
- Content guidance:
  - the shell should frame destinations and workspace state, not become a dumping ground for unrelated metadata
  - use `statusBarSurface()` when shell chrome already lives on the structured `Surface` path; keep `statusBar()` for explicit text output or lowering
  - use `commandPaletteSurface()` when the palette lives inside a rich TUI shell or overlay and should share viewport masking semantics with other panes; keep `commandPalette()` for explicit text output or lowering
  - status lines should carry concise global context, not replace in-page guidance
  - command palette entries should prefer actions, navigation targets, and recent destinations over field-style data entry
  - group palette items by user intent when possible, and avoid turning the palette into a browseable record list
  - tabs should represent peer destinations or work areas, not disguised command buttons
  - use notifications for events and follow-up, not the status rail
  - use help hints for shortcut discovery and shell scope, not for action execution or event messaging
- Graceful lowering:
  - rich: full shell chrome with tabs, palette, overlays, notifications, and workspace regions
  - static: retain the active page and essential shell context without pretending background interactivity exists
  - pipe: lower to current page content plus minimal status/context framing
  - accessible: linearize active shell state, navigation context, and current overlays into one readable flow
- Related families:
  - `statusBar()`
  - `helpShortSurface()`
  - `tabs()`
  - `commandPalette()`
  - notification system
- Carbon analogue:
  - shell, header/footer, command palette

### Keybinding help and shell hints

- Family:
  - `createKeyMap()`
  - `helpView()`
  - `helpViewSurface()`
  - `helpShort()`
  - `helpShortSurface()`
  - `helpFor()`
  - `helpForSurface()`
- Variants:
  - grouped reference, single-line hint, filtered subset, explicit text output, structured-surface output
- Use when:
  - the app is keyboard-owned and the user needs discoverable shortcuts or a grouped command reference
- Avoid when:
  - the controls are already obvious from context and the help text would just restate visible labels
- Ownership:
  - TUI
- Content guidance:
  - use `helpShortSurface()` for shell hints that should stay on the structured `Surface` path; keep `helpShort()` for explicit text output or lowering
  - use `helpViewSurface()` when the full keybinding reference is embedded inside a rich TUI surface; keep `helpView()` for plain text and pipe-oriented help
  - group names should describe jobs (`Navigation`, `Actions`, `Selection`) rather than raw input mechanics
  - help text should clarify behavior and scope, not repeat page prose or become a substitute command palette
  - use the command palette for discoverable actions and navigation, and keep help focused on shortcut explanation
- Graceful lowering:
  - rich: concise shell hints plus an optional grouped help view or modal
  - static: retain the active hint and the relevant grouped reference without pretending background input is live
  - pipe: lower to plain text shortcut summaries and grouped help blocks
  - accessible: linearize help content into readable sections with explicit scope and action labels
- Related families:
  - `createFramedApp()`
  - `statusBarSurface()`
  - `commandPalette()`
- Carbon analogue:
  - keyboard shortcuts help, command reference, hotkey cheat sheet

### Workspace layout

- Family:
  - `splitPane()`
  - `splitPaneSurface()`
  - `grid()`
  - `gridSurface()`
  - `flex()`
  - `vstack()`
  - `hstack()`
  - `place()`
- Variants:
  - user-resizable, named-area, compositional layout primitives with structured-surface and explicit text-lowering paths
- Use when:
  - spatial arrangement materially helps the task
- Avoid when:
  - a sequential flow would be simpler and more legible
- Ownership:
  - TUI
- Content guidance:
  - use `splitPaneSurface()` when the user benefits from explicit primary-versus-secondary context and the panes are already rich TUI surfaces; keep `splitPane()` for explicit text composition or lowering
  - use `gridSurface()` when multiple stable regions deserve simultaneous visibility and the regions are already rich TUI surfaces; keep `grid()` for explicit text composition or lowering
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

- `separator()` label discipline in dense shells and long documents
- `tabs()` overflow/truncation policy when peer destinations outgrow the available width
- `wizard()` / `group()` content architecture for long, interruptible setup flows
