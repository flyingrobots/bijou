# Test plan: browser renderer seam for `ui-scene-ir/1`

This ledger lists each requirement of the
[browser renderer seam](./README.md), the test that holds it, and its status.
Every test is in `packages/bijou/src/core/`, in the file named in the
requirement's group heading. The oracle for each case is the assertion in the
named test.

## Golden: `ui-scene-browser.part01.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USB-01 | The debugger fixture lowers to one exact markup string. | `lowers the debugger fixture to exact browser markup` | Implemented |
| USB-02 | Equal scenes give equal lowerings and hashes. | `lowers the same scene to the same output every time` | Implemented |
| USB-03 | The element tree matches the markup: tags, order, ids, text. | `exposes the element tree that the markup serializes` | Implemented |
| USB-04 | The terminal renderer gives the same rows and source map for the fixture. | `leaves terminal lowering of the same fixture unchanged` | Implemented |

The suites in `ui-scene-ir.part01.test.ts` to `ui-scene-ir.part07.test.ts`
also hold USB-04. This change does not edit them.

## Facts only: `ui-scene-browser.part02.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USB-05 | Output node ids, action ids, binding ids, and text all come from the scene. | `emits only node ids, action ids and text the scene declares` | Implemented |
| USB-06 | A binding is named and never resolved. | `names a binding without resolving it into state` | Implemented |
| USB-07 | Output changes only where a scene fact changes. | `changes output only when a scene fact changes` | Implemented |
| USB-08 | The lowering does not change its input. | `reads a frozen scene without changing it` | Implemented |
| USB-09 | An action that targets a node is listed on that node. | `lists an action that targets a node the node does not list` | Implemented |
| USB-10 | Colors come only from `tokenColors`. | `resolves token colors only from the supplied table` | Implemented |
| USB-11 | The inspection modes replace text with ids, keys, or tokens. | `lowers the inspection modes the terminal renderer has` | Implemented |

## Refusals and edges: `ui-scene-browser.part03.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USB-12 | An invalid scene is refused. | `refuses an invalid scene before lowering it` | Implemented |
| USB-13 | A scene without a `geordi-browser` target profile is refused. | `refuses a scene without a geordi-browser target profile` | Implemented |
| USB-14 | An unsupported target requirement is refused. | `refuses a target requirement it does not support` | Implemented |
| USB-15 | A node kind other than `group` or `text` is refused. | `refuses a node kind it cannot lower` | Implemented |
| USB-16 | A node placed twice, or a cycle, is refused. | `refuses a node that the tree places twice` | Implemented |
| USB-17 | A node the root does not reach is refused. | `refuses a node that the root does not reach` | Implemented |
| USB-18 | A token color that is not a hex color is refused. | `refuses a token color that is not a hex color` | Implemented |
| USB-19 | An id with whitespace is refused in a space-separated attribute. | `refuses an action id that a token list cannot carry` | Implemented |
| USB-20 | A layout number that is not finite is refused. | `refuses a layout number that is not finite` | Implemented |
| USB-27 | A fractional layout number is kept as stated. | `keeps a fractional layout number as the scene states it` | Implemented |
| USB-21 | Attribute values are escaped, and a scene with one node is well formed. | `escapes attribute values and keeps an empty scene well formed` | Implemented |

## Host document and receipt: `ui-scene-browser.part04.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USB-22 | A host document builds the fixture to the same markup. | `builds the fixture through a host document port` | Implemented |
| USB-23 | An element without text gets no text node. | `creates no text node for an element without text` | Implemented |
| USB-24 | The receipt records the browser output and the same scene facts as the terminal receipt. | `records the browser output in a ui-scene receipt` | Implemented |
| USB-25 | A receipt for a lowering of another scene is refused. | `refuses a receipt for a lowering of another scene` | Implemented |
| USB-26 | The endpoint hash follows the target profile. | `changes the endpoint hash when the target profile changes` | Implemented |

## Node state: `ui-scene-checked.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| USB-27 | A checked and an unchecked switch lower to `data-bijou-checked`. | `lowers a checked and an unchecked switch to data-bijou-checked` | Implemented |
| USB-28 | A node without the state lowers no attribute and keeps its markup. | `lowers nothing for a switch without the state, and keeps its exact markup` | Implemented |
| USB-29 | The state on a non-switch node is lowered as a fact only. | `lowers the declared state of a node that is not a switch as a fact only` | Implemented |
| USB-30 | A scene without state keeps its canonical bytes and hash; declaring it changes the hash. | `keeps the canonical bytes and hash of a scene that declares no state`; `hashes a scene that declares the state differently from one that does not` | Implemented |
| USB-31 | A non-boolean `state.checked` is an `invalid-node-state` issue and the seam refuses the scene. | `validates that checked is a boolean` | Implemented |

## Not covered

- No test loads the markup in a browser engine. The sealed runner has none.
- Fuzz and stress cases: not applicable, as the issue records.
