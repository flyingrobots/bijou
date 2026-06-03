---
title: "DX-039 - BlockLab Product Parity"
legend: DX
lane: design
issue: https://github.com/flyingrobots/bijou/issues/272
---

# DX-039 - BlockLab Product Parity

## Linked Issue

- https://github.com/flyingrobots/bijou/issues/272

## Sponsored Human

A component author wants BlockLab to feel like a real component development
product: searchable, controllable, inspectable, test-aware, and useful for
building the next Bijou Block without dropping into the full DOGFOOD docs app.

## Sponsored Agent

An agent needs one stable story surface that can produce docs, fixtures,
lower-mode captures, interaction playback, visual evidence, source links, and
machine-readable reports without scraping terminal frames.

## Hill

Evolve BlockLab from "story catalog plus preview" into a terminal-native
component and Block laboratory that borrows the strongest workflows from the
current Storybook product without cloning its browser UI.

## Source Scan

Official Storybook documentation reviewed on 2026-06-03:

- Args: https://storybook.js.org/docs/writing-stories/args
- Controls: https://storybook.js.org/docs/essentials/controls
- Toolbars and globals:
  https://storybook.js.org/docs/essentials/toolbars-and-globals
- Viewport: https://storybook.js.org/docs/essentials/viewport
- Decorators: https://storybook.js.org/docs/writing-stories/decorators
- Docs and Autodocs: https://storybook.js.org/docs/writing-docs/autodocs
- MDX and doc blocks: https://storybook.js.org/docs/writing-docs/mdx
- Interaction testing:
  https://storybook.js.org/docs/writing-tests/interaction-testing
- Accessibility testing:
  https://storybook.js.org/docs/writing-tests/accessibility-testing
- Visual testing: https://storybook.js.org/docs/writing-tests/visual-testing
- Addon types: https://storybook.js.org/docs/addons/addon-types
- Storybook composition:
  https://storybook.js.org/docs/sharing/storybook-composition

The product lesson is not "make a browser Storybook clone." The lesson is that
a mature story workbench separates story data, controls, global context,
preview, generated docs, addon panels, and test artifacts while keeping them
linked by stable story ids.

## Current Bijou Truth

BlockLab's current pre-rename substrate already has:

- `ComponentStory` records with `id`, `family`, `title`, `package`, docs,
  profile presets, variants, source, and tags
- canonical profile presets for `interactive`, `static`, `pipe`, and
  `accessible`
- `renderDogfoodStorybookIndex()` for deterministic text output
- `captureDogfoodStorybookMatrix()` for profile x variant capture
- a three-pane interactive TUI: catalog, preview, and testing
- AppFrame integration and a surface Block contract

The missing layer is product workflow.

## Gap Table

| Storybook-like product concept | Current BlockLab state | Needed BlockLab feature |
| :--- | :--- | :--- |
| args/controls | variants have static `initialState` | serializable story args plus control schema |
| globals/toolbars | profile keys select mode/width | global toolbar for mode, width, locale, direction, theme, density, reduced motion |
| decorators | stories manually construct context | story harness/decorator chain for frame, providers, mock IO, and data bindings |
| docs blocks/autodocs | `storyDocsMarkdown()` renders fixed sections | doc block model composing summary, source, controls, lowerings, captures, related stories |
| addon panels | testing pane only | addon-like panels for actions, a11y, visual diffs, performance, bindings, events |
| interaction testing | smoke scripts live elsewhere | story-local play steps and playback reports |
| accessibility testing | lower-mode prose is documented | a11y fact panel and required accessible capture assertions |
| visual testing | matrix captures text frames | named visual artifacts, diffs, and update workflow |
| viewport | profile width presets | viewport presets plus arbitrary terminal size profiles |
| composition | one DOGFOOD story catalog | composed story catalogs from packages, examples, plugins, and MCP exports |

## TUI Mockup

Wide terminal with product-grade panels:

```text
Bijou BlockLab                                      story: notification-system
+ catalog -------------------++ preview ---------------------------++ controls ----------------+
| Search: notification        || + Live stack --------------------+ || Args                     |
|                             || | release dashboard              | || severity: success        |
| Feedback overlays           || | Canaries stable in eu-west     | || count: 2                 |
| > notification-system       || +-------------------------------+ || compact: off             |
|   toast                     ||                                   ||                           |
|   modal                     || Docs | Source | Actions | A11y      || Globals                  |
|                             || Use when                          || mode: interactive        |
| Blocks                      || - status must stay observable     || locale: en               |
|   app-shell                 || - lower modes need durable text    || width: 60                |
|                             ||                                   || direction: ltr           |
+-----------------------------++-----------------------------------++---------------------------+
tabs: preview docs source actions a11y visual perf bindings
keys: / search | c controls | g globals | p play | v visual | a a11y | x export
```

Interaction playback panel:

```text
+ interactions ----------------------------------------------------------------+
| notification-system / live-stack                                             |
|                                                                              |
| 1. mount story                                           PASS  4ms            |
| 2. press n to add notification                          PASS  2ms            |
| 3. assert stack announces newest item                    PASS  1ms            |
| 4. switch to accessible profile                          PASS  1ms            |
|                                                                              |
| artifact: artifacts/blocklab/notification-system/live-stack/playback.txt      |
+------------------------------------------------------------------------------+
```

Visual artifact panel:

