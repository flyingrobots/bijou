---
title: DL-016 Mode-aware runtime theme adapter
legend: DL
lane: bad-code
priority: medium
github_issue: 313
keywords:
  - design-language
  - themes
  - modes
  - app-frame
  - dogfood
---

# DL-016 Mode-aware runtime theme adapter

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

Bijou should distinguish theme identity from theme mode at the app-frame
boundary.

The existing runtime `Theme` object is a concrete palette. That stays true for
compatibility. The new shape is an adapter around that concrete palette:

```text
FrameShellTheme
  id: "dogfood"
  modes:
    dark  -> Theme("dogfood-dark")
    light -> Theme("dogfood-light")
```

Single-mode shell themes remain valid:

```text
FrameShellTheme
  id: "default"
  theme: Theme("default")
```

The frame resolves both forms into concrete choices before rendering. A choice
has a stable id, a family id, an optional mode id, and a resolved concrete
theme. This gives settings, inspectors, and DOGFOOD one product identity while
keeping the legacy render path stable.

## Linked Work

- User story: [#313](https://github.com/flyingrobots/bijou/issues/313)
- Token builder foundation: [#308](https://github.com/flyingrobots/bijou/issues/308)
- Theme Inspector follow-up: [#311](https://github.com/flyingrobots/bijou/issues/311)
- Theme Lab follow-up: [#315](https://github.com/flyingrobots/bijou/issues/315)

## Sponsored Perspectives

### Human Perspective

A designer-engineer wants DOGFOOD to present one DogFood theme with dark and
light modes so that switching color scheme does not look like switching product
identity.

### Agent Perspective

An implementation agent wants app-frame theme facts to carry both family and
mode identity so tests, inspectors, and future provenance tools can prove which
semantic theme and concrete mode produced the current cells.

## Hill

An app can declare a mode-aware shell theme, switch between its dark and light
modes through the existing settings drawer, and observe the selected family and
mode without breaking consumers that still pass single concrete themes.

## Problem

DL-013 made theme authoring mode-aware: one theme owns dark and light token
values. The runtime still consumes one concrete `Theme` at a time. PR #310
therefore had to model DOGFOOD as two independent shell themes:

```text
dogfood-dark
dogfood-light
```

That representation works mechanically, but it teaches the wrong model:

- theme identity and mode identity are conflated
- settings rows mix product themes and color modes in one flat list
- Theme Inspector and Theme Lab cannot report a stable family id
- tests assert `dogfood-dark` and `dogfood-light` as peer themes instead of
  `dogfood` plus a selected mode

## Scope

This slice adds the first runtime adapter, not a full replacement for
`Theme`.

- Add optional mode entries to `FrameShellTheme`.
- Resolve shell theme specs into flattened runtime choices.
- Preserve old single-theme specs unchanged.
- Include selected mode facts in `FrameShellThemeChange`.
- Convert DOGFOOD to one `dogfood` shell theme with `dark` and `light` modes.
- Update Theme Inspector and Theme Lab facts to use family and mode labels.
- Add tests proving mode switching, compatibility, and context isolation.

## Non-Goals

- Do not replace the concrete `Theme` interface.
- Do not require every app to adopt mode-aware themes.
- Do not add terminal background-color detection here.
- Do not add element-level token provenance.
- Do not implement Theme Inspector mode preview/apply UX from #311 in this
  slice.

## Runtime Contract

`FrameShellTheme` accepts either a concrete `theme` or a non-empty `modes`
array.

```ts
const theme = {
  id: 'dogfood',
  label: 'DOGFOOD',
  modes: [
    { id: 'dark', label: 'Dark', theme: dogfoodDark },
    { id: 'light', label: 'Light', theme: dogfoodLight },
  ],
} satisfies FrameShellTheme;
```

A mode-aware entry resolves into choices:

```text
choice id: dogfood:dark
family id: dogfood
mode id: dark
label: DOGFOOD / Dark
theme: dogfood-dark
```

A legacy entry resolves into one choice:

```text
choice id: default
family id: default
mode id: undefined
label: Default
theme: default
```

The existing frame model can continue storing `activeShellThemeId` as the
choice id. Consumers that inspect `FrameShellThemeChange` get the richer facts:

```ts
{
  shellTheme,
  shellThemeId: 'dogfood',
  modeId: 'dark',
  modeLabel: 'Dark',
  ctx,
}
```

## Settings UX

The first implementation keeps one settings row:

```text
Shell theme  DOGFOOD / Dark
```

Activating the row cycles the resolved choices:

```text
DOGFOOD / Dark -> DOGFOOD / Light -> Cabinet of Curiosities -> ...
```

This is intentionally conservative. A later #311/#315 slice can split family
and mode into separate controls once the app-frame has enough option metadata
to render that well.

## Compatibility

Compatibility is a hard requirement:

- Existing `FrameShellTheme` entries with `theme` still compile.
- Existing apps that read `change.shellTheme` still receive the original shell
  theme family object.
- Existing app-frame tests for simple theme cycling keep passing.
- `cloneShellThemeContext()` still receives one concrete resolved theme.

## Tests

The slice is complete when tests prove:

1. Mode-aware shell themes flatten into stable choices.
2. Settings cycling applies a mode choice and reports family/mode facts.
3. Old single-mode shell themes still cycle and apply.
4. DOGFOOD publishes one `dogfood` family with `dark` and `light` modes.
5. Preview/resolution helpers can inspect a mode choice without mutating the
   ambient default context until the setting is applied.

## Acceptance Criteria

- [ ] `FrameShellTheme` supports either `theme` or `modes`.
- [ ] Runtime choice ids distinguish family and mode.
- [ ] `FrameShellThemeChange` includes optional mode facts.
- [ ] DOGFOOD presents one DogFood shell theme family with dark/light modes.
- [ ] Legacy single-mode themes remain supported.
- [ ] Tests cover mode switching and context isolation.

## Slice Plan

1. Add the design doc and tracker updates.
2. Add app-frame mode-aware shell theme types and choice resolution tests.
3. Update settings cycling and shell change notifications.
4. Convert DOGFOOD shell themes to one mode-aware family.
5. Update Theme Inspector, Theme Lab, docs tests, and changelog.
6. Run self-review and validation before opening the PR.
