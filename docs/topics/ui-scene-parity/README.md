# Terminal and browser parity witness for `ui-scene-ir/1`

This page is the reference for the parity witness in `@flyingrobots/bijou`.
The witness lowers one `ui-scene-ir/1` scene on the terminal target and on the
browser target, compares the two outputs, and reports every fact as equal, as
a named gap, or as a mismatch.

The cases that hold this behavior are listed in the
[test plan](./test-plan.md). The two renderers are described in the
[browser renderer seam reference](../ui-scene-browser/README.md).

## What the witness proves

Both targets read the same scene value. The witness needs no second protocol
and no input other than the scene and the lowering options.

The comparison reads only the two outputs:

- on the terminal side, the cells of the `Surface` and the cell source map;
- on the browser side, the element tree.

It does not read the scene again. A fact counts as equal only when both
outputs state the same value.

## Functions

| Function | Result |
| --- | --- |
| `witnessUiSceneParity(scene, options?)` | A `UiSceneParityWitness`. It lowers the scene on both targets with the same options, then compares the outputs. |
| `compareUiSceneLowerings(terminal, browser)` | A `UiSceneParityComparison` for a `lowerUiSceneToSurface()` result and a `lowerUiSceneToBrowser()` result. It throws when their scene hashes differ. |

The options are those of the two renderers: `lowerMode`, `tokenColors`, and
`supportedRequirements`.

## Result

A witness has `witnessVersion: 'ui-scene-parity/1'` and a `status`.

With `status: 'compared'` it holds `sceneHash`, `surfaceHash`, `markupHash`,
and `findings`. With `status: 'refused'` it holds `refusals`: one
`{ target, message }` entry for each target that refused the scene, the
terminal first. The witness compares nothing when a target refuses.

Each finding has a `nodeId`, a `fact`, a `status`, and the value each output
states, as `terminal` and `browser`. A value is absent when that output does
not carry the fact. Findings follow the browser tree order, and the facts of
one node follow the order of the tables below.

| Status | Meaning |
| --- | --- |
| `equal` | Both outputs state the same value. |
| `gap` | The outputs differ, and a stated rule of one target explains the difference. The finding names the rule in `gap`. |
| `mismatch` | The outputs differ and no stated rule explains it. This is a defect in a renderer or in the witness. |

A scene has parity, within the limits on this page, when its witness has
`status: 'compared'` and no finding has `status: 'mismatch'`.

## Facts that must be equal

The witness reports these facts for each text node that the terminal drew.

| Fact | Terminal output | Browser output |
| --- | --- | --- |
| `x`, `y` | The cell source map entry | `--bijou-x`, `--bijou-y` in `style` |
| `text` | The characters in the cells of the entry's span | The element text |
| `source` | `source` in the entry | `data-bijou-source` |
| `i18n-key` | `textKey` in the entry | `data-bijou-i18n-key` |
| `fg-token`, `bg-token` | `fgToken`, `bgToken` in the entry | `data-bijou-fg-token`, `data-bijou-bg-token` |
| `fg-color`, `bg-color` | `fg`, `bg` of the cells in the span | `color`, `background-color` in `style` |
| `modifiers` | `modifiers` of the cells in the span | `data-bijou-modifiers` |

A fact that neither output states gives no finding. When the cells of a span
do not all agree, the terminal value is the distinct values joined by `|`.

## Named gaps

A gap is a difference the witness has checked against a rule. To check the
rules, it applies the terminal renderer's own text and position functions to
the browser facts and compares the result with what the terminal drew.

