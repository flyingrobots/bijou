---
title: DL-013 Design token and theme builder API
legend: DL
lane: cool-ideas
priority: medium
github_issue: 308
keywords:
  - design-language
  - themes
  - tokens
  - styles
  - builder-api
---

# DL-013 Design token and theme builder API

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

Tokens describe semantic color slots in a theme.

Themes own mode-specific token values.

Dark and light are the required first theme modes.

Styles consume resolved tokens at render time.

Styles do not register tokens, own theme values, or decide dark/light mode.

This design records the first official Bijou shape for a Lip Gloss-like builder
API without copying Lip Gloss' object model wholesale. Bijou should expose a
declarative style builder, but the theme graph must remain explicit because
Bijou already treats rendering, lowering, and inspectability as first-class
contracts.

The short relationship is:

```text
Theme
  contains modes
    contain token color values

Style
  contains layout and rendering rules
  may reference token ids
  resolves those references through one theme mode during render
```

## Sponsored Human

A Bijou app author wants to declare semantic colors once and reuse them across
dark and light modes so that components can stay visually coherent without
passing raw RGB values through every call site.

## Sponsored Agent

An agent auditing a Bijou app wants theme tokens and style use to be separable
and inspectable so that it can explain whether a rendered cell came from a
semantic theme slot, a raw color override, or a lower-mode fallback.

## Hill

A Bijou app author can define semantic color tokens once inside a theme,
provide required dark and light mode values, and apply those tokens through a
fluent style builder without allowing styles to become the owner of product
theme truth.

## Problem

Bijou has styleable surfaces, palettes, theme presets, and DOGFOOD chrome, but
the authoring API still makes authors think in implementation details too
early. A Lip Gloss-like builder can make styling feel natural, but a naive
builder can blur three different responsibilities:

- declaring which semantic colors exist
- assigning concrete colors to those semantic colors for dark and light modes
- applying resolved colors and layout rules to rendered content

The user-facing syntax should be fluent, but the model should stay strict.
Theme data is application and product identity. Style data is component
presentation. Token references are the bridge.

## Playback Questions

1. Can a theme define the same token id with separate dark and light values?
2. Does a style keep token references unresolved until render receives a theme
   and mode?
3. Can an inspector explain which theme, mode, token id, and lowering profile
   produced a rendered cell color?
4. Do unresolved tokens fail or fall back through an explicit policy instead of
   silently degrading?
5. Does the lower-mode path preserve meaning when truecolor is unavailable?

## Scope

This spec covers the first color-token API only:

- semantic color token ids
- dark and light theme modes
- theme-local token registration and validation
- token references inside styles
- raw color escape hatches inside styles
- deterministic lower-mode color resolution
- runtime inspectability facts for token resolution

## Non-Goals

This slice does not design every future design-token category.

- No spacing tokens yet.
- No typography tokens yet.
- No motion tokens yet.
- No border-shape tokens yet.
- No global mutable token registry.
- No runtime terminal background-color query requirement.
- No implementation of the builder API in this planning slice.

Those can become follow-on issues once the color-token and theme-mode contract
is landed.

## Core Vocabulary

### Token

A token is a semantic color slot inside a theme. It has a stable id such as
`color.status.danger.bg`, but it does not carry a single universal color by
itself. Its value comes from a theme mode.

Good token ids name intent, not pigment:

```text
color.surface.canvas.bg
color.surface.canvas.fg
color.status.danger.bg
color.status.danger.fg
color.chrome.focusGutter
color.chrome.scrollThumb
color.brand.primary
```

Bad token ids encode mode or raw color:

```text
color.dark.red900
color.light.blueAccent
color.hex.ff0000
```

### Theme

A theme is an immutable named collection of modes. It is the owner of token
values. A theme can declare that the same token has different concrete colors
in dark and light modes.

### Mode

A mode is a named token-value map inside a theme. `dark` and `light` are the
required first modes because they cover the highest-value terminal theme split
without requiring terminal background probing in the first implementation.

Additional modes can be designed later, for example `highContrast`,
`deuteranopia`, or `print`.

### Style

A style is an immutable builder for presentation. It can hold foreground,
background, border, padding, margin, width, wrapping, alignment, and other
rendering rules. When a style uses a token, it stores a token reference rather
than a concrete color.

The concrete color is resolved only when rendering receives a theme and mode.

## Proposed API

The primary API should optimize for the common case: define a theme, define
styles that reference semantic tokens, then render with a selected mode.

