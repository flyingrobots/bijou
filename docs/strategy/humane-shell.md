# The Humane Shell

_Design note for a coherent human-centered app shell in `createFramedApp()`_

## Why this exists

Bijou now has many of the right shell primitives:

- framed pages
- focused panes
- command palette
- help overlay
- settings drawer
- notifications
- confirmation flows

But having the primitives is not the same thing as having a product.

The next quality bar is not "can the shell do many things?" It is:

- does the shell feel calm and intentional?
- can a first-time user understand how to search, get help, adjust preferences, and quit safely within a few seconds?
- do header, footer, palette, settings, help, notifications, and confirmations feel like one family?
- does the shell tell the truth about what is active and what input goes where?

This note exists to define that product direction before more one-off shell tweaks accumulate.

## Design-thinking frame

### Primary user

The primary user is the **workspace operator**:

- someone inside a real framed TUI
- someone who wants to navigate, search, change settings, and recover safely without memorizing repo trivia
- someone who expects the shell to make the application feel trustworthy

They are asking:

- "Where do I go to search?"
- "How do I change preferences?"
- "What does this focused area mean?"
- "How do I get help without losing my place?"
- "How do I leave safely?"

### Secondary user

The secondary user is the **workspace builder**:

- a developer building on `createFramedApp()`
- someone who wants a good shell without rebuilding shell UX from scratch
- someone who wants to declare page content and settings, not invent new chrome rules every time

They are asking:

- "What should a high-quality Bijou shell look like by default?"
- "Which concerns belong to the shell versus the page?"
- "How do I get consistency across apps without a giant pile of bespoke conditionals?"

### Jobs to be done

1. **Help me get oriented immediately.**
   A user should understand the shell's major entry points quickly: search, help, settings, and quit.

2. **Help me trust focus and ownership.**
   When the shell highlights a pane or opens a layer, the active area should own input honestly.

3. **Help me adjust preferences without leaving context.**
   Settings should feel like a shell sidecar, not a page detour.

4. **Help me recover and leave safely.**
   Global quit behavior and confirmation flows should be predictable across framed apps.

5. **Help me keep feedback proportional.**
   Temporary information should not feel as heavy as persistent or reviewable information.

## Hills

### Hill 1 — First-use confidence

A new user can enter a framed Bijou app and discover search, help, settings, and quit without reading external documentation.

### Hill 2 — One shell, many surfaces

Header, footer, command palette, help, settings, notifications, and confirmations feel like one coherent shell family instead of unrelated overlays.

### Hill 3 — The shell is calm

The shell favors clear orientation and layered disclosure over dumping the full control scheme into the chrome at all times.

### Hill 4 — Safety is consistent

Global quit, confirmation, and notification behavior is stable enough that users can trust it across framed apps.

## Shell promise

The shell should make the app feel:

- calm
- legible
- safe
- consistent
- honest about focus and control

The shell should not feel:

- noisy
- tutorialized all the time
- full of spilled key legends
- visually clever but operationally unclear

## Product principles

1. **Search is a front door**
   Users should be able to open a framed app and immediately search for what they want.

2. **Help is discoverable, not omnipresent**
   The shell should advertise that help exists, then reveal the deeper control map on demand.

3. **Footer is operational truth**
   The footer should carry the most important current-status and quick-control information.

4. **Visible controls are a promise**
   If the shell or page shows a control hint, that control should work for the active layer or focused region right now. Dead hints erode trust faster than missing hints.

5. **Header is identity and context**
   The header should identify where the user is, not attempt to explain every possible action.

6. **Settings are shell state**
   Preferences should live in a shell-owned drawer and behave the same way across framed apps.

7. **Settings should explain themselves**
   A setting row should make its control type, current value, and purpose legible without requiring users to infer them from a terse label.

8. **Shell polish should graduate into canonical componentry**
   If the shell discovers a reusable presentation pattern, that pattern should become a Bijou component family instead of staying trapped inside shell-local rendering.

9. **Quit is safe by default**
   Interactive framed apps should treat `Esc`, `q`, and `Ctrl+C` as quit requests routed through the shell.

10. **Notifications scale by weight**
   Short-lived notices, persistent notifications, and reviewable history should be separate layers, not one overloaded mechanism.

11. **Layers dismiss from the top**
   `Esc` should dismiss the topmost dismissible layer before it ever falls through to shell quit behavior.

12. **Input maps should drive truth**
   The same input map that governs the active layer should also govern the visible controls the shell advertises.

## Layer stack doctrine

