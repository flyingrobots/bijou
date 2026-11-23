# Browser renderer seam for `ui-scene-ir/1`

This page is the reference for the browser renderer seam in
`@flyingrobots/bijou`. The seam lowers a `ui-scene-ir/1` scene to a browser
element tree and to HTML markup. It runs without a DOM, so it works in a
browser, a worker, or a server.

The cases that hold this behavior are listed in the
[test plan](./test-plan.md).

## What the seam does

The seam copies scene facts into elements. It does not resolve a binding, run
an action, map a role to ARIA, or keep state between calls. A host that wants
live behavior reads the attributes and supplies that behavior itself.

The terminal renderer, `lowerUiSceneToSurface()`, is separate and unchanged.

## Functions

| Function | Result |
| --- | --- |
| `lowerUiSceneToBrowser(scene, options?)` | A `UiSceneBrowserLowering`: the element tree `root`, its `markup`, the `targetProfile`, `sceneHash`, and `markupHash`. |
| `renderUiSceneBrowserMarkup(element)` | The markup for an element tree, with no whitespace between elements. |
| `createUiSceneBrowserDom(element, document)` | The detached root element, built through the host `document`. The host attaches it. |
| `createUiSceneBrowserReceipt(scene, lowering)` | A `ui-scene-receipt/1` with `outputs.browser` filled in. |
| `lowerUiSceneToBrowserProof(scene, options?)` | The lowering and its receipt. |

`createUiSceneBrowserDom()` needs only `createElement()` and
`createTextNode()` from the document, and `setAttribute()` and `appendChild()`
from each element.

## Options

| Option | Meaning |
| --- | --- |
| `lowerMode` | `normal` (default), `node-ids`, `i18n-keys`, or `token-refs`. These are the inspection modes of the terminal renderer. |
| `tokenColors` | Hex colors by token name. Without an entry, a token gets no color declaration. |
| `supportedRequirements` | The target requirements the caller accepts. The default list is the same as the terminal renderer's. |

## Element mapping

The scene must declare a `geordi-browser` target profile. The lowering wraps
the tree in one `div` that carries the scene facts:

| Attribute | Source |
| --- | --- |
| `data-bijou-scene-id` | `scene.id` |
| `data-bijou-ir-version` | `scene.irVersion` |
| `data-bijou-endpoint` | `ui-scene-browser/1` |
| `data-bijou-source-hash` | `scene.sourceHash` |
| `data-bijou-target` | `geordi-browser` |
| `data-bijou-target-width`, `data-bijou-target-height` | The target profile |

The tree starts at `scene.rootNodeId` and follows each node's `children` in
order. A `group` node becomes a `div`. A `text` node becomes a `span` that
holds its text before its children. Each node element carries these
attributes, in this order, when the scene has the fact:

| Attribute | Source |
| --- | --- |
| `data-bijou-node-id` | `node.id` (always present) |
| `data-bijou-node-kind` | `node.kind` (always present) |
| `data-bijou-role` | `node.role` |
| `data-bijou-component` | `node.component` |
| `data-bijou-action` | Ids from `node.actions`, then ids of actions whose `targetNodeId` is the node, separated by spaces |
| `data-bijou-binding` | Ids of bindings whose `targetNodeId` is the node, separated by spaces |
| `data-bijou-i18n-key` | `node.text.key` for i18n text |
| `data-bijou-source` | The node's `sourceMap` entry |
| `data-bijou-fg-token`, `data-bijou-bg-token`, `data-bijou-border-token` | `node.style` token names |
| `data-bijou-checked` | `node.state.checked`, as `true` or `false`; absent when the node declares no state |
| `data-bijou-modifiers` | `node.style.modifiers`, separated by spaces |
| `style` | Layout intent and resolved token colors |

The `style` attribute holds each layout number as a unitless custom
property: `--bijou-x`, `--bijou-y`, `--bijou-width`, and `--bijou-height`. The
host style sheet chooses the unit. With `tokenColors`, it also holds `color`,
`background-color`, and `border-color` for the tokens that have an entry.

Text is the literal value, or the i18n fallback, or the i18n key when there is
no fallback. The seam does not look up a locale catalog.

`node.metadata` is not lowered. `node.state.checked` is the one declared
state: the seam lowers it for any node and attaches no meaning to the role.
The field is optional, so a scene that declares no state keeps its canonical
bytes and its `sceneHash`.

## Example

This call lowers the fixture in
`packages/bijou/src/core/ui-scene-browser.test-support.ts`:

```ts
import { lowerUiSceneToBrowser } from '@flyingrobots/bijou';

const { markup } = lowerUiSceneToBrowser(debuggerScene);
```

The result is one line. It is wrapped and indented here for reading, and it is
abridged to the root node and one child:

```html
<div data-bijou-scene-id="fixture.debugger-scene"
     data-bijou-ir-version="ui-scene-ir/1"
     data-bijou-endpoint="ui-scene-browser/1"
     data-bijou-source-hash="sha256:fixture-debugger-scene"
     data-bijou-target="geordi-browser"
     data-bijou-target-width="640" data-bijou-target-height="360">
  <div data-bijou-node-id="debugger" data-bijou-node-kind="group"
       data-bijou-role="region" data-bijou-component="DebuggerPane"
       style="--bijou-x:0;--bijou-y:0;--bijou-width:32;--bijou-height:3">
    <span data-bijou-node-id="debugger.step" data-bijou-node-kind="text"
          data-bijou-action="debugger.step"
          data-bijou-fg-token="semantic.action.fg"
          data-bijou-bg-token="semantic.action.bg"
          style="--bijou-x:2;--bijou-y:2">Step</span>
  </div>
</div>
```

The exact, unabridged string is `debuggerSceneMarkup` in the same file.

## Refusals

The lowering throws before it returns any output when:

- the scene fails `validateUiSceneIr()`;
- the scene has no `geordi-browser` target profile;
- the target profile requires something outside `supportedRequirements`;
- a node has a kind other than `group` or `text`;
- the tree places a node more than once, which includes a cycle;
- the root node does not reach a node;
- the scene holds a number that is not finite, which the scene hash rejects;
- a `tokenColors` entry for a used token is not a hex color;
- an action id, binding id, or modifier is empty or contains whitespace.

The terminal renderer draws every `text` node by position and ignores the
tree. The browser seam requires one tree that contains every node, because a
document has no other place to put a node.

## Receipt

`outputs.browser.endpointHash` is the hash of the endpoint version and the
target profile. `outputs.browser.witnessHash` is the hash of the markup, and
equals `markupHash`. `createUiSceneBrowserReceipt()` throws when the lowering
came from a different scene.

## Limits

- The tests run in the sealed Docker runner, which has no browser engine. They
  check the element tree, the markup, and the calls made to a host document.
  No test loads the markup in a browser.
- The seam builds a tree once. It does not patch an existing tree.
