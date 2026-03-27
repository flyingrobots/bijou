# Notification History Belongs to the Shell

_Design note for a shell-owned notification center in `createFramedApp()`_

## Why this exists

Bijou already has the underlying notification substrate:

- stacked live notifications
- actionable notifications
- archived notification history
- runtime notification routing in the frame shell

That means the next problem is not "can Bijou archive notifications?" It is:

- where does a human go when they miss one?
- how do they review important notices without reopening a one-off demo or reading logs?
- how do notifications feel like part of the shell instead of a bolt-on overlay system?

If every framed app invents its own history modal, drift is guaranteed:

- different entry points
- different close behavior
- different filters
- different scroll semantics
- different footer/status cues

That is the same kind of product drift that justified shell-owned settings and shell-owned quit policy. Notification history should follow the same path.

## Design-thinking frame

### Primary user

The primary user is the **workspace operator**:

- they are in the middle of real work
- a toast or warning may have appeared while they were reading somewhere else
- they need a calm place to recover missed information without losing context

They are asking:

- "What just happened?"
- "Did I miss something important?"
- "Where do I go to review notices after they disappear?"
- "Can I trust that important shell feedback has a durable home?"

### Secondary user

The secondary user is the **workspace builder**:

- a developer using `createFramedApp()`
- someone who wants a standard review surface for shell/app notifications
- someone who does not want to rebuild archive modals, footer counters, filters, and keyboard behavior for every app

They are asking:

- "Can the shell give me a standard notification center?"
- "Can I surface important notices without building a custom inbox UI?"
- "Will notification review stay coherent with help, settings, search, and quit?"

### Jobs to be done

1. **Help me recover missed feedback.**
   If a transient notice mattered, I need a stable place to review it later.

2. **Help me distinguish feedback by weight.**
   Not every message deserves the same treatment. Toasts, persistent notifications, and reviewable history should feel intentionally different.

3. **Help me review without losing my place.**
   I should be able to inspect notifications while keeping the current workspace visible behind the shell surface.

4. **Help me implement durable feedback once.**
   App authors should supply notification state and optional actions, not reinvent archive UI and shell entry points.

## Hills

### Hill 1 — Missed notices are recoverable

A user can reliably open one shell-owned place to review current and recent notifications.

### Hill 2 — Feedback feels proportional

Low-weight toasts stay lightweight. Important notices remain reviewable. The shell does not force every event to become a blocking modal.

### Hill 3 — Notification review feels shell-owned

The center behaves like a sibling of help, search, settings, and quit, not like a page-specific hack.

### Hill 4 — Context remains visible

The notification center should feel like a sidecar review surface, not a full app detour.

## Product direction

The shell should provide a **right-edge notification center**.

The mental model is:

> toasts are what just happened; the notification center is where I go to review what mattered.

Why a right-edge drawer:

- settings already occupy the left edge as the "change preferences" sidecar
- notifications are naturally review-oriented rather than configuration-oriented
- a right-edge surface lets the current workspace remain visible
- it gives the shell a balanced left/right sidecar model:
  - left: settings
  - right: notification review

This should be treated as a shell surface, not as a special page.

## Feedback ladder

The shell should make these layers feel distinct:

### Toast

- ephemeral
- low-weight
- auto-dismiss
- no expectation of deep recall by itself

### Notification

- meaningful enough to matter
- shell-managed timing/stacking/routing
- still visible in the active workspace context

### Notification center

- durable review surface
- archive/inbox/history semantics
- filterable
- reachable through shell affordances and command search

This is the important design rule:

> **Toasts are not inboxes.**

If an event may matter after it disappears, the shell needs a review surface.

## Relationship to the existing substrate

Bijou should build this feature on the notification model that already exists in
[`notification.ts`](/Users/james/git/bijou/packages/bijou-tui/src/notification.ts):

- `NotificationState.items`
- `NotificationState.overflowExits`
- `NotificationState.history`

That means:

- no second archive store
- no parallel "notification center state" that drifts from the notification stack
- no bespoke demo-only history format

The shell should own:

- container geometry
- entry points
- footer cues
- focus/scroll/input ownership
- review affordances

The app should own:

- notification meaning
- optional archived-item actions
- optional filter/value policy when custom notification state is supplied

## Visual model

The intended feel is a calm right-edge inbox drawer, not a giant modal wall of prose.

Rough structure:

```text
+--------------------------------------+
| Notifications                   All |
+--------------------------------------+
| Live: 2 • Archived: 14              |
|--------------------------------------|
| ERROR    2m ago                      |
| Deploy blocked                       |
| Runtime failed to boot candidate     |
| Retry deploy                         |
|--------------------------------------|
| WARNING  4m ago                      |
| Queue pressure rising                |
| Latency trending upward              |
|--------------------------------------|
| INFO     8m ago                      |
| Background sync ready                |
+--------------------------------------+
```

Important properties:

- right-edge shell drawer
- short header with title and active filter
- compact status line summarizing live vs archived counts
- vertically scrollable entries
- tone, time, title, message snippet, and optional action cue
- no attempt to turn the drawer into a full log viewer

## Principles

1. **Toasts are not the archive**
   The stack is for current interruption; the center is for review.

2. **The shell owns recovery**
   Notification review should be as standard as help, search, settings, and quit.

3. **The current workspace stays visible**
   This is a sidecar, not a route transition.

4. **Footer tells the truth**
   The footer should surface a subtle notification/inbox cue so users know the center exists.

5. **Filters should stay simple**
   Start with pragmatic filters that match the existing notification substrate:
   `All`, `Actionable`, `Error`, `Warning`, `Success`, `Info`.

6. **Archived actions must be explicit**
   If an archived notification exposes a follow-up action, the shell should label that clearly as a deliberate review-time action, not pretend the toast never expired.

7. **Tests are the spec**
   The next implementation slice should be driven by failing `app-frame` tests and one proving surface, not by adding another app-specific history modal.

## Proposed v0 API shape

The frame should own the container. Apps should provide notification content declaratively.

```ts
interface FrameNotificationCenter<Msg> {
  readonly title?: string;
  readonly state: NotificationState<Msg>;
  readonly filters?: readonly NotificationHistoryFilter[];
  readonly activeFilter?: NotificationHistoryFilter;
  readonly onFilterChange?: (filter: NotificationHistoryFilter) => Msg | undefined;
  readonly onActivateItem?: (item: NotificationRecord<Msg>) => Msg | undefined;
  readonly emptyLabel?: string;
}

interface CreateFramedAppOptions<PageModel, Msg> {
  // existing fields...
  readonly notificationCenter?: (args: {
    readonly model: FrameModel<PageModel>;
    readonly activePage: FramePage<PageModel, Msg>;
    readonly pageModel: PageModel;
    readonly runtimeNotifications: NotificationState<never>;
  }) => FrameNotificationCenter<Msg> | undefined;
}
```

Why this shape:

- the shell still owns drawer layout and behavior
- apps can expose their own notification state when they already have one
- the frame can still provide a fallback center for frame-managed runtime notifications
- filters and archived-item activation stay opt-in and explicit

## Standard shell behavior

### Entry points

The shell should expose a stable way to open notification review:

- a standard shell binding such as `Shift+N`
- a command-palette entry like `Open notifications`
- a footer cue that implies review is available

The exact footer copy can evolve, but it should remain small and truthful.

### Footer cue

The footer should not dump archive counts constantly.

It should prioritize:

- live notification count when there are active notices
- a subtle inbox/history affordance when the archive is non-empty

The footer cue is discoverability, not a second notification center.

### Geometry

- anchored to the right edge
- bounded width with compact-terminal fallback
- keeps the active page visible behind it
- owns focus/input while open

### Scroll and focus

- wheel scrolls the drawer when hovered
- arrow keys / `j` / `k` move through entries
- `d` / `u`, `g` / `G` page and jump
- the underlying workspace does not keep reacting while the drawer is open

### Filters

v0 filters should stay aligned with the notification model already in the repo:

- `All`
- `Actionable`
- `Error`
- `Warning`
- `Success`
- `Info`

Cycling filters with one key is acceptable in v0. A richer row/segmented filter control can come later if it proves necessary.

### Archived-item activation

Archived items should only expose a primary action when the app provides one explicitly.

That action should be framed honestly:

- "Run again"
- "Open details"
- "Retry"

not as if the archived notification were still a live toast waiting for immediate response.

## v0 proving surfaces

The first proving surfaces should be:

1. the framed notifications lab in
   [examples/notifications/main.ts](/Users/james/git/bijou/examples/notifications/main.ts)
2. frame-managed runtime notifications in `createFramedApp()`

DOGFOOD should adopt the shell cues later, but it should not be forced to invent fake notifications just to validate the shell container.

## Out of scope for v0

The first slice should **not** try to solve everything:

- unread/read persistence
- cross-session archive storage
- grouped threads or notification threads
- a full log viewer
- snooze/remind-later workflows
- per-notification custom drawer layouts
- replacing structured app logs

Those can come later if the shell-owned review surface proves valuable.

## What success looks like

When this is done well:

- a user sees a toast, misses it, and still knows where to go later
- a framed app gets durable notification review without a custom history modal
- the footer hints that review exists without becoming noisy
- notification review feels like part of the shell family instead of another isolated overlay

## Recommended implementation order

1. Add failing `app-frame` tests for a shell-owned notification center:
   - open/close
   - scroll ownership
   - filter changes
   - footer cue
   - command-palette entry
2. Add one focused proving surface in the framed notifications lab.
3. Implement the right-edge drawer and shell routing in `createFramedApp()`.
4. Reuse the existing notification archive model instead of introducing new storage.
5. Only after that, consider archived-item actions and richer inbox semantics.