The shell should treat interactive surfaces as a stack of layers, not as a pile of unrelated branch checks.

Candidate layers include:

- workspace base layer
- pane-local modal layer
- search / command palette layer
- help layer
- settings layer
- notification-center layer
- quit-confirm layer

The key rule is:

- only the topmost layer owns input

That rule should govern:

- routing
- `Esc` dismiss order
- footer hints
- help/control summaries
- future agent-visible shell semantics

### Dismiss order

`Esc` should follow one humane rule:

1. dismiss the topmost dismissible layer
2. restore the next layer beneath it
3. only when no dismissible layer remains, interpret `Esc` as a quit request

This prevents the shell from closing one layer and accidentally acting on the thing beneath it in the same keystroke.

### Input maps as the source of truth

Each layer should eventually own an input map that describes:

- what keys it handles
- what dismissal behavior it supports
- what controls may be shown in the footer/help
- whether it blocks, reviews, or augments underlying content

This is the cleanest seam for keeping:

- control hints truthful
- agents able to reason about the active layer
- focus semantics aligned with actual runtime routing

## Proposed shell anatomy

### 1. Landing screen

The landing screen is allowed to be expressive, but it should still obey shell rules.

Purpose:

- establish brand and atmosphere
- provide one obvious next action
- give a minimal escape hatch

Recommended structure:

- fullscreen art / shader treatment
- no heavy header
- one reserved footer line

Footer zones on landing:

- **left**: brief controls
  - `Esc/q quit`
  - `Enter continue` or `any key continue`
- **center**: optional telemetry / mode
  - e.g. `54 fps • auto/full`
- **right**: version
  - e.g. `v4.0.0`

The key design decision:

- telemetry belongs in the footer, not floating in the canvas, because it is shell information, not part of the art

### 2. Header

The header should be terse.

Its job is:

- identity
- current page / workspace context
- lightweight discoverability cues

It should not try to be a full control legend.

Recommended header shape:

- left: app title and current page/title
- right: short shell affordances
  - `? Help`
  - `/ Search`
  - `F2 Settings`

Optional contextual detail:

- active pane name
- current mode/profile
- route breadcrumb if actually helpful

Avoid:

- long scrolling control strings
- repeated legends that compete with page content
- dense status dumps in the top chrome

### 3. Footer

The footer should become the primary operational lane.

Recommended footer zones:

- **left**: core controls
  - `Esc/q quit`
  - `Tab next pane`
  - current route-specific primary action if needed
- **center**: current context
  - focused pane
  - landing FPS/mode
  - selected profile / variant / state
- **right**: status summary
  - version
  - notification count
  - connection / runtime status if relevant

This is the shell surface that should carry fast-truth information. The header should not have to do that job.

The design rule is:

- if a focused pane owns special controls, the footer may advertise them
- if that pane loses focus or a shell layer opens, those controls should disappear from visible chrome
- the shell should never keep showing controls that the current layer cannot actually honor

### 4. Workspace gutters and pane geometry

The shell should keep a one-cell breathing gutter between major structures:

- header and workspace
- workspace and footer
- left rail, center content, and right rail

This matters because otherwise the shell feels cropped or visually accidental.

Pane focus should remain obvious, but focus styling should not overpower the content.

### 5. Command palette

The command palette should be treated as a universal front door, not a power-user afterthought.

It should support:

- search by component/page name
- shell actions
- settings entry point
- navigation
- optional recent-history or notification recall later

Design direction:

- `/` and `Ctrl+P` both open it in interactive framed apps
- palette search should be the first thing users reach for when they know what they want

### 6. Help

Help should be layered:

- **short help affordance** in shell chrome
- **full help surface** on demand

The full help surface should be:

- shell-owned
- scrollable
- truthful to the active context

Recommended help structure:

1. shell/global controls
2. focused pane controls
3. active overlay controls
4. current page-specific shortcuts

Long-term direction:

- help should become searchable or filterable once the command palette/search substrate is mature enough

### 7. Settings drawer

The settings drawer should remain a left-edge shell sidecar.

It should feel like:

- a stable shell surface
- sectioned preferences
- compact values on the trailing edge

The shell should own:

- open/close behavior
- scrolling
- row focus
- activation
- input capture

The app should provide:

- sections
- rows
- values
- actions

The shell should keep owning drawer behavior, but the row treatment inside it should be allowed to graduate into canonical Bijou componentry once it proves itself. That follow-on direction is captured in [Preference Lists Belong to Bijou](preference-lists-belong-to-bijou.md).

