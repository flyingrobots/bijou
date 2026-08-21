---
title: DX-052 NO_COLOR Is Not a Capability
legend: DX
lane: release
priority: high
github_issue: 518
status: active
keywords:
  - no-color
  - output-mode
  - detection
  - theme
  - accessors
  - fallback
  - extend-theme
  - breaking-change
  - v8.0.0
---

<!-- markdownlint-disable MD025 -->

# DX-052 NO_COLOR Is Not a Capability

## Problem

Three defects found by an application (`muniment`) that had to work around all
three locally before it could ship a readable palette. Each one is a case of
bijou answering a question the caller did not ask.

### 1. `NO_COLOR` takes the whole TUI down, not just the colour

`detectOutputMode` (`packages/bijou/src/core/detect/tty.ts`) resolves in this
order:

```text
BIJOU_ACCESSIBLE=1    -> 'accessible'
NO_COLOR / TERM=dumb  -> 'pipe'
!stdout.isTTY         -> 'pipe'
CI                    -> 'static'
stdout.isTTY          -> 'interactive'
```

The second line conflates two unrelated requests. [no-color.org][nc] defines
`NO_COLOR` as a statement about **colour**: "when present, regardless of its
value, prevents the addition of ANSI color". It says nothing about cursor
addressing, alternate screens, or interactivity. bijou reads it as a statement
about **capability**, so a user who exports `NO_COLOR=1` in their shell profile
— a common, reasonable thing to do — does not get a monochrome TUI. They get no
TUI: `ctx.mode` becomes `'pipe'`, every component lowers to its plain
single-frame form, and `shouldUseShellQuitConfirm` starts returning
`'immediate'`.

Nothing is gained by the conflation, because **colour is already suppressed by a
separate path** — three of them, in fact, each reading `NO_COLOR` directly and
none consulting `mode`:

| Site | Line | Effect |
| :--- | :--- | :--- |
| `packages/bijou/src/factory.ts` | 54 | `noColor` on the resolved theme |
| `packages/bijou-node/src/node-context.ts` | 23 | `chalkStyle({ noColor, level: 0 })` |
| `packages/bijou/src/core/theme/resolve.ts` | 20 | `isNoColor()` |

So removing the line removes the interactivity damage and keeps every escape
sequence suppressed. The two concerns were never actually coupled in the
implementation; only in the detector.

`git-cas` (`bin/ui/context.js`) already ships a `detectCliTuiMode` override for
exactly this reason, with a comment saying so. When two first-party consumers
independently re-implement a detector, the detector is wrong.

[nc]: https://no-color.org

### 2. An unknown status key renders struck through

`createThemeAccessors` (`packages/bijou/src/core/theme/accessors.ts`):

```ts
status: (key) => {
  try { return tokenGraph.get(`status.${key}`, mode); }
  catch { return tokenGraph.get('status.muted', mode); }
},
```

`status.muted` carries `['dim', 'strikethrough']` in **every** shipped preset —
`bijou-dark`, `bijou-light`, `cyan-magenta`, `nord`, `catppuccin`,
`teal-orange-pink`. That is a defensible token: "muted" as in retired, done,
cancelled. It is the wrong thing to hand back for a key nobody defined.

`status(key)` takes `string`, not a key union, so the failure is silent and
total: a typo, or a key the app forgot to add to its theme, produces text with a
line through it. A reader sees "cancelled". The app said nothing of the kind.
The sibling accessor already does the right thing — `ui()` falls back to
`semantic.primary`, a plain token in another group — so the fix is to make
`status()` consistent with it and fall back to `semantic.muted`, which is `dim`
and nothing else in every preset.

Found in the field: an app declared a `paint.unreviewed()` helper, dropped the
matching status key from its theme as a duplicate, and shipped a painter that
resolved to the strikethrough fallback. No check caught it, because no view had
called it yet. `inkStatus()` in `resolve.ts` has the same fallback and the same
problem.

### 3. `extendTheme` cannot reach `border` or `semantic`