| Gap | Fact | Rule |
| --- | --- | --- |
| `group-not-drawn` | `node` | The terminal renderer draws only `text` nodes. A `group` node is an element in the browser output and nothing in the terminal output. |
| `text-not-visible` | `node` | The terminal renderer records no span for a text node that is empty or lies outside the target. The browser output keeps the element. |
| `text-clipped` | `text` | The terminal renderer keeps only the part of the text inside the target columns. The browser output keeps all of it. |
| `text-sanitized` | `text` | The terminal renderer removes control sequences and replaces tabs and line breaks. The browser output keeps the text and escapes it as markup. |
| `text-overdrawn` | `text` | The terminal renderer draws nodes in scene order onto one grid, so a later node replaces the cells of an earlier one. The browser output keeps both texts. The witness skips `fg-color`, `bg-color`, and `modifiers` for the earlier node. |
| `coordinate-normalized` | `x`, `y` | The terminal renderer uses 0 for a missing coordinate, drops the fraction of a number, and starts a span at column 0 when the text starts left of the target. The browser output states the number as the scene gives it, or states nothing. |
| `browser-only-fact` | `role`, `component`, `action`, `binding`, `border-token`, `checked`, `width`, `height` | The terminal output has no place for the fact. The browser output carries it as an attribute or a custom property. |

For a node that the terminal did not draw, the witness reports the `node`
finding and the `browser-only-fact` findings, and no other fact.

## Refusals that only one target makes

These scenes lower on one target and are refused by the other. The witness
records the refusal.

- The browser seam needs one tree that starts at `rootNodeId` and contains
  every node once. It refuses a node that the tree places twice, a cycle, and
  a node that the root does not reach. The terminal renderer ignores the tree
  and draws every `text` node by position.
- Each target needs its own target profile. A scene with only a
  `bijou-terminal` profile is refused by the browser seam, and a scene with
  only a `geordi-browser` profile is refused by the terminal renderer.
- The browser seam refuses a `tokenColors` entry that is not a hex color. The
  terminal renderer does not check the entry.

Both targets refuse an invalid scene with the same message, and both refuse a
node kind other than `group` or `text`.

## What the witness does not claim

- **No pixel or layout-engine parity.** The sealed test runner has no browser
  engine. The witness compares the element tree with the terminal cells. No
  test loads the markup in a browser.
- **No shared units.** `--bijou-x` and `--bijou-y` are unitless numbers that
  equal the terminal column and row. The host style sheet decides what they
  mean on screen. The two target profiles state sizes in different units, and
  the witness does not compare them.
- **No comparable output hashes.** `surfaceHash` and `markupHash` hash
  different outputs. Only `sceneHash` is the same on both sides.
- **No accessibility parity.** The browser seam writes `node.role` to
  `data-bijou-role` and does not map it to ARIA. The terminal output does not
  carry the role.
- **No color-format parity.** The witness compares color strings exactly.
  The cases cover six-digit lowercase hex colors only.
- **No checked-state parity.** `node.state.checked` is a `browser-only-fact`
  gap. The terminal renderer draws no toggle state; the text of the node is
  its only state there.
- **No behavior parity.** Neither renderer runs an action or resolves a
  binding. The browser output names both on the element. The terminal output
  names neither; the `ui-scene-receipt/1` lists their ids for both targets.
- **No parity for other node kinds.** Both renderers lower only `group` and
  `text` nodes.

## Example

This call witnesses the fixture in
`packages/bijou/src/core/ui-scene-browser.test-support.ts`:

```ts
import { witnessUiSceneParity } from '@flyingrobots/bijou';

const witness = witnessUiSceneParity(debuggerScene);
```

The findings below are the ones for the `debugger.tick` node. They are
abridged from the full list, which is `debuggerSceneFindings` in
`packages/bijou/src/core/ui-scene-parity.test-support.ts`:

```json
[
  { "nodeId": "debugger.tick", "fact": "x", "status": "equal", "terminal": "0", "browser": "0" },
  { "nodeId": "debugger.tick", "fact": "y", "status": "equal", "terminal": "1", "browser": "1" },
  { "nodeId": "debugger.tick", "fact": "text", "status": "equal", "terminal": "Tick 12 <paused> & \"held\"", "browser": "Tick 12 <paused> & \"held\"" },
  { "nodeId": "debugger.tick", "fact": "source", "status": "equal", "terminal": "fixture.debugger:3:1", "browser": "fixture.debugger:3:1" },
  { "nodeId": "debugger.tick", "fact": "binding", "status": "gap", "gap": "browser-only-fact", "browser": "debugger.tick.value" }
]
```
