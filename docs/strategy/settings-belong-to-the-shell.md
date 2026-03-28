# Settings Belong to the Shell

_Design note for a frame-owned settings drawer in `createFramedApp()`_

## Why this exists

The DOGFOOD docs app exposed a product gap that is larger than the docs app itself:

- users want global preferences quickly
- they expect to reach them from the shell, not by navigating into a one-off page
- those preferences often affect the whole surface, not just the current page

Examples:

- theme selection
- animation or reduced-motion preferences
- input hints and help visibility
- output/profile defaults for a docs or workbench surface

If each framed app invents its own settings overlay, the result will drift:

- different entry points
- different keyboard behavior
- different scroll behavior
- different focus and dismissal rules
- different mouse expectations

That is exactly the kind of shell concern the standard app frame should own.

## Design-thinking frame

### Primary user

The primary user is the **workspace user**:

- they are already inside a framed app
- they want to adjust preferences without leaving their place
- they expect settings to feel global, stable, and discoverable

They are asking:

- "Where do I change app-wide preferences?"
- "Can I do that without leaving the current page?"
- "Will the shell behave the same way in every framed app?"

### Secondary user

The secondary user is the **workspace builder**:

- a developer using `createFramedApp()`
- someone who wants settings UX without re-implementing drawers, key routing, or scrolling preferences

They are asking:

- "Can the frame give me a standard settings surface?"
- "Can I declare preferences, sections, and actions instead of rebuilding infrastructure?"
- "Will this stay coherent with help, palette, and modal routing?"

### Jobs to be done

1. **Help me adjust global preferences in place.**
   I want to change shell- or app-level behavior without leaving the screen I am on.

2. **Help me trust the shell.**
   Settings should feel like a first-class shell affordance, not a special page pretending to be one.

3. **Help me keep settings readable and tappable.**
   Preferences should be easy to scan, scroll, and toggle in a narrow drawer.

4. **Help me implement preferences once.**
   App authors should declare settings data and effects, not rebuild list rendering, drawer motion, and input plumbing.

## Hills

### Hill 1 — Settings feel shell-owned

In a framed app, settings open from the shell and behave like the shell. They do not feel like a page hack or a random modal.

### Hill 2 — Preferences are readable in a narrow lane

The drawer should support a vertically scrolling, sectioned preference list that works in compact widths and still feels deliberate.

### Hill 3 — Input remains honest

When the settings drawer is open, it owns local input. The underlying page does not keep reacting as if the drawer were not there. Mouse, keyboard, and help should all tell the same truth.

## Product direction

The shell should provide a **left-edge settings drawer** with a structured, scrollable preference list.

The mental model is:

> settings are a shell-owned sidecar, not a page transition.

That means:

- the current page remains visible behind it
- the drawer opens from the left edge
- the drawer can scroll independently
- the drawer owns input while open
- the rest of the shell remains visible but non-interactive underneath

## The visual model

The intended feel is closer to an iOS-style settings list than to a long markdown help page.

Rough structure:

```text
+------------------------------------------+
| Settings                            ⓘ   |
+------------------------------------------+
| Appearance                               |
|  Theme                            Paper  |
|  Motion                              On  |
|------------------------------------------|
| Docs                                     |
|  Landing animation                     On |
|  Profile default                  Static |
|------------------------------------------|
| Shell                                    |
|  Show hints                            On |
|  Mouse support                         On |
+------------------------------------------+
```

Important properties:

- section headings
- rows that read like preferences, not generic commands
- a compact trailing value or toggle affordance
- enough spacing to scan quickly
- scroll support when the list exceeds the drawer height

## Principles

1. **Settings are shell state first**
   The frame should own open/close, focus, scroll, and entry affordances.

2. **Page content stays visible**
   This is a drawer, not a full route transition.

3. **Preferences should be declarative**
   App authors should define sections and rows, not low-level drawer plumbing.

4. **Mouse and keyboard should agree**
   Click, wheel, arrow keys, Enter, and Escape should all follow the same ownership model.

5. **Tests are the spec**
   The next implementation step should be failing shell tests, not one-off docs hacks.

## Proposed v0 API shape

The first public step should keep the shell responsible for the container while apps declare the content model.

```ts
interface FrameSettingRow<PageModel, Msg> {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly valueLabel?: string;
  readonly action?: Msg;
  readonly kind?: 'action' | 'toggle' | 'choice' | 'info';
  readonly enabled?: boolean;
}

interface FrameSettingSection<PageModel, Msg> {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly FrameSettingRow<PageModel, Msg>[];
}

interface FrameSettings<PageModel, Msg> {
  readonly title?: string;
  readonly sections: readonly FrameSettingSection<PageModel, Msg>[];
}

interface CreateFramedAppOptions<PageModel, Msg> {
  // existing fields...
  readonly settings?: (args: {
    readonly model: FrameModel<PageModel>;
    readonly activePage: FramePage<PageModel, Msg>;
    readonly pageModel: PageModel;
  }) => FrameSettings<PageModel, Msg> | undefined;
}
```

