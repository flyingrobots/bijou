# Test plan: DOM host

This ledger lists each requirement of [`mountBijouDom()`](./README.md), the
test that holds it, and its status. Every test is in
`packages/bijou-web/src/`, in the file named in the requirement's group
heading. The oracle for each case is the assertion in the named test. A name
with `%j` or `%s` is one parameterized test.

The tests run in the sealed Docker runner against the in-memory document in
`dom-document.test-support.ts`. It models these browser rules: a moved node
leaves its old parent, removing the focused node moves focus to `body`,
moving the focused node also drops focus, only a `<button>`, an `<input>`, or
an element with `tabindex` takes focus, setting an `<input>` value that
differs moves the caret to the end, and Enter or Space on a `<button>` whose
`keydown` is not prevented fires one `click`. The fixture apps are
`createControlsApp()` in `dom-app.test-support.ts` and `createShapesApp()` in
`dom-shapes.test-support.ts`. No real browser runs these cases.

## Golden: `dom-mount.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-01 | The app mounts as native elements with roles, and no ANSI reaches the DOM or the output port. | `mounts a semantic scene app as native elements with no terminal grid or ANSI` | Implemented |
| DOM-02 | A click dispatches an action and the scene patches in place. | `runs the app interactively: a click dispatches and the scene patches in place` | Implemented |

## Keyed patching: `dom-patch.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-03 | The active `<input>` keeps its identity, value, and selection across re-renders. | `keeps the active input node and its selection across re-renders` | Implemented |
| DOM-04 | The active input value is not rewritten when the scene did not change it. | `does not rewrite the active input value unless the scene changed it` | Implemented |
| DOM-05 | A value that the scene changed goes into the same input element. | `writes a value that the scene changed into the same input element` | Implemented |
| DOM-06 | Attributes and text are diffed: an update writes once and creates nothing. | `diffs attributes and text, so an unchanged node gets no write` | Implemented |
| DOM-07 | A removed node goes, and every other element stays. | `removes a node that leaves the scene and keeps every other element` | Implemented |
| DOM-08 | A new node is inserted at its scene position. | `inserts a node that enters the scene at its scene position` | Implemented |

## Events: `dom-events.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-09 | Enter and Space on a native `<button>` dispatch exactly once. | `activates a native button exactly once for %j` | Implemented |
| DOM-10 | Enter and Space on a plain actionable element dispatch once and prevent the default. | `activates a plain actionable element once for %j and prevents the default` | Implemented |
| DOM-11 | Other keys, and keys on a text input, dispatch nothing. | `ignores other keys and keydown on a text input` | Implemented |
| DOM-12 | Typed text dispatches the input value. | `dispatches typed text with the input value` | Implemented |
| DOM-13 | Committed composition text dispatches once, whichever of `compositionend` and the last `input` comes first. | `dispatches committed composition text once (compositionend first: %s)` | Implemented |
| DOM-14 | Nothing dispatches during a composition, and a scene value does not overwrite it. | `dispatches nothing while a composition is in progress, and keeps its text` | Implemented |
| DOM-15 | An action for a removed node is ignored with a diagnostic. | `ignores an action for a node that left the scene` | Implemented |
| DOM-28 | After the scene changes the value, typing that repeats a committed composition still dispatches. | `dispatches typed text that repeats a committed composition after the scene changed the value` | Implemented |

## Focus: `dom-focus.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-16 | Focus moves to the first declared focusable node that remains. | `moves focus to the first declared focusable node the new scene still has` | Implemented |
| DOM-17 | Without one, focus moves to the nearest surviving ancestor, never to `body`. | `falls back to the nearest surviving ancestor when no declared node remains` | Implemented |
| DOM-18 | Focus on a node that stays is left alone. | `leaves focus alone when the focused node stays in the scene` | Implemented |

## Theme and direction: `dom-theme.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-19 | Semantic, surface, and border tokens are custom properties at mount. | `writes semantic, surface, and border tokens as custom properties at mount` | Implemented |
| DOM-20 | A token change updates its property live, with one write and no new node. | `updates a changed token live without recreating any node` | Implemented |
| DOM-21 | The model direction flips `dir` without re-creating nodes. | `flips dir from the model direction without recreating any node` | Implemented |
| DOM-22 | Without a direction option there is no `dir`. | `writes no dir attribute without a direction option` | Implemented |

## Teardown: `dom-stop.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-23 | `stop()` removes listeners, command timers, and the root, and is idempotent. | `stop() removes every listener, TEA timer, and the root, and is idempotent` | Implemented |
| DOM-24 | After `stop()`, a theme change, an event, or an action writes nothing. | `writes nothing for a theme change, event, or action after stop()` | Implemented |
| DOM-25 | A first scene that cannot be lowered stops the controller, which releases a command interval, and attaches nothing. | `stops the controller and attaches nothing when the first scene cannot be lowered` | Implemented |

## Stress: `dom-stress.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-26 | 200 sequential updates write at most once each, create nothing, keep every element, and leave no listener after `stop()`. | `patches 200 sequential updates in place with bounded writes and no orphaned listeners` | Implemented |

## Reshaped scenes: `dom-reshape.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-29 | A reorder that moves the focused element gives it focus again. | `restores focus to a kept element that a reorder moved` | Implemented |
| DOM-30 | A sibling leaving does not move the focused element after it. | `does not move a focused element when an earlier sibling leaves` | Implemented |
| DOM-31 | A plain element that replaces the focused one gets `tabindex="-1"` and focus. | `makes a replacement plain element focusable before focusing it` | Implemented |
| DOM-32 | Replacing an input drops its composition state. | `clears the composition state of an input that a new element replaces` | Implemented |

## Switch state: `dom-elements.test.ts`, `dom-patch.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-33 | A switch that declares the state gets `role="switch"` and `aria-checked`. | `adds role="switch" and aria-checked for a switch that declares the state` | Implemented |
| DOM-34 | A switch without the state, and the state on another role, keep today's rendering. | `keeps today's rendering for a switch without the state`; `ignores the state on a node that is not a switch` | Implemented |
| DOM-35 | A state change updates `aria-checked` on the same element. | `writes role="switch" and aria-checked, and flips aria-checked in place` | Implemented |

## Real browser: `examples/web-gpu/e2e/dom.e2e.ts`

This case runs with `npm run test:browser:web-gpu` in Google Chrome, outside
the sealed runner. Its page is `examples/web-gpu/dom.html`.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| DOM-27 | Real Chromium: focus, selection, IME, and single-fire button activation in Mode 2. A click, Enter and Space on a focused `<button>` each dispatch once; typing, a caret move and an IME commit keep the same `<input>` element focused, with its selection; a switch toggled twice flips `aria-checked` on the same element; no diagnostic, console or page error. | `mountBijouDom() in Chromium: one dispatch per activation, and typing or composing keeps the input element, focus and selection` | Implemented |