### 8. Notifications and notification history

The shell should differentiate between:

- **toast**
  - ephemeral
  - low-weight
  - auto-dismiss
- **notification**
  - persistent enough to matter
  - shell-managed
  - should be reviewable
- **notification history**
  - archive / inbox / center
  - where missed or important notices can be recovered

Design direction:

- toasts should stay lightweight and not try to be a history mechanism
- a future notification-history surface should be reachable from shell affordances or the command palette
- the footer is a good place for a subtle notification count or inbox cue

That more detailed direction is now captured in
[Notification History Belongs to the Shell](notification-history-belongs-to-the-shell.md)
and the companion [Shell Notification Center spec](../specs/shell-notification-center.spec.json).

### 9. Confirmation flows

Confirmation should be treated as a shell/system pattern, not ad hoc prose.

Use confirmations for:

- destructive actions
- irreversible actions
- quitting when work could be lost or when the shell wants a consistent safe exit policy

Avoid confirmations for:

- trivial reversible actions
- low-consequence navigation
- "are you sure?" spam

Standard confirmation behavior should include:

- clear primary question
- short consequence line
- stable affordances:
  - `y`
  - `n`
  - `Enter`
  - `Esc`

### 10. Global quit behavior

Interactive framed apps should have a standard shell-level quit policy.

Recommended default:

- `Esc`
- `q`
- `Ctrl+C`

all map to **request quit**

Narrow exception:

- shell-owned text-entry surfaces may keep printable characters like `q` available for input
- `Esc` and `Ctrl+C` should still request quit from those surfaces

The shell then applies a policy:

- `confirm` by default for interactive framed apps
- `immediate` for non-interactive/piped contexts
- app-specific override only when truly justified

Why:

- this makes exit semantics predictable
- it prevents every app from inventing its own "sometimes q quits, sometimes it does nothing, sometimes Esc closes a random pane" rules

The shell should expose this as a real policy, not just a hardcoded DOGFOOD behavior.

## Recommended default shell policy

### Header

- minimal and contextual
- no long legends

### Footer

- always present in framed interactive apps
- reserved for controls, state, and operational truth

### Search

- `/` and `Ctrl+P`
- palette visible in chrome by name

### Settings

- `F2` and palette command
- shell-owned drawer

### Help

- `?`
- shell-owned overlay
- active-pane aware

### Quit

- `Esc`, `q`, `Ctrl+C`
- shell `requestQuit` policy

### Notifications

- toast for ephemeral updates
- persistent notifications for important updates
- planned history surface for recovery

## Out of scope for this note

- exact BCSS token palette for the shell
- final landing-screen motion style
- every possible notification-center information architecture detail
- full tutorial/onboarding flow design

Those are related, but this note is about the shell contract first.

## Acceptance tests this design implies

1. **A framed app shows a stable shell affordance set**
   Header and footer expose search, help, settings, and quit consistently.

2. **Header is concise**
   The shell does not regress into long truncated legends in the top chrome.

3. **Footer carries operational truth**
   Landing telemetry, version, and quit hints render in the reserved footer line instead of floating inside content.

4. **Global quit is shell-owned**
   `Esc`, `q`, and `Ctrl+C` route through one standard quit policy in interactive framed apps.

5. **Settings are shell-owned**
   Preferences open in the standard drawer and underlying page input is blocked while it is open.

6. **Help is layered and contextual**
   The full help surface includes shell controls and active-pane controls without implying that inactive panes still own input.

7. **Notifications are recoverable by weight**
   Toasts stay ephemeral, while persistent shell notifications can eventually be reviewed later.

## Proving surface

`DOGFOOD` should be the first proving surface for this design.

Why:

- it already uses the standard frame shell
- it already has a landing screen
- it already exposes search, help, settings, notifications, and quit behavior
- it is visible enough that shell drift shows up quickly

The rule should be:

> if the shell feels confusing in DOGFOOD, the shell contract is not ready yet.

## Recommended implementation order

1. **Footer-first shell cleanup**
   - move landing telemetry into the footer permanently
   - simplify the docs/footer roles until header and footer read cleanly

2. **Global quit policy**
   - formalize shell `requestQuit`
   - route `Esc`, `q`, and `Ctrl+C` through that policy

3. **Search/help/settings discoverability pass**
   - make shell entry points visible and calm in the chrome

4. **Notification history concept**
   - add the first shell-level recovery path for persistent notifications

5. **FTUI onboarding primitives**
   - once the shell itself is stable enough to teach honestly
