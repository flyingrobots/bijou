# Components: which one, when, and how

Authority: the component-family guidance (`docs/design-system/component-families.md`, read it in bounded chunks with
`node --import tsx scripts/read-documentation.ts docs/design-system/component-families.md START LIMIT`). Live
examples of every variant in every mode: `npm run components`. Sources: `packages/bijou/src/core/components/`,
`packages/bijou/src/core/forms/`, `packages/bijou-tui/src`.

A **family** is one semantic job; its functions are the components. Pick by job: read *Use when* and *Avoid when*,
then follow the content guidance. Every component takes `ctx?` (mode and theme); pass it explicitly in tests.

## The 36 families

Format: **Family** `functions` [ownership]: use when / avoid when / content / lowering.

### Status and feedback
1. **Inline status** `badge()` [core]: compact status attached to another object / the message must stand alone /
   terse noun or state labels / pipe prints plain inline text. `badge()` returns a **Surface**.
2. **In-flow status block** `alert()`, `alertSurface()` [core]: status that stays part of the page / lifecycle,
   history, or stacking needed / state, cause, next action; short headline / accessible states severity in words.
3. **Low-level transient overlay** `toast()` [TUI]: one overlay the app composes, placement matters, lifecycle does
   not / stacking, routing, actions, or recall needed (use notifications) / scannable without stopping the task.
4. **Transient app notifications** (notification system, variants `TOAST`, `INLINE`, `ACTIONABLE`) [TUI]: the app
   owns transient messaging with stacking, routing, actions, recall / content belongs in the page / title is the
   event, body the consequence; one primary action / pipe prints ordered event lines.
5. **Activity stream** `log()` [core]: order and accumulation matter / it should interrupt / chronological,
   specific, attributable lines.
6. **Loading placeholders** `skeleton()` [core]: shape known, content not yet, short wait / honest partial content
   possible or long waits / match final density, label what loads.
7. **Inline shortcut cues** `kbd()` [core]: a local hint next to its action / a broader reference (use help).
8. **Progress indicators** `progressBar()`, `createProgressBar()`, `createAnimatedProgressBar()`, `spinnerFrame()`,
   `createSpinner()` [core]: honest feedback that *work* is ongoing / flicker-short waits, durable results, or a
   position in a sequence (that is `paginator()`) / bar only when completion is estimable, spinner otherwise,
   always labelled / pipe `Progress: N%`.

### Structure
9. **Framed grouping** `box()`, `headerBox()`, `boxSurface()`, `headerBoxSurface()` [core]: containment or region
   identity / urgency, decoration on every subsection / titles describe the region's job and never restate
   context; `headerBox` detail is terse metadata; nest rarely.
10. **Explainability walkthroughs** `explainability()` [core]: an AI recommendation with rationale, evidence,
    governance, and one next action / generic status, or dressing speculation as authority / title is the
    recommendation; `[AI]` provenance; sections stay separate.
11. **Inspector panels** `inspector()` [core]: a calm side summary of the current selection / a recommendation or an
    alert / the selection outranks supporting copy.
12. **Formatted documents** `markdown()` [core]: bounded help, reference, release notes / deep navigation or layout
    / scannable headings; move to `pager` once it becomes reading.
13. **Linked destinations** `hyperlink()` [core]: the destination matters / untrusted targets or app actions /
    describe the destination; never "click here"; pipe shows text plus URL.
14. **Dividers** `separator()`, `separatorSurface()` [core]: a boundary without containment / content needs its own
    region / the label names the next section.

### Choice and forms (core, async prompts)
15. **Text entry** `input()`, `textarea()`: free text / enumerable choices.
16. **Single choice** `select()`, `filter()`: a stored value (`filter` when search is the real job) / choosing runs a
    command (use the command palette).
17. **Multiple choice** `multiselect()`: building a set.
18. **Binary decision** `confirm()`: a genuinely binary decision; state the consequence of yes and of no; name the
    target of destructive actions.
19. **Staged forms** `group()`, `wizard()`: related inputs in a progression; one goal per step.

### Organization
20. **Peer navigation** `tabs()` [core]: peer views with one active / order or hierarchy is the point / short
    destination names, never actions; counts go in `badge`.
21. **Progressive disclosure** `accordion()`, `interactiveAccordion()`: detail secondary to a summary / peers that
    deserve navigation.
22. **Path and progress** `breadcrumb()`, `stepper()`, `paginator()` [core]: wayfinding or process progress / tabs or
    lists express it better.
23. **Motion and shader effects** `canvas()`, transition shaders, `animate()`, `timeline()` [TUI]: motion clarifies a
    change / decoration that harms reading / static shows the final state, pipe drops the effect.
24. **Expressive branding** `loadRandomLogo()`, `gradientText()` [core]: splash, docs, launch moments / routine
    chrome or critical labels / never put meaning in gradient colour.
25. **Mode-aware custom primitives** `renderByMode()` [core]: an app primitive that must lower honestly / an existing
    family fits / every branch carries the same meaning.

### Data and browsing
26. **Dense comparison** `table()`, `tableSurface()`, `navigableTable()`, `navigableTableSurface()`: row and column
    comparison / hierarchy or one dimension / headers name comparable attributes; pipe is TSV (`pipeFormat`).
