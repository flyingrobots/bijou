# DL-012 Separate focus gutter chrome from scrollbar UI tokens

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Date
2026-05-16

## Sponsor human

A Bijou app author tuning a framed shell theme who needs focused pane chrome
to be themed separately from scrollbars and local accent affordances.

## Sponsor agent

An agent auditing theme usage in DOGFOOD and first-party frame components that
must explain why a pane gutter, scrollbar thumb, and local active item are not
all the same semantic token.

## Hill

Focused pane gutters use a dedicated built-in `ui.focusGutter` token, while
scrollbars stay on `ui.scrollThumb` / `ui.scrollTrack` and component-local
active emphasis stays on `semantic.accent`.

## Description

DOGFOOD exposed a vocabulary gap in the built-in theme contract. Focused pane
gutters are reusable shell chrome, but they were still effectively treated as
accent-colored geometry. Scrollbars already had named `ui.scrollThumb` and
`ui.scrollTrack` tokens, so focus chrome and scroll chrome could drift
together visually without any explicit semantic separation.

The fix belongs in the token system and first-party defaults, not in one-off
app palette tweaks.

## Decision

Add `ui.focusGutter` to the built-in UI token vocabulary.

The first-party defaults are:

- focused pane gutter: `ui.focusGutter`
- unfocused pane gutter: `semantic.muted`
- scrollbar thumb: `ui.scrollThumb`
- scrollbar track: `ui.scrollTrack`
- local active/focused affordance inside a component: `semantic.accent`

`focusedGutterToken` remains a per-pane escape hatch for deliberate shell
variants, but the stock focus-area and framed-app path should not require it
for ordinary focused pane chrome.

## Playback questions

1. Does `BaseUiKey` include `focusGutter`?
2. Do all built-in presets and shipped JSON themes define `ui.focusGutter`?
3. Does `focusArea()` use `ctx.ui('focusGutter')` for the default focused
   gutter instead of `semantic.accent`?
4. Do surface-rendered scrollbars use `ctx.ui('scrollThumb')` and
   `ctx.ui('scrollTrack')` by default?
5. Does DOGFOOD publish focus gutter color through its shell theme instead of
   only through pane-local ad hoc tokens?
6. Do theme authoring docs explain when to use `ui.focusGutter` versus
   `semantic.accent`?

## Accessibility / assistive reading posture

No new accessible output is added. The change improves semantic clarity in the
theme graph so future accessible inspectors can name focused shell chrome as
shell chrome rather than generic accent usage.

## Localization / directionality posture

No localized text or directionality behavior changes. The token name is
logical and does not imply left/right placement.

## Agent inspectability / explainability posture

Theme inspectors and future Storybook-like tooling can now report
`ui.focusGutter` as a first-class shell token. That makes pane focus chrome
auditable without reverse-engineering whether a component happened to borrow
`semantic.accent`.

## Implementation outline

1. Add `focusGutter` to the built-in `BaseUiKey` vocabulary.
2. Add the token to presets, DTCG conversion, shipped JSON themes, and test
   fixtures.
3. Update focus-area defaults for focused gutters and scrollbar cells.
4. Move DOGFOOD shell themes onto `ui.focusGutter` for focused pane chrome.
5. Update theme authoring and token-vocabulary docs.

## Tests / validation

- `packages/bijou/src/core/theme/tokens.test.ts`
- `packages/bijou/src/core/theme/dtcg.test.ts`
- `packages/bijou/src/core/theme/dtcg.fuzz.test.ts`
- `packages/bijou/src/core/theme/presets.test.ts`
- `packages/bijou-tui/src/focus-area.test.ts`
- `packages/bijou-node/src/index.test.ts`

## Retrospective

Closed by adding `ui.focusGutter` to the built-in theme contract, updating
first-party focus-area defaults to consume shell UI tokens, and moving DOGFOOD
focused gutter styling into its shell theme vocabulary.
