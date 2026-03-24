# Focus Owns Input

_Design note for pane-scoped input in `createFramedApp()`_

## Why this exists

The first DOGFOOD docs shell exposed a real shell problem, not just a docs-app bug:

- visual focus can move to a different pane
- the active pane can change in shell state
- but page-wide bindings still handle keys as if nothing changed

That makes the app feel dishonest. If the right pane is focused and the left pane still reacts to arrow keys, the shell is lying about where input goes.

This is not only a docs concern. Any multi-pane framed app will eventually want the same thing:

- the active area should own local controls
- inactive areas should stop responding
- shell overlays and modal layers should still preempt lower layers
- mouse focus and keyboard focus should follow the same model

The right place to solve that is the standard app frame.

## Design-thinking frame

### Primary user

The primary user is the **workspace builder**:

- a developer building a multi-pane TUI with `createFramedApp()`
- someone who expects pane focus to mean something operational, not just visual
- someone who does not want to cram every local interaction into one page-global `keyMap`

They are asking:

- "Which area owns my keys right now?"
- "If focus moves, do the controls move with it?"
- "Will the shell still keep command palette, help, and tab management coherent?"

### Secondary user

The secondary user is the **framework maintainer / docs author**:

- they need the shell to express local controls honestly
- they need the help surface to describe the currently active area
- they need mouse and keyboard behavior to align instead of drifting apart

### Jobs to be done

1. **Help me trust focus.**
   When the shell highlights a pane as active, local input should target that pane and not a hidden sibling.

2. **Help me compose local interactions safely.**
   I want pane-local key and mouse behavior without rewriting the shell or creating one enormous page keymap.

3. **Help me keep shell behavior coherent.**
   Global shell actions like help, palette, tab switching, and modal capture should still work consistently.

4. **Help me explain the app truthfully.**
   The help surface should reflect the active area's local bindings, not stale page-wide assumptions.

## Hills

### Hill 1 — Focus means ownership

When a user moves focus inside a framed app, the active area owns the next local interaction. Inactive panes do not keep responding as if they were still active.

### Hill 2 — Shell layers still win

Help, command palette, and modal capture continue to preempt lower layers. Local pane input should feel powerful, not anarchic.

### Hill 3 — Authors declare areas, not routing spaghetti

App authors should be able to declare pane-scoped input near the pane definition instead of encoding a whole workspace's behavior inside one page-global keymap.

## The current problem

Today `createFramedApp()` already tracks:

- the active page
- the focused pane per page
- pane-local scroll positions
- shell overlays like help and command palette

But it still routes most custom keyboard input through:

- `FramePage.keyMap`
- `FramePage.modalKeyMap`
- `CreateFramedAppOptions.globalKeys`

That means:

- focus affects scrolling, not input ownership
- page-level bindings can keep mutating the wrong pane
- help can only talk about shell/global/page bindings, not the active pane
- mouse focus and keyboard routing are only partially aligned

The DOGFOOD docs shell is just the first visible symptom:

- focus can move to the variants pane
- but the family lane still responds to arrow keys because the page keymap is still global

## Principles

1. **Focus should imply local input ownership**
   If the shell says a pane is active, pane-local controls should route there.

2. **Layering should stay explicit**
   Shell overlays and modals must remain above pane input.

3. **Keyboard and mouse should share one focus model**
   Click-to-focus and key-based focus should activate the same local area.

4. **The frame should own the stack**
   Apps should declare local input sources. The frame should synthesize the routing model internally.

5. **Tests are the spec**
   The first implementation step is failing `app-frame` tests that describe routing truthfully.

## Proposed concept

The philosophy is:

> **Focus owns input.**

In practical shell terms:

- the focused pane contributes a local input layer
- when focus moves, that layer is replaced
- inactive panes no longer receive local keys
- shell overlays/modals still sit above pane-local behavior

The frame should manage this as an internal input stack, even if the first public API stays simple and declarative.

## Proposed v0 API shape

The first public step should stay pane-scoped and explicit:

```ts
interface FrameInputArea<PageModel, Msg> {
  readonly paneId: string;
  readonly keyMap?: KeyMap<Msg>;
  readonly helpSource?: BindingSource;
  readonly mouse?: (args: {
    readonly msg: MouseMsg;
    readonly model: PageModel;
    readonly rect: LayoutRect;
  }) => Msg | undefined;
}

interface FramePage<PageModel, Msg> {
  // existing fields...
  readonly inputAreas?: (model: PageModel) => readonly FrameInputArea<PageModel, Msg>[];
}
```

Why this shape:

- it stays close to the existing `paneId`-based frame layout model
- it does not force apps to manually manage an `InputStack`
- it leaves room for a richer future stack model without throwing away the first API

## Internal routing model

`createFramedApp()` should internally synthesize a layered routing model from its existing shell state plus any active input areas.