27. **Hierarchy** `tree()`, `filePicker()`, `filePickerSurface()`: single-parent nesting / graphs or comparison.
28. **Lists** `enumeratedList()`, `browsableList()`, `browsableListSurface()`: one-dimensional scanning; lead each row
    with its most distinguishing label.
29. **Temporal or dependency views** `timeline()`, `dag()`, `dagSlice()`, `dagStats()`, `dagPane()`: time or
    causality is the structure / a table or tree is enough, or the graph is wallpaper.
30. **Viewport and scroll panes** `viewport()`, `viewportSurface()`, `pager()`, `pagerSurface()`, `focusArea()`,
    `focusAreaSurface()` [TUI]: a bounded pane for reading / row semantics (use a table or list).

### Overlay and shell (TUI)
31. **Overlay primitives** `tooltip()`, `drawer()`, `modal()`, `toast()`: layered interaction / content that belongs
    in the document or shell. Overlays accept Surface content.
32. **Notification system** `pushNotification()`, `dismissNotification()`, `tickNotifications()`,
    `renderNotificationStack()`, `renderNotificationHistory()`: messaging as a system with history / the user must
    stop and decide (use a modal).
33. **App shell** `createFramedApp()`, `statusBar()`, `commandPalette()`: multiple views, overlays, navigation / one
    screen. The palette groups actions and navigation by intent; events go to notifications, not the status rail.
34. **Keybinding help** `createKeyMap()`, `helpView()`, `helpShort()`, `helpFor()`: discoverable shortcuts / help
    that only restates visible labels.
35. **Workspace layout** `splitPane()`, `grid()`, `flex()`, `vstack()`, `hstack()`, `place()` and `*Surface` forms:
    spatial arrangement helps / a sequential flow is clearer. Pipe gives a sensible sequential order.
36. **Data visualization** `sparkline()`, `brailleChartSurface()`, `statsPanelSurface()`, `perfOverlaySurface()`
    [core], plus `@flyingrobots/bijou/viz`: trends at a glance / precision (use a table) / pass `min`/`max` when
    comparing; accessible speaks the trend.

## Choosing between look-alikes

- **tabs vs stepper vs paginator vs breadcrumb:** `tabs()` for peers with one active; `stepper()` when the current
  stage and remaining path matter more than switching; `paginator()` for compact position in a sequence;
  `breadcrumb()` for path context, ending at the current place (a variant is a tab, not a place).
- **progressBar vs spinner vs skeleton:** bar for estimable *work*, spinner for real activity of unknown length,
  skeleton for a known shape during a short wait. A slide or page position is not progress.
- **badge vs alert vs toast vs notifications vs log vs modal:** attached status, in-page message, one composed
  overlay, an app-owned messaging system, accumulation, a decision that must block.
- **modal vs drawer vs tooltip:** tooltip is short and never actionable; drawer keeps the main task visible (prefer
  it); a modal must justify blocking and end in a decision.
- **box vs headerBox vs separator:** containment, containment plus terse metadata, a boundary without containment.
- **explainability vs inspector vs guidedFlow:** AI recommendation with evidence, current-selection summary, a
  non-AI guided path.
- **select vs filter vs multiselect vs confirm vs commandPalette:** stored value, search-first value, a set, binary,
  run a command.
- **table vs tree vs list vs timeline vs dag:** comparison, single-parent nesting, scanning, chronology, causality.
- **markdown vs pager:** bounded prose vs a reading task. **kbd vs help vs palette:** local hint, discovery, action.

## Signatures (abridged)

- `box(content, { title?, borderToken?, bgToken?, padding?, width?, ctx? }): string`; `boxSurface(content, opts)`.
- `headerBox(label, { detail?, labelToken?, ...BoxOptions })`.
- `table({ columns?, rows, layout?: 'auto'|'intrinsic', variant?, pipeFormat?: 'tsv'|'csv'|'markdown'|'ascii-grid',
  width?, wrap?, ctx? })`; `tableSurface(...)`.
- `tabs(items: {label, badge?}[], { active, separator?, activeBgToken?, ctx? }): string`.
- `alert(message, { variant?: 'success'|'error'|'warning'|'info', ctx? })`; `alertSurface(message | Surface, opts)`.
- `badge(text, { variant?, ctx? }): Surface`.
- `progressBar(percent, { width?, gradient?, filledToken?, emptyToken?, showPercent?, ctx? }): string`.
- `paginator({ current, total, style?: 'dots'|'text', ctx? })`; `stepper(steps: {label}[], { current, ctx? })`.
- Prompts: `input({ title, placeholder?, validate? })`, `select({ title, options: {label, value}[] })`,
  `confirm({ title, defaultValue? })`: all return Promises.
- Overlays return `Overlay { content, surface?, row, col }`: `modal({ body, screenWidth, screenHeight, title?, hint? })`,
  `drawer({ content, anchor, width|height, screenWidth, screenHeight })`, `toast({ message, variant?, anchor? })`
  (no warning variant), `tooltip({ content, row, col, direction? })`.
- Notifications: `pushNotification(state, { title, message?, variant?, tone?, durationMs?, placement?, action? }, nowMs)`.
