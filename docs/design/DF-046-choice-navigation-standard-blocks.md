---
title: DF-046 Choice and navigation standard Blocks
legend: DF
lane: design
priority: medium
keywords:
  - blocks
  - choice
  - component-audit
  - design-thinking
  - dogfood
  - navigation
---

# DF-046 Choice and navigation standard Blocks

## Framing

The first component-family six-pack moved grouping, prose, links, dividers, and
text entry into typed standard Blocks. This follow-on six-pack turns choice,
decision, peer navigation, progressive disclosure, and path progress audits
into reusable Block contracts with schema-bound input and lower-mode facts.

This cycle closes issues #232 through #237:

| Issue | Block | Family |
| :--- | :--- | :--- |
| [#232](https://github.com/flyingrobots/bijou/issues/232) | `SingleChoiceBlock` | input |
| [#233](https://github.com/flyingrobots/bijou/issues/233) | `MultipleChoiceBlock` | input |
| [#234](https://github.com/flyingrobots/bijou/issues/234) | `BinaryDecisionBlock` | input |
| [#235](https://github.com/flyingrobots/bijou/issues/235) | `PeerNavigationBlock` | navigation |
| [#236](https://github.com/flyingrobots/bijou/issues/236) | `ProgressiveDisclosureBlock` | disclosure |
| [#237](https://github.com/flyingrobots/bijou/issues/237) | `PathProgressBlock` | navigation |

The work follows a Design Thinking loop:

- observe DOGFOOD choice and navigation surfaces as product semantics, not
  visual widgets
- frame each family as a named Block contract with explicit state and facts
- prototype TUI and lower-mode shapes before treating implementation as landed
- prove catalog, schema, render, command, story, and lowering behavior in tests

## Sponsored Users

- TUI authors who need reusable semantics for choices, decisions, peer
  navigation, disclosure state, and path progress.
- DOGFOOD maintainers who need the Blocks preview page to show the next real
  component-family slice.
- Tooling authors who need to inspect selection, current-step, checked-state,
  and disclosure facts without scraping terminal chrome.
- Future declaration authors who need YAML or JSON IR targets over typed Block
  APIs rather than a second runtime.

## Hills

1. A builder can import all six Blocks and inspect metadata, data requirements,
   command intents, schema descriptions, and ready story ids from the public
   barrel.
2. A reader can compare interactive/static output with pipe/accessibility
   lowerings and recover option identity, selected state, current route,
   disclosure state, and current step.
3. A maintainer can run one DF-046 cycle test that proves the six-pack is
   catalogued, schema-bound, rendered, documented, and lowering-stable.

## Playback Questions

- Does each choice/navigation family have a named Block contract instead of a
  broad audit note?
- Are required and optional fields concrete enough for DOGFOOD previews and
  small enough for reuse?
- Do lower modes expose stable facts for block identity, family, variant, mode,
  selected value, and semantic values?
- Does the DOGFOOD Blocks page have sample slots for every new definition?
- Does this preserve future YAML/JSON IR as an adapter over typed APIs?

## Block Contracts

| Block | Required data | Optional data | Scale |
| :--- | :--- | :--- | :--- |
| `SingleChoiceBlock` | `label`, `options`, `selected` | `mode`, `validation` | section |
| `MultipleChoiceBlock` | `label`, `checked`, `unchecked` | `selected`, `validation` | section |
| `BinaryDecisionBlock` | `label`, `selected`, `consequence` | `confirmation`, `disabledReason` | section |
| `PeerNavigationBlock` | `previous`, `current`, `next` | `route`, `status` | section |
| `ProgressiveDisclosureBlock` | `label`, `state`, `hiddenCount` | `summary`, `details` | section |
| `PathProgressBlock` | `path`, `current`, `step`, `total` | `status` | section |

Each Block gets the same first-party command contract:

```text
<blockPrefix>.select
<blockPrefix>.copyFacts
<blockPrefix>.openStory
```

## TUI Mockups

Single choice:

```text
+-- SingleChoiceBlock -------------------------------+
| Label                                              |
|   Output mode                                      |
| Options                                            |
|   interactive; pipe; accessible                    |
| Selected                                           |
|   pipe                                             |
| Mode                                               |
|   radio                                            |
+----------------------------------------------------+
```

Multiple choice:

```text
+-- MultipleChoiceBlock -----------------------------+
| Label                                              |
|   Release proof                                    |
| Checked                                            |
|   lint; tests                                      |
| Unchecked                                          |
|   screenshots                                      |
| Validation                                         |
|   2 of 3 complete                                  |
+----------------------------------------------------+
```

Binary decision:

```text
+-- BinaryDecisionBlock -----------------------------+
| Label                                              |
|   Merge gate                                       |
| Selected                                           |
|   yes                                              |
| Consequence                                        |
|   admin merge                                      |
| Confirmation                                       |
|   CI green                                         |
+----------------------------------------------------+
```

Peer navigation:

```text
+-- PeerNavigationBlock -----------------------------+
| Previous                                           |
|   Architecture                                     |
| Current                                            |
|   Blocks                                           |
| Next                                               |
|   Method                                           |
| Route                                              |
|   docs/blocks                                      |
+----------------------------------------------------+
```

Progressive disclosure:

```text
+-- ProgressiveDisclosureBlock ----------------------+
| Label                                              |
|   Advanced options                                 |
| State                                              |
|   closed                                           |
| Hidden count                                       |
|   6                                                |
| Summary                                            |
|   6 options hidden                                 |
+----------------------------------------------------+
```

Path progress:

```text
+-- PathProgressBlock -------------------------------+
| Path                                               |
|   Setup; Blocks; Preview                           |
| Current                                            |
|   Blocks                                           |
| Step                                               |
|   2                                                |
| Total                                              |
|   3                                                |
+----------------------------------------------------+
```

## Lower Modes

Static mode keeps the same section structure as interactive mode and stays
render-only.

Pipe mode lowers every Block to compact records:

```text
SingleChoiceBlock
label: Output mode
options: interactive; pipe; accessible
selected: pipe
mode: radio
```

```text
PathProgressBlock
path: Setup; Blocks; Preview
current: Blocks
step: 2
total: 3
status: current
```

Accessible mode lowers every Block to label-first prose:

```text
SingleChoiceBlock
Label: Output mode
Options: interactive; pipe; accessible
Selected: pipe
Mode: radio
```

```text
PathProgressBlock
Path: Setup; Blocks; Preview
Current: Blocks
Step: 2
Total: 3
Status: current
```

Every lower mode carries inspectable facts:

```text
block = SingleChoiceBlock
block.rendered = true
block.family = input
block.variant = ready
block.mode = pipe
block.selected = pipe
semanticValue.label = Output mode
```

## Accessibility And Directionality

The first slice does not add bespoke focus handling. The Blocks expose labels
and section values so accessible output preserves choice state, current route,
hidden-count state, and current-step state when visual affordances are removed.
Text is stored as plain strings or string arrays, leaving locale and
bidirectional rendering concerns to callers and localization adapters.

## Agent Inspectability

Agents and tests should inspect metadata, data contracts, schema descriptions,
command intent ids, ready story ids, and lowering facts. They should not infer
selected state, checked state, or current step from visual markers.

## Declarative IR Note

The Bijou IR idea remains an adapter layer over this typed API. This cycle does
not introduce a new YAML or JSON runtime, but it gives future IR work concrete
targets:

```yaml
block: SingleChoiceBlock
package: "@flyingrobots/bijou"
story: single-choice.ready
data:
  label: Output mode
  options:
    - interactive
    - pipe
    - accessible
  selected: pipe
  mode: radio
commands:
  - singleChoice.select
  - singleChoice.copyFacts
  - singleChoice.openStory
facts:
  block.family: input
  block.variant: ready
  semanticValue.label: Output mode
```

## Tests

- `tests/cycles/DF-046/dogfood-choice-navigation-six-pack.test.ts` proves all
  six Blocks publish through the standard catalog and package manifest.
- The cycle test validates metadata, command intent shape, schema binding,
  accessor rejection, visual rendering, lower-mode rendering, semantic facts,
  and Method documentation.
- DX-031 catalog tests prove the public barrel, first-party manifest, story
  ids, and rendered lowering checks include the expanded standard block set.
- `scripts/dogfood-i18n-completeness.test.ts` proves that new DOGFOOD
  localization keys and changed source strings require current rows for every
  supported locale before pre-push or CI can pass.

## Closeout

The six-pack is landed when:

- `@flyingrobots/bijou` exports all six Block definitions, schema adapters, and
  schema-bound block definitions
- DOGFOOD Blocks preview has concrete sample slots for all six names
- DOGFOOD preview strings have current `en`, `fr`, `es`, and `de`
  translations, and the completeness policy is enforced by pre-push and CI
- `standardBlocks`, `standardBlockStories`, and
  `standardBlockPackageManifest` include the six names
- CHANGELOG, BEARING, and ROADMAP record the v7 component-family slice
- PR text closes #232, #233, #234, #235, #236, and #237