Why this shape:

- the shell still owns layout, drawer chrome, and interaction rules
- the app only supplies structured preference content
- rows can dispatch messages back into the page/app model without exposing shell internals
- the model leaves room for future persistence without forcing it in v0

As the first proving surface matured, the row treatment itself proved valuable enough to deserve promotion into canonical Bijou componentry. That follow-on direction is captured in [Preference Lists Belong to Bijou](preference-lists-belong-to-bijou.md) and [Preference List Surface](../specs/preference-list-surface.spec.json).

## Standard shell behavior

### Entry

The shell should expose a standard way to open settings:

- a frame action and binding such as `ctrl+,`
- a command-palette entry like `Open settings`

This should be part of the shell, not left to every app.

### Drawer placement

- anchored to the left edge
- consistent width policy, likely a bounded percentage of screen width
- standard header row with title and optional lightweight info glyph

### Scroll behavior

- the settings list scrolls independently
- wheel scrolling over the drawer scrolls the drawer
- arrow keys, `j/k`, `d/u`, `g/G` can scroll the list when it is focused/open
- the underlying page does not scroll while the drawer is active

### Selection behavior

For v0, the simplest honest behavior is:

- one active row
- arrow keys move between rows
- Enter triggers the row action
- Space can toggle boolean rows
- mouse click activates a row

The shell should provide enough behavior that the list feels native even before richer controls exist.

### Dismissal

- `Esc` closes the drawer
- shell help and command palette remain able to preempt it if intentionally opened
- clicking outside the drawer should close it only if we decide the shell uses outside-click dismissal consistently; otherwise v0 should avoid surprise dismissal

## Input layering

This feature depends on the Focus Owns Input direction.

Conceptually, the order should be:

1. shell modal layers
2. settings drawer layer
3. page modal layer
4. frame shell layer
5. focused pane layer
6. page/global fallback

The important behavior is:

- when settings are open, the settings drawer owns local navigation and scroll
- the underlying page does not continue responding
- the shell can still intentionally open help or palette above settings

This is why settings should be built into the frame, not bolted onto one page.

## Mouse model

Mouse should be first-class here.

### v0 expectations

- click inside a row focuses and activates/selects it
- wheel scroll inside the drawer scrolls the settings list
- click inside the drawer does not leak through to the page
- click in shell chrome still hits shell chrome if it is intentionally above the drawer layer

If we do not build mouse support into this, the drawer will feel unfinished immediately.

## Help model

When settings are open:

- the short help strip should mention settings navigation and dismissal
- the full help view should reflect the settings layer rather than only the current page

That keeps the shell honest and discoverable.

## Scope

### In scope for v0

- shell-owned settings drawer in `createFramedApp()`
- declarative settings sections and rows
- scrollable settings list
- keyboard navigation and selection
- mouse click and wheel support
- command-palette entry to open settings
- docs app as a proving surface

### Out of scope for v0

- settings persistence across sessions
- arbitrarily rich embedded controls inside rows
- editable text fields inside settings
- page-specific custom drawer layouts
- a full generalized preferences framework for every component in the repo

## Tests are the spec

The next implementation loop should start with failing tests in `app-frame.test.ts` and `docs-preview.test.ts`.

### Minimum acceptance tests

1. **The frame can open a standard settings drawer**
   - A standard shell action opens settings without the page building a one-off overlay.

2. **The settings drawer owns input while open**
   - Arrow keys and scroll actions move within settings instead of mutating the underlying page.

3. **Mouse input does not leak through the settings drawer**
   - Clicks and wheel events inside the drawer are consumed by settings behavior.

4. **The settings list scrolls when content exceeds drawer height**
   - Long preference lists remain usable in compact terminals.

5. **The command palette can open settings**
   - The shell exposes settings as a discoverable shell command, not just a hidden keybinding.

6. **The docs app can expose preferences without custom drawer plumbing**
   - DOGFOOD becomes a proving surface, not a special-case shell fork.

## Recommended first proving surface

The DOGFOOD docs app is the right v0 proving surface because it already has obvious shell-level preferences:

- landing theme preset
- default profile
- animation on/off
- hint visibility

That is enough to validate:

- drawer layout
- shell input ownership
- mouse routing
- command-palette entry
- scrollable settings sections

without overdesigning persistence or form controls too early.

## Recommended next implementation loop

1. Write failing `app-frame` tests for opening, scrolling, and owning input.
2. Add a failing docs-preview test that opens settings and changes one visible preference.
3. Implement the shell-owned drawer and basic settings list renderer.
4. Prove the docs app can adopt it with minimal custom code.

The key discipline is the same as the rest of the post-v4 work:

> design first, tests second, implementation third.