```text
+ visual ----------------------------------------------------------------------+
| profile      variant          baseline       current        result            |
| interactive  live-stack       60x18          60x18          unchanged         |
| static       live-stack       60x18          60x18          changed +2 lines  |
| pipe         framed-routing   52x18          52x18          unchanged         |
| accessible   history-review   52x18          52x18          unchanged         |
+------------------------------------------------------------------------------+
```

## Lower Modes

Pipe mode should expose stable machine-readable sections:

```text
blocklab story notification-system
variant=live-stack
profile=interactive
globals.mode=interactive
globals.locale=en
globals.width=60
args.severity=success
args.count=2

[preview]
release dashboard
Canaries stable in eu-west

[tests]
interaction=pass
a11y=pass
visual=changed +2 lines
```

Accessible mode should prioritize the selected story and active findings:

```text
BlockLab story notification-system. Variant Live stack.
Controls: severity success, count two, compact off.
Globals: interactive mode, English locale, left to right, sixty columns.
Accessibility report passed. Visual report changed by two lines in static mode.
```

## Protocol Sketch

`ComponentStory` can grow without breaking existing records by adding optional
fields:

```ts
interface BlockLabControl {
  readonly id: string;
  readonly label: string;
  readonly kind: 'boolean' | 'number' | 'text' | 'select' | 'color' | 'json';
  readonly defaultValue: unknown;
  readonly options?: readonly unknown[];
}

interface BlockLabGlobals {
  readonly mode?: OutputMode;
  readonly width?: number;
  readonly locale?: string;
  readonly direction?: 'ltr' | 'rtl';
  readonly theme?: string;
  readonly density?: string;
  readonly reducedMotion?: boolean;
}

interface BlockLabPanelReport {
  readonly panelId: string;
  readonly status: 'pass' | 'warn' | 'fail' | 'info';
  readonly facts: readonly ExplanationFact[];
  readonly output: string;
}
```

The first implementation should keep these fields optional and derive defaults
from the current profile presets.

## Feature Slices

### 1. Args/Controls

Add serializable controls to stories and a control pane in BlockLab.

Proof:

- controls render in TUI and lower modes
- control changes feed story render input deterministically
- CLI output includes selected args

### 2. Globals/Toolbars

Add global context for mode, width, locale, direction, theme, density, and
reduced motion.

Proof:

- global state affects preview context
- lower modes report globals
- locale/direction changes route through DOGFOOD localization ports

### 3. Decorators/Harnesses

Add a story harness chain for common setup: AppFrame, providers, mock IO,
binding snapshots, theme, and viewport.

Proof:

- harnesses compose without mutating base context
- a story can declare provider data without bespoke preview code

### 4. Docs Blocks

Replace fixed markdown assembly with docs block composition.

Proof:

- docs view can show source, controls, lowerings, story matrix, and related
  stories as separate inspectable blocks
- pipe mode can emit those blocks in deterministic order

### 5. Addon-Like Panels

Introduce panel slots for actions/events, accessibility facts, visual diffs,
performance facts, binding state, and source.

Proof:

- each panel has a stable id and lower-mode report
- disabled panels do not affect preview rendering

### 6. Interaction Playback

Let stories declare deterministic play steps that can run in BlockLab, CI, and
text-first output.

Proof:

- RED/GREEN tests for one story-local playback
- playback report includes steps, status, elapsed time, and artifacts

### 7. Composition

Allow BlockLab to import multiple story catalogs.

Proof:

- composed catalogs preserve package/source facts
- duplicate story ids fail loudly
- CLI can filter by package, family, tag, and source

## Accessibility / Assistive Posture

BlockLab parity must improve lower-mode truth, not just add visual panels.
Every product feature needs accessible and pipe output:

- controls list active values
- globals list current context
- panels list status and findings
- interactions list steps and outcomes
- visual reports describe line/cell differences
- docs blocks preserve heading order

## Localization / Directionality Posture

Controls and globals are visible UI. Labels, panel names, and status text must
go through DOGFOOD localization when they appear in DOGFOOD-owned surfaces.
Story ids, arg ids, and artifact paths remain machine tokens.

Directionality belongs in globals. RTL preview should be a first-class context
state, not a separate story variant unless the variant is semantically
different.

## Agent Inspectability / Explainability Posture

The text-first command should eventually emit:

- `blocklab index`
- `blocklab story <id>`
- `blocklab controls <id>`
- `blocklab test <id>`
- `blocklab artifacts <id>`

Each command should produce stable sections that agents can parse without
screen scraping. JSON output can be added later, but plain text remains the
first evidence surface because it is easier to review in PRs.

## Tests To Write First

- Protocol tests for optional controls and globals.
- Workbench model tests proving controls, globals, panels, and docs blocks are
  discoverable without rendering.
- TUI tests proving controls and globals change preview output.
- Lower-mode tests proving pipe and accessible output include args/controls and
  panel statuses.
- Interaction playback tests using fake clocks and deterministic input.
- Visual artifact tests using fixed-size terminal captures.

## Non-Goals

- No browser Storybook runtime.
- No direct addon API compatibility promise.
- No screenshots-only acceptance criteria.
- No story catalog fork separate from DOGFOOD story truth.
- No hidden global registry.

## Retrospective Target

BlockLab is product-grade when a maintainer can open one terminal workbench,
adjust story inputs, switch global context, read generated docs, run playback,
inspect a11y/visual/performance findings, and export deterministic evidence for
CI or agents.
