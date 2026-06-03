---
title: "DX-038 - BlockLab Rename And Migration"
legend: DX
lane: design
issue: https://github.com/flyingrobots/bijou/issues/271
---

# DX-038 - BlockLab Rename And Migration

## Linked Issue

- https://github.com/flyingrobots/bijou/issues/271

## Sponsored Human

A Bijou maintainer wants the story and component workbench to have a
project-owned name that does not imply affiliation with the browser Storybook
product, while keeping the existing workflow understandable for users who
already know `npm run storybook`.

## Sponsored Agent

An agent needs stable names for scripts, Blocks, command intents, surface ids,
and docs links. It should not have to infer whether "storybook" means Bijou's
terminal workbench, the external product, or a generic story-driven workflow.

## Hill

Rename the current Storybook-labeled workstation to **BlockLab** across human
visible surfaces and future-facing contracts, while preserving a short
compatibility path for existing commands.

This is product hygiene, not a legal conclusion. The current name creates
avoidable ambiguity because Storybook is an established external product. Bijou
can keep story-driven component development while naming its own terminal-native
surface differently.

## Current Truth

The current repo exposes a story-driven workstation through:

- `npm run storybook`
- `npm run storybook:index`
- `npm run dogfood:storybook`
- `examples/docs/storybook.ts`
- `examples/docs/storybook-app.ts`
- `examples/docs/storybook-workstation.ts`
- visible labels such as `Bijou Storybook`, `Storybook`, and
  `Storybook Workstation`
- DOGFOOD Block and registry names such as `StorybookWorkbenchBlock`
- docs that describe a "Storybook-style" workbench

The product shape is already useful: it has a story catalog, variants, profile
presets, structured docs fields, matrix capture, AppFrame integration, and a
text-first index. The naming layer is the weak part.

## Name Decision

Use **BlockLab** as the product name.

Proposed vocabulary:

| Current | Proposed |
| :--- | :--- |
| `Bijou Storybook` | `Bijou BlockLab` |
| `Storybook Workstation` | `BlockLab Workstation` |
| `StorybookWorkbenchBlock` | `BlockLabWorkbenchBlock` |
| `storybook.workbench` | `blocklab.workbench` |
| `storybook.selectStory` | `blocklab.selectStory` |
| `npm run storybook` | `npm run blocklab` |
| `npm run storybook:index` | `npm run blocklab:index` |

Compatibility aliases should remain for one migration window:

```bash
npm run storybook
npm run storybook:index
npm run dogfood:storybook
```

Those aliases should call the BlockLab entrypoints and may print a concise
deprecation note if the runtime can do so without polluting deterministic index
output.

## TUI Mockup

Wide terminal:

```text
Bijou BlockLab | notification-system | Live stack | Rich
+ catalog -------------------++ preview ---------------------------++ lab -----------------------+
| 72 stories                  || notification-system                || Selection                  |
| > notification-system       || + Live stack --------------------+ || story=notification-system  |
|   framed-shell              || | release dashboard              | || variant=live-stack        |
|   command-palette           || | Canaries stable in eu-west     | || profile=interactive       |
|   table-responsive          || +-------------------------------+ ||                              |
|                             || Docs                              || Required modes             |
| Families                    || Use when                          || interactive: ready         |
| Feedback overlays           || - surface owns transient state     || static: ready              |
| Navigation                  || - lower modes preserve message     || pipe: ready                |
| Blocks                      ||                                   || accessible: ready          |
+-----------------------------++-----------------------------------++-----------------------------+
q quit | / search | g globals | c controls | a actions | t tests | ,/. variant | 1-4 profile
```

Narrow terminal:

```text
Bijou BlockLab
notification-system

+ Live stack --------------------+
| release dashboard              |
| Canaries stable in eu-west     |
+-------------------------------+

Profile: Rich / interactive / 60 cols
Variant: live-stack
Modes: interactive static pipe accessible

Tabs: preview docs controls tests actions
```

## Lower Modes

Pipe mode should remain deterministic and artifact-friendly:

```text
blocklab index
stories=72
families=31
variants=144
requiredModes=interactive,static,pipe,accessible

family Feedback overlays and history
- notification-system | package=bijou-tui | variants=live-stack,history-review,framed-routing
```

Accessible mode should describe purpose and state instead of chrome:

```text
BlockLab workbench. Story notification-system. Variant Live stack.
Profile Rich. Required modes are all ready. Source examples/notifications/main.ts.
Preview summary: release dashboard, canaries stable in eu-west.
```

## Accessibility / Assistive Posture

The rename must not make the workbench more visual-only. Every renamed surface
keeps existing lower-mode facts:

- story id
- story title
- package
- source path
- selected variant
- selected profile
- required mode coverage
- capture matrix status

Future `BlockLab` labels should be localizable visible text. Machine tokens such
as command ids and event discriminants can use `blocklab.*` but should not be
translated.

## Localization / Directionality Posture

New visible strings must enter `examples/docs/i18n/source/dogfood-strings.csv`
with `en`, `fr`, `es`, and `de` rows. The rename should update generated
catalog files in the same PR, and `npm run dogfood:i18n:complete` should be run
against the branch.

Directionality does not change for this rename. The UI must continue to route
localized copy through DOGFOOD's localization port rather than hard-coded view
helpers.

## Agent Inspectability / Explainability Posture

Agents should be able to tell that `BlockLab` is the canonical surface without
scraping UI strings. The rename should update:

- Block metadata names and tags
- surface inventory ids and descriptions
- command intents
- story matrix report titles
- deterministic index title
- docs references

The compatibility aliases should be treated as command-level affordances, not
as canonical product names.

## Linked Invariants

- GitHub Issues are the live tracker; this design is linked to #271.
- DOGFOOD localization completeness gates protect new visible strings.
- Blocks own product semantics; components remain leaf rendering vocabulary.
- Text-first outputs stay deterministic for CI, agents, and fixtures.

## Migration Plan

1. Introduce BlockLab docs language and visible product labels.
2. Add `blocklab` and `blocklab:index` scripts.
3. Keep `storybook`, `storybook:index`, and `dogfood:storybook` as compatibility
   aliases for one migration window.
4. Rename user-visible AppFrame page title and settings label.
5. Rename DOGFOOD Block contracts and registry entries from
   `StorybookWorkbenchBlock` to `BlockLabWorkbenchBlock`.
6. Rename command intents and surface ids from `storybook.*` to `blocklab.*`.
7. Update localization rows and generated catalogs.
8. Update docs, tests, and teardown command tables.

## Tests To Write First

- A focused rename test that expects the default title to be `Bijou BlockLab`.
- A framed AppFrame test that expects the page title `BlockLab`.
- A DOGFOOD settings test that expects `BlockLab Workstation`.
- A Block metadata test that expects `BlockLabWorkbenchBlock`.
- A script-registration test proving `blocklab` and `blocklab:index` exist and
  legacy scripts still resolve.
- An i18n completeness run proving every changed visible string has supported
  locale rows.

## Non-Goals

- No direct Storybook compatibility layer.
- No browser runtime.
- No package rename outside the workbench surface.
- No claim about trademark law.
- No removal of compatibility scripts in the first rename PR.

## Retrospective Target

The rename is successful when humans see `BlockLab`, agents see `blocklab.*`
contracts, and legacy `storybook` commands still work long enough for users to
move without friction.
