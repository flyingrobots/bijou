# DOM host: `mountBijouDom()`

This page is the reference for `mountBijouDom()` in
`@flyingrobots/bijou-web`. It runs a semantic scene app in a DOM container:
native elements, no terminal grid, and no ANSI.

The function joins three existing parts:

- the [semantic scene app contract](../semantic-scene-app/README.md), which
  runs the app and dispatches actions;
- the [browser renderer seam](../ui-scene-browser/README.md), which lowers
  each scene to an element tree;
- the [browser host adapter](../bijou-web/README.md), whose
  `createWebContext()` is the default context.

The cases that hold this behavior are listed in the
[test plan](./test-plan.md).

## Signature

```ts
mountBijouDom(app, container, options?): BijouDomHandle
```

| Option | Meaning |
| --- | --- |
| `document` | The document that creates elements. Defaults to `container.ownerDocument`. |
| `ctx` | The app's `BijouContext`. Defaults to `createWebContext()`. |
| `focusableNodeIds` | Node ids that may take focus, in order. Used by the focus fallback. |
| `direction` | `(model) => 'ltr' \| 'rtl' \| 'auto'`. Without it the root has no `dir`. |
| `onDiagnostic`, `onCrash` | Passed to `createSemanticSceneController()`. |

| Handle member | Meaning |
| --- | --- |
| `root` | The element that holds the scene, appended to `container`. |
| `controller` | The `SemanticSceneController` that runs the app. |
| `stop()` | Stops the app and detaches `root`. A second call does nothing. |

The DOM types are structural: `BijouDomDocument` needs `createElement()`,
`createTextNode()` and `activeElement`, and `BijouDomElement` needs the
element methods that the patcher and the event bridge call. The package names
no DOM library type.

## Lifecycle

`mountBijouDom()` creates the controller, lowers the first scene with
`lowerUiSceneToBrowser()`, patches it into a new `div`, writes the theme
custom properties, and then appends that `div` to `container`. It patches
again for each frame the controller commits, synchronously and in commit
order.

When the first scene cannot be lowered, the controller is stopped, nothing
is attached, and the error is thrown. The seam lowers `group` and `text`
nodes only, so a scene with any other node kind fails here. A later frame
that cannot be lowered throws inside the frame listener; the controller
reports it through its bus, and the DOM keeps the last patched frame.

`stop()` disposes the frame subscription and the theme observation, removes
every delegated listener, stops the controller, and removes `root` from
`container`. The controller's own bus is disposed, so a command cleanup, such
as an interval that a command returned, runs. A pending `tick()` sleep is not
cancelled by the bus; its message is dropped.

## Element mapping

The seam maps no role to ARIA. The host reads `data-bijou-role`:

| Role | Element | Added attributes |
| --- | --- | --- |
| `button`, `switch` | `<button>` | `type="button"` |
| `textbox`, with no children | `<input>` | `type="text"`; the node text is the `value` |
| `alert`, `group`, `log`, `region`, `status`, `toolbar` | the seam's `div` or `span` | `role` with the same value |
| any other, or none | the seam's `div` or `span` | `tabindex="0"` when the node has an action |

Every attribute that the seam lowers is kept. `ui-scene-ir/1` has no field
for a checked state, and the seam lowers no `node.metadata`, so a `switch`
gets no `aria-checked` and no ARIA `role`. Its text is its only state.

## Keyed patching

Each element is keyed by `data-bijou-node-id`. While a node id stays in the
scene and its element tag does not change, its element is kept:

- Attributes are diffed against the last values the patcher wrote. Only a
  changed value is set, and only an attribute that the scene dropped is
  removed. An attribute the patcher did not write is left alone.
- Text lives in one text node; a change sets its `data`.
- An `<input>` value is written only when the scene's value changed since the
  last patch, the input differs from it, and no composition is in progress.
  A re-render for any other change leaves the value, and so the selection,
  untouched.
- Children are put in scene order by moving only the nodes that are out of
  place. A node that left the scene is removed.

A node whose element tag changes, for example from `span` to `button`, gets
a new element.

## Events

The root has one listener for each of `click`, `keydown`, `input`,
`compositionstart`, and `compositionend`. Each element's action ids come from
its `data-bijou-action`; the bridge sends the first one with
`controller.invoke()`.

| Event | Action |
| --- | --- |
| `click` | The nearest element at or above the target that has an action. A click on an `<input>` sends nothing. |
| `keydown` Enter or Space | Only on a plain element that has an action; the default is prevented. A `<button>` gets no key handling, because the browser turns Enter and Space into one `click`. |
| `input` | The input's value, unless `isComposing` is true or a composition is in progress. |
| `compositionend` | The committed value, once. An `input` event right after it with the same value is skipped. |

An action that the current scene no longer declares is ignored by the
controller and reported to `onDiagnostic` as `action-not-declared`.

## Focus fallback

When the focused element belongs to a node that leaves the scene, focus
moves to, in order:

1. the first id in `focusableNodeIds` that the new scene has;
2. the nearest ancestor of the removed node that the new scene has;
3. the root.

A plain element without a `tabindex` gets `tabindex="-1"` before it takes
focus. When the focused node stays but gets a new element, the new element
takes focus.

## Theme and direction

The root's inline style holds one custom property per token, read through
the context's accessors: `--bijou-semantic-<key>` for `success`, `error`,
`warning`, `info`, `accent`, `muted`, and `primary`;
`--bijou-surface-<key>` for `primary`, `secondary`, `elevated`, `overlay`,
and `muted`; `--bijou-border-<key>` for `primary`, `secondary`, `success`,
`warning`, `error`, and `muted`. The value is the token's hex color.

`observeTheme()` reports each token graph change, and only the properties
whose color changed are written. No node is re-created. The seam gets no
`tokenColors`, so node elements carry token names in `data-bijou-fg-token`
and similar attributes, and a page style sheet maps them to the custom
properties.

With `direction`, the root's `dir` is written after each frame when the
value changes.

## Limits

- No browser engine runs in the sealed test runner. The tests use an
  in-memory document that models the browser rules the host relies on. Real
  focus, selection, IME composition, and native button activation are not
  verified in a browser.
- The seam lowers `group` and `text` nodes only, so `box`, `image`, `list`,
  `table`, `custom`, and `markdown` nodes are refused.
- A toggle has no checked state in `ui-scene-ir/1`, so it has no
  `aria-checked`.
- A patch runs for each frame; patches are not batched to animation frames.
