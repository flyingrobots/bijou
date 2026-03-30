# HT-003 — Implement Layer Stack and Input Map Routing

_Cycle for turning the shell layer-stack doctrine into real routing, dismissal, and control-hint behavior inside `createFramedApp()`_

Legend:

- [HT — Humane Terminal](/Users/james/git/bijou/docs/legends/HT-humane-terminal.md)

Depends on:

- [HT-002 — Layered Focus and Interaction](/Users/james/git/bijou/docs/design/HT-002-layered-focus-and-interaction.md)

## Why this cycle exists

HT-002 established the right direction:

- layers should behave like a stack
- the topmost layer should own input
- `Esc` should dismiss topmost layers before quitting
- visible controls should come from the active input map

But the runtime was still routing shell surfaces through raw branch order.

This cycle exists to make that doctrine real enough to stop the `Esc`/footer class of bugs from reappearing constantly.

## Human users / jobs / hills

### Primary human users

- framed-app operators moving through search, settings, help, notifications, and quit confirm
- DOGFOOD users switching between pane work and shell-owned layers
- builders relying on `createFramedApp()` defaults instead of reinventing shell logic

### Human jobs

1. Dismiss the thing on top without accidentally triggering something beneath it.
2. Trust the footer to describe the active controls instead of stale underlying controls.
3. Understand when a page-owned modal is blocking the workspace.

### Human hill

The shell behaves like a calm stack of layers instead of a pile of conditionals: dismissal is unsurprising and footer hints are truthful.

## Agent users / jobs / hills

### Primary agent users

- agents driving framed apps by key sequences
- agents validating shell behavior through playbacks
- agents that need a structured way to infer what the shell considers active

### Agent jobs

1. Inspect the active shell layer order from model state instead of reverse-engineering branch order.
2. Predict whether a key will dismiss, route to the page modal, or fall through to the workspace.
3. Derive visible controls from the topmost layer, not by parsing terminal chrome heuristically.

### Agent hill

An agent can inspect a frame model and understand the current shell/page layer stack well enough to predict `Esc` and footer behavior reliably.

## Human playback

1. A user opens settings from a framed app.
2. Settings becomes the topmost active layer and the footer shows settings controls.
3. The user opens help from within settings.
4. Help becomes the topmost layer and its controls replace the settings footer.
5. The user presses `Esc`.
6. Help dismisses and settings becomes active again.
7. The user presses `Esc` again.
8. Settings dismisses.
9. The user presses `Esc` once more.
10. Only now does the shell treat the key as a quit request and open quit confirm.

## Agent playback

1. An agent inspects a frame model with a search layer open over settings.
2. The model describes the layer stack as `workspace -> settings -> search`.
3. The topmost input map is `frame-search`, so the footer shows search controls.
4. The agent sends `Esc`.
5. The search layer dismisses.
6. The layer stack becomes `workspace -> settings`.
7. The footer now shows settings controls.
8. The agent sends `Esc` again.
9. Settings dismisses, restoring the base workspace.

## Linked invariants

- [Focus Owns Input](/Users/james/git/bijou/docs/invariants/focus-owns-input.md)
- [Topmost Layer Dismisses First](/Users/james/git/bijou/docs/invariants/topmost-layer-dismisses-first.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)
- [Shell Owns Shell Concerns](/Users/james/git/bijou/docs/invariants/shell-owns-shell-concerns.md)

## Implementation outline

1. Add a shared shell-layer descriptor model.
2. Expose a public `describeFrameLayerStack()` helper for tests/agents.
3. Drive key routing from the topmost active layer instead of raw boolean branch order.
4. Make mouse handling respect the same topmost-layer blocking model.
5. Drive footer hints from the active layer's input map or shell-specific control source.
6. Add regressions for:
   - top-down `Esc` dismissal
   - structured layer-stack inspection
   - page-modal footer truth

## Tests to write first

- cycle doc regression for HT-003 and its follow-on backlog item
- shell regression proving `Esc` dismisses topmost layers before quit
- shell regression proving footer hints come from the topmost active layer
- regression proving the layer stack can be described structurally for shell layers and page modals

## Risks / unknowns

- the implementation may still describe a layer stack rather than literally pushing/popping key maps as first-class runtime objects
- page-owned modals still expose only a `modalKeyMap`, not a richer layer object
- shell help content is still composed from binding sources rather than a fully unified input-map registry

## Retrospective

What landed:

- `describeFrameLayerStack()` in the public TUI API
- topmost-layer-driven key routing in `createFramedApp()`
- topmost-layer-aware mouse blocking
- footer hints derived from the active layer instead of raw booleans
- page-modal footer truth through modal-keymap-driven help hints

What did not land:

- a literal push/pop runtime registry of layer objects
- richer page-provided layer descriptors beyond `modalKeyMap`
- a dedicated agent-visible shell introspection surface beyond the public layer-stack helper

Follow-on:

- [HT-004 — Promote Explicit Layer Objects and Richer Shell Introspection](/Users/james/git/bijou/docs/BACKLOG/HT-004-promote-explicit-layer-objects-and-richer-shell-introspection.md)
