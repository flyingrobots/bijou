# DL-014 Theme Inspector And Lab

## Decision Summary

Bijou should make theme facts inspectable inside DOGFOOD before the broader
mode-aware runtime migration is complete.

This slice adds two bounded surfaces:

- an `F10` Theme Inspector drawer in DOGFOOD
- a `Themes` / Theme Lab docs page with default palettes, shell-gallery facts,
  token swatches, and safe-pair diagnostics

The first implementation inspects theme tokens only. It does not guess
element-level token ownership from final RGB values.

## Linked Work

- Parent goalpost: [#308](https://github.com/flyingrobots/bijou/issues/308)
- User story: [#311](https://github.com/flyingrobots/bijou/issues/311)
- Related Theme Lab idea: [#315](https://github.com/flyingrobots/bijou/issues/315)
- Safe-pair contract: [#314](https://github.com/flyingrobots/bijou/issues/314)

## Sponsored Perspectives

### Human Perspective

A designer-engineer wants to inspect the active theme's token palette from
inside a running Bijou TUI so that contrast, token naming, and reuse mistakes
can be debugged without leaving the app.

### Agent Perspective

An implementation agent wants a deterministic DOGFOOD surface and scripted
assertions for theme facts so future theme work can be reviewed without relying
only on subjective screenshots.

## Current Truth

Bijou has a typed `Theme` contract with `semantic`, `surface`, `border`, `ui`,
`status`, and `gradient` families. DL-013 added a mode-aware token-theme builder,
and DL-015 added safe-pair contrast contracts. DOGFOOD had explicit dark/light
themes, but those facts were visible only through settings and tests.

The legacy runtime `Theme` object is still single-mode. This design works inside
that limitation by inspecting concrete runtime themes and documenting the mode
migration separately in #313.

## Problem

Theme work is hard to evaluate when token choices are buried in code:

- colors can look acceptable in one screen but fail in another surface
- token names and token usage are not visible to the person running DOGFOOD
- safe-pair diagnostics are test-only facts
- dark/light design decisions are not presented as a product surface

## Scope

- Add first-party `bijou-dark` and `bijou-light` presets.
- Retokenize DOGFOOD dark/light shell themes to consume those presets.
- Add a `Themes` page to DOGFOOD.
- Add an `F10` Theme Inspector drawer to the DOGFOOD docs route.
- Render token swatches grouped by family.
- Show deterministic safe-pair pass counts.
- Add scripted tests for presets, DogFood theme inheritance, F10 behavior, and
  the Theme Lab page.

## Non-Goals

- Do not implement full runtime theme/mode separation in this slice.
- Do not make `F10` a global app-frame feature for every consumer app yet.
- Do not implement element-level token overlays without renderer provenance.
- Do not guess token ownership from RGB equality.
- Do not block lower-mode rendering on rich color swatches.

## Product Shape

```text
-------------------- DOGFOOD docs shell --------------------+
| Guides  Components  Blocks  Packages  Philosophy  Themes  |
|                                                           |
| +-- themes --------+  +-- docs • Theme Lab --------------+ |
| | > Theme Lab      |  | theme posture                    | |
| |                  |  | shell gallery                    | |
| |                  |  | bijou-dark token swatches        | |
| |                  |  | bijou-light token swatches       | |
| +------------------+  +----------------------------------+ |
| ? Help • / Search • F2 Settings • F10 Theme Inspector     |
+-----------------------------------------------------------+
```

The quick inspector is a right-side drawer:

```text
                         +-- Theme Inspector --------------+
                         | Active: DOGFOOD Dark            |
                         | Theme:  dogfood-dark            |
                         | 32/32 safe pairs pass           |
                         |                                  |
                         | SEMANTIC                        |
                         | [swatch] semantic.primary       |
                         | [swatch] semantic.muted         |
                         | SURFACE                         |
                         | [swatch] surface.primary        |
                         | ...                             |
                         | F10/Esc close • ↑/↓ scroll      |
                         +----------------------------------+
```

## Lower Modes

The inspector and lab are still useful in lower modes because every swatch row
also prints the token path and token value text. Color improves scanning, but
the token name and diagnostics remain visible without color.

## Runtime And API Contract

- `BIJOU_DARK` and `BIJOU_LIGHT` are exported from `@flyingrobots/bijou`.
- The presets are registered in `PRESETS` as `bijou-dark` and `bijou-light`.
- DOGFOOD shell themes keep their current app-facing ids:
  - `dogfood-dark`
  - `dogfood-light`
- DOGFOOD clones the default preset values into those shell themes so mutating
  runtime RGB caches cannot accidentally alias future app-level overrides.
- `F10` toggles the DOGFOOD-only Theme Inspector drawer after the title screen.
- `Esc` closes the drawer.
- `↑`/`↓`, `j`/`k`, `d`/`u`, and `g`/`G` scroll the drawer without changing the
  page behind it.
- `q` still routes to the normal DOGFOOD quit confirmation and closes the
  drawer so the confirmation is visible.
- Other keys are bounded and do not drive the page behind the drawer.

## Accessibility And Localization

The Theme Lab and quick inspector use DOGFOOD catalog entries for all new
user-facing strings. New keys are present in every supported runtime locale:
English, German, Spanish, and French. Stable token paths such as
`semantic.primary` and `surface.overlay.bg` remain developer identifiers and
are not localized.

## Inspectability

The lab and drawer expose:

- active shell theme label
- runtime theme name
- grouped token paths
- token hex and foreground/background values
- gradient stop values
- color-reuse counts
- safe-pair pass counts

## Implementation Slices

1. Add `bijou-dark` and `bijou-light` presets and export them.
2. Retokenize DOGFOOD dark/light shell themes to consume those presets.
3. Add the DOGFOOD `Themes` page and token-swatch renderer.
4. Add the `F10` Theme Inspector drawer and scripted tests.
5. Keep `q` quit routing and drawer scrolling deterministic while the drawer is
   open.

## Tests To Write First

- Preset registry includes `bijou-dark` and `bijou-light`.
- DOGFOOD dark/light shell themes inherit the default preset token values.
- `F10` opens and closes the Theme Inspector drawer after entering docs.
- `q` opens the normal quit confirmation while the drawer is open.
- Scroll keys move the drawer viewport without closing it.
- The Theme Lab page renders first-party default names, shell-gallery facts,
  token swatches, and gradient rows.

## Validation

Run:

```sh
npx vitest run packages/bijou/src/core/theme/presets.test.ts scripts/docs-preview.test.ts --testNamePattern "presets|DogFood dark and light|Theme Inspector|Theme Lab"
npx vitest run scripts/docs-preview.test.ts
npm run typecheck:test
npm run lint
git diff --check
```

## Follow-On Debt

- Promote the inspector into an opt-in app-frame API once its command model is
  stable.
- Add theme/mode separation for runtime shell settings in #313.
- Add renderer provenance so element-level token overlays can be truthful.
- Move long-form Theme Lab Markdown into the DOGFOOD Markdown localization
  model when that frontmatter workflow is ready.