### Conceptual layers

From highest priority to lowest:

1. **Shell modal layers**
   - help
   - command palette
   - future shell-owned overlays that capture input

2. **Page modal layer**
   - existing `modalKeyMap`

3. **Frame shell layer**
   - tab switching
   - pane cycling
   - shell help/palette open
   - shell scroll actions that intentionally target the focused pane

4. **Focused pane layer**
   - the `inputAreas` entry whose `paneId` matches the currently focused pane

5. **Page/global fallback layers**
   - existing `keyMap`
   - existing `globalKeys`

The exact ordering of page/global/frame conflicts should preserve the spirit of the existing `keyPriority` option:

- `keyPriority: 'frame-first'` means shell bindings still win over page-derived bindings
- `keyPriority: 'page-first'` means page-derived bindings win before shell fallbacks

For v0, the focused pane should count as **page-derived**, not as a shell layer.

## Mouse model

Mouse should follow the same ownership concept.

### v0 expectations

- clicking inside a focusable pane focuses it first
- after focus is updated, pane-local mouse handling can run for that pane
- wheel scrolling over a pane focuses it and scrolls the hovered/focused pane
- shell chrome and shell-owned overlays still intercept first

This keeps mouse support additive and consistent with the keyboard model instead of becoming a parallel routing system.

## Help and discoverability

The help surface should become more truthful once pane-local input exists.

For v0:

- the short help strip should continue to show shell-level controls first
- the full help view should merge the active pane's `helpSource` into the current binding view
- inactive pane bindings should not be shown as if they are currently usable

This is a real product value of the feature, not just a nice-to-have.

## Scope

### In scope for v0

- pane-scoped key handling in `createFramedApp()`
- pane-scoped mouse handling in `createFramedApp()`
- shell-managed focus-to-input ownership
- help integration for the active pane
- migration of the DOGFOOD docs shell as a proving surface

### Out of scope for v0

- arbitrary nested input graphs beyond framed panes
- full public `InputStack` authoring inside frame apps
- generalized interactive-component protocol
- animation work on the DOGFOOD landing hero
- redesigning every shell binding or every scroll primitive

## Tests are the spec

The first implementation step should be failing tests in `app-frame.test.ts` and the docs preview tests.

### Minimum acceptance tests

1. **Focused pane keymaps only fire for the active pane**
   - If the variants pane is focused, local arrow bindings in the family pane do not fire.

2. **Changing focus replaces the active pane layer**
   - Tabbing or clicking into a different pane immediately changes which pane-local bindings are active.

3. **Page modal capture still blocks pane input**
   - Existing `modalKeyMap` behavior remains stronger than pane-local bindings.

4. **Shell modal capture still blocks pane input**
   - Help and command palette continue to preempt lower layers.

5. **Shell bindings remain coherent**
   - Frame-level commands like pane cycling or help toggle still work while pane-local input exists.

6. **Pane-local mouse handlers only run for the focused/targeted pane**
   - A click in one pane does not invoke another pane's local handler.

7. **Help reflects the active pane**
   - The full help surface shows the active pane's bindings instead of stale page-global guidance.

8. **DOGFOOD regression**
   - In the docs shell, focusing the variants pane stops arrow keys from moving the family accordion.

## Recommended implementation loop

1. **Write the shell tests first**
   - Add focused-pane keyboard routing tests to `app-frame.test.ts`
   - Add a docs-preview regression that encodes the current broken behavior

2. **Add pane-scoped input areas to `FramePage`**
   - Start with declarative `inputAreas(model)`
   - Keep all existing page/global APIs working

3. **Synthesize the active layer in `createFramedApp()`**
   - Resolve the focused pane
   - Insert the active area into the internal routing order

4. **Wire help to the active pane**
   - Merge `helpSource` from the focused area into the shell help surface

5. **Add mouse support to the same model**
   - Click-to-focus
   - wheel-to-focus-and-scroll
   - pane-local click dispatch after shell interception

6. **Migrate DOGFOOD**
   - Move its lane controls out of one page-global keymap and into pane-scoped areas

7. **Only then evaluate a richer public stack model**
   - If the abstraction proves out, consider whether framed apps should later expose a more direct layer/stack contract

## Open questions

1. Should `inputAreas` eventually support non-pane regions inside a pane, or is pane scope enough for the first public step?
2. Should the active pane's bindings appear in the short help strip, or only in the full help overlay?
3. Should a pane-local keymap be able to override shell scroll keys like `j/k`, or should those remain shell-reserved in v0?
4. Should the internal routing eventually use the existing public `createInputStack()` implementation directly, or keep a lighter frame-specific dispatcher?

## Recommendation

Do **not** implement this as a docs-only fix.

The docs shell merely surfaced the problem. The right solution is a frame-shell feature with the docs app as the first proving ground.