```ts
export declare function extendTheme<S, U, G>(base: Theme, extensions: {
  status?: ...; ui?: ...; gradient?: ...; surface?: ...;
}): Theme<...>
```

`Theme` has six token groups. `extendTheme` can extend four. There is no way to
override a border or semantic token through it, which matters because the
shipped themes alias heavily across groups: `bijou-dark` uses `#f2c45d` for
`status.warning`, `status.active`, `semantic.warning`, `semantic.accent`,
`ui.cursor`, `ui.focusGutter`, `ui.sectionHeader`, `ui.logo`,
`border.secondary` **and** `border.warning` — ten aliases of one amber.

An app that calls `extendTheme(BIJOU_DARK, { status })` therefore replaces its
statuses and silently keeps bijou's amber for every heading, cursor and border.
In the case that prompted this, the app's section headings landed ΔE **0.023**
from its own `warning` in OKLab — indistinguishable — and the only escape was to
abandon `extendTheme` and author all six groups by hand.

## Non-goals

- **Changing `status.muted` itself.** Its strikethrough is deliberate and used.
  Only the *fallback target* moves.
- **Re-fitting the shipped palettes.** The `#f2c45d` ten-way alias and
  `bijou-dark`'s error/success collapse under protanopia (ΔE 0.059) are real,
  are what motivated non-goal-adjacent issues, and are filed separately.
- **Adding OKLCH authoring or a CVD-aware palette audit to bijou.** Also filed
  separately; `doctorTheme` covers contrast and reuse but not perceptual
  separation under simulated colour-vision deficiency.
- **Typing `status(key)` to a key union.** It would catch defect 2 at compile
  time for typed callers, but it is a wider API change than this cycle wants and
  would not help JS consumers. Filed as follow-up.

## Playback questions

1. With `NO_COLOR=1` and a real TTY on both stdio, is `ctx.mode`
   `'interactive'`?
2. With `NO_COLOR=1`, is `theme.noColor` still `true` and does `styled()` still
   return unstyled text?
3. Does `TERM=dumb` still yield `'pipe'`? Does a non-TTY stdout? Does `CI`
   still yield `'static'`, and `BIJOU_ACCESSIBLE=1` still win outright?
4. Does `status('nonexistent')` return a token with no `strikethrough`?
5. Does `status('muted')` still return the real muted token, strikethrough
   intact?
6. Does `inkStatus('nonexistent')` agree with `status()` about the fallback?
7. Does `extendTheme(base, { border, semantic })` merge those groups, preserve
   unlisted keys within them, and leave the other four groups untouched?

## Decision

1. Delete the `NO_COLOR` branch from `detectOutputMode`. Update its docblock and
   the `OutputMode` doc comment, which both currently document the old order.
2. Point the `status()` accessor and `inkStatus()` fallbacks at
   `semantic.muted`.
3. Add optional `border` and `semantic` to `extendTheme`'s extension parameter.

## Breaking-change note

1 and 2 change observable behaviour that the current docblocks describe, so this
lands as part of **8.0.0** rather than a minor.

Two existing tests assert the behaviour being removed:

- `tty.test.ts` — `'returns pipe when NO_COLOR is set'` and `'NO_COLOR takes
  priority over CI'`.
- `accessors.test.ts` — `'status() falls back to muted for unknown keys'`.

They are not wrong about what the code did; they are the specification of the
defect. They are rewritten to assert the new contract, and this paragraph exists
so that the rewrite is a recorded decision rather than a test quietly edited to
make a build go green. `'BIJOU_ACCESSIBLE takes priority over NO_COLOR'` becomes
vacuous once `NO_COLOR` no longer affects mode and is replaced by a test that
`NO_COLOR` leaves an interactive session interactive.

3 is additive and breaks nothing.

## Acceptance criteria

- All seven playback questions have a passing test.
- `npm run lint`, the full test suite, and the Code Dojo gates pass.
- `docs/CHANGELOG.md` records all three under a `Changed` heading with the
  breaking note, and `docs/BEARING.md` mentions the detection-semantics change.
- No consumer-visible colour output changes when `NO_COLOR` is set.