```ts
import {
  defineTheme,
  style,
  tokenRef,
} from '@flyingrobots/bijou';

const theme = defineTheme()
  .id('bijou.default')
  .label('Bijou Default')
  .mode("dark", mode => mode
    .token('color.status.danger.bg')
    .color({ r: 144, g: 0, b: 0 })
    .token('color.status.danger.fg')
    .color({ r: 255, g: 230, b: 230 }))
  .mode("light", mode => mode
    .token('color.status.danger.bg')
    .color({ r: 255, g: 230, b: 230 })
    .token('color.status.danger.fg')
    .color({ r: 144, g: 0, b: 0 }))
  .build();

const warning = style()
  .padding(0, 1)
  .foreground(tokenRef("color.status.danger.fg"))
  .background(tokenRef("color.status.danger.bg"));

const surface = warning.render(surfaceText, { theme, mode: "dark" });
```

The exact authoring names can still move during implementation, but the
responsibility split should not.

## Token Builder Variant

The user-proposed token builder shape is useful, but it should be scoped to
theme modes rather than become a global registry:

```ts
const theme = defineTheme()
  .id('bijou.default')
  .mode('dark', mode => mode
    .token()
    .id('color.status.danger.bg')
    .color({ r: 144, g: 0, b: 0 })
    .register())
  .mode('light', mode => mode
    .token()
    .id('color.status.danger.bg')
    .color({ r: 255, g: 230, b: 230 })
    .register())
  .build();
```

The shorter `.token(id).color(value)` form should exist for dense theme files.
The longer `.token().id(...).color(...).register()` form is useful when an
author wants comments, metadata, or validation hooks attached to one token
entry.

## Why Tokens Are Theme-Scoped

Theme-scoped token registration prevents three failure modes:

1. A token definition cannot silently survive without mode values.
2. A style cannot accidentally become the source of product theme truth.
3. A future theme inspector can show all missing mode values from one theme
   object instead of chasing global state.

If Bijou later adds package-level token catalogs, those catalogs should declare
allowed ids and descriptions. They should still not own the concrete dark and
light mode colors for every consuming app.

## Relationship Diagram

```text
              +------------------+
              | Theme            |
              | id, label        |
              +--------+---------+
                       |
              owns mode maps
                       |
          +------------+------------+
          |                         |
+---------v---------+     +---------v---------+
| Mode: dark        |     | Mode: light       |
| token -> color    |     | token -> color    |
+---------+---------+     +---------+---------+
          |                         |
          +------------+------------+
                       |
                 resolves refs
                       |
              +--------v---------+
              | Style            |
              | fg: tokenRef(...)|
              | bg: tokenRef(...)|
              | layout rules     |
              +--------+---------+
                       |
                 render context
                       |
              +--------v---------+
              | Surface cells    |
              | concrete colors  |
              +------------------+
```

## Style Builder Surface

The style builder should feel familiar to authors who know fluent terminal
style APIs, while still returning Bijou surfaces and facts.

Candidate methods:

```ts
style()
  .foreground(tokenRef('color.text.primary'))
  .background(tokenRef('color.surface.canvas.bg'))
  .bold(true)
  .italic(true)
  .underline(true)
  .padding(1, 2)
  .margin(0, 1)
  .width(40)
  .height(8)
  .maxWidth(80)
  .align('center')
  .border('single')
  .borderForeground(tokenRef('color.chrome.border'))
  .render(surfaceText, { theme, mode: 'dark' });
```

The style builder can support raw colors as an escape hatch:

```ts
style().foreground({ r: 250, g: 250, b: 250 });
```

Raw colors should be visible in inspectability facts so an agent can
distinguish deliberate hard-coded color from semantic token use.

## Resolution Contract

Rendering a token-backed style requires:

- a theme
- a mode id
- a lowering profile
- an unresolved-token policy

The default unresolved-token policy should fail in development and use a
visible fallback in production-like rendering. The fallback must be
deterministic and inspectable.

```ts
type TokenResolutionFact = {
  tokenId: string;
  themeId: string;
  mode: string;
  source: 'theme' | 'fallback' | 'raw-color';
  requestedColor?: RgbColor;
  resolvedColor: LoweredColor;
  profile: 'truecolor' | 'ansi256' | 'ansi16' | 'mono' | 'plain';
};
```

## Lower Modes

Color lowering belongs to the resolver, not to each style call site.

The first resolver should support:

- `truecolor`: preserve RGB
- `ansi256`: nearest palette index
- `ansi16`: nearest named ANSI color
- `mono`: intensity and emphasis only
- `plain`: no color, style facts preserved

This keeps the style syntax stable even when output moves from rich terminal to
pipe, static snapshot, accessible text, or future frame capture.

## Inheritance And Composition

Bijou should support value-style copying and inheritance, but unset rules must
stay distinguishable from intentionally raw or token-backed rules.

Candidate API:

```ts
const base = style()
  .foreground(tokenRef('color.text.primary'))
  .background(tokenRef('color.surface.canvas.bg'));

const danger = style()
  .inherit(base)
  .background(tokenRef('color.status.danger.bg'))
  .foreground(tokenRef('color.status.danger.fg'));
```

Inheritance should copy only unset rules on the receiver, matching the useful
part of Lip Gloss while keeping the resolved-token facts intact.

