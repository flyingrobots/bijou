# What's New in Bijou 7.1.0

Bijou 7.1.0 is a focused post-V7 minor release. It does not try to become the
full V8 Runtime Graph product. Instead, it makes the first portable UI proof
chain inspectable, adds a real DOGFOOD GraphQL block fixture, tightens theme
and terminal-rendering behavior, and gives release prep better executable
guardrails.

## Runtime Graph And Scene IR Proofs

The core package now exposes the first `ui-scene-ir/1` runtime contract for
portable Bijou UI proof. The seed includes deterministic scene hashing,
structural receipts, node/action/binding/token/i18n validation, visible-cell
source-map facts, terminal lowering receipts, and lower modes for inspecting
node, token, and localization state.

This is the first committed step toward a product-grade Runtime Graph lane: a
Bijou surface can be described semantically, lowered deterministically, and
verified without treating screenshots as the only evidence.

## GraphQL-Authored Blocks

Bijou now has a constrained GraphQL authoring path for block artifacts:

```text
GraphQL SDL
  -> bijou-block/1
    -> ui-scene-ir/1
      -> terminal Surface proof
      -> graphql-bijou-block-debug/1 facts
```

`compileGraphqlBijouBlock()` and `lowerBijouBlockToUiScene()` turn SDL into a
stable `bijou-block/1` artifact and a portable scene. Group directives,
grouped field membership, semantic source anchors, token refs, i18n fallback
facts, actions, bindings, lower modes, and debug summaries are all part of the
proof surface.

The release also checks in a real DOGFOOD NavigationListBlock GraphQL fixture,
so the proof path is no longer only synthetic.

## Theme Tokens, Modes, And Inspector Work

The design-token lane is more concrete:

- `defineTheme()` creates immutable dark/light theme definitions.
- `tokenRef()` and `resolveThemeColorRef()` preserve semantic color facts.
- `BIJOU_DARK` and `BIJOU_LIGHT` are first-party presets.
- `defineThemeSafePairs()` records reusable contrast pair matrices.
- DOGFOOD uses a high-contrast shell theme family with explicit dark and light
  modes.
- The Theme Lab page and `F10` Theme Inspector expose token swatches, color
  reuse diagnostics, and safe-pair diagnostics.

These pieces make theme behavior easier to inspect and harder to fake with
one-off color strings.

## Raster-To-Glyph And Title Surface Polish

The TUI package now includes deterministic raw-RGBA-to-`Surface` rendering with
ASCII, Braille, and quad modes. DOGFOOD uses that pipeline for release-title
art, the V7 Launch Wake title surface, and image-to-glyph side-app previews.

The side app opened by `npm run img` or `npm run image-viewer` can preview SVG,
PNG, and PPM/PNM files, pan and zoom the view, switch glyph modes, preserve
sampled colors, tune Braille contrast, and enable deterministic ordered
dithering.

## DOGFOOD And Terminal Fixes

Several release-review fixes landed in the same release window:

- terminal resize and display-resume repaint now invalidates the front buffer
  so blank cells repaint immediately after geometry changes
- DOGFOOD Blocks navigation lets Up move from the first Block Preview child
  back to the parent row
- ANSI foreground/background resets now honor scoped `39` and `49` resets
  without leaking colors into following labels
- the quit confirmation modal no longer duplicates its controls
- the DOGFOOD title perf HUD stays on the title screen and reports current
  frame timing

## Release Guardrails

The release process is stricter and more replayable:

- `npm run release:readiness -- --milestone v7.1.0` prints a milestone report
  and blocks incomplete release prep before running the full local gauntlet
- DOGFOOD i18n debt discovery now scans `examples/docs/**/*.ts` modules by
  default, with explicit tooling-only exclusions
- release evidence packets are now required for versioned releases
- the roadmap, bearing, and release runbook now describe the forward-looking
  V7.1/V8/V9 release posture

The practical result is a release that is easier to inspect: users get new
portable proof primitives and DOGFOOD fixture evidence, and maintainers get
better release gates before tags are cut.