## Agent Inspectability / Explainability Posture

Every rendered token-backed style should be able to expose:

- style id, when provided
- theme id
- mode id
- token ids used
- raw colors used
- fallback tokens used
- lowered output profile
- concrete cell color results

This is a Bijou-specific requirement. The goal is not only nice terminal
styling, but explainable rendering.

## Accessibility / Assistive Reading Posture

Token ids should be semantic enough that an accessible renderer can report
meaning even when color is stripped.

For example, `color.status.danger.bg` gives better assistive context than
`color.red.900`. The style resolver should preserve facts for accessible
surfaces even when the final text has no color escape sequences.

## Localization / Directionality Posture

No localized strings are introduced by this design. Public docs and DOGFOOD
examples introduced during implementation must follow the repository
localization policy and provide all supported DOGFOOD locales when new
localized copy is added. Token ids are logical semantic identifiers and should
not encode physical direction, locale, or translated prose.

## Linked Invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md): resolved cell
  colors and resolver facts are stronger evidence than design prose.
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md):
  color cannot be the only carrier of status, focus, or warning meaning.
- [Tests Are The Spec](../invariants/tests-are-the-spec.md): the builder API
  should land through focused runtime tests, not just examples.
- [Buffer Holds Facts](../invariants/buffer-holds-facts.md): rendered cells
  should preserve token-resolution facts for inspection and replay.
- [Docs Are The Demo](../invariants/docs-are-the-demo.md): DOGFOOD examples
  should exercise the same public builder API as consumers.

## Compatibility

The builder should be additive. Existing theme preset and surface APIs should
continue to work while the builder is introduced.

Migration can be staged:

1. Add token references and theme builder types.
2. Convert one DOGFOOD shell theme path to prove the model.
3. Add docs and examples.
4. Expand first-party components to accept `Style` values.
5. Deprecate ad hoc raw color plumbing only after call sites have a builder
   alternative.

## Acceptance Criteria

- `defineTheme()` creates immutable theme definitions with required dark and
  light mode maps.
- Theme builders reject duplicate token ids within one mode.
- Theme builders reject themes missing required dark or light mode values for
  declared tokens.
- `tokenRef(id)` is accepted by style color setters.
- `style()` produces immutable styles and does not mutate copied styles.
- `render(surfaceText, { theme, mode: "dark" })` resolves token-backed colors
  through the selected mode.
- The resolver emits inspectability facts for token, theme, mode, fallback, and
  lowering decisions.
- Lower modes prove that token-backed styles render in truecolor, ANSI, mono,
  and plain profiles.
- DOGFOOD includes one theme-builder example and one style-builder example
  once implementation lands.

## Implementation Outline

1. Token and theme type contracts with focused tests.
2. `defineTheme()` builder with dark/light validation.
3. `tokenRef()` and color-reference resolution.
4. `style()` builder for foreground, background, emphasis, padding, width, and
   render.
5. Lower-mode resolver facts and fallback behavior.
6. DOGFOOD docs, examples, and package exports.

## Implementation Progress

Slices 1 through 3 are the first runtime landing target for issue
[#308](https://github.com/flyingrobots/bijou/issues/308):

- `defineTheme()` creates immutable token-theme definitions with required
  `dark` and `light` mode maps.
- Theme-scoped token registration rejects duplicate token ids within one mode
  and rejects required modes that omit a declared token.
- `tokenRef()` and `resolveThemeColorRef()` preserve resolution facts for
  selected theme mode, token id, raw colors, and explicit fallback colors.

The remaining implementation work is the `style()` builder, lower-mode
resolution proof, and DOGFOOD/package example coverage.

## Tests To Write First

- Theme builder rejects missing `dark` or `light` modes.
- Theme builder rejects duplicate mode token ids.
- Style render resolves foreground and background token refs by selected mode.
- Copied styles stay immutable after chained modifications.
- Lower-mode rendering produces deterministic truecolor, ANSI, mono, and plain
  output.
- Inspectability facts identify theme id, mode id, token id, and fallback
  status.

## Roadmap Placement

This belongs in the Beyond lane as issue
[#308](https://github.com/flyingrobots/bijou/issues/308) until implementation
is scheduled into a versioned release. It should be grouped as the candidate
goalpost `Design Tokens And Theme Modes` because it crosses design language,
runtime rendering, DOGFOOD docs, and public package exports.

## Open Questions

- Should `Style.render()` accept strings only, surfaces only, or both?
- Should style ids be required for inspectability, or optional metadata?
- Should high-contrast mode land in the first implementation or immediately
  after dark/light?
- Should token catalogs exist as package-level declarations separate from
  app-owned theme values?

## Retrospective

This slice is intentionally documentation and roadmap only. The important
decision is the object model: tokens belong to themes, themes own modes, and
styles consume resolved tokens. Implementation should start with failing
runtime tests that prove that split instead of only matching fluent syntax.
